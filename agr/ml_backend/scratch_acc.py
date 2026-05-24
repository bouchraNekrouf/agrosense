import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

try:
    # 1. Crop Model
    crop_model = joblib.load('crop_model.pkl')
    crop_encoder = joblib.load('crop_encoder.pkl')
    crop_scaler = joblib.load('crop_scaler.pkl')
    
    crop_df = pd.read_csv('Crop_recommendation.csv')
    if "Temperature" not in crop_df.columns and "Temparature" in crop_df.columns:
        crop_df = crop_df.rename(columns={"Temparature": "Temperature"})
        
    X_crop = crop_df[["Nitrogen", "Phosphorous", "Potassium", "Temperature", "Humidity", "ph", "Rainfall"]].values
    y_crop = crop_encoder.transform(crop_df["Crop Type"].values)
    
    _, Xc_test, _, yc_test = train_test_split(
        crop_scaler.transform(X_crop), y_crop,
        test_size=0.2, random_state=42, stratify=y_crop
    )
    crop_acc = accuracy_score(yc_test, crop_model.predict(Xc_test)) * 100
    print(f"CROP_ACCURACY: {crop_acc:.2f}%")
except Exception as e:
    print(f"Error evaluating crop model: {e}")

try:
    # 2. Fertilizer Model
    fert_model = joblib.load('fertilizer_model.pkl')
    fert_encoder = joblib.load('fertilizer_encoder.pkl')
    fert_scaler = joblib.load('fertilizer_scaler.pkl')
    soil_encoder = joblib.load('soil_encoder.pkl')
    
    fert_df = pd.read_csv('data_core.csv')
    X_fert_raw = fert_df[["Temparature", "Humidity", "Moisture", "Soil Type", "Nitrogen", "Potassium", "Phosphorous"]].copy()
    X_fert_raw["Soil Type"] = soil_encoder.transform(X_fert_raw["Soil Type"])
    y_fert = fert_encoder.transform(fert_df["Fertilizer Name"].values)
    
    _, Xf_test, _, yf_test = train_test_split(
        fert_scaler.transform(X_fert_raw.values), y_fert,
        test_size=0.2, random_state=42, stratify=y_fert
    )
    fert_acc = accuracy_score(yf_test, fert_model.predict(Xf_test)) * 100
    print(f"FERT_ACCURACY: {fert_acc:.2f}%")
except Exception as e:
    print(f"Error evaluating fertilizer model: {e}")
