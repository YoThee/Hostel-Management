require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const path = require('path');
const multer = require('multer');

const hostelRoutes = require('./routes/hostels');
const roomRoutes = require('./routes/rooms');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const uploadRoutes = require('./routes/upload'); 


const app = express();
const port = process.env.PORT || 5000;



// Middleware
app.use(cors());
app.use(express.json()); // parse JSON bodies

// Serve static files from the 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // save files in the uploads folder
    },
    filename: (req, file, cb) => {
        // Create a unique filename: timestamp-originalname
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});


app.use('/api/auth', authRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/hostels/:hostelId/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes); 
app.use('/api/upload', uploadRoutes);



// Test route
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ time: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('Hostel Management API is running');
});

// Temporary test: get all users
app.get('/test-users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json({ count: result.rowCount, users: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
