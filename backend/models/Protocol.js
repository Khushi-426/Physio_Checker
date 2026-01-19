// models/Protocol.js
const mongoose = require('mongoose');

const protocolSchema = new mongoose.Schema({
  therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseName: { type: String, default: 'SingleExercise', required: true },
  sets: { type: Number, required: true },
  reps: { type: Number, required: true },
  // FIX: Removed strict enum so it accepts "Intermediate", "Beginner", etc.
  difficulty: { type: String, required: true }, 
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Protocol = mongoose.models.Protocol || mongoose.model('Protocol', protocolSchema);
module.exports = Protocol;