from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import base64
import cv2
import numpy as np
import mediapipe as mp
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from pose_engine import EXERCISES, mp_pose, mp_drawing

router = APIRouter(prefix="/gym-trainer", tags=["Gym Trainer"])

# In-memory state per exercise
state = {
    "squat":  {"reps": 0, "stage": None},
    "curl":   {"reps": 0, "stage": None},
    "pushup": {"reps": 0, "stage": None}
}

pose = mp.solutions.pose.Pose(static_image_mode=True)


class FrameInput(BaseModel):
    image_base64: str
    exercise: Optional[str] = "squat"  # squat / curl / pushup


@router.get("/status")
def status():
    return {"module": "AI Gym Trainer", "status": "online"}


@router.get("/state")
def get_state():
    return {"state": state}


@router.post("/reset")
def reset_reps(exercise: str = "squat"):
    if exercise not in state:
        raise HTTPException(status_code=400, detail="Unknown exercise")
    state[exercise] = {"reps": 0, "stage": None}
    return {"message": f"{exercise} reset", "state": state[exercise]}


@router.post("/analyze-pose")
def analyze_pose(data: FrameInput):
    exercise = data.exercise.lower()

    if exercise not in EXERCISES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown exercise. Choose: {list(EXERCISES.keys())}"
        )

    # Decode base64 image
    try:
        img_bytes = base64.b64decode(data.image_base64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")

    results = pose.process(rgb)

    if not results.pose_landmarks:
        return {
            "pose_detected": False,
            "reps": state[exercise]["reps"],
            "stage": state[exercise]["stage"],
            "feedback": "Stand back so your full body is visible.",
            "angle": None
        }

    landmarks = results.pose_landmarks.landmark
    config    = EXERCISES[exercise]
    ex_state  = state[exercise]

    # Get angle + feedback
    angle, feedback = config["analyzer"](landmarks)

    # Count rep
    if angle > config["up_threshold"]:
        ex_state["stage"] = "up"
    if angle < config["down_threshold"] and ex_state["stage"] == "up":
        ex_state["stage"] = "down"
        ex_state["reps"] += 1

    return {
        "pose_detected": True,
        "exercise": exercise,
        "reps": ex_state["reps"],
        "stage": ex_state["stage"],
        "angle": round(angle, 1),
        "feedback": feedback
    }