// server.js

const express = require('express');
const connectDB = require('./config/db'); 
const authRoutes = require('./routes/auth'); 
const protocolRoutes = require('./routes/protocols');
const therapistRoutes = require('./routes/therapist');
const sessionRoutes = require('./routes/sessions');
const notificationRoutes = require('./routes/notifications');
const cors = require('cors'); // ✅ Added CORS

// 1. Load environment variables
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Connect to Database
connectDB();

// 3. Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // Allow Frontend
    credentials: true
}));
app.use(express.json()); 

// 4. Define Main Routes
app.use('/api/auth', authRoutes); 
app.use('/api/protocols', protocolRoutes);
app.use('/api/therapist', therapistRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic Test Route
app.get('/', (req, res) => {
    res.send('Rehabilitation Backend API is running.');
});

// 5. Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});