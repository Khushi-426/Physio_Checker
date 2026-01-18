// routes/protocols.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Protocol = require('../models/Protocol');
const User = require('../models/User');
const Notification = require('../models/Notification');

// POST /api/protocols/assign
router.post('/assign', auth, async (req, res) => {
  const { patientId, sets, reps, difficulty, exerciseName } = req.body;

  if (!patientId || !sets || !reps || !difficulty || !exerciseName) {
    return res
      .status(400)
      .json({ message: 'patientId, sets, reps, difficulty, and exerciseName are required.' });
  }

  try {
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'PATIENT') {
      return res.status(400).json({ message: 'Invalid patient.' });
    }

    // deactivate previous active protocol for this patient & therapist
    // Note: If you want to allow multiple different exercises assigned simultaneously, 
    // you might want to only deactivate if the exerciseName matches. 
    // For now, keeping your original logic which seems to deactivate ANY previous protocol.
    // If you want to support multiple active exercises, consider removing this block or making it specific to exerciseName.
    await Protocol.updateMany(
      { patient: patientId, therapist: req.user.id, isActive: true, exerciseName: exerciseName },
      { isActive: false }
    );

    const protocol = new Protocol({
      therapist: req.user.id,
      patient: patientId,
      sets,
      reps,
      difficulty,
      exerciseName: exerciseName // Dynamically set from request
    });

    await protocol.save();

    // Create notification
    await Notification.create({
      therapist: req.user.id,
      patient: patientId,
      type: 'PROTOCOL_ASSIGNED',
      message: `New protocol assigned: ${exerciseName} - ${protocol.sets}x${protocol.reps} (${protocol.difficulty}).`,
      metadata: {
        protocolId: protocol._id,
        exerciseName: exerciseName,
        sets: protocol.sets,
        reps: protocol.reps,
        difficulty: protocol.difficulty
      }
    });

    return res
      .status(201)
      .json({ message: 'Protocol assigned successfully.', protocol });
  } catch (err) {
    console.error('Assign protocol error:', err);
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

    if (!protocols || protocols.length === 0) {
      return res.status(404).json({ message: 'No active protocols for this patient.' });
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