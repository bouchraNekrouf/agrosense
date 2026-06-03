"""
Flask Web Application - Agricultural Prediction API (Dual-Model Version)
=========================================================================
Model 1: Crop prediction   ← Crop_recommendation.csv
Model 2: Fertilizer prediction ← data_core.csv

Each model has its own isolated encoder and scaler.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

app = Flask(__name__)
CORS(app)

# ══════════════════════════════════════════════════════════════════
#  LOAD MODELS
# ══════════════════════════════════════════════════════════════════
crop_model        = None
crop_encoder      = None
crop_scaler       = None
crop_features     = None

fert_model        = None
fert_encoder      = None
fert_scaler       = None
soil_encoder      = None
fert_features     = None

_crop_metrics_cache = None


def load_models():
    global crop_model, crop_encoder, crop_scaler, crop_features
    global fert_model, fert_encoder, fert_scaler, soil_encoder
    global fert_features

    required = [
        "crop_model.pkl", "crop_encoder.pkl", "crop_scaler.pkl", "crop_features.pkl",
        "fertilizer_model.pkl", "fertilizer_encoder.pkl", "fertilizer_scaler.pkl",
        "soil_encoder.pkl", "fert_features.pkl"
    ]
    missing = [f for f in required if not os.path.exists(f)]
    if missing:
        print(f"❌ Missing model files: {missing}")
        print("   Run: python main.py  first!")
        return False

    try:
        crop_model        = joblib.load("crop_model.pkl")
        crop_encoder      = joblib.load("crop_encoder.pkl")
        crop_scaler       = joblib.load("crop_scaler.pkl")
        crop_features     = joblib.load("crop_features.pkl")

        fert_model        = joblib.load("fertilizer_model.pkl")
        fert_encoder      = joblib.load("fertilizer_encoder.pkl")
        fert_scaler       = joblib.load("fertilizer_scaler.pkl")
        soil_encoder      = joblib.load("soil_encoder.pkl")
        fert_features     = joblib.load("fert_features.pkl")

        print("✅ All models loaded successfully!")
        print(f"   Crop classes     : {list(crop_encoder.classes_)}")
        print(f"   Fertilizer types : {list(fert_encoder.classes_)}")
        return True
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        return False


# ══════════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════════
@app.route("/")
def home():
    return "🌱 Agricultural Prediction API is running — POST to /predict"


@app.route("/predict", methods=["POST"])
def predict():
    if crop_model is None:
        return jsonify({"success": False,
                        "error": "Models not loaded. Run main.py first."}), 500
    try:
        data = request.json or {}

        # ── 1. CROP PREDICTION ─────────────────────────────────────
        # Features: Nitrogen, Phosphorous, Potassium, Temperature, Humidity, ph, Rainfall
        crop_input = np.array([[
            float(data.get("Nitrogen",     20)),
            float(data.get("Phosphorous",  20)),
            float(data.get("Potassium",    20)),
            float(data.get("Temperature",  float(data.get("Temparature", 25)))),
            float(data.get("Humidity",     60)),
            float(data.get("ph",           6.5)),
            float(data.get("Rainfall",    100))
        ]])

        crop_input_scaled = crop_scaler.transform(crop_input)
        crop_pred_enc     = crop_model.predict(crop_input_scaled)[0]
        crop_result       = crop_encoder.inverse_transform([crop_pred_enc])[0]

        # Confidence
        crop_proba      = crop_model.predict_proba(crop_input_scaled)[0]
        crop_confidence = float(max(crop_proba)) * 100

        # ── 2. FERTILIZER PREDICTION ───────────────────────────────
        # Target Features Order: Temparature, Humidity, Moisture, Soil Type, Nitrogen, Potassium, Phosphorous
        soil_type_raw = str(data.get("Soil Type", "Sandy"))
        try:
            soil_encoded = float(soil_encoder.transform([soil_type_raw])[0])
        except (ValueError, TypeError, Exception) as e:
            soil_encoded = 0.0  # default if unseen label

        # Map frontend "Low", "Medium", "High" to numerical averages expected by dataset
        moisture_raw = data.get("Moisture", "Medium")
        if isinstance(moisture_raw, str):
            moisture_val = {"Low": 25, "Medium": 45, "High": 65}.get(moisture_raw, 45)
        else:
            moisture_val = float(moisture_raw)

        fert_input = np.array([[
            float(data.get("Temparature",  data.get("Temperature", 25))),
            float(data.get("Humidity",     60)),
            float(moisture_val),
            float(soil_encoded),
            float(data.get("Nitrogen",     20)),
            float(data.get("Potassium",    20)),
            float(data.get("Phosphorous",  20))
        ]])

        fert_input_scaled = fert_scaler.transform(fert_input)
        fert_pred_enc     = fert_model.predict(fert_input_scaled)[0]
        fert_result       = fert_encoder.inverse_transform([fert_pred_enc])[0]

        # Confidence
        fert_proba      = fert_model.predict_proba(fert_input_scaled)[0]
        fert_confidence = float(max(fert_proba)) * 100

        # ── 3. YIELD ESTIMATE ──────────────────────────────────────
        yield_est = estimate_yield(data, crop_result)

        return jsonify({
            "success":              True,
            "crop":                 crop_result,
            "crop_confidence":      f"{crop_confidence:.0f}%",
            "fertilizer":           fert_result,
            "fertilizer_confidence": f"{fert_confidence:.0f}%",
            "yield_estimate":       yield_est
        })

    except Exception as e:
        import traceback
        print(f"❌ Error during /predict: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/metrics", methods=["GET"])
def metrics():
    global _crop_metrics_cache
    if _crop_metrics_cache is not None:
        return jsonify(_crop_metrics_cache)

    if crop_model is None or crop_encoder is None or crop_scaler is None or crop_features is None:
        return jsonify({"success": False, "error": "Models not loaded. Run main.py first."}), 500

    try:
        df = pd.read_csv("Crop_recommendation.csv")
        if "Temperature" not in df.columns and "Temparature" in df.columns:
            df = df.rename(columns={"Temparature": "Temperature"})

        X = df[list(crop_features)].values
        y_raw = df["Crop Type"].values

        X_scaled = crop_scaler.transform(X)
        y = crop_encoder.transform(y_raw)

        X_trainval, X_test, y_trainval, y_test = train_test_split(
            X_scaled, y,
            test_size=0.15,
            random_state=42,
            stratify=y
        )

        X_train, X_val, y_train, y_val = train_test_split(
            X_trainval, y_trainval,
            test_size=(5 / 85),
            random_state=42,
            stratify=y_trainval
        )

        y_pred = crop_model.predict(X_test)

        accuracy = float(accuracy_score(y_test, y_pred))
        precision = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        recall = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
        cm = confusion_matrix(y_test, y_pred).tolist()
        labels = [str(x) for x in list(crop_encoder.classes_)]

        payload = {
            "success": True,
            "task": "crop_recommendation",
            "algorithm": "RandomForestClassifier",
            "split": {"train": 80, "validation": 5, "test": 15, "random_state": 42},
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1": f1
            },
            "confusion_matrix": cm,
            "labels": labels
        }
        _crop_metrics_cache = payload
        return jsonify(payload)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def estimate_yield(data, crop_type):
    base_yields = {
        "rice": 5000, "maize": 4500, "chickpea": 1500, "kidneybeans": 1800,
        "pigeonpeas": 1400, "mothbeans": 900, "mungbean": 1000,
        "blackgram": 1100, "lentil": 1200, "pomegranate": 12000,
        "banana": 25000, "mango": 10000, "grapes": 18000, "watermelon": 30000,
        "muskmelon": 15000, "apple": 20000, "orange": 15000, "papaya": 35000,
        "coconut": 8000, "cotton": 2000, "jute": 2500, "coffee": 800,
        # from data_core.csv
        "Wheat": 4000, "Sugarcane": 70000, "Paddy": 5000, "Barley": 3500,
        "Millets": 2000, "Oil seeds": 1500, "Tobacco": 2500,
        "Pulses": 1200, "Ground Nuts": 1800, "Cotton": 2000, "Maize": 4500,
    }

    base = base_yields.get(crop_type, 3000)
    temp     = float(data.get("Temperature", data.get("Temparature", 27)))
    humidity = float(data.get("Humidity", 60))
    nitrogen = float(data.get("Nitrogen", 20))
    
    moisture_raw = data.get("Moisture", "Medium")
    if isinstance(moisture_raw, str):
        moisture = float({"Low": 25, "Medium": 45, "High": 65}.get(moisture_raw, 45))
    else:
        moisture = float(moisture_raw)

    temp_f     = max(0.75, min(1.15, 1.0 - abs(temp - 27.5) * 0.015))
    humidity_f = max(0.85, min(1.10, 1.0 - abs(humidity - 60) * 0.008))
    nitrogen_f = min(1.25, 0.85 + nitrogen * 0.012)
    moisture_f = max(0.90, min(1.10, 1.0 - abs(moisture - 45) * 0.005))

    estimated = base * temp_f * humidity_f * nitrogen_f * moisture_f
    return f"{int(estimated):,} kg/ha"


# ══════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════
# Load models at module level so they are available when imported (e.g. by gunicorn)
load_models()

if __name__ == "__main__":
    print("=" * 58)
    print("  Starting Agricultural API (Dual-Model Version)")
    print("=" * 58)
    app.run(debug=True, host="0.0.0.0", port=5000)
