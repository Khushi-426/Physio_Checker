// backend/routes/therapist.js

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Protocol = require("../models/Protocol");
const Session = require("../models/Session");

// GET /api/therapist/patients
router.get("/patients", auth, async (req, res) => {
  try {
    // 1. Fetch all patients
    const patients = await User.find({ role: "PATIENT" }).select("-password");

    // 2. Fetch active protocols for this therapist
    const protocols = await Protocol.find({
      therapist: req.user.id,
      isActive: true,
    });

    // 3. Fetch all sessions for these patients
    // SAFETY: Only fetch if we actually have patients to prevent empty $in errors
    if (!patients || patients.length === 0) {
        return res.json([]);
    }

    const patientIds = patients.map((p) => p._id);
    const sessions = await Session.find({
      patient: { $in: patientIds }
    }).sort({ performedAt: 1 });

    // --- HELPER MAPS (With Safety Checks) ---
    const protocolMap = {};
    protocols.forEach(p => {
        // SAFETY: Check if patient ID exists before converting
        if (p.patient) {
            protocolMap[p.patient.toString()] = p;
        }
    });

    const sessionMap = {};
    sessions.forEach(s => {
      // SAFETY: Check if patient ID exists
      if (s.patient) {
          const pid = s.patient.toString();
          if (!sessionMap[pid]) sessionMap[pid] = [];
          sessionMap[pid].push(s);
      }
    });

    // 4. COMBINE DATA
    const result = patients.map((p) => {
      const pid = p._id.toString();
      const userSessions = sessionMap[pid] || [];
      const userProtocol = protocolMap[pid];

      // -- Stats Calculation --
      const totalSessions = userSessions.length;
      const completedSessions = userSessions.filter(s => s.completed).length;
      const completionRate = totalSessions === 0 ? 0 : Math.round((completedSessions / totalSessions) * 100);
      
      // -- Accuracy Trend (Graph Data) --
      const historyMap = {};
      userSessions.forEach(s => {
        if (s.completed && s.qualityScore !== undefined) {
            // SAFETY: Handle invalid dates
            const dateObj = new Date(s.performedAt);
            if (!isNaN(dateObj)) {
                const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                if (!historyMap[dateStr]) historyMap[dateStr] = { sum: 0, count: 0 };
                historyMap[dateStr].sum += s.qualityScore;
                historyMap[dateStr].count += 1;
            }
        }
      });

      const accuracyTrend = Object.keys(historyMap).map(day => ({
        day,
        val: Math.round(historyMap[day].sum / historyMap[day].count)
      })).slice(-7); 

      // -- Last Active --
      const lastSession = userSessions[userSessions.length - 1];
      const lastActive = lastSession ? lastSession.performedAt : p.createdAt;

      // -- Risk Flags --
      const isHighRisk = completionRate < 50 && totalSessions > 2;
      const isAlert = completionRate >= 50 && completionRate < 75;

      return {
        _id: p._id,
        name: p.name || "Unknown Patient",
        email: p.email,
        // Optional Chaining for new fields to prevent crashes if they don't exist yet
        age: p.age || null,           
        weight: p.weight || null,     
        bloodGroup: p.bloodGroup || null,
        joinedAt: p.createdAt,
        lastActive: lastActive,
        completionRate,
        status: isHighRisk ? "High Risk" : isAlert ? "Alert" : "Active",
        hasActiveProtocol: !!userProtocol,
        flags: { nonCompliant: isHighRisk, lowScore: isAlert },
        // Always return an array for the graph, never null
        accuracyTrend: accuracyTrend.length > 0 ? accuracyTrend : [{day: 'No Data', val: 0}],
        loginHistory: userSessions.slice(-15).map(s => ({ 
            date: s.performedAt, 
            active: true 
        })) 
      };
    });

    res.json(result);

  } catch (err) {
    console.error("Therapist Dashboard API Error:", err);
    // Return a valid empty array on error so frontend doesn't crash
    res.status(500).json({ message: "Server Error", error: err.toString() }); 
  }
});

module.exports = router;