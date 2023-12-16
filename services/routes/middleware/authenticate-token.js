// services/routes/middleware/authenticateToken.js - This file contains a middleware function which authenticates a JWT

// Require in jsonwebtoken - used for creating, signing and managing JSON Web Tokens
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    // Get the Authorization Header from the request
    const authHeader = req.headers.authorization;
    if (authHeader) {
        // Check if the Authorization Headers has a JWT
        // authHeader = 'Bearer abc123'        
        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json("Token authentication failed: Authorization Header is missing token");

        // Verify token
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) =>{
            // Reject request if verify() throws an error
            if(err) return res.status(403).json("Token verification failed");

            // Otherwise, add the decoded user to the request object
            req.user = user;
            next();
        });
    } else {
        res.status(400).json("Request is missing an Authorization Header.");
    }
}

module.exports = authenticateToken