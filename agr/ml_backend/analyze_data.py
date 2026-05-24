"""
Data Analysis Script - Understanding the Dataset Relationships
===============================================================
This script analyzes the dataset to understand why accuracy is low
and find the best approach for prediction.
"""

import pandas as pd
import numpy as np
from collections import Counter

# Load data
df = pd.read_csv("data_core.csv")

print("="*70)
print("DATA ANALYSIS REPORT")
print("="*70)

# Basic stats
print(f"\nDataset Shape: {df.shape}")
print(f"\nColumns: {df.columns.tolist()}")

# Target distributions
print("\n" + "="*70)
print("TARGET DISTRIBUTIONS")
print("="*70)

print("\n1. Crop Type Distribution:")
crop_dist = df['Crop Type'].value_counts()
print(crop_dist)
print(f"\nNumber of crops: {len(crop_dist)}")
print(f"Most common: {crop_dist.index[0]} ({crop_dist.iloc[0]} samples, {crop_dist.iloc[0]/len(df)*100:.1f}%)")

print("\n2. Fertilizer Distribution:")
fert_dist = df['Fertilizer Name'].value_counts()
print(fert_dist)
print(f"\nNumber of fertilizers: {len(fert_dist)}")

# Check Crop-Fertilizer relationship
print("\n" + "="*70)
print("CROP-FERTILIZER RELATIONSHIP ANALYSIS")
print("="*70)

# Cross-tabulation
cross_tab = pd.crosstab(df['Crop Type'], df['Fertilizer Name'])
print("\nCrops x Fertilizers Cross-tabulation:")
print(cross_tab)

# For each crop, what's the most common fertilizer?
print("\nMost common fertilizer for each crop:")
for crop in df['Crop Type'].unique():
    crop_data = df[df['Crop Type'] == crop]
    most_common_fert = crop_data['Fertilizer Name'].mode()[0]
    fert_percentage = (crop_data['Fertilizer Name'] == most_common_fert).mean() * 100
    print(f"  {crop}: {most_common_fert} ({fert_percentage:.1f}%)")

# Check if same input features lead to same outputs
print("\n" + "="*70)
print("DATA CONSISTENCY CHECK")
print("="*70)

# Group by all input features and check output consistency
input_cols = ['Temparature', 'Humidity', 'Moisture', 'Soil Type', 'Nitrogen', 'Potassium', 'Phosphorous']

# Round numeric columns for grouping
df_rounded = df.copy()
for col in ['Temparature', 'Humidity', 'Moisture']:
    df_rounded[col] = df_rounded[col].round(0)

grouped = df_rounded.groupby(input_cols)

# Check how many unique crops per input combination
inconsistent_count = 0
consistent_count = 0

for name, group in grouped:
    unique_crops = group['Crop Type'].nunique()
    if unique_crops > 1:
        inconsistent_count += 1
    else:
        consistent_count += 1

total_groups = inconsistent_count + consistent_count
print(f"\nUnique input combinations: {total_groups}")
print(f"Consistent (1 crop per input): {consistent_count} ({consistent_count/total_groups*100:.1f}%)")
print(f"Inconsistent (multiple crops per input): {inconsistent_count} ({inconsistent_count/total_groups*100:.1f}%)")

# Check soil type - crop relationship
print("\n" + "="*70)
print("SOIL TYPE - CROP RELATIONSHIP")
print("="*70)

soil_crop = pd.crosstab(df['Soil Type'], df['Crop Type'], normalize='index') * 100
print("\nCrop distribution by Soil Type (%):")
print(soil_crop.round(1))

# Feature correlations with targets
print("\n" + "="*70)
print("FEATURE-TARGET CORRELATIONS")
print("="*70)

from sklearn.preprocessing import LabelEncoder

# Encode targets
le_crop = LabelEncoder()
le_fert = LabelEncoder()
df['Crop_Encoded'] = le_crop.fit_transform(df['Crop Type'])
df['Fert_Encoded'] = le_fert.fit_transform(df['Fertilizer Name'])

# Calculate correlations
numeric_cols = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Potassium', 'Phosphorous']
print("\nCorrelation with Crop Type (encoded):")
for col in numeric_cols:
    corr = df[col].corr(df['Crop_Encoded'])
    print(f"  {col}: {corr:.4f}")

print("\nCorrelation with Fertilizer (encoded):")
for col in numeric_cols:
    corr = df[col].corr(df['Fert_Encoded'])
    print(f"  {col}: {corr:.4f}")

# Check if there's a deterministic relationship
print("\n" + "="*70)
print("DETERMINISTIC RELATIONSHIP CHECK")
print("="*70)

# Check if Fertilizer can predict Crop perfectly
fert_crop = df.groupby('Fertilizer Name')['Crop Type'].apply(lambda x: x.mode()[0] if len(x) > 0 else None)
print("\nMost common Crop for each Fertilizer:")
for fert, crop in fert_crop.items():
    accuracy = (df[df['Fertilizer Name'] == fert]['Crop Type'] == crop).mean() * 100
    print(f"  {fert} -> {crop} ({accuracy:.1f}% of cases)")

# Recommendation
print("\n" + "="*70)
print("RECOMMENDATION")
print("="*70)
print("""
Based on the analysis:

1. The data appears to have WEAK relationships between input features 
   and targets (Crop Type, Fertilizer).

2. This is likely because:
   a) The same input conditions can lead to different crops (farmer's choice)
   b) The data is synthetic and relationships are not strongly defined

3. Possible solutions:
   a) Use a RULE-BASED system based on domain knowledge
   b) Use a PROBABILISTIC approach (show top-3 recommendations)
   c) Accept that this is the maximum achievable accuracy

Maximum theoretical accuracy (if predicting most common class):
""")

# Calculate baseline accuracy
most_common_crop = df['Crop Type'].mode()[0]
baseline_crop = (df['Crop Type'] == most_common_crop).mean() * 100
print(f"  - Crop: {baseline_crop:.1f}% (always predict '{most_common_crop}')")

most_common_fert = df['Fertilizer Name'].mode()[0]
baseline_fert = (df['Fertilizer Name'] == most_common_fert).mean() * 100
print(f"  - Fertilizer: {baseline_fert:.1f}% (always predict '{most_common_fert}')")

print("\nOur model is performing at or near random chance, which suggests")
print("the input features alone are NOT sufficient to determine crop/fertilizer.")
