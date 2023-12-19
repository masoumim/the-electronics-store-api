// Require in the express module
const express = require("express");

// Create a router
const router = express.Router();

// Export the router
module.exports = router

router.post('/firebase-auth', async (req, res) => {
    try {
        const reqBody = req.body;
        console.log(reqBody);
                                        
        res.status(200).json("Token received");
    } catch (error) {
        res.status(500).json(error);
    }
});