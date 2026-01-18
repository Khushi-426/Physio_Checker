"""
Rep counting logic - STABILIZED AND ACCURACY-FOCUSED
"""
from collections import deque
from constants import ArmStage
import time
import random

class RepCounter:
    def __init__(self, calibration_data, min_rep_duration=0.5):
        self.calibration = calibration_data
        self.min_rep_duration = min_rep_duration 

        # Stability buffers for EACH side independently
        self.angle_history = {
            'RIGHT': deque(maxlen=8),
            'LEFT': deque(maxlen=8)
        }

        # Stability Logic
        self.color_lock_until = {'RIGHT': 0, 'LEFT': 0}
        self.color_hold_duration = 1.5 

        # State confirmation variables
        self.state_hold_time = 0.1 
        self.pending_state = {'RIGHT': None, 'LEFT': None}
        self.pending_state_start = {'RIGHT': 0, 'LEFT': 0}
        
        self.rep_start_time = {'RIGHT': 0, 'LEFT': 0}
        self.last_rep_time = {'RIGHT': 0, 'LEFT': 0}
        
        # Ensure full Range of Motion
        self.ready_to_count = {'RIGHT': False, 'LEFT': False}
        
        # Tracking peaks
        self.rep_min_angle = {'RIGHT': 180, 'LEFT': 180}
        self.rep_max_angle = {'RIGHT': 0, 'LEFT': 0}
        
        # ACCURACY & ERROR TRACKING
        self.rep_accuracies = {'RIGHT': [], 'LEFT': []}
        self.feedback_error_counts = {'RIGHT': 0, 'LEFT': 0}
        
        # ERROR STATE TRACKING (Rising Edge Detection)
        self.in_error_state = {'RIGHT': False, 'LEFT': False}
        
        # Compliments
        self.compliments = [
            "Perfect Form!", 
            "Great Control!", 
            "Nice and steady!", 
            "Excellent!"
        ]
        self.current_compliment = {'RIGHT': "Maintain Form", 'LEFT': "Maintain Form"}
        
        self.last_feedback = {'RIGHT': "", 'LEFT': ""}
        self.feedback_cooldown = {'RIGHT': 0, 'LEFT': 0}

    def _calculate_rep_accuracy(self, arm):
        """Calculates 0-100% accuracy based on calibrated range of motion"""
        cal_ext = self.calibration.extended_thresholds[arm]
        cal_con = self.calibration.contracted_thresholds[arm]
        cal_range = abs(cal_ext - cal_con)
        
        if cal_range == 0: return 100
        
        user_range = abs(self.rep_max_angle[arm] - self.rep_min_angle[arm])
        
        # Calculate deviation magnitude
        deviation = abs(user_range - cal_range)
        
        # Calculate percentage error relative to expected range
        percent_error = (deviation / cal_range) * 100
        
        # Accuracy is 100 minus the error
        accuracy = max(0, 100 - percent_error)
        
        return int(accuracy)

    def count_error_state_based(self, arm, feedback_color):
        """
        Counts errors using STATE MACHINE (Rising Edge).
        Increments ONLY when entering a RED state from a non-RED state.
        """
        if feedback_color == "RED":
            if not self.in_error_state[arm]:
                # Rising edge: We just entered error state
                self.feedback_error_counts[arm] += 1
                self.in_error_state[arm] = True
        else:
            # Falling edge: We are safe now
            self.in_error_state[arm] = False

    def process_rep(self, arm, angle, metrics, current_time, history):
        """Process rep counting for a single side independently"""
        metrics.angle = angle
        self.angle_history[arm].append(angle)

        # Track peaks
        self.rep_min_angle[arm] = min(self.rep_min_angle[arm], angle)
        self.rep_max_angle[arm] = max(self.rep_max_angle[arm], angle)

        if len(self.angle_history[arm]) < 2:
            return

        prev_stage = metrics.stage
        
        # Get calibrated thresholds SPECIFIC TO THIS ARM
        contracted = self.calibration.contracted_thresholds[arm]
        extended = self.calibration.extended_thresholds[arm]
        
        # --- 1. DETERMINE STATE ---
        target_state = self._determine_target_state(angle, contracted, extended, prev_stage)
        
        # --- 2. STATE SWITCHING WITH CONFIRMATION ---
        if target_state != prev_stage:
            if self.pending_state[arm] == target_state:
                if (current_time - self.pending_state_start[arm]) >= self.state_hold_time:
                    self._handle_state_transition(arm, prev_stage, target_state, metrics, current_time)
            else:
                self.pending_state[arm] = target_state
                self.pending_state_start[arm] = current_time
        else:
            self.pending_state[arm] = None

        # Update rep timing
        if metrics.stage == ArmStage.UP.value:
            metrics.curr_rep_time = current_time - self.rep_start_time[arm]

        # --- 3. FEEDBACK GENERATION ---
        self._provide_user_centered_feedback(arm, angle, metrics, current_time)

    def _determine_target_state(self, angle, contracted, extended, current_stage):
        """Determines state with dynamic buffer"""
        rom = abs(extended - contracted)
        buffer = max(5, min(15, int(rom * 0.15)))
        
        up_limit = contracted + buffer 
        down_limit = extended - buffer

        if angle <= up_limit:
            return ArmStage.UP.value
        elif angle >= down_limit:
            return ArmStage.DOWN.value
        
        # Hysteresis Transitions
        if current_stage == ArmStage.UP.value:
            return ArmStage.UP.value if angle < (up_limit + 5) else ArmStage.MOVING_DOWN.value
        elif current_stage == ArmStage.DOWN.value:
            return ArmStage.DOWN.value if angle > (down_limit - 5) else ArmStage.MOVING_UP.value
        elif current_stage == ArmStage.MOVING_UP.value:
            return ArmStage.UP.value if angle <= up_limit else ArmStage.MOVING_UP.value
        elif current_stage == ArmStage.MOVING_DOWN.value:
            return ArmStage.DOWN.value if angle >= down_limit else ArmStage.MOVING_DOWN.value
            
        return current_stage

    def _handle_state_transition(self, arm, prev_stage, new_stage, metrics, current_time):
        """Handle state transitions and rep counting"""
        metrics.stage = new_stage
        
        # 1. RESET / READY AT EXTENSION (DOWN)
        if new_stage == ArmStage.DOWN.value:
            self.ready_to_count[arm] = True
            self.rep_start_time[arm] = current_time
            self.rep_min_angle[arm], self.rep_max_angle[arm] = 180, 0
            
        # 2. DETECT REP COMPLETION (Moving from CONTRACTION -> EXTENSION)
        elif prev_stage == ArmStage.UP.value and new_stage in [ArmStage.MOVING_DOWN.value, ArmStage.DOWN.value]:
            
            if self.ready_to_count[arm]:
                rep_duration = current_time - self.rep_start_time[arm]
                
                if rep_duration >= self.min_rep_duration:
                    metrics.rep_count += 1
                    metrics.rep_time = rep_duration
                    
                    # Calculate Genuine Accuracy for this Rep
                    calculated_accuracy = self._calculate_rep_accuracy(arm)
                    metrics.accuracy = calculated_accuracy
                    
                    # STORE ACCURACY
                    self.rep_accuracies[arm].append(calculated_accuracy)
                    
                    self.last_rep_time[arm] = current_time
                    self.current_compliment[arm] = random.choice(self.compliments)
                    self.color_lock_until[arm] = current_time + self.color_hold_duration
                    self.ready_to_count[arm] = False

    def _provide_user_centered_feedback(self, arm, angle, metrics, current_time):
        """
        Determines form feedback and counts errors.
        CRITICAL FIX: Error counting happens BEFORE any Fatigue Override logic.
        """
        
        # 1. Determine "Natural" Feedback (based on mechanics)
        potential_feedback = "Smooth movements"
        potential_color = "GREEN"
        
        # High angle (Full extension) is still a positive indicator
        if angle > 170.0:
            potential_feedback = "Good extension"
            potential_color = "GREEN"
            
        # CRITICAL ERROR CHECK (e.g., lost tracking or extreme angle)
        if metrics.stage == ArmStage.LOST.value:
            potential_feedback = "Adjust your position"
            potential_color = "RED"
            self.color_lock_until[arm] = current_time + 2.0
        
        # 2. COUNT ERRORS NOW (Before any overrides hide them)
        # This fixes the "Zero Form Error" bug.
        self.count_error_state_based(arm, potential_color)

        # 3. Apply Feedback to UI (If not locked by Fatigue or Compliment)
        
        # Check 1: Is Fatigue Message Active? (Don't overwrite it, but we already counted the error above)
        if metrics.feedback == "Fatigue Detected: Take a Rest":
            return

        # Check 2: Is Compliment Active?
        if (current_time - self.last_rep_time[arm]) < self.color_hold_duration:
            metrics.feedback = self.current_compliment[arm]
            metrics.feedback_color = "GREEN"
            return

        # Check 3: Is Color Locked?
        if current_time < self.color_lock_until[arm]:
            return

        # Apply calculated feedback
        if potential_feedback != self.last_feedback[arm]:
            metrics.feedback = potential_feedback
            metrics.feedback_color = potential_color
            self.last_feedback[arm] = potential_feedback
        else:
            metrics.feedback = potential_feedback
            metrics.feedback_color = potential_color

    def reset_arm(self, arm):
        """Reset tracking for specific side"""
        self.angle_history[arm].clear()
        self.pending_state[arm] = None
        self.rep_start_time[arm] = 0
        self.last_feedback[arm] = ""
        self.color_lock_until[arm] = 0
        self.ready_to_count[arm] = False
        self.in_error_state[arm] = False