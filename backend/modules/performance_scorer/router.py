from fastapi import APIRouter

router = APIRouter(prefix="/performance", tags=["Performance Scorer"])

@router.get("/status")
def status():
    return {"module": "Performance Scorer", "status": "online"}

@router.post("/score")
def score_workout():
    return {"message": "Scoring coming soon"}
