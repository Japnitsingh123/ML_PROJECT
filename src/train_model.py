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

# Choose target
TARGET = "Traffic Volume"
if TARGET not in df.columns:
    raise ValueError(f"Target '{TARGET}' not found in {DATA_PATH}")

X = df.drop(columns=[TARGET])
y = y = df[['Traffic Volume', 'Travel Time Index']]

# Train-test split (time-aware if needed — here random split)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model (RandomForest baseline)
model = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"MAE: {mae:.3f}, R2: {r2:.3f}")

# Save model
joblib.dump(model, OUT_DIR / "traffic_rf_model.pkl")
print("Saved model to", OUT_DIR / "traffic_rf_model.pkl")
