const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// REGISTER a new user
router.post('/register', async (req, res) => {
    const { email, password, full_name, role } = req.body;

    try {
        // 1. Check if user already exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Insert new user into database
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_at',
            [email, password_hash, full_name, role || 'student']
        );

        // 4. Create and send JWT token
        const token = jwt.sign(
            { id: newUser.rows[0].id, role: newUser.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser.rows[0],
            token
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// LOGIN existing user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user by email
        const user = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // 2. Compare password
        const validPassword = await bcrypt.compare(
            password,
            user.rows[0].password_hash
        );
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // 3. Create and send JWT token
        const token = jwt.sign(
            { id: user.rows[0].id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Logged in successfully',
            user: {
                id: user.rows[0].id,
                email: user.rows[0].email,
                full_name: user.rows[0].full_name,
                role: user.rows[0].role
            },
            token
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
