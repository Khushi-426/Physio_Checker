"""
Configuration constants and enumerations
"""
from enum import Enum
from dataclasses import dataclass, field
from typing import List
import mediapipe as mp 

class WorkoutPhase(Enum):
    INACTIVE = "INACTIVE"
    CALIBRATION = "CALIBRATION"
    COUNTDOWN = "COUNTDOWN"
    ACTIVE = "ACTIVE"

class CalibrationPhase(Enum):
    EXTEND = "EXTEND"
    CONTRACT = "CONTRACT"
    COMPLETE = "COMPLETE"

class ArmStage(Enum):
    UP = "UP"         # Fully contracted (e.g. Squat Bottom)
    DOWN = "DOWN"     # Fully extended (e.g. Standing)
    LOST = "LOST"     
    MOVING_UP = "MOVING_UP"   
    MOVING_DOWN = "MOVING_DOWN" 

class ExerciseJoint(Enum):
    ELBOW = "ELBOW"
    KNEE = "KNEE"
    SHOULDER = "SHOULDER"
    HIP = "HIP" 
    ANKLE = "ANKLE"

@dataclass
class ExerciseConfig:
    name: str = "Bicep Curl"
    joint_to_track: ExerciseJoint = ExerciseJoint.ELBOW
    right_landmarks: List[int] = field(default_factory=list)
    left_landmarks: List[int] = field(default_factory=list) 
    ai_features_landmarks: List[int] = field(default_factory=list)

mp_pose = mp.solutions.holistic.PoseLandmark

# --- DEFINE CONFIGS INDIVIDUALLY FIRST ---

BICEP_CURL = ExerciseConfig(
    name="Bicep Curl",
    joint_to_track=ExerciseJoint.ELBOW,
    right_landmarks=[mp_pose.RIGHT_SHOULDER.value, mp_pose.RIGHT_ELBOW.value, mp_pose.RIGHT_WRIST.value],
    left_landmarks=[mp_pose.LEFT_SHOULDER.value, mp_pose.LEFT_ELBOW.value, mp_pose.LEFT_WRIST.value],
    ai_features_landmarks=[
        mp_pose.RIGHT_SHOULDER.value, mp_pose.RIGHT_ELBOW.value, mp_pose.RIGHT_WRIST.value,
        mp_pose.LEFT_SHOULDER.value, mp_pose.LEFT_ELBOW.value, mp_pose.LEFT_WRIST.value,
        mp_pose.RIGHT_HIP.value, mp_pose.LEFT_HIP.value 
    ]
)

SQUAT = ExerciseConfig(
    name="Squat",
    joint_to_track=ExerciseJoint.KNEE,
    right_landmarks=[mp_pose.RIGHT_HIP.value, mp_pose.RIGHT_KNEE.value, mp_pose.RIGHT_ANKLE.value],
    left_landmarks=[mp_pose.LEFT_HIP.value, mp_pose.LEFT_KNEE.value, mp_pose.LEFT_ANKLE.value],
    ai_features_landmarks=[
        mp_pose.RIGHT_SHOULDER.value, mp_pose.RIGHT_HIP.value, mp_pose.RIGHT_KNEE.value,
        mp_pose.LEFT_SHOULDER.value, mp_pose.LEFT_HIP.value, mp_pose.LEFT_KNEE.value,
        mp_pose.RIGHT_ANKLE.value, mp_pose.LEFT_ANKLE.value
    ]
)

KNEE_LIFT = ExerciseConfig(
    name="Knee Lift",
    joint_to_track=ExerciseJoint.KNEE,
    right_landmarks=[mp_pose.RIGHT_HIP.value, mp_pose.RIGHT_KNEE.value, mp_pose.RIGHT_ANKLE.value],
    left_landmarks=[mp_pose.LEFT_HIP.value, mp_pose.LEFT_KNEE.value, mp_pose.LEFT_ANKLE.value],
    ai_features_landmarks=[
        mp_pose.RIGHT_HIP.value, mp_pose.RIGHT_KNEE.value, mp_pose.RIGHT_ANKLE.value,
        mp_pose.LEFT_HIP.value, mp_pose.LEFT_KNEE.value, mp_pose.LEFT_ANKLE.value,
        mp_pose.NOSE.value, mp_pose.RIGHT_HIP.value 
    ]
)

SHOULDER_PRESS = ExerciseConfig(
    name="Shoulder Press",
    joint_to_track=ExerciseJoint.SHOULDER,
    right_landmarks=[mp_pose.RIGHT_HIP.value, mp_pose.RIGHT_SHOULDER.value, mp_pose.RIGHT_ELBOW.value],
    left_landmarks=[mp_pose.LEFT_HIP.value, mp_pose.LEFT_SHOULDER.value, mp_pose.LEFT_ELBOW.value],
    ai_features_landmarks=[
        mp_pose.RIGHT_HIP.value, mp_pose.RIGHT_SHOULDER.value, mp_pose.RIGHT_ELBOW.value,
        mp_pose.LEFT_HIP.value, mp_pose.LEFT_SHOULDER.value, mp_pose.LEFT_ELBOW.value,
        mp_pose.RIGHT_KNEE.value, mp_pose.LEFT_KNEE.value 
    ]
)

STANDING_ROW = ExerciseConfig(
    name="Standing Row",
    joint_to_track=ExerciseJoint.SHOULDER,
    right_landmarks=[mp_pose.RIGHT_HIP.value, mp_pose.RIGHT_SHOULDER.value, mp_pose.RIGHT_ELBOW.value],
    left_landmarks=[mp_pose.LEFT_HIP.value, mp_pose.LEFT_SHOULDER.value, mp_pose.LEFT_ELBOW.value],
    ai_features_landmarks=[
        mp_pose.RIGHT_HIP.value, mp_pose.RIGHT_SHOULDER.value, mp_pose.RIGHT_ELBOW.value,
        mp_pose.LEFT_HIP.value, mp_pose.LEFT_SHOULDER.value, mp_pose.LEFT_ELBOW.value,
        mp_pose.RIGHT_KNEE.value, mp_pose.LEFT_KNEE.value 
    ]
)

# --- MAP BOTH SINGULAR AND PLURAL NAMES ---
EXERCISE_PRESETS = {
    "Bicep Curl": BICEP_CURL,
    "Bicep Curls": BICEP_CURL,
    
    "Squat": SQUAT,
    "Squats": SQUAT, # <--- THIS FIXES YOUR ISSUE
    
    "Knee Lift": KNEE_LIFT,
    "Knee Lifts": KNEE_LIFT,
    
    "Shoulder Press": SHOULDER_PRESS,
    
    "Standing Row": STANDING_ROW,
    "Standing Rows": STANDING_ROW
}

# Settings
CALIBRATION_HOLD_TIME = 5     
WORKOUT_COUNTDOWN_TIME = 5    
SMOOTHING_WINDOW = 7
SAFETY_MARGIN = 10    
MIN_DETECTION_CONFIDENCE = 0.7
MIN_TRACKING_CONFIDENCE = 0.7
MIN_REP_DURATION = 0.6    
REP_VALIDATION_RELIEF = 5   
REP_HYSTERESIS_MARGIN = 5   
DEFAULT_CONTRACTED_THRESHOLD = 50
DEFAULT_EXTENDED_THRESHOLD = 160
DEFAULT_SAFE_ANGLE_MIN = 30
DEFAULT_SAFE_ANGLE_MAX = 175