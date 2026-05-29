import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


def calculate_angle(a, b, c):
    """Calculate angle at joint B formed by points A-B-C."""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    ba = a - b
    bc = c - b
    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    return np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))


def get_landmark_point(landmarks, landmark_enum):
    """Extract [x, y] from a landmark."""
    lm = landmarks[landmark_enum.value]
    return [lm.x, lm.y]


def analyze_squat(landmarks):
    """Detect squat rep and give form feedback."""
    hip   = get_landmark_point(landmarks, mp_pose.PoseLandmark.LEFT_HIP)
    knee  = get_landmark_point(landmarks, mp_pose.PoseLandmark.LEFT_KNEE)
    ankle = get_landmark_point(landmarks, mp_pose.PoseLandmark.LEFT_ANKLE)

    angle = calculate_angle(hip, knee, ankle)

    if angle < 70:
        feedback = "Great depth! Hold it."
    elif angle < 100:
        feedback = "Go a little deeper!"
    elif angle < 160:
        feedback = "Coming up — push through heels."
    else:
        feedback = "Standing — go down for next rep."

    return angle, feedback


def analyze_curl(landmarks):
    """Detect bicep curl rep and give form feedback."""
    shoulder = get_landmark_point(landmarks, mp_pose.PoseLandmark.LEFT_SHOULDER)
    elbow    = get_landmark_point(landmarks, mp_pose.PoseLandmark.LEFT_ELBOW)
    wrist    = get_landmark_point(landmarks, mp_pose.PoseLandmark.LEFT_WRIST)

    angle = calculate_angle(shoulder, elbow, wrist)

    if angle < 40:
        feedback = "Top of curl — great!"
    elif angle < 90:
        feedback = "Keep curling up!"
    else:
        feedback = "Lower down slowly."

    return angle, feedback


def analyze_pushup(landmarks):
    """Detect push-up rep and give form feedback."""
    shoulder = get_landmark_point(landmarks, mp_pose.PoseLandmark.LEFT_SHOULDER)
    elbow    = get_landmark_point(landmarks, mp_pose.PoseLandmark.LEFT_ELBOW)
    wrist    = get_landmark_point(landmarks, mp_pose.PoseLandmark.LEFT_WRIST)

    angle = calculate_angle(shoulder, elbow, wrist)

    if angle < 70:
        feedback = "Good depth!"
    elif angle < 110:
        feedback = "Keep going down!"
    else:
        feedback = "Push up — full extension!"

    return angle, feedback


# Exercise configs: which analyzer + up/down thresholds
EXERCISES = {
    "squat": {
        "analyzer": analyze_squat,
        "down_threshold": 100,
        "up_threshold": 160
    },
    "curl": {
        "analyzer": analyze_curl,
        "down_threshold": 40,
        "up_threshold": 140
    },
    "pushup": {
        "analyzer": analyze_pushup,
        "down_threshold": 70,
        "up_threshold": 140
    }
}