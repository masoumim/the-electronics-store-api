// services/routes/computers.js - This file contains all of the API routes / endpoints for COMPUTERS

// Require in the express module
const express = require("express");

// Require in the requests module
const requests = require("../requests.js");

// Create a router
const router = express.Router();

// Export the router
module.exports = router

/**
 * @swagger
 * /computers:
 *   get:
 *     summary: Get all computers
 *     tags: [Computers]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: "MacBook Pro"
 *               description: "Apple MacBook Pro 13-inch"
 *               price: 1299
 *               category_code: "COM"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving computers
 */
router.get('/computers', async (req, res) => {
    try {
        // Get computers from the db and return it in response
        const foundComputers = await requests.getComputers();
        res.status(200).json(foundComputers);
    } catch (error) {
        res.status(500).json(error);
    }
});