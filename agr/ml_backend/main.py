"""
main.py - Dual-Dataset Training Pipeline
==========================================
Dataset 1 → Crop_recommendation.csv  → crop_model.pkl
Dataset 2 → data_core.csv            → fertilizer_model.pkl

Run once, then start: python app.py
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ══════════════════════════════════════════════════════════════════
#  HELPER — pretty section printer
# ══════════════════════════════════════════════════════════════════
def section(title):
    print("\n" + "═" * 58)
    print(f"  {title}")
    print("═" * 58)


# ══════════════════════════════════════════════════════════════════
#  PART 1 — CROP MODEL  (Crop_recommendation.csv)
# ══════════════════════════════════════════════════════════════════
section("PART 1 · CROP MODEL  ←  Crop_recommendation.csv")

try:
    crop_df = pd.read_csv("Crop_recommendation.csv")
    print(f"  ✔ Loaded {len(crop_df):,} rows | "
          f"{crop_df['Crop Type'].nunique()} unique crops")
except FileNotFoundError:
    print("  ✘ Crop_recommendation.csv not found!")
    exit(1)

# ── Features & Target ────────────────────────────────────────────
CROP_FEATURES = ["Nitrogen", "Phosphorous", "Potassium",
                 "Temperature", "Humidity", "ph", "Rainfall"]

# Accept both 'Temperature' and 'Temparature' spellings
if "Temperature" not in crop_df.columns and "Temparature" in crop_df.columns:
    crop_df = crop_df.rename(columns={"Temparature": "Temperature"})

X_crop = crop_df[CROP_FEATURES].values
y_crop_raw = crop_df["Crop Type"].values

# ── Encode target ─────────────────────────────────────────────────
crop_encoder = LabelEncoder()
y_crop = crop_encoder.fit_transform(y_crop_raw)

# ── Scale features ────────────────────────────────────────────────
crop_scaler = StandardScaler()
X_crop_scaled = crop_scaler.fit_transform(X_crop)

# ── Train / Test split ────────────────────────────────────────────
Xc_train, Xc_test, yc_train, yc_test = train_test_split(
    X_crop_scaled, y_crop,
    test_size=0.2, random_state=42, stratify=y_crop
)

print(f"  Train: {len(Xc_train):,} samples  |  Test: {len(Xc_test):,} samples")

# ── Train ─────────────────────────────────────────────────────────
print("  Training RandomForest for crops...")
crop_model = RandomForestClassifier(
    n_estimators=200, max_depth=None,
    min_samples_split=2, random_state=42, n_jobs=1
)
crop_model.fit(Xc_train, yc_train)

# ── Evaluate ──────────────────────────────────────────────────────
crop_preds = crop_model.predict(Xc_test)
crop_acc   = accuracy_score(yc_test, crop_preds)

print(f"\n  ✅ Crop Model Accuracy : {crop_acc * 100:.1f}%")
print("\n  Detailed Report:")
print(classification_report(
    yc_test, crop_preds,
    target_names=crop_encoder.classes_,
    zero_division=0
))

# ── Save ──────────────────────────────────────────────────────────
joblib.dump(crop_model,     "crop_model.pkl")
joblib.dump(crop_encoder,   "crop_encoder.pkl")
joblib.dump(crop_scaler,    "crop_scaler.pkl")
joblib.dump(CROP_FEATURES,  "crop_features.pkl")
print("  ✔ Saved: crop_model.pkl · crop_encoder.pkl · "
      "crop_scaler.pkl · crop_features.pkl")


# ══════════════════════════════════════════════════════════════════
#  PART 2 — FERTILIZER MODEL  (data_core.csv)
# ══════════════════════════════════════════════════════════════════
section("PART 2 · FERTILIZER MODEL  ←  data_core.csv")

try:
    fert_df = pd.read_csv("data_core.csv")
    print(f"  ✔ Loaded {len(fert_df):,} rows | "
          f"{fert_df['Fertilizer Name'].nunique()} unique fertilizers")
except FileNotFoundError:
    print("  ✘ data_core.csv not found!  Run generate_data.py first.")
    exit(1)

# ── Features & Target ────────────────────────────────────────────
FERT_FEATURES = ["Temparature", "Humidity", "Moisture",
                 "Soil Type",
                 "Nitrogen", "Potassium", "Phosphorous"]

X_fert_raw = fert_df[FERT_FEATURES].copy()
y_fert_raw = fert_df["Fertilizer Name"].values

# ── Encode categorical columns ────────────────────────────────────
soil_encoder      = LabelEncoder()
X_fert_raw["Soil Type"]  = soil_encoder.fit_transform(X_fert_raw["Soil Type"])

fert_encoder = LabelEncoder()
y_fert = fert_encoder.fit_transform(y_fert_raw)

# ── Scale ─────────────────────────────────────────────────────────
fert_scaler = StandardScaler()
X_fert_scaled = fert_scaler.fit_transform(X_fert_raw.values)

# ── Train / Test split ────────────────────────────────────────────
Xf_train, Xf_test, yf_train, yf_test = train_test_split(
    X_fert_scaled, y_fert,
    test_size=0.2, random_state=42, stratify=y_fert
)

print(f"  Train: {len(Xf_train):,} samples  |  Test: {len(Xf_test):,} samples")

# ── Train ─────────────────────────────────────────────────────────
print("  Training RandomForest for fertilizers...")
fert_model = RandomForestClassifier(
    n_estimators=200, max_depth=None,
    min_samples_split=2, random_state=42, n_jobs=1
)
fert_model.fit(Xf_train, yf_train)

# ── Evaluate ──────────────────────────────────────────────────────
fert_preds = fert_model.predict(Xf_test)
fert_acc   = accuracy_score(yf_test, fert_preds)

print(f"\n  ✅ Fertilizer Model Accuracy : {fert_acc * 100:.1f}%")
print("\n  Detailed Report:")
print(classification_report(
    yf_test, fert_preds,
    target_names=fert_encoder.classes_,
    zero_division=0
))

# ── Save ──────────────────────────────────────────────────────────
joblib.dump(fert_model,         "fertilizer_model.pkl")
joblib.dump(fert_encoder,       "fertilizer_encoder.pkl")
joblib.dump(fert_scaler,        "fertilizer_scaler.pkl")
joblib.dump(soil_encoder,       "soil_encoder.pkl")
joblib.dump(FERT_FEATURES,      "fert_features.pkl")
print("  ✔ Saved: fertilizer_model.pkl · fertilizer_encoder.pkl · "
      "fertilizer_scaler.pkl · soil_encoder.pkl · "
      "fert_features.pkl")


# ══════════════════════════════════════════════════════════════════
#  FINAL SUMMARY
# ══════════════════════════════════════════════════════════════════
section("FINAL SUMMARY")
print(f"  🌾  Crop Model Accuracy       :  {crop_acc * 100:.1f}%")
print(f"  🧪  Fertilizer Model Accuracy :  {fert_acc * 100:.1f}%")
print("\n  All models saved successfully!")
print("  ➜  You can now start the API:  python app.py")
print("═" * 58)
