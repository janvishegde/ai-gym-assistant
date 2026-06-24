# AI Gym & Fitness Assistant

A unified AI-powered fitness ecosystem with 7 intelligent modules.

## 🎥 Demo Video
[Link to your video]

## 🌐 Live Demo
- Frontend: https://your-app.vercel.app
- Backend: https://your-ngrok-url.ngrok-free.app/docs

## 🧠 7 AI Modules

| Module | Technology | Function |
|--------|-----------|----------|
| AI Gym Trainer | MediaPipe, OpenCV | Real-time pose detection & rep counting |
| AI Dietician | RAG, Qdrant, Groq | Nutrition Q&A from PDF knowledge base |
| Smart IoT Sync | MQTT Simulator | Live sensor data & heart rate zones |
| Habit Predictor | scikit-learn ML | Skip prediction & motivational nudges |
| Virtual Gym Buddy | Sentiment Analysis, LLM | Emotionally aware chat companion |
| Performance Scorer | Custom Algorithm | Workout grading & progress tracking |
| Gym Recommender | RAG, YouTube API | Personalized gym & video recommendations |

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js / Next.js |
| Backend | Python FastAPI |
| AI/ML | MediaPipe, HuggingFace, scikit-learn |
| LLM | Groq (Llama 3.3 70B) |
| Vector DB | Qdrant |
| Database | MongoDB Atlas |
| Embeddings | HuggingFace all-MiniLM-L6-v2 |

## 🚀 Run Locally

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 👩‍💻 Built By
Janvi Hegde — AI Gym & Fitness Assistant Major Project