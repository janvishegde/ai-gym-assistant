from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import all module routers
from modules.gym_trainer.router     import router as gym_trainer_router
from modules.dietician.router       import router as dietician_router
from modules.habit_predictor.router import router as habit_router
from modules.gym_buddy.router       import router as buddy_router
from modules.performance_scorer.router import router as performance_router
from modules.gym_recommender.router import router as recommender_router
from modules.iot_sync.router        import router as iot_router

load_dotenv()

app = FastAPI(
    title="AI Gym & Fitness Assistant",
    description="7-module AI fitness ecosystem",
    version="1.0.0"
)

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all 7 modules
app.include_router(gym_trainer_router)
app.include_router(dietician_router)
app.include_router(habit_router)
app.include_router(buddy_router)
app.include_router(performance_router)
app.include_router(recommender_router)
app.include_router(iot_router)

@app.get("/")
def root():
    return {
        "project": "AI Gym & Fitness Assistant",
        "modules": [
            "gym-trainer", "dietician", "habits",
            "gym-buddy", "performance", "recommender", "iot"
        ],
        "status": "running"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
