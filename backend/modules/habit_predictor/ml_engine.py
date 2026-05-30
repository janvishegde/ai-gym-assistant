import os
import pickle
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

DATA_PATH  = os.path.join(os.path.dirname(__file__), "data", "workout_history.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")

FEATURES = ["day_of_week", "days_since_last", "current_streak", "energy_level"]


def train_model():
    """Train logistic regression on workout history CSV."""
    print("Loading training data...")
    df = pd.read_csv(DATA_PATH)

    X = df[FEATURES]
    y = df["completed"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    model = LogisticRegression()
    model.fit(X_train_scaled, y_train)

    acc = accuracy_score(y_test, model.predict(X_test_scaled))
    print(f"Model accuracy: {round(acc * 100, 1)}%")

    # Save model and scaler
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)

    print(f"Model saved to: {MODEL_PATH}")
    return model, scaler


def load_model():
    """Load saved model and scaler from disk."""
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(SCALER_PATH, "rb") as f:
        scaler = pickle.load(f)
    return model, scaler


def predict_skip(day_of_week: int, days_since_last: int,
                 current_streak: int, energy_level: int) -> dict:
    """
    Predict whether user will skip workout.
    Returns probability and risk level.
    """
    if not os.path.exists(MODEL_PATH):
        train_model()

    model, scaler = load_model()

    features = pd.DataFrame(
        [[day_of_week, days_since_last, current_streak, energy_level]],
        columns=FEATURES
    )
    scaled = scaler.transform(features)

    prob_complete = model.predict_proba(scaled)[0][1]
    prob_skip     = 1 - prob_complete

    if prob_skip > 0.7:
        risk = "high"
    elif prob_skip > 0.4:
        risk = "medium"
    else:
        risk = "low"

    return {
    "skip_probability": float(round(prob_skip, 3)),
    "complete_probability": float(round(prob_complete, 3)),
    "risk_level": str(risk),
    "will_likely_skip": bool(prob_skip > 0.5)
    }