import os
import sys
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)


def get_motivational_nudge(risk_level: str, skip_probability: float,
                            user_name: str = "Champion",
                            streak: int = 0) -> str:
    """
    Generate a personalized motivational message
    based on skip risk level using Groq LLM.
    """
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.8
    )

    if risk_level == "high":
        urgency = "strongly motivating — they are very likely to skip today"
        action  = "give them one powerful reason to show up anyway"
    elif risk_level == "medium":
        urgency = "gently encouraging — they might skip"
        action  = "remind them how good they'll feel after the workout"
    else:
        urgency = "celebratory — they are on track"
        action  = "celebrate their consistency and push them to keep going"

    prompt = PromptTemplate.from_template("""
You are a personal fitness coach sending a motivational message to {user_name}.

Their workout stats:
- Skip risk: {risk_level} ({skip_prob}% chance of skipping)
- Current streak: {streak} days

Your message should be: {urgency}
Your goal: {action}

Write a short motivational message (2-3 sentences max).
Make it personal, powerful, and fitness-focused.
Message:""")

    chain = prompt | llm | StrOutputParser()

    return chain.invoke({
        "user_name": user_name,
        "risk_level": risk_level,
        "skip_prob": round(skip_probability * 100),
        "streak": streak,
        "urgency": urgency,
        "action": action
    }).strip()