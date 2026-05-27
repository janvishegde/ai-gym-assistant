from fastapi import APIRouter

router = APIRouter(prefix="/gym-buddy", tags=["Gym Buddy"])

@router.get("/status")
def status():
    return {"module": "Virtual Gym Buddy", "status": "online"}

@router.post("/chat")
def chat():
    return {"message": "Chat coming soon"}
