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
            if features['is_flaring']: return True, "Keep Elbows Close to Body"

        # Shoulder Press
        elif "shoulder" in ex_name or "press" in ex_name:
            if features['is_squatting']: return True, "Squat Detected"
            if features['is_knee_lift']: return True, "Leg Lift Detected"

        # Squat Checks
        elif "squat" in ex_name:
            if features['is_leaning']: return True, "Keep Chest Up"
            if features['is_valgus']: return True, "Push Knees Out"
            if features['is_shifted']: return True, "Balance Hips Evenly"

        # Knee Lift Checks (NEW)
        elif "knee" in ex_name or "lift" in ex_name:
            # 1. Leaning Back (Cheating)
            if features['is_leaning_back']: return True, "Don't Lean Back"
            # 2. Squatting (Standing leg bent too much)
            if features['is_squatting']: return True, "Stand Tall"
            # 3. Overhead (Arms flailing)
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

        # --- 4. ELBOW FLARE ---
        r_flare = abs(right_elbow[0] - right_shoulder[0])
        l_flare = abs(left_elbow[0] - left_shoulder[0])
        is_flaring = (r_flare > 0.15) or (l_flare > 0.15)

        # --- 5. VALGUS (Knees Caving In) ---
        knee_dist = abs(right_knee[0] - left_knee[0])
        ankle_dist = abs(right_ankle[0] - left_ankle[0])
        is_valgus = (knee_dist < ankle_dist * 0.75) and (ankle_dist > 0.1)

        # --- 6. HIP SHIFT ---
        hip_y_diff = abs(right_hip[1] - left_hip[1])
        is_shifted = hip_y_diff > 0.05

        # --- 7. TORSO LEAN (Forward & Backward) ---
        mid_shoulder = (right_shoulder + left_shoulder) / 2
        mid_hip = (right_hip + left_hip) / 2
        
        dx = mid_shoulder[0] - mid_hip[0] # Signed distance for direction
        dy = abs(mid_shoulder[1] - mid_hip[1])
        
        lean_angle = math.degrees(math.atan2(abs(dx), dy))
        
        is_leaning = lean_angle > 35.0 # Forward lean
        
        # Check backward lean (Shoulders behind hips significantly)
        # Note: This is simple heuristic, assumes side view or consistent camera
        is_leaning_back = lean_angle > 20.0 and (mid_shoulder[1] > mid_hip[1]) # Very rough check, better relying on angle
        
        # Better Back Lean Check:
        # If shoulders are behind hips relative to ankles? 
        # For now, let's just use the absolute lean angle trigger if it's excessive
        is_leaning_back = lean_angle > 25.0 # Stricter for knee lift

        return {
            "is_overhead": is_overhead,
            "is_squatting": is_squatting,
            "is_knee_lift": is_knee_lift,
            "is_flaring": is_flaring,
            "is_valgus": is_valgus,
            "is_shifted": is_shifted,
            "is_leaning": is_leaning,
            "is_leaning_back": is_leaning_back
        }

    def _calculate_angle(self, a, b, c):
        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians*180.0/np.pi)
        if angle > 180.0:
            angle = 360 - angle
        return angle