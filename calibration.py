"""
Calibration logic: Dynamically determines ROM thresholds INDEPENDENTLY per arm
"""
import time
from typing import TYPE_CHECKING
from constants import CalibrationPhase, ExerciseConfig

if TYPE_CHECKING:
    from pose_processor import PoseProcessor
    from models import CalibrationData

class CalibrationManager:
    def __init__(self, pose_processor, data: 'CalibrationData', hold_time: int, safety_margin: int):
        self.pose_processor = pose_processor
        self.data = data
        self.hold_time = hold_time
        self.safety_margin = safety_margin
        
        self.exercise_config: ExerciseConfig = pose_processor.config
        self.joint_name = self.exercise_config.joint_to_track.value.title()
        self.exercise_name = self.exercise_config.name

        self.start_time = 0.0
        
        # FIXED: Independent tracking
        self.min_angles = {'RIGHT': 360, 'LEFT': 360}
        self.max_angles = {'RIGHT': 0, 'LEFT': 0}

    def _get_instruction(self, phase_type: str) -> str:
        """Returns natural language instructions based on the exercise type."""
        name = self.exercise_name.lower()

        # --- PHASE 1: EXTEND (START POSITION) ---
        if phase_type == "EXTEND":
            if "lateral" in name:
                return "Rest your arms at your sides."
            elif "squat" in name:
                return "Stand up straight."
            elif "knee" in name:
                return "Stand tall with feet together."
            elif "press" in name:
                return "Bring hands to shoulder level."
            elif "row" in name:
                return "Extend your arms forward."
            else:
                return f"Please fully EXTEND your {self.joint_name} joint."

        # --- PHASE 2: CONTRACT (TARGET POSITION) ---
        elif phase_type == "CONTRACT":
            if "lateral" in name:
                return "Raise your arms to shoulder height (T-Pose)."
            elif "squat" in name:
                return "Lower into a squat position."
            elif "knee" in name:
                return "Lift your knee up high."
            elif "press" in name:
                return "Press your arms fully overhead."
            elif "row" in name:
                return "Pull your elbows back."
            else:
                return "Great. Now fully CONTRACT that joint."
        
        return ""

    def start(self):
        """Initializes the calibration sequence with a stable instruction."""
        self.data.active = True
        self.data.phase = CalibrationPhase.EXTEND
        
        self.data.message = self._get_instruction("EXTEND")
        
        self.data.progress = 0
        self.start_time = time.time()
        
        # Reset independent trackers
        self.min_angles = {'RIGHT': 360, 'LEFT': 360}
        self.max_angles = {'RIGHT': 0, 'LEFT': 0}
        print(f"Starting calibration for: {self.exercise_name}")

    def process_frame(self, results, current_time: float) -> bool:
        """Processes pose data to determine range of motion limits."""
        if not self.data.active:
            return False

        angles = self.pose_processor.get_both_arm_angles(results)
        
        # Check if we have at least one valid arm
        if angles['RIGHT'] is None and angles['LEFT'] is None:
            if "Searching" not in self.data.message:
                self.data.message = f"Searching for your {self.joint_name}..."
            self.start_time = current_time 
            return False
            
        # FIXED: Update Independent Trackers
        for arm in ['RIGHT', 'LEFT']:
            if angles[arm] is not None:
                self.min_angles[arm] = min(self.min_angles[arm], angles[arm])
                self.max_angles[arm] = max(self.max_angles[arm], angles[arm])
        
        elapsed_time = current_time - self.start_time
        self.data.progress = int((elapsed_time / self.hold_time) * 100)
        
        if self.data.phase == CalibrationPhase.EXTEND:
            # Transition to contraction phase after hold time
            if elapsed_time >= self.hold_time:
                # Store independent extended thresholds
                self.data.extended_thresholds['RIGHT'] = int(self.max_angles['RIGHT']) if self.max_angles['RIGHT'] > 0 else 160
                self.data.extended_thresholds['LEFT'] = int(self.max_angles['LEFT']) if self.max_angles['LEFT'] > 0 else 160
                
                self.data.phase = CalibrationPhase.CONTRACT
                self.data.message = self._get_instruction("CONTRACT")
                
                self.start_time = current_time
                self.data.progress = 0
                
                # Reset for contraction phase
                self.min_angles = {'RIGHT': 360, 'LEFT': 360}
                self.max_angles = {'RIGHT': 0, 'LEFT': 0}
        
        elif self.data.phase == CalibrationPhase.CONTRACT:
            # Finalize calibration
            if elapsed_time >= self.hold_time:
                # Store independent contracted thresholds
                self.data.contracted_thresholds['RIGHT'] = int(self.min_angles['RIGHT']) if self.min_angles['RIGHT'] < 360 else 50
                self.data.contracted_thresholds['LEFT'] = int(self.min_angles['LEFT']) if self.min_angles['LEFT'] < 360 else 50
                
                self._finalize_calibration()
                return True
                
        return False

    def _finalize_calibration(self):
        """Calculates final thresholds and sets the completion message."""
        # Calculate safe ranges (using average for safety limits, or min/max of both)
        avg_con = (self.data.contracted_thresholds['RIGHT'] + self.data.contracted_thresholds['LEFT']) / 2
        avg_ext = (self.data.extended_thresholds['RIGHT'] + self.data.extended_thresholds['LEFT']) / 2
        
        self.data.safe_angle_min = max(20, int(avg_con - self.safety_margin))
        self.data.safe_angle_max = min(175, int(avg_ext + self.safety_margin))

        self.data.active = False
        self.data.phase = CalibrationPhase.COMPLETE
        self.data.message = "Calibration successful. Ready to start!"
        self.data.progress = 100
        print(f"Calibration Finalized. R: {self.data.contracted_thresholds['RIGHT']}-{self.data.extended_thresholds['RIGHT']}, L: {self.data.contracted_thresholds['LEFT']}-{self.data.extended_thresholds['LEFT']}")