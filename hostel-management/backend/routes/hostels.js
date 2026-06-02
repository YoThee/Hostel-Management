const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// GET all hostels – public, no authentication needed (students can see hostels)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM hostels ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET a single hostel by id – public
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM hostels WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Hostel not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create a new hostel – only admin
router.post('/', authMiddleware, async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { name, description, address, image_url } = req.body;

    try {
        const newHostel = await pool.query(
            'INSERT INTO hostels (name, description, address, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, address, image_url]
        );
        res.status(201).json(newHostel.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update a hostel – only admin
router.put('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { id } = req.params;
    const { name, description, address, image_url } = req.body;

    try {
        const result = await pool.query(
            'UPDATE hostels SET name = $1, description = $2, address = $3, image_url = $4 WHERE id = $5 RETURNING *',
            [name, description, address, image_url, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Hostel not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE a hostel – only admin
router.delete('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM hostels WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Hostel not found' });
        }
        res.json({ message: 'Hostel deleted successfully', deletedHostel: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
