from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys, os

sys.path.insert(0, os.path.dirname(__file__))
from scorer_engine import (
    calculate_performance_score,
    save_session_score,
    get_weekly_summary
)

router = APIRouter(prefix="/performance", tags=["Performance Scorer"])


class SessionInput(BaseModel):
    user_name: str
    exercise: str
    reps_completed: int
    target_reps: int
    avg_angle_accuracy: float   # 0-100 percent
    save_score: Optional[bool] = True


@router.get("/status")
def status():
    return {"module": "Performance Scorer", "status": "online"}


@router.post("/score")
def score_workout(data: SessionInput):
    if not 0 <= data.avg_angle_accuracy <= 100:
        raise HTTPException(
            status_code=400,
            detail="avg_angle_accuracy must be between 0 and 100"
        )

    score = calculate_performance_score(
        data.reps_completed,
        data.target_reps,
        data.avg_angle_accuracy,
        data.exercise
    )

    if data.save_score:
        save_session_score(data.user_name, score)

    return {
        "user_name": data.user_name,
        "score": score,
        "module": "Performance Scorer"
    }


@router.get("/weekly/{user_name}")
def weekly_summary(user_name: str):
    summary = get_weekly_summary(user_name)
    return {"summary": summary, "module": "Performance Scorer"}


@router.get("/history/{user_name}")
def score_history(user_name: str):
    from scorer_engine import load_scores
    all_scores = load_scores()
    user_scores = [s for s in all_scores if s["user_name"] == user_name]
    return {
        "user_name": user_name,
        "total_sessions": len(user_scores),
        "scores": user_scores
    }