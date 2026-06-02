const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // 2. The header is "Bearer <token>", so split and take the second part
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // 3. Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // 4. Attach the decoded payload to the request object
        req.user = decoded;  // decoded contains { id, role, iat, exp }
        next(); // 5. Pass control to the next middleware or route handler
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;
