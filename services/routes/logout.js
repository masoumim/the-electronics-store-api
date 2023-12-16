// services/routes/logout.js - This file contains the API route / endpoint for logout

// Require in the express module
const express = require("express");

// Create a router
const router = express.Router();

// Export the router
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Logout
 *   description: The Logout API route
 */

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: User Logout
 *     tags: [Logout]
 *     responses:
 *       200:
 *         description: Successful Logout
 *         content:
 *           application/json:             
 *             example:
 *               Logout Successful.       
 */

// Passport.js exposes a logout function within the request object: req.logout() 
router.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.status(200).json('Logout successful');
    });
});