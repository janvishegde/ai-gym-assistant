import cv2
import mediapipe as mp
import numpy as np
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from pose_engine import EXERCISES, mp_pose, mp_drawing

pose = mp_pose.Pose()
cap  = cv2.VideoCapture(0)

exercise = "squat"
reps  = 0
stage = None
config = EXERCISES[exercise]

print(f"Testing {exercise} counter. Press Q to quit.")

while True:
    success, frame = cap.read()
    if not success:
        break

    rgb     = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    feedback = "No pose detected"
    angle    = 0

    if results.pose_landmarks:
        lm = results.pose_landmarks.landmark
        angle, feedback = config["analyzer"](lm)

        if angle > config["up_threshold"]:
            stage = "up"
        if angle < config["down_threshold"] and stage == "up":
            stage = "down"
            reps += 1

        mp_drawing.draw_landmarks(
            frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS
        )

        # Show angle
        cv2.putText(frame, f"{int(angle)} deg", (50, 150),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 2)

    # Counter box
    cv2.rectangle(frame, (0,0), (250,80), (0,0,0), -1)
    cv2.putText(frame, exercise.upper(), (10,28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)
    cv2.putText(frame, str(reps), (10,70),
                cv2.FONT_HERSHEY_SIMPLEX, 2, (255,255,255), 3)

    # Feedback
    cv2.putText(frame, feedback, (10, frame.shape[0]-20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,255), 2)

    cv2.imshow("AI Gym Trainer", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()