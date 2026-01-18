"""
Flask application with API routes - THREADING MODE (No Eventlet)
INTEGRATED WITH: MongoDB, Ghost Toggle, Smart AI Coach, Streaming, and Accuracy Tracking
"""
from flask import Flask, Response, jsonify, request, render_template
import cv2
import mediapipe as mp
import numpy as np
import time
import json
import os
import random
import string
import requests
import certifi
import threading
import logging
from collections import deque
from datetime import datetime
from flask_cors import CORS
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from flask_mail import Mail, Message
from flask_socketio import SocketIO, emit
from bson.objectid import ObjectId

# --- IMPORT CUSTOM AI MODULES ---
from workout_session import WorkoutSession
from ai_engine import AIEngine
from constants import EXERCISE_PRESETS

# ----------------------------------------------------
# 0. CONFIGURATION
# ----------------------------------------------------
load_dotenv()

app = Flask(__name__)

# --- CORS FIX: Explicitly allow localhost:5173 with credentials ---
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5000", "http://localhost:5173"],
    "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
}}, supports_credentials=True)

bcrypt = Bcrypt(app)

# SWITCHED TO THREADING MODE
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ----------------------------------------------------
# 1. MAIL CONFIGURATION
# ----------------------------------------------------
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
mail = Mail(app)

# ----------------------------------------------------
# 2. DATABASE SETUP
# ----------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "physiocheck_db"

client = None
db = None
users_collection = None
otp_collection = None
sessions_collection = None
exercises_collection = None
protocols_collection = None
notifications_collection = None
checkins_collection = None  # ✅ NEW COLLECTION

try:
    print("⏳ Attempting to connect to MongoDB...")
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000, 
        tls=True,
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True,
    )
    client.admin.command("ping")
    db = client[DB_NAME]

    users_collection = db["users"]
    otp_collection = db["otps"]
    sessions_collection = db["sessions"]
    exercises_collection = db["exercises"]
    protocols_collection = db["protocols"]
    notifications_collection = db["notifications"]
    checkins_collection = db["checkins"] # ✅ Init Checkins

    print(f"✅ Connected to MongoDB Cloud: {DB_NAME}")
except Exception as e:
    print(f"⚠️ DB Error: {e}")
    print("⚠️ WARNING: Application running without Database. Login/Signup will fail.")

# ----------------------------------------------------
# 3. WORKOUT SESSION MANAGEMENT
# ----------------------------------------------------
workout_session = None
last_session_report = None
session_lock = threading.Lock()

def get_camera_index():
    for i in range(2):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            cap.release()
            return i
    return 0 

def init_session(exercise_name="Bicep Curl"):
    global workout_session, last_session_report
    with session_lock:
        if workout_session:
            try:
                print("🛑 Stopping previous session...")
                workout_session.stop()
            except Exception as e:
                print(f"⚠️ Error stopping previous session: {e}")
            finally:
                workout_session = None

        last_session_report = None
        
        print(f"🎥 Initializing Camera for {exercise_name}...")
        workout_session = WorkoutSession(exercise_name)
        
        cam_idx = get_camera_index()
        workout_session.cap = cv2.VideoCapture(cam_idx)
        
        if not workout_session.cap.isOpened():
            print("❌ Camera not accessible")
            workout_session = None
            raise Exception("Camera not accessible")
            
        workout_session.start()

def generate_video_frames():
    from constants import WorkoutPhase
    global workout_session
    
    while True:
        if workout_session is None or workout_session.phase == WorkoutPhase.INACTIVE:
            time.sleep(0.1)
            continue

        try:
            frame, valid = workout_session.process_frame()
            
            if not valid or frame is None:
                continue

            socketio.emit("workout_update", workout_session.get_state_dict())
            
            ret, buffer = cv2.imencode(".jpg", frame)
            if ret:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + buffer.tobytes()
                    + b"\r\n"
                )
        except Exception as e:
            logger.error(f"Stream Error: {e}")
            break

# ----------------------------------------------------
# 4. EXERCISES (FRONTEND DATA)
# ----------------------------------------------------
def _get_frontend_exercise_list():
    meta_map = {
        "Bicep Curl": {
            "category": "Strength",
            "description": "A fundamental exercise for building arm strength and definition.",
            "instructions": ["Stand tall.", "Hold dumbbells.", "Curl weights up.", "Lower slowly."],
            "difficulty": "Beginner",
            "duration": "5 Mins",
            "color": "#E3F2FD",
            "iconColor": "#1565C0",
            "recommended": False
        },
        "Knee Lift": {
            "category": "Mobility",
            "description": "Improves hip mobility and balance.",
            "instructions": ["Stand straight.", "Lift knee to chest.", "Hold.", "Lower slowly."],
            "difficulty": "Beginner",
            "duration": "5 Mins",
            "color": "#E8F5E9",
            "iconColor": "#2E7D32",
            "recommended": False
        },
        "Shoulder Press": {
            "category": "Strength",
            "description": "Builds shoulder and upper arm strength.",
            "instructions": ["Hold weights at shoulder height.", "Press upwards.", "Lower with control."],
            "difficulty": "Intermediate",
            "duration": "8 Mins",
            "color": "#FFF3E0",
            "iconColor": "#EF6C00",
            "recommended": False
        },
        "Squat": {
            "category": "Lower Body",
            "description": "Compound movement for legs and core.",
            "instructions": ["Feet shoulder-width.", "Push hips back.", "Keep chest up.", "Push through heels."],
            "difficulty": "Intermediate",
            "duration": "10 Mins",
            "color": "#F3E5F5",
            "iconColor": "#7B1FA2",
            "recommended": False
        },
        "Standing Row": {
            "category": "Back & Core",
            "description": "Strengthens the upper back.",
            "instructions": ["Hinge forward.", "Pull weights to waist.", "Squeeze blades.", "Lower."],
            "difficulty": "Intermediate",
            "duration": "7 Mins",
            "color": "#FFEBEE",
            "iconColor": "#C62828",
            "recommended": False
        }
    }

    result = []
    for name in EXERCISE_PRESETS:
        details = meta_map.get(name, {
            "category": "General",
            "description": "Standard rehabilitation exercise.",
            "instructions": ["Maintain good form.", "Follow the visual guide."],
            "difficulty": "General",
            "duration": "5 Mins",
            "color": "#F5F5F5",
            "iconColor": "#616161",
            "recommended": False
        })
        
        result.append({
            "id": name.lower().replace(" ", "_"),
            "title": name,
            **details 
        })
    return result

# ----------------------------------------------------
# 5. SOCKET EVENTS
# ----------------------------------------------------
@socketio.on("connect")
def handle_connect():
    print("🟢 Client connected to WebSocket")

@socketio.on("disconnect")
def handle_disconnect():
    print("🔴 Client disconnected")

@socketio.on("stop_session")
def handle_stop_session(data):
    """
    Stops the session and saves detailed metrics to MongoDB.
    """
    global workout_session, last_session_report
    if not workout_session:
        return

    data = data or {}
    email = data.get("email")
    exercise = data.get("exercise", "Freestyle")

    try:
        print("🛑 Stop session command received")
        with session_lock:
            last_session_report = workout_session.get_final_report()
            workout_session.stop()
            workout_session = None 

        if email and sessions_collection is not None:
            r = last_session_report["summary"]["RIGHT"]
            l = last_session_report["summary"]["LEFT"]
            total_reps = r["total_reps"] + l["total_reps"]
            
            if total_reps == 0:
                print(f"⚠️ Session skipped for {email}: 0 reps performed.")
                emit("session_stopped", {"status": "success", "message": "No reps, session not saved."})
                return

            duration = last_session_report.get("duration", 0) 
            avg_accuracy = last_session_report.get("average_accuracy", 0)

            session_doc = {
                "email": email,
                "exerciseType": exercise, 
                "timestamp": time.time(),
                "performedAt": datetime.now(), 
                "date_str": datetime.now().strftime("%Y-%m-%d"),
                "duration": duration,
                "reps": total_reps,
                "qualityScore": int(avg_accuracy),
                "completed": True,
                "metrics": {
                    "leftErrors": l.get("error_count", 0),
                    "rightErrors": r.get("error_count", 0),
                    "leftReps": l["total_reps"],
                    "rightReps": r["total_reps"]
                }
            }
            sessions_collection.insert_one(session_doc)
            print(f"✅ Session saved for {email}: {total_reps} reps, {int(avg_accuracy)}% accuracy")

        emit("session_stopped", {"status": "success"})
    except Exception as e:
        logger.error(f"Stop session error: {e}")
        emit("session_stopped", {"status": "error", "message": str(e)})

@socketio.on("toggle_listening")
def handle_toggle_listening(data):
    global workout_session
    if workout_session:
        active = data.get("active", False)
        print(f"🎙️ Setting listening mode to: {active}")
        workout_session.set_listening(active)

# ----------------------------------------------------
# 6. API ROUTES
# ----------------------------------------------------

# ✅ NEW ROUTE: Patient Daily Check-in
@app.route("/api/user/checkin", methods=["POST"])
def patient_checkin():
    if checkins_collection is None: return jsonify({"error": "DB unavailable"}), 503
    
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    fatigue = data.get("fatigue")
    pain = data.get("painLevel") # Matches frontend 'painLevel'
    
    if not email: return jsonify({"error": "Email required"}), 400

    new_checkin = {
        "email": email,
        "fatigue": fatigue,
        "pain": pain,
        "timestamp": time.time(),
        "date_str": datetime.now().strftime("%Y-%m-%d")
    }
    
    checkins_collection.insert_one(new_checkin)
    return jsonify({"status": "success", "message": "Check-in received"}), 200

# ✅ ROUTE: Checkin History
@app.route("/api/user/checkin_history", methods=["GET"])
def get_checkin_history():
    if checkins_collection is None: return jsonify([]), 200
    email = request.args.get("email")
    if not email: return jsonify({"error": "Email required"}), 400
    
    history = list(checkins_collection.find({"email": email}).sort("timestamp", -1).limit(7))
    for h in history: h["_id"] = str(h["_id"])
    return jsonify(history), 200

# --- AUTH & USER ROUTES ---

@app.route("/api/user/profile/get", methods=["POST"])
def get_user_profile():
    data = request.get_json(silent=True) or {}
    email = data.get("email")

    if not email: return jsonify({"error": "Email is required"}), 400
    if users_collection is None: return jsonify({"error": "Database unavailable"}), 503

    try:
        user = users_collection.find_one({"email": email}, {"_id": 0, "password": 0, "otp": 0})
        if user:
            return jsonify({
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "age": user.get("age", ""),
                "weight": user.get("weight", ""),
                "bloodGroup": user.get("bloodGroup", "")
            }), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logger.error(f"Fetch Profile Error: {e}")
        return jsonify({"error": "Internal Error"}), 500

@app.route("/api/user/profile/update", methods=["POST"])
def update_user_profile():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    
    if not email: return jsonify({"error": "Email is required"}), 400
    if users_collection is None: return jsonify({"error": "Database unavailable"}), 503

    update_fields = {}
    if "name" in data: update_fields["name"] = data["name"]
    if "age" in data: update_fields["age"] = data["age"]
    if "weight" in data: update_fields["weight"] = data["weight"]
    if "bloodGroup" in data: update_fields["bloodGroup"] = data["bloodGroup"]

    try:
        result = users_collection.update_one(
            {"email": email},
            {"$set": update_fields}
        )
        if result.modified_count > 0 or result.matched_count > 0:
            return jsonify({"status": "success", "message": "Profile updated"}), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logger.error(f"Update Profile Error: {e}")
        return jsonify({"error": "Internal Error"}), 500

# --- EXERCISE & PROTOCOL ROUTES ---

@app.route("/api/assign", methods=["POST"])
def assign_exercise():
    if protocols_collection is None or users_collection is None: 
        return jsonify({"error": "Database unavailable"}), 503
        
    data = request.get_json(silent=True) or {}
    patient_email = data.get("patientEmail")
    exercise_name = data.get("exerciseName")
    
    if not patient_email or not exercise_name: 
        return jsonify({"error": "Missing fields"}), 400
        
    patient = users_collection.find_one({"email": patient_email})
    if not patient: return jsonify({"error": "Patient not found"}), 404
    
    sets = data.get("sets", 3)
    reps = data.get("reps", 10)
    difficulty = data.get("difficulty", "Medium")
    duration = data.get("duration", 14) 
    
    therapist = users_collection.find_one({"role": "therapist"})
    therapist_id = therapist["_id"] if therapist else patient["_id"] 
    
    protocol_doc = {
        "therapist": therapist_id,
        "patient": patient["_id"],
        "exerciseName": exercise_name,
        "sets": sets,
        "reps": reps,
        "difficulty": difficulty,
        "duration": duration,
        "isActive": True,
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    
    protocols_collection.update_one(
        {"patient": patient["_id"], "exerciseName": exercise_name},
        {"$set": protocol_doc},
        upsert=True
    )
    
    return jsonify({
        "status": "assigned", 
        "exercise": exercise_name,
        "details": {"sets": sets, "reps": reps, "difficulty": difficulty}
    }), 200

@app.route("/api/exercises", methods=["GET"])
def get_exercises():
    try:
        base_list = _get_frontend_exercise_list()
        email = request.args.get('email')
        assigned_map = {} 

        if email and users_collection is not None and protocols_collection is not None:
            try:
                user = users_collection.find_one({"email": email})
                if user:
                    protocols = protocols_collection.find({"patient": user["_id"], "isActive": True})
                    for p in protocols:
                        ex_name_db = p.get("exerciseName", "")
                        key = ""
                        if "bicep" in ex_name_db.lower(): key = "Bicep Curl"
                        elif "shoulder" in ex_name_db.lower(): key = "Shoulder Press"
                        elif "knee" in ex_name_db.lower(): key = "Knee Lift"
                        elif "squat" in ex_name_db.lower(): key = "Squat"
                        elif "row" in ex_name_db.lower(): key = "Standing Row"
                        
                        if key:
                            assigned_map[key] = {
                                "sets": p.get("sets", 3),
                                "reps": p.get("reps", 10),
                                "difficulty": p.get("difficulty", "Medium"),
                                "duration": p.get("duration", 14)
                            }
            except Exception as db_err: 
                print(f"Error fetching protocols: {db_err}")

        for ex in base_list:
            if ex["title"] in assigned_map: 
                ex["recommended"] = True
                details = assigned_map[ex["title"]]
                ex["assignedDetails"] = {
                    "sets": details["sets"],
                    "reps": details["reps"],
                    "difficulty": details["difficulty"],
                    "days": details["duration"]
                }
                ex["duration"] = f"{details['sets']} Sets • {details['reps']} Reps"
                ex["difficulty"] = details["difficulty"]
            else: 
                ex["recommended"] = False
                
        return jsonify(base_list)
    except Exception as e:
        logger.error(f"Get Exercises Error: {e}")
        return jsonify({"error": "Failed to fetch exercises"}), 500

@app.route("/api/exercises", methods=["OPTIONS"])
def options_exercises():
    return jsonify({}), 200

# --- OTHER ROUTES (HISTORY, ANALYTICS, ETC) ---

@app.route("/api/sessions/my-history", methods=["GET", "OPTIONS"])
def get_session_history():
    if request.method == "OPTIONS": return jsonify({}), 200
    email = request.args.get("email")
    if not email: return jsonify({"error": "Email is required"}), 400
    if sessions_collection is None: return jsonify([]), 200

    try:
        cursor = sessions_collection.find({"email": email}).sort("timestamp", -1)
        sessions = []
        for doc in cursor:
            sessions.append({
                "_id": str(doc["_id"]),
                "exerciseType": doc.get("exerciseType", doc.get("exercise", "Unknown")),
                "reps": doc.get("reps", doc.get("total_reps", 0)),
                "qualityScore": doc.get("qualityScore", 0),
                "duration": doc.get("duration", 0),
                "performedAt": doc.get("timestamp", 0) * 1000, 
                "completed": doc.get("completed", True),
                "metrics": doc.get("metrics", {})
            })
        return jsonify(sessions), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch history"}), 500

# ✅ UPDATED: THERAPIST PATIENTS LIST (Includes Latest Check-in)
@app.route("/api/therapist/patients", methods=["GET"])
def therapist_patients():
    if users_collection is None: return jsonify({"patients": []}), 200
    
    patients = list(users_collection.find(
        {"role": "patient"}, 
        {"_id": 0, "name": 1, "email": 1, "created_at": 1, "age": 1, "weight": 1, "bloodGroup": 1}
    ))
    
    enriched = []
    
    for p in patients:
        email = p.get("email")
        
        # 1. Fetch Sessions
        sessions = list(sessions_collection.find({"email": email}).sort("timestamp", 1))
        
        # 2. ✅ Fetch Latest Daily Check-in
        latest_checkin = checkins_collection.find_one(
            {"email": email}, 
            sort=[("timestamp", -1)]
        )
        
        daily_report = None
        if latest_checkin:
            daily_report = {
                "fatigue": latest_checkin.get("fatigue", "None"),
                "pain": latest_checkin.get("pain", 0),
                "timestamp": latest_checkin.get("timestamp", 0)
            }

        # 3. Calculate Stats
        completed_count = len(sessions)
        accuracy_trend = []
        total_quality = 0
        last_session_ts = None
        
        if completed_count > 0:
            last_session_ts = sessions[-1].get("timestamp")
            for s in sessions:
                q = s.get("qualityScore", 0)
                ts = s.get("timestamp", 0)
                # ✅ Append object with timestamp for filtering
                accuracy_trend.append({"val": q, "ts": ts})
                total_quality += q
            avg_accuracy = int(total_quality / completed_count)
        else:
            avg_accuracy = 0

        status = "Normal"
        if completed_count > 0:
            last_acc = accuracy_trend[-1]["val"] if accuracy_trend else 0
            if last_acc < 60: status = "High Risk"
            elif last_acc < 80: status = "Alert"
            
        enriched.append({
            "id": str(email),
            "name": p.get("name", "Unknown"),
            "email": email,
            "age": p.get("age", "--"),
            "weight": p.get("weight", "--"),
            "bloodGroup": p.get("bloodGroup", "--"),
            "date_joined": datetime.fromtimestamp(p.get("created_at", time.time())).strftime("%Y-%m-%d"),
            "status": status,
            "last_session_ts": last_session_ts,
            
            "accuracyTrend": accuracy_trend, # ✅ Now includes timestamps
            "completionRate": avg_accuracy,
            "completedSessions": completed_count,
            "assignedSessions": 20, 
            "hasActiveProtocol": False,
            "dailyCheckin": daily_report # ✅ Added here
        })
        
    return jsonify({"patients": enriched}), 200

@app.route("/api/therapist/notifications", methods=["GET"])
def therapist_notifications():
    if notifications_collection is None: return jsonify([]), 200
    notifs = list(notifications_collection.find({}).sort("timestamp", -1).limit(10))
    response = []
    for n in notifs:
        response.append({
            "id": str(n.get("_id")),
            "type": n.get("type", "Info"),
            "title": n.get("title", "System"),
            "message": n.get("message", ""),
            "time": n.get("time", "Recently")
        })
    return jsonify(response), 200

@app.route("/api/user/analytics_detailed", methods=["POST"])
def analytics_detailed():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    if not email: return jsonify({"error": "Email required"}), 400
    if sessions_collection is None: return jsonify({"total_sessions": 0, "history": []})

    sessions = list(sessions_collection.find({"email": email}).sort("timestamp", 1))
    analytics = AIEngine.get_detailed_analytics(sessions)
    return jsonify(analytics)

@app.route("/api/user/ai_prediction", methods=["POST"])
def ai_prediction():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    if not email: return jsonify({"error": "Email required"}), 400
    if sessions_collection is None: return jsonify({"error": "Database unavailable"}), 500

    sessions = list(sessions_collection.find({"email": email}).sort("timestamp", 1))
    prediction = AIEngine.get_recovery_prediction(sessions)
    if not prediction: return jsonify({"error": "Not enough data"}), 200 
    return jsonify(prediction)

@app.route("/api/ai_coach", methods=["POST", "OPTIONS"])
def ai_coach_commentary():
    if request.method == 'OPTIONS': return jsonify({}), 200
    data = request.get_json(silent=True) or {}
    if 'listening' in data:
        global workout_session
        if workout_session:
            active = data['listening']
            workout_session.set_listening(active)
            return jsonify({"status": "updated", "listening": active})

    context = data.get("context")
    query = data.get("query")
    history = data.get("history", [])

    if not context or not query: return jsonify({"error": "Context and query are required"}), 400

    try:
        engine = AIEngine()
        response = engine.generate_commentary(context, query, history)
        return jsonify({"response": response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/toggle_ghost', methods=['POST'])
def toggle_ghost():
    global workout_session
    if workout_session:
        new_state = workout_session.toggle_ghost()
        return jsonify({"status": "success", "ghost_visible": new_state})
    return jsonify({"status": "error", "message": "No active session"}), 400

@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    if users_collection is None: return jsonify({"error": "Database unavailable"}), 503
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400
    otp = "".join(random.choices(string.digits, k=6))
    otp_collection.update_one(
        {"email": email},
        {"$set": {"otp": otp, "created_at": time.time()}},
        upsert=True,
    )
    try:
        msg = Message("PhysioCheck OTP", sender=app.config["MAIL_USERNAME"], recipients=[email])
        msg.body = f"Your verification code is: {otp}"
        mail.send(msg)
        return jsonify({"message": "OTP sent"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to send email"}), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    if users_collection is None: return jsonify({"error": "Database unavailable"}), 503
    data = request.get_json(silent=True) or {}
    user = users_collection.find_one({"email": data.get("email")})
    if user and bcrypt.check_password_hash(user["password"], data.get("password")):
        return jsonify({
            "email": user["email"],
            "role": user.get("role", "patient"),
            "name": user["name"],
            "therapistCode": f"DR-{user['name'][:3].upper()}-{str(int(time.time()))[-4:]}"
        })
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/auth/signup-verify", methods=["POST"])
def signup_verify():
    if users_collection is None: return jsonify({"error": "Database unavailable"}), 503
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    otp_input = data.get("otp")
    password = data.get("password")
    name = data.get("name")
    role = data.get("role", "patient")
    if not all([email, otp_input, password, name]):
        return jsonify({"error": "Missing required fields"}), 400
    otp_record = otp_collection.find_one({"email": email})
    if not otp_record or otp_record.get("otp") != otp_input:
        return jsonify({"error": "Invalid OTP"}), 400
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = {
        "email": email, 
        "password": hashed_pw, 
        "name": name, 
        "role": role, 
        "created_at": time.time()
    }
    users_collection.insert_one(new_user)
    otp_collection.delete_one({"email": email})
    return jsonify({"user": {"email": email, "name": name, "role": role}}), 201

@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    if users_collection is None: return jsonify({"error": "Database unavailable"}), 503
    data = request.get_json(silent=True) or {}
    token = data.get("token") 
    role = data.get("role", "patient")
    if not token: return jsonify({"error": "Google token required"}), 400
    try:
        google_response = requests.get(
            f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={token}",
            headers={"Accept": "application/json"}
        )
        if google_response.status_code != 200:
            return jsonify({"error": "Invalid Google Token"}), 401
        google_user = google_response.json()
        email = google_user.get("email")
        name = google_user.get("name")
        if not email: return jsonify({"error": "Email not found"}), 400
        user = users_collection.find_one({"email": email})
        if user:
            return jsonify({
                "email": user["email"],
                "role": user.get("role", "patient"),
                "name": user["name"]
            }), 200
        else:
            new_user = {
                "email": email,
                "name": name,
                "role": role,
                "password": "", 
                "auth_provider": "google",
                "created_at": time.time()
            }
            users_collection.insert_one(new_user)
            return jsonify({
                "email": email,
                "role": role,
                "name": name
            }), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error"}), 500

@app.route("/start_tracking", methods=["POST", "OPTIONS"])
def start_tracking():
    if request.method == 'OPTIONS': return jsonify({}), 200
    data = request.get_json(silent=True) or {}
    exercise = data.get("exercise", "Bicep Curl")
    try:
        init_session(exercise)
        if workout_session:
            return jsonify({"status": "started", "exercise": exercise})
        else:
            return jsonify({"error": "Failed to initialize workout session"}), 500
    except Exception as e:
        logger.error(f"❌ Error in start_tracking: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/stop_tracking", methods=["POST"])
def stop_tracking():
    global workout_session, last_session_report
    with session_lock:
        if workout_session:
            last_session_report = workout_session.get_final_report()
            workout_session.stop()
            workout_session = None
            return jsonify({"status": "stopped", "report": last_session_report})
    return jsonify({"status": "no_active_session"})

@app.route("/video_feed")
def video_feed():
    return Response(
        generate_video_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

@app.route("/report_data")
def report_data():
    global workout_session, last_session_report
    if workout_session:
        return jsonify(workout_session.get_final_report())
    if last_session_report:
        return jsonify(last_session_report)
    return jsonify({"error": "No session data found"})

if __name__ == "__main__":
    print("🚀 Starting Server with THREADING on Port 5001...")
    socketio.run(app, host="0.0.0.0", port=5001, debug=True, allow_unsafe_werkzeug=True)