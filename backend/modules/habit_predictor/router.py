from fastapi import APIRouter

router = APIRouter(prefix="/habits", tags=["Habit Predictor"])

@router.get("/status")
def status():
    return {"module": "Habit Predictor", "status": "online"}

@router.post("/predict")
def predict_habit():
    return {"message": "Habit prediction coming soon"}
