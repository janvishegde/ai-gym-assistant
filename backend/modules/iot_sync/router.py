from fastapi import APIRouter

router = APIRouter(prefix="/iot", tags=["IoT Sync"])

@router.get("/status")
def status():
    return {"module": "IoT Sync", "status": "online"}

@router.post("/data")
def receive_sensor_data():
    return {"message": "IoT data endpoint coming soon"}
