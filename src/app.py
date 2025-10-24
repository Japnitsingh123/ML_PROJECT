# ============================
# src/app.py  — FastAPI Backend
# ============================
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
from pathlib import Path
from datetime import datetime

# ============================
# PATHS
# ============================
MODEL_PATH = Path("models/traffic_rf_model.pkl")
SCALER_PATH = Path("models/scaler_and_cols.pkl")
ENCODER_PATH = Path("models/frequency_encoders.pkl")
DATA_PATH = Path("data/Banglore_traffic_Dataset.csv")

# ============================
# LOAD MODEL & OBJECTS
# ============================
model = joblib.load(MODEL_PATH)
scaler_bundle = joblib.load(SCALER_PATH)
encoders = joblib.load(ENCODER_PATH)
scaler = scaler_bundle["scaler"]
num_cols = scaler_bundle["num_cols"]

df = pd.read_csv(DATA_PATH)
df.columns = df.columns.str.strip().str.lower()

# ============================
# FASTAPI APP CONFIG
# ============================
app = FastAPI(title="Bangalore Traffic Predictor API")

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev; restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# HEALTH CHECK ENDPOINT
# ============================
@app.get("/")
def root():
    return {"message": "🚦 Bangalore Traffic Prediction API is running!"}

# ============================
# PREDICTION ENDPOINT
# ============================
@app.post("/predict")
async def predict(request: Request):
    """
    Expects JSON like:
    {
      "area_name": "Koramangala",
      "road_name": "Sony World Junction",
      "weather": "Clear",
      "date": "2025-10-24"
    }
    """
    data = await request.json()

    # Extract inputs
    area_name = data.get("area_name")
    road_name = data.get("road_name")
    weather = data.get("weather", "Clear")
    date_str = data.get("date", str(datetime.today().date()))

    # --- Frequency encoding for area and road
    area_freq = encoders.get("Area Name", {}).get(area_name, 0)
    road_freq = encoders.get("Road/Intersection Name", {}).get(road_name, 0)

    # --- Extract time-based features
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        date_obj = datetime.today()

    day = date_obj.day
    month = date_obj.month
    weekday = date_obj.weekday()
    is_weekend = 1 if weekday >= 5 else 0

    # --- Create single input row
    input_dict = {
        "Area Name_freq_enc": area_freq,
        "Road/Intersection Name_freq_enc": road_freq,
        "day": day,
        "month": month,
        "weekday": weekday,
        "is_weekend": is_weekend,
        "Weather_Clear": 1 if weather == "Clear" else 0,
        "Weather_Cloudy": 1 if weather == "Cloudy" else 0,
        "Weather_Rain": 1 if weather == "Rain" else 0,
        "Weather_Fog": 1 if weather == "Fog" else 0,
    }

    X_input = pd.DataFrame([input_dict])

    # Align columns
    for col in num_cols:
        if col not in X_input.columns:
            X_input[col] = 0

    X_input = X_input[num_cols]

    # ---------------------------
    # Convert to NumPy array to avoid feature name warnings
    # ---------------------------
    X_array = X_input.to_numpy()

    # Scale features
    X_scaled = scaler.transform(X_array)

    # Predict
    preds = model.predict(X_scaled)[0]
    traffic_vol, travel_time_index = preds[0], preds[1]

    return {
        "traffic_volume": round(float(traffic_vol), 2),
        "travel_time_index": round(float(travel_time_index), 2)
    }
