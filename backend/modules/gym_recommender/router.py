from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
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
    user_profile: Optional[Dict[str, Any]] = {}


@router.get("/status")
def status():
    return {"module": "Gym Recommender", "status": "online"}


@router.post("/recommend")
def recommend(data: RecommendInput):
    chain = get_chain()

    query = (
        f"Goal: {data.goal}. "
        f"Fitness level: {data.fitness_level}. "
        f"Available {data.available_days} days per week. "
        f"Location preference: {data.location or 'any'}. "
        f"Additional info: {data.user_profile}."
    )

    result = chain.invoke(query)

    return {
        "goal": data.goal,
        "fitness_level": data.fitness_level,
        "recommendation": result,
        "module": "Gym Recommender"
    }


@router.post("/workout-plan")
def get_workout_plan(data: RecommendInput):
    chain = get_chain()

    query = (
        f"Create a {data.available_days}-day per week workout plan for "
        f"a {data.fitness_level} with goal: {data.goal}. "
        f"Include specific exercises, sets, reps, and rest periods."
    )

    result = chain.invoke(query)
    return {
        "workout_plan": result,
        "module": "Gym Recommender"
    }


@router.post("/nearby-gyms")
def find_gyms(data: RecommendInput):
    chain = get_chain()

    query = (
        f"What type of gym or fitness facility would you recommend for "
        f"someone in {data.location or 'any city'} with goal: {data.goal} "
        f"and fitness level: {data.fitness_level}? "
        f"What features should they look for?"
    )

    result = chain.invoke(query)
    return {
        "location": data.location,
        "gym_advice": result,
        "module": "Gym Recommender"
    }