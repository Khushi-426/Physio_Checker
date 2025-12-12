// server.js

const express = require('express');
const connectDB = require('./config/db'); 
const authRoutes = require('./routes/auth'); 
// We are skipping therapistRoutes and patientRoutes for now to focus on the fix.

// 1. Load environment variables (CRUCIAL: Must be the very first line after requires)
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Connect to Database
connectDB();

// 3. Middleware
app.use(express.json()); // Allows the server to accept JSON data in the request body

// 4. Define Main Routes
app.use('/api/auth', authRoutes); 

// Basic Test Route (Optional)
app.get('/', (req, res) => {
    res.send('Rehabilitation Backend API is running.');
});

// 5. Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});