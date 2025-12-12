// routes/auth.js

const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const jwt = require('jsonwebtoken'); 
// bcrypt is needed for the login route's comparePassword method (though the model uses it too)

// @route   POST /api/auth/register
// @desc    Register a new Therapist user
// @access  Public
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // The password hashing is automatically done by the userSchema.pre('save') hook
        user = new User({
            email,
            password,
            role: 'THERAPIST' // Role is explicitly set for this registration endpoint
        });

        await user.save();

        res.status(201).json({ message: 'Therapist registered successfully.' });

    } catch (err) {
        // Log the full error object for better debugging
        console.error("Registration Error:", err); 
        res.status(500).send('Server Error during registration.');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate Therapist & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }

        // Check the user's role
        if (user.role !== 'THERAPIST') {
             return res.status(403).json({ message: 'Access Denied: Not a Therapist account.' });
        }

        // Compare the provided password with the stored hash
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }

        // Generate the JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, // JWT Secret from .env
            { expiresIn: '5h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token }); 
            }
        );

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send('Server Error during login.');
    }
});

module.exports = router;