from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

url = os.getenv("MONGODB_URL")
print("Connecting to:", url[:30], "...")  # prints first 30 chars only (safe)

client = MongoClient(url)
db = client["gym_assistant"]

result = db["test"].insert_one({"message": "Connected!"})
print("MongoDB connected! ID:", result.inserted_id)

db["test"].delete_one({"_id": result.inserted_id})
print("Test doc cleaned up. All good!")
client.close()