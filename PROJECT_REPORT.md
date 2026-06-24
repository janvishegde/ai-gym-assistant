# AI Gym & Fitness Assistant — Project Report

## Project Overview
The AI Gym & Fitness Assistant is a unified AI ecosystem that acts as a 
smart personal trainer, dietician, motivator, and data-driven fitness manager.

## Objective
To create an all-in-one AI platform that understands, adapts, and enhances 
user fitness journeys through intelligent automation and personalization.

## Architecture

### System Flow
User → React Dashboard → FastAPI Backend → 7 AI Modules → MongoDB + Qdrant

### Module Details

#### Module 1: AI Gym Trainer
- Technology: MediaPipe Pose, OpenCV
- How it works: Captures webcam frames, detects 33 body keypoints,
  calculates joint angles to count reps and give form feedback
- Key innovation: Real-time angle calculation using vector dot product

#### Module 2: AI Dietician  
- Technology: RAG Pipeline, Qdrant Vector DB, Groq LLM
- How it works: 5 nutrition PDFs → chunked → embedded with HuggingFace
  → stored in Qdrant → user query retrieves top 4 chunks → Groq generates answer
- Key innovation: Source citation showing which PDF page the answer came from

#### Module 3: Smart IoT Sync
- Technology: Python threading, MQTT simulation
- How it works: Simulates smart gym sensors generating heart rate, steps,
  calories every 2 seconds → heart rate zone classification → session summary
- Key innovation: Real-time heart rate training zone detection

#### Module 4: Habit Predictor
- Technology: scikit-learn Logistic Regression, Groq LLM
- How it works: Trains on workout history CSV → predicts skip probability
  based on day, streak, energy level → generates personalized nudge
- Model accuracy: ~85% on test set

#### Module 5: Virtual Gym Buddy
- Technology: cardiffnlp sentiment model, Groq LLM
- How it works: Detects sentiment (positive/neutral/negative) from user message
  → adjusts LLM system prompt tone → generates emotionally appropriate response
- Key innovation: Sentiment-aware response generation

#### Module 6: Performance Scorer
- Technology: Custom scoring algorithm
- How it works: Scores workout 0-100 based on rep completion (40%),
  form accuracy (40%), and consistency bonus (20%) → assigns letter grade
- Key innovation: Multi-factor scoring with progress history

#### Module 7: Gym Recommender
- Technology: RAG on gym PDFs, YouTube Data API, Groq LLM
- How it works: User states goal → RAG retrieves relevant fitness programs
  → LLM generates recommendation → YouTube API fetches relevant tutorial videos
- Key innovation: Combined RAG + video recommendation pipeline

## Technical Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React, Tailwind CSS | User interface |
| Backend | FastAPI, Python 3.11 | REST API |
| AI/ML | MediaPipe, HuggingFace | Computer vision, embeddings |
| LLM | Groq Llama 3.3 70B | Text generation |
| Vector DB | Qdrant | Semantic search |
| Database | MongoDB Atlas | Data persistence |
| Deployment | Vercel + ngrok | Frontend + Backend hosting |

## Challenges & Solutions

| Challenge | Solution |
|-----------|---------|
| Python 3.14 incompatibility | Downgraded to Python 3.11 |
| OpenAI cost | Replaced with free Groq API |
| ChromaDB protobuf error | Switched to Qdrant vector store |
| Browser extension breaking layout | Used incognito mode |
| numpy type serialization | Converted to Python native types |

## Results
- All 7 modules functional and integrated
- Real-time pose detection at ~1 FPS via API
- RAG pipeline answers nutrition questions with source citations
- ML model predicts workout skips with ~85% accuracy
- Complete React dashboard with glowing fitness app UI

## Future Improvements
- Add user authentication and multi-user support
- Integrate real IoT devices via MQTT broker
- Add voice input for Gym Buddy
- Deploy ML model with more training data
- Add progress charts with historical data visualization
