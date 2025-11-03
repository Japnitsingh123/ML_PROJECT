# src/train_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
from pathlib import Path

DATA_PATH = Path("../data/Banglore_traffic_preprocessed.csv")
OUT_DIR = Path("../models")
OUT_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA_PATH)
print("Loaded processed shape:", df.shape)
print("Columns in dataset:", df.columns.tolist())

# Define the SPECIFIC 10 features we want to use (same as API)
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

# Check which selected features exist in our data
available_features = [col for col in SELECTED_FEATURES if col in df.columns]
print("Available selected features:", available_features)

# If we're missing some features, we need to create them
for feature in SELECTED_FEATURES:
    if feature not in df.columns:
        print(f"Warning: {feature} not found in dataset, creating with default values")
        if 'Weather_' in feature:
            df[feature] = 0  # Default weather to 0
        elif feature in ['day', 'month', 'weekday', 'is_weekend']:
            # Extract from date if available, else use defaults
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                if feature == 'day':
                    df[feature] = df['date'].dt.day
                elif feature == 'month':
                    df[feature] = df['date'].dt.month
                elif feature == 'weekday':
                    df[feature] = df['date'].dt.weekday
                elif feature == 'is_weekend':
                    df[feature] = (df['date'].dt.weekday >= 5).astype(int)
            else:
                # Use reasonable defaults
                df[feature] = 1 if feature == 'month' else 0
        else:
            df[feature] = 0  # Default for other missing features

# Use ONLY our selected features
X = df[SELECTED_FEATURES]

# Targets
y = df[['Traffic Volume', 'Travel Time Index']]

print(f"Training with {X.shape[1]} features: {X.columns.tolist()}")
print(f"Targets: {y.columns.tolist()}")

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"MAE: {mae:.3f}, R2: {r2:.3f}")

# Save model
joblib.dump(model, OUT_DIR / "traffic_rf_model.pkl")

# Save the feature list so API knows what to expect
feature_info = {
    'selected_features': SELECTED_FEATURES,
    'target_columns': y.columns.tolist()
}
joblib.dump(feature_info, OUT_DIR / "model_features.pkl")

print("Saved model to", OUT_DIR / "traffic_rf_model.pkl")
print("Saved feature info to", OUT_DIR / "model_features.pkl")
print(f"Model trained with {len(SELECTED_FEATURES)} features matching API input")