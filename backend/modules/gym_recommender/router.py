from fastapi import APIRouter

router = APIRouter(prefix="/recommender", tags=["Gym Recommender"])

@router.get("/status")
def status():
    return {"module": "Gym Recommender", "status": "online"}

@router.post("/recommend")
def recommend():
    return {"message": "Recommendations coming soon"}
