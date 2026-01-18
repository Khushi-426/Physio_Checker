"""
Exercise Verification Logic - Detects if the user is performing the wrong exercise
"""
import mediapipe as mp
import numpy as np
import math

class ExerciseVerifier:
    def __init__(self):
        self.mp_pose = mp.solutions.holistic.PoseLandmark

    def check_mismatch(self, landmarks, expected_exercise_name: str):
        """
        Checks if the current pose landmarks indicate an exercise that conflicts 
        with the expected exercise.
        """
        if not landmarks:
            return False, ""

        features = self._extract_features(landmarks)
        ex_name = expected_exercise_name.lower()

        # --- RULE SETS ---
        
        # Bicep Curl
        if "bicep" in ex_name:
            if features['is_overhead']: return True, "Overhead Reach Detected"
            if features['is_squatting']: return True, "Squat Detected"
            if features['is_knee_lift']: return True, "Leg Lift Detected"
            
            # IMPROVED: Checks both flaring (out) and drifting (forward)
            if features['is_elbow_drifting']: return True, "Keep Elbows Pinned to Sides"

        # Lateral Raise
        elif "lateral" in ex_name:
            if features['is_arm_bent']: return True, "Keep Arms Straight"
            if features['is_too_high']: return True, "Stop at Shoulder Height"
            if features['is_leaning']: return True, "Keep Torso Straight"

        # Shoulder Press
        elif "shoulder" in ex_name or "press" in ex_name:
            if features['is_squatting']: return True, "Squat Detected"
            if features['is_knee_lift']: return True, "Leg Lift Detected"

        # Squat Checks
        elif "squat" in ex_name:
            if features['is_leaning']: return True, "Keep Chest Up"
            if features['is_valgus']: return True, "Push Knees Out"
            if features['is_shifted']: return True, "Balance Hips Evenly"

        # Knee Lift Checks
        elif "knee" in ex_name or "lift" in ex_name:
            if features['is_leaning_back']: return True, "Don't Lean Back"
            if features['is_squatting']: return True, "Stand Tall"
            if features['is_overhead']: return True, "Relax Shoulders"
            
        # Standing Row
        elif "row" in ex_name:
            if features['is_overhead']: return True, "Overhead Reach Detected"
            if features['is_squatting']: return True, "Squat Detected"
            if features['is_knee_lift']: return True, "Leg Lift Detected"

        return False, ""

    def _extract_features(self, landmarks):
        """Analyzes geometric features of the pose"""
        pl = self.mp_pose
        
        def get_pos(idx):
            lm = landmarks[idx]
            return np.array([lm.x, lm.y])

        # Get Landmarks
        nose = get_pos(pl.NOSE.value)
        right_shoulder = get_pos(pl.RIGHT_SHOULDER.value)
        left_shoulder = get_pos(pl.LEFT_SHOULDER.value)
        right_elbow = get_pos(pl.RIGHT_ELBOW.value)
        left_elbow = get_pos(pl.LEFT_ELBOW.value)
        right_wrist = get_pos(pl.RIGHT_WRIST.value)
        left_wrist = get_pos(pl.LEFT_WRIST.value)
        right_hip = get_pos(pl.RIGHT_HIP.value)
        left_hip = get_pos(pl.LEFT_HIP.value)
        right_knee = get_pos(pl.RIGHT_KNEE.value)
        left_knee = get_pos(pl.LEFT_KNEE.value)
        right_ankle = get_pos(pl.RIGHT_ANKLE.value)
        left_ankle = get_pos(pl.LEFT_ANKLE.value)

        # --- 1. OVERHEAD REACH ---
        is_overhead = (right_wrist[1] < nose[1]) or (left_wrist[1] < nose[1])

        # --- 2. DEEP SQUAT ---
        r_knee_angle = self._calculate_angle(right_hip, right_knee, right_ankle)
        l_knee_angle = self._calculate_angle(left_hip, left_knee, left_ankle)
        is_squatting = (r_knee_angle < 130) and (l_knee_angle < 130)

        # --- 3. KNEE LIFT ---
        ankle_y_diff = abs(right_ankle[1] - left_ankle[1])
        is_knee_lift = ankle_y_diff > 0.15 

        # --- 4. ELBOW FLARE / DRIFT (UPDATED) ---
        # Old method: Simple X distance (too loose)
        # New method: Angle between Torso (Shoulder-Hip) and Upper Arm (Shoulder-Elbow)
        
        r_upper_arm_angle = self._calculate_angle(right_elbow, right_shoulder, right_hip)
        l_upper_arm_angle = self._calculate_angle(left_elbow, left_shoulder, left_hip)
        
        # If angle > 25 degrees, the elbow is drifting away from the body
        is_elbow_drifting = (r_upper_arm_angle > 25) or (l_upper_arm_angle > 25)

        # --- 5. VALGUS (Knees Caving In) ---
        knee_dist = abs(right_knee[0] - left_knee[0])
        ankle_dist = abs(right_ankle[0] - left_ankle[0])
        is_valgus = (knee_dist < ankle_dist * 0.75) and (ankle_dist > 0.1)

        # --- 6. HIP SHIFT ---
        hip_y_diff = abs(right_hip[1] - left_hip[1])
        is_shifted = hip_y_diff > 0.05

        # --- 7. TORSO LEAN ---
        mid_shoulder = (right_shoulder + left_shoulder) / 2
        mid_hip = (right_hip + left_hip) / 2
        
        dx = mid_shoulder[0] - mid_hip[0]
        dy = abs(mid_shoulder[1] - mid_hip[1])
        
        lean_angle = math.degrees(math.atan2(abs(dx), dy))
        is_leaning = lean_angle > 35.0
        is_leaning_back = lean_angle > 25.0

        # --- 8. LATERAL RAISE CHECKS ---
        # Arm Bent
        r_arm_angle = self._calculate_angle(right_shoulder, right_elbow, right_wrist)
        l_arm_angle = self._calculate_angle(left_shoulder, left_elbow, left_wrist)
        is_arm_bent = (r_arm_angle < 140) or (l_arm_angle < 140)

        # Too High (Shoulder Abduction > 110)
        r_lat_angle = self._calculate_angle(right_elbow, right_shoulder, right_hip)
        l_lat_angle = self._calculate_angle(left_elbow, left_shoulder, left_hip)
        is_too_high = (r_lat_angle > 110) or (l_lat_angle > 110)

        return {
            "is_overhead": is_overhead,
            "is_squatting": is_squatting,
            "is_knee_lift": is_knee_lift,
            "is_elbow_drifting": is_elbow_drifting,
            "is_valgus": is_valgus,
            "is_shifted": is_shifted,
            "is_leaning": is_leaning,
            "is_leaning_back": is_leaning_back,
            "is_arm_bent": is_arm_bent,
            "is_too_high": is_too_high
        }

    def _calculate_angle(self, a, b, c):
        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians*180.0/np.pi)
        if angle > 180.0:
            angle = 360 - angle
        return angle