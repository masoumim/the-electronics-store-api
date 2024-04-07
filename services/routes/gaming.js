// services/routes/gaming.js - This file contains all of the API routes / endpoints for GAMING

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
 * /gaming:
 *   get:
 *     summary: Get all gaming products
 *     tags: [Gaming]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: "PlayStation 5"
 *               description: "Sony PlayStation 5 Console"
 *               price: 499
 *               category_code: "GAM"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving gaming products
 */
router.get('/gaming', async (req, res) => {
    try {
        // Get gaming products from the db and return it in response
        const foundGamingProducts = await requests.getGaming();
        res.status(200).json(foundGamingProducts);
    } catch (error) {
        res.status(500).json(error);
    }
});