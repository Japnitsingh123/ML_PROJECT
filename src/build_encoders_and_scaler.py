# src/build_encoders_and_scaler.py
import pandas as pd
import joblib
from pathlib import Path
from sklearn.preprocessing import StandardScaler

# Paths - adjust if needed
RAW_PATH = Path("../data/Banglore_traffic_Dataset.csv")             # original raw (preferred)
PREPRO_PATH = Path("../data/Banglore_traffic_preprocessed.csv")    # preprocessed file produced earlier
OUT_DIR = Path("../models")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Define the EXACT 10 features we're using (same as training and API)
SELECTED_FEATURES = [
    'Area Name_freq_enc', 
    'Road/Intersection Name_freq_enc',
    'day', 
    'month', 
    'weekday', 
    'is_weekend',
    'Weather_Clear',
    'Weather_Cloudy', 
    'Weather_Rain',
    'Weather_Fog'
]

# --- Prefer to build encoders from the raw dataset (keeps original names)
if RAW_PATH.exists():
    df_raw = pd.read_csv(RAW_PATH)
    # make sure date parsed
    if "Date" in df_raw.columns:
        df_raw["Date"] = pd.to_datetime(df_raw["Date"], errors="coerce")
else:
    # fallback: try to reconstruct some info from preprocessed file
    df_raw = None

# Load preprocessed dataset
df_proc = pd.read_csv(PREPRO_PATH)

# Build frequency encoders from raw if possible, else attempt to infer from preprocessed
freq_maps = {}
for col in ["Area Name", "Road/Intersection Name"]:
    if df_raw is not None and col in df_raw.columns:
        freq = df_raw[col].fillna("Unknown").astype(str).value_counts(normalize=True).to_dict()
    else:
        # if raw not available, try to reverse engineer from freq_enc column in preprocessed
        enc_col = col + "_freq_enc"
        if enc_col in df_proc.columns:
            # Create a simple mapping based on unique values in the encoded column
            unique_vals = df_proc[enc_col].unique()
            freq = {f"Area_{i}": val for i, val in enumerate(unique_vals)} if col == "Area Name" else {f"Road_{i}": val for i, val in enumerate(unique_vals)}
        else:
            freq = {}
    freq_maps[col] = freq

# Save frequency maps
joblib.dump(freq_maps, OUT_DIR / "frequency_encoders.pkl")
print("Saved frequency encoders to", OUT_DIR / "frequency_encoders.pkl")

# --- Build scaler ONLY on our 10 selected features ---
# Check which of our selected features exist in the preprocessed data
available_features = [col for col in SELECTED_FEATURES if col in df_proc.columns]
print("Available selected features for scaling:", available_features)

# If some features are missing, create them with default values
for feature in SELECTED_FEATURES:
    if feature not in df_proc.columns:
        print(f"Warning: {feature} not found in dataset, creating with default values")
        if 'Weather_' in feature:
            df_proc[feature] = 0  # Default weather to 0
        elif feature in ['day', 'month', 'weekday', 'is_weekend']:
            # Extract from date if available, else use defaults
            if 'date' in df_proc.columns:
                df_proc['date'] = pd.to_datetime(df_proc['date'])
                if feature == 'day':
                    df_proc[feature] = df_proc['date'].dt.day
                elif feature == 'month':
                    df_proc[feature] = df_proc['date'].dt.month
                elif feature == 'weekday':
                    df_proc[feature] = df_proc['date'].dt.weekday
                elif feature == 'is_weekend':
                    df_proc[feature] = (df_proc['date'].dt.weekday >= 5).astype(int)
            else:
                # Use reasonable defaults
                df_proc[feature] = 1 if feature == 'month' else 0
        else:
            df_proc[feature] = 0  # Default for other missing features

# Ensure we have all 10 features
final_features = [col for col in SELECTED_FEATURES if col in df_proc.columns]
print(f"Final features for scaling ({len(final_features)}): {final_features}")

# Scale ONLY our 10 selected features
scaler = StandardScaler()
scaler.fit(df_proc[final_features].fillna(0).values)

# Save scaler and the EXACT feature order we're using
scaler_bundle = {
    "scaler": scaler, 
    "num_cols": final_features,  # Only our 10 features
    "selected_features": SELECTED_FEATURES
}
joblib.dump(scaler_bundle, OUT_DIR / "scaler_and_cols.pkl")
print("Saved scaler and column list to", OUT_DIR / "scaler_and_cols.pkl")
print(f"Scaler fitted on {len(final_features)} features matching training and API")