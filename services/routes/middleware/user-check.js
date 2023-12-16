// services/routes/middleware/user-check.js - This file contains a middleware to check if user is logged in and has same ID as route parameter

function userCheck(req, res, next){
    // Check if user is logged in
    if (!req.user) return res.status(401).json("User not logged in");

    // If there is an ID parameter, confirm the logged in user's ID matches the ID parameter
    if (req.params.id && req.user.id !== parseInt(req.params.id)) return res.status(403).json("User ID does not match ID in URL");

    // Pass control to the next middleware function
    next();
}

module.exports = userCheck