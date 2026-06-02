const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// ========================
// CREATE A BOOKING
// ========================
router.post('/', authMiddleware, async (req, res) => {
    const { room_id, check_in, check_out } = req.body;
    const user_id = req.user.id;   // from the token

    // Basic validation
    if (!room_id || !check_in || !check_out) {
        return res.status(400).json({ error: 'Missing room_id, check_in or check_out' });
    }
    if (new Date(check_in) >= new Date(check_out)) {
        return res.status(400).json({ error: 'check_in must be before check_out' });
    }

    try {
        // 1. Check that the room exists and has available capacity
        const room = await pool.query('SELECT * FROM rooms WHERE id = $1', [room_id]);
        if (room.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const { capacity, occupied } = room.rows[0];
        if (occupied >= capacity) {
            return res.status(400).json({ error: 'Room is fully occupied' });
        }

        // 2. Insert the booking with status 'confirmed'
        const newBooking = await pool.query(
            `INSERT INTO bookings (user_id, room_id, check_in, check_out, status)
             VALUES ($1, $2, $3, $4, 'confirmed') RETURNING *`,
            [user_id, room_id, check_in, check_out]
        );

        // 3. Update the room's occupied count
        await pool.query(
            'UPDATE rooms SET occupied = occupied + 1 WHERE id = $1',
            [room_id]
        );

        res.status(201).json(newBooking.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========================
// GET ALL BOOKINGS
// ========================
router.get('/', authMiddleware, async (req, res) => {
    try {
        let result;
        if (req.user.role === 'admin') {
            // Admin sees all bookings, with user and room info
            result = await pool.query(
                `SELECT b.*, u.email as user_email, u.full_name as user_name,
                        r.room_number, h.name as hostel_name
                 FROM bookings b
                 JOIN users u ON b.user_id = u.id
                 JOIN rooms r ON b.room_id = r.id
                 JOIN hostels h ON r.hostel_id = h.id
                 ORDER BY b.created_at DESC`
            );
        } else {
            // Student sees only their own bookings
            result = await pool.query(
                `SELECT b.*, r.room_number, h.name as hostel_name
                 FROM bookings b
                 JOIN rooms r ON b.room_id = r.id
                 JOIN hostels h ON r.hostel_id = h.id
                 WHERE b.user_id = $1
                 ORDER BY b.created_at DESC`,
                [req.user.id]
            );
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========================
// GET A SINGLE BOOKING
// ========================
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT b.*, u.email as user_email, u.full_name as user_name,
                    r.room_number, h.name as hostel_name
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN rooms r ON b.room_id = r.id
             JOIN hostels h ON r.hostel_id = h.id
             WHERE b.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = result.rows[0];

        // Ownership check: a student can only view their own booking
        if (req.user.role === 'student' && booking.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(booking);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========================
// UPDATE A BOOKING (status change)
// ========================
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;   // expected: 'confirmed' or 'cancelled'

    if (!status || !['confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Status must be "confirmed" or "cancelled"' });
    }

    try {
        // Fetch the current booking
        const bookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookingResult.rows[0];

        // Permission check:
        // - Admin can change any booking to any status.
        // - Student can only cancel their own booking (status = 'cancelled')
        if (req.user.role !== 'admin') {
            if (booking.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            if (status !== 'cancelled') {
                return res.status(403).json({ error: 'You can only cancel your own booking' });
            }
        }

        // Update status
        const updatedBooking = await pool.query(
            'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        // Adjust room occupied count
        // If changing from 'confirmed' to 'cancelled', decrease occupied.
        // If changing from 'cancelled' to 'confirmed', increase occupied (admin only)
        if (booking.status !== status) {
            if (status === 'cancelled' && booking.status === 'confirmed') {
                await pool.query('UPDATE rooms SET occupied = occupied - 1 WHERE id = $1', [booking.room_id]);
            } else if (status === 'confirmed' && booking.status === 'cancelled') {
                // Check capacity again
                const room = await pool.query('SELECT * FROM rooms WHERE id = $1', [booking.room_id]);
                if (room.rows[0].occupied >= room.rows[0].capacity) {
                    return res.status(400).json({ error: 'Room is fully occupied' });
                }
                await pool.query('UPDATE rooms SET occupied = occupied + 1 WHERE id = $1', [booking.room_id]);
            }
        }

        res.json(updatedBooking.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========================
// DELETE A BOOKING (admin only)
// ========================
router.delete('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { id } = req.params;

    try {
        const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
        if (booking.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const { room_id, status } = booking.rows[0];

        // If the booking was confirmed, decrease occupied
        if (status === 'confirmed') {
            await pool.query('UPDATE rooms SET occupied = occupied - 1 WHERE id = $1', [room_id]);
        }

        await pool.query('DELETE FROM bookings WHERE id = $1', [id]);

        res.json({ message: 'Booking deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
