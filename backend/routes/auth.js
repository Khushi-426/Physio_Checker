// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth'); 

// helper to create JWT
const createToken = (user) => {
  const payload = {
    user: {
      id: user.id,
      role: user.role
    }
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
};

// ---------------------- GET LOGGED IN USER ----------------------
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ---------------------- UPDATE USER PROFILE (NEW) ----------------------
router.put('/update-profile', auth, async (req, res) => {
  const { name, age, weight, bloodGroup } = req.body;

  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (age) user.age = age;
    if (weight) user.weight = weight;
    if (bloodGroup) user.bloodGroup = bloodGroup;

    await user.save();

    // Return the updated user object (excluding password)
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error('Profile Update Error:', err);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});

// ---------------------- THERAPIST REGISTER ----------------------
router.post('/therapist/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Please enter all fields.' });

  try {
    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists.' });

    const user = new User({ email, password, role: 'THERAPIST' });
    await user.save();
    return res.status(201).json({ message: 'Therapist registered successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------- PATIENT REGISTER ------------------------
router.post('/patient/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Please enter all fields.' });

  try {
    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists.' });

    const user = new User({ email, password, role: 'PATIENT' });
    await user.save();
    return res.status(201).json({ message: 'Patient registered successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------- THERAPIST LOGIN -------------------------
router.post('/therapist/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Please enter all fields.' });

  try {
    const user = await User.findOne({ email });
    if (!user || user.role !== 'THERAPIST') return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = createToken(user);
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------- PATIENT LOGIN (Assuming you need this too) -------------------------
router.post('/patient/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please enter all fields.' });
  
    try {
      const user = await User.findOne({ email });
      if (!user || user.role !== 'PATIENT') return res.status(400).json({ message: 'Invalid credentials.' });
  
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });
  
      const token = createToken(user);
      return res.json({ token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;