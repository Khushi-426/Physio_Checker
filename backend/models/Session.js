// backend/models/Session.js

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  therapist: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  protocol: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Protocol', 
    required: true 
  },
  
  // --- Data Fields ---
  exerciseType: { 
    type: String, 
    default: 'Standard Exercise' 
  },
  performedAt: { 
    type: Date, 
    default: Date.now 
  },
  duration: { 
    type: Number, 
    default: 0 
  }, // Duration in seconds
  reps: { 
    type: Number, 
    default: 0 
  },
  
  // Main Accuracy
  qualityScore: { 
    type: Number, 
    min: 0, 
    max: 100 
  },

  // NEW: Facial Fatigue Index
  ffi: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Detailed Metrics
  metrics: {
    leftAccuracy: { type: Number },
    rightAccuracy: { type: Number },
    leftErrors: { type: Number, default: 0 },
    rightErrors: { type: Number, default: 0 },
    leftReps: { type: Number, default: 0 },
    rightReps: { type: Number, default: 0 }
  },

  completed: { 
    type: Boolean, 
    default: false 
  },
  keyErrors: { 
    type: [String], 
    default: [] 
  },
  videoUrl: { 
    type: String 
  }
});

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
module.exports = Session;