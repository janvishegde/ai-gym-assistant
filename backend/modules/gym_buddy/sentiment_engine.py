from transformers import pipeline
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

# Load sentiment model once at startup
print("Loading sentiment model...")
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
    return_all_scores=False
)
print("Sentiment model loaded!")


def detect_sentiment(text: str) -> dict:
    """
    Returns sentiment label and score.
    Labels: positive / neutral / negative
    """
    result = sentiment_pipeline(text[:512])[0]
    label = result["label"].lower()
    score = round(result["score"], 3)

    # Normalize label
    if "pos" in label:
        label = "positive"
    elif "neg" in label:
        label = "negative"
    else:
        label = "neutral"

    return {"label": label, "score": score}


def get_buddy_response(user_message: str, sentiment: dict,
                       user_name: str = "Champion") -> str:
    """
    Generate a personalized motivational response
    based on the user's message and detected sentiment.
    """
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7
    )

    # Adjust tone based on sentiment
    if sentiment["label"] == "negative":
        tone = "very empathetic, uplifting, and encouraging"
        style = "acknowledge their struggle first, then motivate"
    elif sentiment["label"] == "positive":
        tone = "energetic, celebratory, and enthusiastic"
        style = "celebrate their positivity and push them further"
    else:
        tone = "friendly, warm, and supportive"
        style = "engage with them and keep them motivated"

    prompt = PromptTemplate.from_template("""
You are an AI Virtual Gym Buddy — a personal fitness companion.
Your job is to motivate, support, and guide {user_name} on their fitness journey.

User's sentiment: {sentiment_label} (confidence: {sentiment_score})
Your tone should be: {tone}
Your style: {style}

User said: "{message}"

Respond in 2-3 sentences maximum. Be personal, energetic, and fitness-focused.
Don't mention that you detected their sentiment.
Response:""")

    chain = prompt | llm | StrOutputParser()

    response = chain.invoke({
        "user_name": user_name,
        "sentiment_label": sentiment["label"],
        "sentiment_score": sentiment["score"],
        "tone": tone,
        "style": style,
        "message": user_message
    })

    return response.strip()