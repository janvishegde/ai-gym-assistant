from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import sys, os

sys.path.insert(0, os.path.dirname(__file__))

router = APIRouter(prefix="/gym-buddy", tags=["Gym Buddy"])

# Chat history per session (in memory)
chat_history = []

# Load engines once
sentiment_engine = None
def get_engine():
    global sentiment_engine
    if sentiment_engine is None:
        try:
            from sentiment_engine import detect_sentiment, get_buddy_response
            sentiment_engine = {
                "detect": detect_sentiment,
                "respond": get_buddy_response
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return sentiment_engine


class ChatInput(BaseModel):
    message: str
    user_name: Optional[str] = "Champion"


class ChatMessage(BaseModel):
    role: str      # "user" or "buddy"
    message: str
    sentiment: Optional[str] = None


@router.get("/status")
def status():
    return {"module": "Virtual Gym Buddy", "status": "online"}


@router.post("/chat")
def chat(data: ChatInput):
    engine = get_engine()

    # Detect sentiment
    sentiment = engine["detect"](data.message)

    # Generate response
    response = engine["respond"](
        data.message,
        sentiment,
        data.user_name
    )

    # Save to history
    chat_history.append({
        "role": "user",
        "message": data.message,
        "sentiment": sentiment["label"]
    })
    chat_history.append({
        "role": "buddy",
        "message": response,
        "sentiment": None
    })

    return {
        "user_message": data.message,
        "sentiment": sentiment,
        "buddy_response": response,
        "module": "Virtual Gym Buddy"
    }


@router.get("/history")
def get_history():
    return {"history": chat_history, "total": len(chat_history)}


@router.post("/reset")
def reset_history():
    chat_history.clear()
    return {"message": "Chat history cleared"}


@router.post("/mood-check")
def mood_check(data: ChatInput):
    """Just returns sentiment without generating a response."""
    engine = get_engine()
    sentiment = engine["detect"](data.message)
    return {
        "message": data.message,
        "sentiment": sentiment,
        "mood_summary": f"You seem {sentiment['label']} right now."
    }