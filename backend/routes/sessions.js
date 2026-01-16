// backend/routes/sessions.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const Protocol = require('../models/Protocol');
const User = require('../models/User');
const { createNotification } = require('../utils/notify');

// POST /api/sessions
// Record a session (Handles both Patient doing it at home OR Therapist recording it)
router.post('/', auth, async (req, res) => {
  const {
    patientId,
    protocolId,
    qualityScore,
    completed,
    keyErrors,
    videoUrl,
    duration,
    reps,
    exerciseType,
    leftHandAccuracy,
    rightHandAccuracy
  } = req.body;

  if (!protocolId) {
    return res.status(400).json({ message: 'Protocol ID is required.' });
  }

  try {
    // 1. Fetch Protocol to identify the exercise and therapist
    const protocol = await Protocol.findById(protocolId);
    if (!protocol) {
      return res.status(404).json({ message: 'Protocol not found.' });
    }

    let targetPatientId = patientId;
    let targetTherapistId = protocol.therapist;

    // 2. Determine Context (Patient vs Therapist)
    if (req.user.role === 'PATIENT') {
      // If Patient is logged in, they are saving their own session
      targetPatientId = req.user.id;
    } else {
      // If Therapist is logged in, they must provide patientId
      if (!patientId) return res.status(400).json({ message: 'Patient ID required for therapist entry.' });
      
      // Verify this protocol belongs to the logged-in therapist
      if (protocol.therapist.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized for this protocol.' });
      }
    }

    // 3. Calculate "Main Avg Accuracy"
    // If we have separate hands, average them. Otherwise use provided qualityScore.
    let finalAccuracy = qualityScore;
    if (leftHandAccuracy !== undefined && rightHandAccuracy !== undefined) {
      finalAccuracy = (Number(leftHandAccuracy) + Number(rightHandAccuracy)) / 2;
    }

    // 4. Create Session
    const session = new Session({
      patient: targetPatientId,
      therapist: targetTherapistId,
      protocol: protocolId,
      exerciseType: exerciseType || protocol.title || 'Exercise',
      duration: duration || 0,
      reps: reps || 0,
      qualityScore: finalAccuracy ?? 0,
      metrics: {
        leftAccuracy: leftHandAccuracy,
        rightAccuracy: rightHandAccuracy
      },
      completed: completed ?? true,
      keyErrors: keyErrors || [],
      videoUrl: videoUrl || null
    });

    await session.save();

    // 5. Notify Therapist if Patient performed it
    if (req.user.role === 'PATIENT') {
      await createNotification({
        therapistId: targetTherapistId,
        patientId: targetPatientId,
        type: 'SESSION_RECORDED',
        message: `${req.user.name || 'Patient'} completed ${session.exerciseType} with ${Math.round(session.qualityScore)}% accuracy.`
      });
    }

    res.status(201).json({ message: 'Session recorded successfully.', session });
  } catch (err) {
    console.error('Record session error:', err);
    res.status(500).json({ message: 'Server error while recording session.' });
  }
});

// GET /api/sessions/my-history
// For Patients: Get their own full history
router.get('/my-history', auth, async (req, res) => {
  try {
    if (req.user.role !== 'PATIENT') {
      return res.status(403).json({ message: 'Access denied. Patient resource.' });
    }

    const sessions = await Session.find({ patient: req.user.id })
      .sort({ performedAt: -1 })
      .populate('protocol', 'title description'); // Optional: populate protocol details

    res.json(sessions);
  } catch (err) {
    console.error('Fetch history error:', err);
    res.status(500).json({ message: 'Server error fetching history.' });
  }
});

// GET /api/sessions/patient/:patientId
// For Therapists: Get a specific patient's sessions
router.get('/patient/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;

  try {
    // Security check: Ensure therapist is linked to this patient (Optional logic here)
    const sessions = await Session.find({
      patient: patientId,
      therapist: req.user.id
    }).sort({ performedAt: -1 });

    res.json(sessions);
  } catch (err) {
    console.error('Get patient sessions error:', err);
    res.status(500).json({ message: 'Server error fetching sessions.' });
  }
});

module.exports = router;