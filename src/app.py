# ============================
# src/app.py  — FastAPI Backend
# ============================
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
from pathlib import Path
from datetime import datetime
import numpy as np
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================
# PATHS
# ============================
MODEL_PATH = Path("models/traffic_rf_model.pkl")
SCALER_PATH = Path("models/scaler_and_cols.pkl")
ENCODER_PATH = Path("models/frequency_encoders.pkl")
FEATURE_INFO_PATH = Path("models/model_features.pkl")  # New feature info file

# ============================
# LOAD MODEL & OBJECTS with error handling
# ============================
try:
    model = joblib.load(MODEL_PATH)
    scaler_bundle = joblib.load(SCALER_PATH)
    encoders = joblib.load(ENCODER_PATH)
    scaler = scaler_bundle["scaler"]
    num_cols = scaler_bundle["num_cols"]  # This should now be our 10 features
    
    # Load feature info if available
    if FEATURE_INFO_PATH.exists():
        feature_info = joblib.load(FEATURE_INFO_PATH)
        selected_features = feature_info.get('selected_features', num_cols)
        target_columns = feature_info.get('target_columns', ['Traffic Volume', 'Travel Time Index'])
    else:
        selected_features = num_cols
        target_columns = ['Traffic Volume', 'Travel Time Index']
    
    logger.info("✅ All models and encoders loaded successfully")
    logger.info(f"📊 Using {len(selected_features)} features: {selected_features}")
    
except Exception as e:
    logger.error(f"❌ Error loading models: {e}")
    raise RuntimeError(f"Failed to load required model files: {e}")

# ============================
# FASTAPI APP CONFIG
# ============================
app = FastAPI(title="Bangalore Traffic Predictor API", version="0.1.0")

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
async def predict(data: dict):
    """
    Expects JSON like:
    {
      "area_name": "Koramangala",
      "road_name": "Sony World Junction", 
      "weather": "Clear",
      "date": "2025-10-24"
    }
    """
    try:
        # Validate inputs
        required_fields = ["area_name", "road_name"]
        for field in required_fields:
            if field not in data or not data[field]:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Extract inputs
        area_name = data.get("area_name")
        road_name = data.get("road_name")
        weather = data.get("weather", "Clear")
        date_str = data.get("date", str(datetime.today().date()))

        # --- Frequency encoding for area and road with fallbacks
        area_freq = encoders.get("Area Name", {}).get(area_name, 0.0)
        road_freq = encoders.get("Road/Intersection Name", {}).get(road_name, 0.0)

        # --- Extract time-based features
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            date_obj = datetime.today()

        day = date_obj.day
        month = date_obj.month
        weekday = date_obj.weekday()  # Monday=0, Sunday=6
        is_weekend = 1 if weekday >= 5 else 0

        # --- Create single input row with EXACT 10 features ---
        input_dict = {
            "Area Name_freq_enc": area_freq,
            "Road/Intersection Name_freq_enc": road_freq,
            "day": day,
            "month": month,
            "weekday": weekday,
            "is_weekend": is_weekend,
            "Weather_Clear": 1 if weather.lower() == "clear" else 0,
            "Weather_Cloudy": 1 if weather.lower() == "cloudy" else 0,
            "Weather_Rain": 1 if weather.lower() == "rain" else 0,
            "Weather_Fog": 1 if weather.lower() == "fog" else 0,
        }

        # Debug log the input
        logger.info(f"🔍 Input features: {input_dict}")

        # Create DataFrame
        X_input = pd.DataFrame([input_dict])
        
        # Ensure we have ALL and ONLY the expected features
        # Add any missing features with 0
        for col in selected_features:
            if col not in X_input.columns:
                X_input[col] = 0
                logger.warning(f"⚠️ Added missing feature: {col}")
        
        # Remove any extra features that shouldn't be there
        extra_cols = set(X_input.columns) - set(selected_features)
        for col in extra_cols:
            X_input = X_input.drop(columns=[col])
            logger.warning(f"⚠️ Removed extra feature: {col}")
        
        # Reorder columns to match training data EXACTLY
        X_input = X_input[selected_features]

        logger.info(f"📐 Final input shape: {X_input.shape}")
        logger.info(f"📋 Final columns: {X_input.columns.tolist()}")

        # Convert to NumPy array to avoid feature name warnings
        X_array = X_input.to_numpy()

        # Scale features
        X_scaled = scaler.transform(X_array)

        # Predict
        preds = model.predict(X_scaled)
        
        logger.info(f"🎯 Raw prediction: {preds}")

        # Handle prediction output - now it should be consistent
        if preds.ndim == 2 and preds.shape[1] == 2:
            # Standard multi-output format [traffic_volume, travel_time_index]
            traffic_vol, travel_time_index = preds[0][0], preds[0][1]
        elif preds.ndim == 1 and len(preds) == 2:
            # Single sample with 2 outputs
            traffic_vol, travel_time_index = preds[0], preds[1]
        else:
            # Fallback - use first two values
            traffic_vol = preds[0] if hasattr(preds[0], '__len__') else preds[0]
            travel_time_index = preds[1] if hasattr(preds[1], '__len__') else preds[1] if len(preds) > 1 else preds[0] * 0.1

        result = {
            "area_name": area_name,
            "road_name": road_name,
            "weather": weather,
            "date": date_str,
            "traffic_volume": round(float(traffic_vol), 2),
            "travel_time_index": round(float(travel_time_index), 2)
        }
        
        logger.info(f"✅ Prediction result: {result}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")