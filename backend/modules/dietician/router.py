from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import sys, os

sys.path.insert(0, os.path.dirname(__file__))

router = APIRouter(prefix="/dietician", tags=["Dietician"])

_retriever = None
_chain = None

def get_chain():
    global _retriever, _chain
    if _chain is None:
        try:
            from rag_pipeline import get_qa_chain
            _retriever, _chain = get_qa_chain()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return _retriever, _chain


def get_sources(retriever, query: str) -> List[dict]:
    """Fetch source documents and format them."""
    docs = retriever.invoke(query)
    sources = []
    seen = set()
    for doc in docs:
        filename = os.path.basename(
            doc.metadata.get("source", "Unknown source")
        )
        page = doc.metadata.get("page", "?")
        key  = f"{filename}_p{page}"
        if key not in seen:
            seen.add(key)
            sources.append({
                "document": filename,
                "page": page,
                "preview": doc.page_content[:120] + "..."
            })
    return sources


class QuestionInput(BaseModel):
    question: str
    user_profile: Dict[str, Any] = {}


@router.get("/status")
def status():
    return {"module": "AI Dietician", "status": "online"}


@router.post("/ask")
def ask_dietician(data: QuestionInput):
    retriever, chain = get_chain()

    full_question = data.question
    if data.user_profile:
        profile_str = ", ".join(f"{k}: {v}" for k, v in data.user_profile.items())
        full_question = f"User profile — {profile_str}. Question: {data.question}"

    answer  = chain.invoke(full_question)
    sources = get_sources(retriever, full_question)

    return {
        "question": data.question,
        "answer": answer,
        "sources": sources,
        "module": "AI Dietician"
    }


@router.post("/meal-plan")
def get_meal_plan(data: QuestionInput):
    retriever, chain = get_chain()
    prompt = (
        f"Create a detailed one-day meal plan. "
        f"User details: {data.user_profile}. "
        f"Requirements: {data.question}. "
        f"Include breakfast, lunch, dinner and 2 snacks with calories."
    )
    answer  = chain.invoke(prompt)
    sources = get_sources(retriever, prompt)
    return {
        "meal_plan": answer,
        "sources": sources,
        "module": "AI Dietician"
    }


@router.post("/grocery-list")
def get_grocery_list(data: QuestionInput):
    retriever, chain = get_chain()
    prompt = (
        f"Generate a weekly grocery list for: {data.user_profile}. "
        f"Goal: {data.question}. "
        f"Group by: Proteins, Vegetables, Fruits, Grains, Dairy, Others."
    )
    answer  = chain.invoke(prompt)
    sources = get_sources(retriever, prompt)
    return {
        "grocery_list": answer,
        "sources": sources,
        "module": "AI Dietician"
    }