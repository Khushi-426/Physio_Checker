// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, 
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['THERAPIST', 'PATIENT'], 
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to hash the password before saving the user
// FIX: 'next' is correctly included in the function signature
userSchema.pre('save', async function (next) { 
    if (!this.isModified('password')) {
        return next();
    }
    
    this.password = await bcrypt.hash(this.password, 10);
    next(); // Pass control to the next save function
});

// Method to compare the password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);