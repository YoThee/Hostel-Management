const express = require('express');
const router = express.Router({ mergeParams: true }); // important!
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// All routes in this file are prefixed with /api/hostels/:hostelId/rooms
// We'll use req.params.hostelId from the parent route

// GET all rooms for a specific hostel – public
router.get('/', async (req, res) => {
    const { hostelId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM rooms WHERE hostel_id = $1 ORDER BY room_number',
            [hostelId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET a single room by id – public
router.get('/:roomId', async (req, res) => {
    const { hostelId, roomId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM rooms WHERE id = $1 AND hostel_id = $2',
            [roomId, hostelId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found in this hostel' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create a new room – admin only
router.post('/', authMiddleware, async (req, res) => {
    // Role check
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { hostelId } = req.params;
    const { room_number, capacity, price, description, image_url } = req.body;

    try {
        // Check if the hostel exists
        const hostelCheck = await pool.query('SELECT * FROM hostels WHERE id = $1', [hostelId]);
        if (hostelCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        // Insert the room; occupied defaults to 0
        const newRoom = await pool.query(
            `INSERT INTO rooms (hostel_id, room_number, capacity, occupied, price, description, image_url)
             VALUES ($1, $2, $3, 0, $4, $5, $6) RETURNING *`,
            [hostelId, room_number, capacity, price, description, image_url]
        );

        res.status(201).json(newRoom.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update a room – admin only
router.put('/:roomId', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { hostelId, roomId } = req.params;
    const { room_number, capacity, price, description, image_url } = req.body;

    try {
        const result = await pool.query(
            `UPDATE rooms 
             SET room_number = $1, capacity = $2, price = $3, description = $4, image_url = $5
             WHERE id = $6 AND hostel_id = $7 RETURNING *`,
            [room_number, capacity, price, description, image_url, roomId, hostelId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found in this hostel' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE a room – admin only
router.delete('/:roomId', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { hostelId, roomId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM rooms WHERE id = $1 AND hostel_id = $2 RETURNING *',
            [roomId, hostelId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found in this hostel' });
        }
        res.json({ message: 'Room deleted successfully', deletedRoom: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
