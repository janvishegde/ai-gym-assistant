from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys, os

sys.path.insert(0, os.path.dirname(__file__))

router = APIRouter(prefix="/habits", tags=["Habit Predictor"])

ml_engine    = None
quote_engine = None

def get_engines():
    global ml_engine, quote_engine
    if ml_engine is None:
        try:
            from ml_engine import predict_skip
            from quote_engine import get_motivational_nudge
            ml_engine    = predict_skip
            quote_engine = get_motivational_nudge
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return ml_engine, quote_engine


class HabitInput(BaseModel):
    day_of_week: int        # 0=Monday, 6=Sunday
    days_since_last: int    # days since last workout
    current_streak: int     # current streak in days
    energy_level: int       # self-reported 1-10
    user_name: Optional[str] = "Champion"


class LogWorkout(BaseModel):
    completed: bool
    user_name: Optional[str] = "Champion"


@router.get("/status")
def status():
    return {"module": "Habit Predictor", "status": "online"}


@router.post("/predict")
def predict_habit(data: HabitInput):
    predict_skip, get_nudge = get_engines()

    # Validate inputs
    if not 0 <= data.day_of_week <= 6:
        raise HTTPException(status_code=400, detail="day_of_week must be 0-6")
    if not 1 <= data.energy_level <= 10:
        raise HTTPException(status_code=400, detail="energy_level must be 1-10")

    prediction = predict_skip(
        data.day_of_week,
        data.days_since_last,
        data.current_streak,
        data.energy_level
    )

    nudge = get_nudge(
        prediction["risk_level"],
        prediction["skip_probability"],
        data.user_name,
        data.current_streak
    )

    return {
        "user_name": data.user_name,
        "prediction": prediction,
        "motivational_nudge": nudge,
        "module": "Habit Predictor"
    }


@router.post("/quick-check")
def quick_check(data: HabitInput):
    """Just prediction, no motivational message."""
    predict_skip, _ = get_engines()
    prediction = predict_skip(
        data.day_of_week,
        data.days_since_last,
        data.current_streak,
        data.energy_level
    )
    return {"prediction": prediction}