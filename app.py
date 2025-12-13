"""
PhysioCheck Flask Backend - FINAL STABLE VERSION
Google Auth FIXED (Mac + Windows)
"""

from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_mail import Mail, Message
from dotenv import load_dotenv

import cv2
import mediapipe as mp
import numpy as np
import time
import os
import random
import string
import requests
import certifi

from datetime import datetime
from pymongo import MongoClient

# ---------------- LOAD ENV ----------------
load_dotenv()

# ---------------- APP SETUP ----------------
app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# ---------------- MAIL CONFIG ----------------
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
mail = Mail(app)

# ---------------- DB SETUP ----------------
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "physiocheck_db"

try:
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )
    client.admin.command("ping")
    db = client[DB_NAME]
    users_collection = db["users"]
    otp_collection = db["otps"]
    sessions_collection = db["sessions"]
    print("✅ MongoDB Connected")
except Exception as e:
    print("❌ MongoDB Error:", e)
    users_collection = otp_collection = sessions_collection = None

# ---------------- AI IMPORTS ----------------
from pose_processor import PoseProcessor
from rep_counter import RepCounter
from workout_session import WorkoutSession

workout_session = None

def init_session():
    global workout_session
    workout_session = WorkoutSession()

# ---------------- OTP SIGNUP ----------------
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    if users_collection is None:
        return jsonify({"error": "DB unavailable"}), 503

    email = request.json.get("email")

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400

    otp = "".join(random.choices(string.digits, k=6))

    otp_collection.update_one(
        {"email": email},
        {"$set": {"otp": otp, "created_at": time.time()}},
        upsert=True
    )

    msg = Message(
        "PhysioCheck Verification Code",
        sender=app.config["MAIL_USERNAME"],
        recipients=[email]
    )
    msg.body = f"Your OTP is: {otp}"
    mail.send(msg)

    return jsonify({"message": "OTP sent"}), 200

# ---------------- OTP VERIFY ----------------
@app.route("/api/auth/signup-verify", methods=["POST"])
def signup_verify():
    data = request.json
    email = data.get("email")
    otp = data.get("otp")

    record = otp_collection.find_one({"email": email})
    if not record or record["otp"] != otp:
        return jsonify({"error": "Invalid OTP"}), 400

    hashed = bcrypt.generate_password_hash(data["password"]).decode()
    user = {
        "name": data["name"],
        "email": email,
        "password": hashed,
        "role": data.get("role", "patient"),
        "auth_method": "email",
        "created_at": time.time()
    }
    users_collection.insert_one(user)
    otp_collection.delete_one({"email": email})

    return jsonify({"message": "Signup successful"}), 201

# ---------------- LOGIN ----------------
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    user = users_collection.find_one({"email": data["email"]})

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user["auth_method"] == "google":
        return jsonify({"error": "Use Google Login"}), 400

    if bcrypt.check_password_hash(user["password"], data["password"]):
        return jsonify({
            "message": "Login success",
            "email": user["email"],
            "role": user["role"],
            "name": user["name"]
        }), 200

    return jsonify({"error": "Invalid credentials"}), 401

# ---------------- GOOGLE AUTH (FIXED) ----------------
@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    token = request.json.get("token")
    role = request.json.get("role", "patient")

    try:
        # VERIFY ID TOKEN (CORRECT WAY)
        resp = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": token},
            verify=certifi.where()
        )

        if resp.status_code != 200:
            return jsonify({"error": "Invalid Google token"}), 401

        google_user = resp.json()
        email = google_user.get("email")
        name = google_user.get("name")

        if not email:
            return jsonify({"error": "Google auth failed"}), 400

        user = users_collection.find_one({"email": email})

        if not user:
            users_collection.insert_one({
                "name": name,
                "email": email,
                "password": None,
                "role": role,
                "auth_method": "google",
                "created_at": time.time()
            })

        return jsonify({
            "message": "Google login successful",
            "email": email,
            "name": name,
            "role": role
        }), 200

    except Exception as e:
        print("❌ Google Auth Error:", e)
        return jsonify({"error": "Google authentication failed"}), 500

# ---------------- WORKOUT ROUTES ----------------
@app.route("/start_tracking")
def start_tracking():
    global workout_session
    init_session()
    workout_session.start()
    return jsonify({"status": "started"})

@app.route("/stop_tracking", methods=["POST"])
def stop_tracking():
    global workout_session
    data = request.json
    email = data.get("email")

    report = workout_session.get_final_report()
    workout_session.stop()

    if email:
        sessions_collection.insert_one({
            "email": email,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "timestamp": time.time(),
            "total_reps": report["total_reps"],
            "total_errors": report["total_errors"],
            "duration": report["duration"]
        })

    return jsonify(report)

@app.route("/video_feed")
def video_feed():
    def gen():
        while workout_session:
            frame = workout_session.get_frame()
            ret, buffer = cv2.imencode(".jpg", frame)
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" +
                   buffer.tobytes() + b"\r\n")

    return Response(gen(), mimetype="multipart/x-mixed-replace; boundary=frame")

# ---------------- MAIN ----------------
if __name__ == "__main__":
    init_session()
    app.run(host="0.0.0.0", port=5001, debug=True)
