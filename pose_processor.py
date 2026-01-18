"""
MediaPipe pose detection and landmark extraction - ROBUST & STRICT FATIGUE DETECTION
"""
import mediapipe as mp
import math
from typing import Dict, Optional, List
from constants import ExerciseConfig, FACE_LANDMARKS

class PoseProcessor:
    """Handles MediaPipe pose detection and landmark extraction"""
    
    def __init__(self, angle_calculator, exercise_config: ExerciseConfig):
        self.angle_calculator = angle_calculator
        self.config = exercise_config 

    def _get_distance(self, p1, p2) -> float:
        """Euclidean distance helper"""
        return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)

    def _is_head_pose_valid(self, landmarks) -> bool:
        """
        Validates if the user is looking relatively straight ahead.
        Prevents false fatigue detection when looking down/sideways.
        """
        try:
            nose = landmarks[FACE_LANDMARKS["NOSE_TIP"]]
            left_ear = landmarks[FACE_LANDMARKS["LEFT_EAR"]]
            right_ear = landmarks[FACE_LANDMARKS["RIGHT_EAR"]]
            
            # 1. Pitch Check (Looking Down): Nose should not be too far below ears vertically
            ear_y_avg = (left_ear.y + right_ear.y) / 2
            # If nose is significantly below ears, head is tilted down
            if (nose.y - ear_y_avg) > 0.15: 
                return False 

            # 2. Yaw Check (Turning Head): Nose should be roughly centered between ears
            ear_width = abs(right_ear.x - left_ear.x)
            if ear_width == 0: return False
            
            nose_offset = abs(nose.x - (left_ear.x + right_ear.x) / 2)
            # If nose offset is > 30% of face width, head is turned
            if (nose_offset / ear_width) > 0.30: 
                return False
                
            return True
        except (IndexError, AttributeError):
            return True # Assume valid if landmarks missing to allow fallback

    def calculate_ear(self, landmarks, indices: List[int]) -> float:
        """Calculate Eye Aspect Ratio (EAR)"""
        try:
            pts = [landmarks[i] for i in indices]
            v1 = self._get_distance(pts[1], pts[5])
            v2 = self._get_distance(pts[2], pts[4])
            h = self._get_distance(pts[0], pts[3])
            
            if h < 0.01: return 0.3 # Prevent division by zero
            return (v1 + v2) / (2.0 * h)
        except (IndexError, AttributeError):
            return 0.3

    def calculate_mar(self, landmarks, indices: List[int]) -> float:
        """Calculate Mouth Aspect Ratio (MAR)"""
        try:
            pts = [landmarks[i] for i in indices] 
            v = self._get_distance(pts[2], pts[3]) 
            h = self._get_distance(pts[0], pts[1]) 
            
            if h < 0.01: return 0.0
            return v / h
        except (IndexError, AttributeError):
            return 0.0 

    def check_fatigue_face(self, face_landmarks) -> bool:
        """
        Returns True ONLY if 'Pain Face' is detected AND Head Pose is valid.
        """
        if not face_landmarks: return False
        
        lm = face_landmarks.landmark
        
        # 1. Edge Case: Check Head Pose First
        if not self._is_head_pose_valid(lm):
            return False # Invalid pose, do not detect fatigue
        
        # 2. Calculate Ratios
        left_ear = self.calculate_ear(lm, FACE_LANDMARKS["LEFT_EYE"])
        right_ear = self.calculate_ear(lm, FACE_LANDMARKS["RIGHT_EYE"])
        avg_ear = (left_ear + right_ear) / 2.0
        
        mar = self.calculate_mar(lm, FACE_LANDMARKS["MOUTH"])
        
        # 3. Strict Thresholds (Defined in constants.py)
        # 0.20 is very low (requires genuine squint/squeeze)
        # 0.75 is very high (requires wide open mouth)
        from constants import FATIGUE_THRESHOLDS
        
        is_squinting = avg_ear < FATIGUE_THRESHOLDS["EAR_MIN"]
        is_gasping = mar > FATIGUE_THRESHOLDS["MAR_MAX"]
        
        return is_squinting or is_gasping
    
    def extract_arm_angle(self, landmarks, arm: str) -> Optional[float]:
        """Extract angle for the specified joint using the current exercise config"""
        try:
            # Select the correct landmark index list based on arm/side
            if arm == 'RIGHT':
                indices = self.config.right_landmarks
            elif arm == 'LEFT':
                indices = self.config.left_landmarks
            else:
                return None
            
            # Indices are (A, B, C) where B is the vertex
            A_idx, B_idx, C_idx = indices
            
            # Extract Coordinates
            A = [landmarks[A_idx].x, landmarks[A_idx].y] 
            B = [landmarks[B_idx].x, landmarks[B_idx].y] 
            C = [landmarks[C_idx].x, landmarks[C_idx].y] 
            
            # Check landmark visibility
            if (landmarks[A_idx].visibility < 0.6 or
                landmarks[B_idx].visibility < 0.6 or
                landmarks[C_idx].visibility < 0.6):
                return None

            # Calculate and smooth the angle
            raw_angle = self.angle_calculator.calculate_angle(A, B, C)
            return self.angle_calculator.get_smoothed_angle(arm, raw_angle)
            
        except (KeyError, IndexError, AttributeError):
            return None
    
    def get_both_arm_angles(self, results) -> Dict[str, Optional[int]]:
        """Get angles for both sides defined in the config"""
        if not results.pose_landmarks:
            return {'RIGHT': None, 'LEFT': None}
        
        landmarks = results.pose_landmarks.landmark
        return {
            'RIGHT': self.extract_arm_angle(landmarks, 'RIGHT'),
            'LEFT': self.extract_arm_angle(landmarks, 'LEFT')
        }

    def calculate_depth_percentage(self, knee_angle: float) -> int:
        """Squat: 180 (Stand) -> 90 (Deep)"""
        if knee_angle is None: return 0
        rom_target = 180 - 90 
        current_rom = 180 - knee_angle
        depth = (current_rom / rom_target) * 100
        return int(max(0, depth))

    def calculate_lift_percentage(self, hip_angle: float) -> int:
        """
        Knee Lift: 180 (Stand) -> 90 (High Knee)
        """
        if hip_angle is None: return 0
        # Target is 90 degrees flexion
        rom_target = 180 - 90
        current_rom = 180 - hip_angle
        lift = (current_rom / rom_target) * 100
        return int(max(0, lift))

    def detect_v_sign(self, results) -> bool:
        """
        Strict V-Sign Detection (Peace Sign).
        """
        for hand_landmarks in [results.right_hand_landmarks, results.left_hand_landmarks]:
            if hand_landmarks:
                lm = hand_landmarks.landmark
                index_tip_y, index_pip_y = lm[8].y, lm[6].y
                middle_tip_y, middle_pip_y = lm[12].y, lm[10].y
                ring_tip_y, ring_pip_y = lm[16].y, lm[14].y
                pinky_tip_y, pinky_pip_y = lm[20].y, lm[18].y
                
                fingers_correct = (
                    index_tip_y < index_pip_y and
                    middle_tip_y < middle_pip_y and
                    ring_tip_y > ring_pip_y and
                    pinky_tip_y > pinky_pip_y
                )
                
                if not fingers_correct:
                    continue

                def dist(p1, p2):
                    return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)

                tip_spread = dist(lm[8], lm[12])
                pip_spread = dist(lm[6], lm[10])
                
                if tip_spread > (pip_spread * 1.5):
                    return True
                    
        return False