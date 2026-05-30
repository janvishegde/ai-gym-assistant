from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import sys, os

sys.path.insert(0, os.path.dirname(__file__))

router = APIRouter(prefix="/recommender", tags=["Gym Recommender"])

rec_chain = None

def get_chain():
    global rec_chain
    if rec_chain is None:
        try:
            from recommender_engine import get_recommender_chain
            rec_chain = get_recommender_chain()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return rec_chain


class RecommendInput(BaseModel):
    goal: str
    fitness_level: Optional[str] = "beginner"
    location: Optional[str] = ""
    available_days: Optional[int] = 3
    include_videos: Optional[bool] = True
    user_profile: Optional[Dict[str, Any]] = {}


@router.get("/status")
def status():
    return {"module": "Gym Recommender", "status": "online"}


@router.post("/recommend")
def recommend(data: RecommendInput):
    chain = get_chain()
    from video_engine import search_youtube_videos

    query = (
        f"Goal: {data.goal}. "
        f"Fitness level: {data.fitness_level}. "
        f"Available {data.available_days} days per week. "
        f"Location: {data.location or 'any'}."
    )

    result = chain.invoke(query)

    videos = []
    if data.include_videos:
        videos = search_youtube_videos(data.goal, max_results=3)

    return {
        "goal": data.goal,
        "fitness_level": data.fitness_level,
        "recommendation": result,
        "video_recommendations": videos,
        "module": "Gym Recommender"
    }


@router.post("/workout-plan")
def get_workout_plan(data: RecommendInput):
    chain = get_chain()
    from video_engine import search_youtube_videos

    query = (
        f"Create a {data.available_days}-day per week workout plan for "
        f"a {data.fitness_level} with goal: {data.goal}. "
        f"Include specific exercises, sets, reps, and rest periods."
    )

    result = chain.invoke(query)
    videos = search_youtube_videos(f"{data.goal} workout tutorial", max_results=3)

    return {
        "workout_plan": result,
        "tutorial_videos": videos,
        "module": "Gym Recommender"
    }


@router.post("/nearby-gyms")
def find_gyms(data: RecommendInput):
    chain = get_chain()

    query = (
        f"What type of gym would suit someone in {data.location or 'any city'} "
        f"with goal: {data.goal} and level: {data.fitness_level}?"
    )

    result = chain.invoke(query)
    return {
        "location": data.location,
        "gym_advice": result,
        "module": "Gym Recommender"
    }