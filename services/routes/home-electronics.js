// services/routes/home-electronics.js - This file contains all of the API routes / endpoints for Home Electronics

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
 * /home-electronics:
 *   get:
 *     summary: Get all home electronics products
 *     tags: [Home Electronics]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: "Smart TV"
 *               description: "Samsung 55 inch Smart TV"
 *               price: 699
 *               category_code: "HOME"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving home electronics products
 */
router.get('/home-electronics', async (req, res) => {
    try {
        // Get home electronics products from the db and return it in response
        const foundHomeElectronicsProducts = await requests.getHomeElectronics();
        res.status(200).json(foundHomeElectronicsProducts);
    } catch (error) {
        res.status(500).json(error);
    }
});