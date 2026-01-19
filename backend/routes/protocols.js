// routes/protocols.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Protocol = require('../models/Protocol');
const User = require('../models/User');
const Notification = require('../models/Notification');

// POST /api/protocols/assign
router.post('/assign', auth, async (req, res) => {
  const { patientId, sets, reps, difficulty, exerciseName, duration } = req.body;

  // Added basic validation logging
  if (!patientId || !sets || !reps || !difficulty || !exerciseName) {
    console.log("❌ Assignment Failed: Missing Fields", req.body);
    return res
      .status(400)
      .json({ message: 'patientId, sets, reps, difficulty, and exerciseName are required.' });
  }

  try {
    const patient = await User.findById(patientId);
    
    // FIX: Case-insensitive role check (Accepts 'patient' or 'PATIENT')
    if (!patient || (patient.role && patient.role.toUpperCase() !== 'PATIENT')) {
      console.log(`❌ Assignment Failed: Invalid Patient Role. Found: ${patient ? patient.role : 'No User'}`);
      return res.status(400).json({ message: 'Invalid patient.' });
    }

    // Deactivate previous active protocol for this specific exercise
    await Protocol.updateMany(
      { patient: patientId, therapist: req.user.id, isActive: true, exerciseName: exerciseName },
      { isActive: false }
    );

    const protocol = new Protocol({
      therapist: req.user.id,
      patient: patientId,
      sets,
      reps,
      difficulty, // Now accepts "Intermediate" etc.
      exerciseName: exerciseName,
      // Optional: If you want to store duration (days) in the DB, ensure schema has it or store in metadata
    });

    await protocol.save();
    console.log(`✅ Protocol Assigned: ${exerciseName} to ${patient.name}`);

    // Create notification
    await Notification.create({
      therapist: req.user.id,
      patient: patientId,
      type: 'PROTOCOL_ASSIGNED',
      message: `New protocol assigned: ${exerciseName} - ${sets}x${reps} (${difficulty}).`,
      metadata: {
        protocolId: protocol._id,
        exerciseName: exerciseName,
        sets: sets,
        reps: reps,
        difficulty: difficulty
      }
    });

    return res
      .status(201)
      .json({ message: 'Protocol assigned successfully.', protocol });
  } catch (err) {
    console.error('❌ Assign protocol error:', err);
    return res
      .status(500)
      .json({ message: 'Server error during protocol assignment.', error: err.message });
  }
});

// GET /api/protocols/patient/:patientId
router.get('/patient/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;

  try {
    // Return all active protocols for this patient
    const protocols = await Protocol.find({
      patient: patientId,
      therapist: req.user.id,
      isActive: true
    });

    // Valid empty state response (Return empty array instead of 404 for cleaner frontend handling)
    if (!protocols || protocols.length === 0) {
      return res.json([]); 
    }

    return res.json(protocols);
  } catch (err) {
    console.error('Get protocol error:', err);
    return res.status(500).json({ message: 'Server error fetching protocol.' });
  }
});

// PUT /api/protocols/:id
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { sets, reps, difficulty } = req.body;

  try {
    const protocol = await Protocol.findOne({ _id: id, therapist: req.user.id });
    if (!protocol) {
      return res.status(404).json({ message: 'Protocol not found.' });
    }

    if (sets !== undefined) protocol.sets = sets;
    if (reps !== undefined) protocol.reps = reps;
    if (difficulty !== undefined) protocol.difficulty = difficulty;

    await protocol.save();
    return res.json({ message: 'Protocol updated successfully.', protocol });
  } catch (err) {
    console.error('Update protocol error:', err);
    return res
      .status(500)
      .json({ message: 'Server error updating protocol.' });
  }
});

module.exports = router;