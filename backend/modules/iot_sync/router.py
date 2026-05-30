from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import sys, os
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))
from simulator import simulator

router = APIRouter(prefix="/iot", tags=["IoT Sync"])


class ManualReading(BaseModel):
    heart_rate:       Optional[int]   = None
    steps:            Optional[int]   = None
    calories_burned:  Optional[float] = None
    resistance_level: Optional[int]   = None
    speed_kmh:        Optional[float] = None


@router.get("/status")
def status():
    return {
        "module":         "IoT Sync",
        "status":         "online",
        "session_active": simulator.session_active,
        "device":         "Smart Gym Simulator v1.0"
    }


@router.post("/session/start")
def start_session():
    """Start a simulated gym session."""
    if simulator.session_active:
        return {"message": "Session already active", "status": "active"}
    return simulator.start_session()


@router.post("/session/stop")
def stop_session():
    """Stop the session and get summary."""
    if not simulator.session_active:
        return {"message": "No active session"}
    summary = simulator.stop_session()
    return {
        "message": "Session complete!",
        "summary": summary,
        "module":  "IoT Sync"
    }


@router.get("/readings")
def get_readings():
    """Get current live sensor readings."""
    readings = simulator.get_readings()
    return {
        "readings": readings,
        "module":   "IoT Sync"
    }


@router.get("/session/stats")
def get_session_stats():
    """Get full session statistics."""
    return {
        "stats":  simulator.get_session_stats(),
        "module": "IoT Sync"
    }


@router.post("/readings/manual")
def manual_reading(data: ManualReading):
    """Manually push a sensor reading (for real IoT device integration)."""
    update = {k: v for k, v in data.dict().items() if v is not None}
    update["timestamp"] = datetime.now().isoformat()
    update["status"]    = "active"
    simulator.data.update(update)
    return {
        "message":  "Reading updated",
        "readings": simulator.data
    }


@router.get("/heart-rate-zone")
def heart_rate_zone():
    """Calculate current heart rate training zone."""
    hr = simulator.data.get("heart_rate", 0)

    if hr == 0:
        return {"zone": "idle", "description": "No active session"}
    elif hr < 100:
        zone, desc, color = "warm-up",    "Light activity",        "blue"
    elif hr < 120:
        zone, desc, color = "fat-burn",   "Fat burning zone",      "green"
    elif hr < 140:
        zone, desc, color = "aerobic",    "Aerobic endurance",     "yellow"
    elif hr < 160:
        zone, desc, color = "threshold",  "Lactate threshold",     "orange"
    else:
        zone, desc, color = "max-effort", "Maximum performance",   "red"

    return {
        "heart_rate":  hr,
        "zone":        zone,
        "description": desc,
        "color":       color,
        "module":      "IoT Sync"
    }