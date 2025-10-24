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

# --- Prefer to build encoders from the raw dataset (keeps original names)
if RAW_PATH.exists():
    df_raw = pd.read_csv(RAW_PATH)
    # make sure date parsed
    if "Date" in df_raw.columns:
        df_raw["Date"] = pd.to_datetime(df_raw["Date"], errors="coerce")
else:
    # fallback: try to reconstruct some info from preprocessed file
    df_raw = None

# Load preprocessed dataset (this has the numeric columns and derived columns)
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
            # make mapping unknown -> 0 and keep only encountered encoded values
            # not perfect — recommend using raw file
            freq = {}
            # we cannot reconstruct string->freq mapping reliably without raw strings
        else:
            freq = {}
    freq_maps[col] = freq

# Save frequency maps
joblib.dump(freq_maps, OUT_DIR / "frequency_encoders.pkl")
print("Saved frequency encoders to", OUT_DIR / "frequency_encoders.pkl")

# --- Build scaler on numeric columns used for training
# Identify numeric columns in the preprocessed file
num_cols = df_proc.select_dtypes(include=["number"]).columns.tolist()

# If target column present (e.g., 'Traffic Volume'), remove it from features
TARGET = "Traffic Volume"
if TARGET in num_cols:
    num_cols.remove(TARGET)

print("Numeric columns to be scaled:", num_cols)

scaler = StandardScaler()
scaler.fit(df_proc[num_cols].fillna(0).values)   # fillna just in case
joblib.dump({"scaler": scaler, "num_cols": num_cols}, OUT_DIR / "scaler_and_cols.pkl")
print("Saved scaler and column list to", OUT_DIR / "scaler_and_cols.pkl")
