from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGODB_URL)
db = client["gym_assistant"]

# Collections (like tables in SQL)
users_collection       = db["users"]
workouts_collection    = db["workouts"]
diet_collection        = db["diet_logs"]
habits_collection      = db["habits"]
performance_collection = db["performance"]