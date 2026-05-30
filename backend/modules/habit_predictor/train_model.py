import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from ml_engine import train_model

if __name__ == "__main__":
    model, scaler = train_model()
    print("Done! Model is ready.")