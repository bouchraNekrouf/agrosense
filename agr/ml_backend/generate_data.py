"""
generate_data.py - Generates realistic agricultural training data
=================================================================
Run this script once to create data_core.csv with 1500+ rows.
Then run main.py to train the models.
"""

import pandas as pd
import numpy as np
import random

random.seed(42)
np.random.seed(42)

# ──────────────────────────────────────────────────────────────────
# Agricultural rules: (Soil, N_range, K_range, P_range, Temp, Humidity, Moisture) -> Crop, Fertilizer
# ──────────────────────────────────────────────────────────────────

RULES = [
    # Sandy soil
    ("Sandy",  (10,20), (8,15),  (10,18), (25,30), (48,56), (30,40), "Barley",      "17-17-17"),
    ("Sandy",  (18,30), (0,5),   (15,25), (28,34), (50,58), (35,45), "Maize",       "28-28"),
    ("Sandy",  (30,45), (0,4),   (0,8),   (26,32), (50,56), (33,44), "Maize",       "Urea"),
    ("Sandy",  (10,20), (0,5),   (15,22), (28,36), (50,60), (35,45), "Millets",     "28-28"),
    ("Sandy",  (10,16), (0,5),   (32,44), (34,38), (66,72), (28,36), "Barley",      "14-35-14"),
    ("Sandy",  (12,22), (0,5),   (32,44), (24,30), (48,56), (24,34), "Ground Nuts", "DAP"),

    # Loamy soil
    ("Loamy",  (35,45), (0,5),   (0,6),   (30,36), (62,68), (44,54), "Wheat",       "Urea"),
    ("Loamy",  (10,16), (0,5),   (32,44), (27,34), (50,58), (44,56), "Wheat",       "DAP"),
    ("Loamy",  (20,30), (0,5),   (16,24), (25,33), (50,58), (42,52), "Wheat",       "28-28"),
    ("Loamy",  (32,45), (0,5),   (0,6),   (24,28), (62,68), (60,68), "Cotton",      "Urea"),
    ("Loamy",  (6,12),  (8,14),  (28,36), (26,32), (58,66), (56,66), "Cotton",      "14-35-14"),
    ("Loamy",  (10,18), (0,5),   (32,44), (28,36), (62,68), (24,34), "Sugarcane",   "DAP"),
    ("Loamy",  (35,42), (0,5),   (0,6),   (30,36), (60,66), (28,36), "Sugarcane",   "Urea"),
    ("Loamy",  (10,16), (12,18), (10,16), (32,37), (62,68), (48,58), "Sugarcane",   "17-17-17"),
    ("Loamy",  (10,16), (5,12),  (28,36), (28,36), (58,66), (54,64), "Sugarcane",   "14-35-14"),

    # Clayey soil
    ("Clayey", (32,45), (0,5),   (0,6),   (27,33), (52,60), (40,50), "Paddy",       "Urea"),
    ("Clayey", (10,18), (0,5),   (18,26), (30,36), (60,66), (38,48), "Paddy",       "28-28"),
    ("Clayey", (10,16), (0,5),   (36,46), (34,40), (66,72), (34,44), "Paddy",       "DAP"),
    ("Clayey", (10,16), (0,5),   (8,16),  (26,32), (52,58), (24,34), "Pulses",      "20-20"),
    ("Clayey", (35,45), (0,5),   (0,6),   (30,36), (60,67), (30,42), "Pulses",      "Urea"),
    ("Clayey", (10,18), (0,5),   (36,46), (34,40), (66,72), (34,44), "Paddy",       "DAP"),

    # Black soil
    ("Black",  (36,45), (0,5),   (0,6),   (26,32), (52,58), (30,42), "Millets",     "Urea"),
    ("Black",  (35,44), (0,5),   (0,6),   (26,34), (52,60), (60,70), "Cotton",      "Urea"),
    ("Black",  (6,12),  (8,14),  (26,36), (32,38), (62,68), (58,68), "Cotton",      "14-35-14"),
    ("Black",  (8,14),  (6,12),  (36,46), (35,40), (67,73), (28,38), "Oil seeds",   "DAP"),
    ("Black",  (10,16), (11,17), (10,16), (28,36), (58,66), (44,56), "Sugarcane",   "17-17-17"),
    ("Black",  (34,44), (0,5),   (0,6),   (26,32), (52,60), (30,42), "Millets",     "Urea"),

    # Red soil
    ("Red",    (8,14),  (0,5),   (36,46), (24,30), (48,56), (28,38), "Ground Nuts", "DAP"),
    ("Red",    (13,20), (13,19), (8,15),  (23,30), (48,56), (24,32), "Ground Nuts", "17-17-17"),
    ("Red",    (20,32), (0,5),   (18,28), (30,36), (60,68), (28,40), "Tobacco",     "28-28"),
    ("Red",    (8,14),  (0,5),   (34,44), (33,40), (64,72), (30,40), "Tobacco",     "DAP"),
    ("Red",    (8,14),  (8,14),  (26,36), (30,38), (58,68), (56,66), "Cotton",      "14-35-14"),
    ("Red",    (8,14),  (0,5),   (7,15),  (24,30), (50,58), (54,64), "Cotton",      "20-20"),
    ("Red",    (18,28), (0,5),   (18,28), (30,38), (60,68), (30,40), "Pulses",      "28-28"),
]

rows = []
SAMPLES_PER_RULE = 45  # 34 rules x 45 = 1530 rows

for rule in RULES:
    soil, n_r, k_r, p_r, t_r, h_r, m_r, crop, fert = rule
    for _ in range(SAMPLES_PER_RULE):
        n  = round(random.uniform(*n_r)  + random.gauss(0, 0.8), 1)
        k  = round(random.uniform(*k_r)  + random.gauss(0, 0.5), 1)
        p  = round(random.uniform(*p_r)  + random.gauss(0, 0.8), 1)
        t  = round(random.uniform(*t_r)  + random.gauss(0, 0.4), 1)
        h  = round(random.uniform(*h_r)  + random.gauss(0, 0.5), 1)
        mo = round(random.uniform(*m_r)  + random.gauss(0, 0.4), 1)

        # Keep values in realistic bounds
        n  = max(5,  min(50, n))
        k  = max(0,  min(25, k))
        p  = max(0,  min(50, p))
        t  = max(20, min(42, t))
        h  = max(45, min(78, h))
        mo = max(22, min(72, mo))

        rows.append({
            "Temparature":     t,
            "Humidity":        h,
            "Moisture":        mo,
            "Soil Type":       soil,
            "Crop Type":       crop,
            "Nitrogen":        n,
            "Potassium":       k,
            "Phosphorous":     p,
            "Fertilizer Name": fert
        })

df = pd.DataFrame(rows)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

output_file = "data_core.csv"
df.to_csv(output_file, index=False)

print("=" * 60)
print("Data generated successfully!")
print(f"  Total rows     : {len(df)}")
print(f"  Unique crops   : {df['Crop Type'].nunique()} -> {sorted(df['Crop Type'].unique())}")
print(f"  Unique fertil  : {df['Fertilizer Name'].nunique()} -> {sorted(df['Fertilizer Name'].unique())}")
print(f"  Soil types     : {sorted(df['Soil Type'].unique())}")
print("=" * 60)
print("\nCrop distribution:")
print(df['Crop Type'].value_counts().to_string())
print("\nFertilizer distribution:")
print(df['Fertilizer Name'].value_counts().to_string())
print(f"\nSaved to: {output_file}")
print("Now run: python main.py")
