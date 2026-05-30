import os
import json
from datetime import datetime
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

# Score history file (simple JSON store)
SCORES_FILE = os.path.join(os.path.dirname(__file__), "scores.json")


def load_scores():
    if not os.path.exists(SCORES_FILE):
        return []
    with open(SCORES_FILE, "r") as f:
        return json.load(f)


def save_scores(scores):
    with open(SCORES_FILE, "w") as f:
        json.dump(scores, f, indent=2)


def calculate_performance_score(reps: int, target_reps: int,
                                  avg_angle_accuracy: float,
                                  exercise: str) -> dict:
    """
    Score a workout session 0-100.

    Components:
    - Rep completion rate (40%): did they hit their target?
    - Form accuracy (40%):       how good was their joint angle?
    - Consistency bonus (20%):   extra points for hitting both
    """

    # Rep score (0-40)
    rep_rate  = min(reps / max(target_reps, 1), 1.0)
    rep_score = round(rep_rate * 40, 1)

    # Form score (0-40) — angle_accuracy is 0-100%
    form_score = round((avg_angle_accuracy / 100) * 40, 1)

    # Consistency bonus (0-20)
    if rep_rate >= 1.0 and avg_angle_accuracy >= 70:
        bonus = 20
    elif rep_rate >= 0.8 and avg_angle_accuracy >= 60:
        bonus = 10
    else:
        bonus = 0

    total = round(rep_score + form_score + bonus, 1)

    # Grade
    if total >= 85:
        grade, feedback = "A", "Outstanding performance!"
    elif total >= 70:
        grade, feedback = "B", "Great work, keep pushing!"
    elif total >= 55:
        grade, feedback = "C", "Good effort, room to improve."
    elif total >= 40:
        grade, feedback = "D", "Keep going, consistency is key!"
    else:
        grade, feedback = "F", "Don't give up — every rep counts!"

    return {
        "total_score": total,
        "grade": grade,
        "feedback": feedback,
        "breakdown": {
            "rep_score": rep_score,
            "form_score": form_score,
            "consistency_bonus": bonus
        },
        "exercise": exercise,
        "reps_completed": reps,
        "target_reps": target_reps,
        "form_accuracy": avg_angle_accuracy
    }


def save_session_score(user_name: str, score_data: dict):
    """Save a scored session to the JSON store."""
    scores = load_scores()
    entry = {
        "user_name": user_name,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "timestamp": datetime.now().isoformat(),
        **score_data
    }
    scores.append(entry)
    save_scores(scores)
    return entry


def get_weekly_summary(user_name: str) -> dict:
    """Get last 7 days of scores for a user."""
    scores = load_scores()
    user_scores = [s for s in scores if s["user_name"] == user_name]

    if not user_scores:
        return {"message": "No scores yet", "scores": []}

    # Last 7 entries
    recent = user_scores[-7:]
    avg_score = round(sum(s["total_score"] for s in recent) / len(recent), 1)
    best      = max(recent, key=lambda x: x["total_score"])

    return {
        "user_name": user_name,
        "sessions_this_week": len(recent),
        "average_score": avg_score,
        "best_score": best["total_score"],
        "best_exercise": best["exercise"],
        "recent_scores": recent
    }