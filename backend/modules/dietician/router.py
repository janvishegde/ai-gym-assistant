from fastapi import APIRouter

router = APIRouter(prefix="/dietician", tags=["Dietician"])

@router.get("/status")
def status():
    return {"module": "AI Dietician", "status": "online"}

@router.post("/ask")
def ask_dietician():
    return {"message": "Dietician RAG coming soon"}
