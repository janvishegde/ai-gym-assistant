from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/dietician", tags=["Dietician"])

qa_chain = None

def get_chain():
    global qa_chain
    if qa_chain is None:
        try:
            from .rag_pipeline import get_qa_chain
            qa_chain = get_qa_chain()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return qa_chain


class QuestionInput(BaseModel):
    question: str
    user_profile: dict = {}


@router.get("/status")
def status():
    return {"module": "AI Dietician", "status": "online"}


@router.post("/ask")
def ask_dietician(data: QuestionInput):
    chain = get_chain()

    full_question = data.question
    if data.user_profile:
        profile_str = ", ".join(f"{k}: {v}" for k, v in data.user_profile.items())
        full_question = f"User profile — {profile_str}. Question: {data.question}"

    answer = chain.invoke(full_question)
    return {"question": data.question, "answer": answer, "module": "AI Dietician"}


@router.post("/meal-plan")
def get_meal_plan(data: QuestionInput):
    chain = get_chain()
    prompt = (
        f"Create a detailed one-day meal plan. "
        f"User details: {data.user_profile}. "
        f"Requirements: {data.question}. "
        f"Include breakfast, lunch, dinner and 2 snacks with calories."
    )
    answer = chain.invoke(prompt)
    return {"meal_plan": answer, "module": "AI Dietician"}


@router.post("/grocery-list")
def get_grocery_list(data: QuestionInput):
    chain = get_chain()
    prompt = (
        f"Generate a weekly grocery list for: {data.user_profile}. "
        f"Goal: {data.question}. "
        f"Group by: Proteins, Vegetables, Fruits, Grains, Dairy, Others."
    )
    answer = chain.invoke(prompt)
    return {"grocery_list": answer, "module": "AI Dietician"}