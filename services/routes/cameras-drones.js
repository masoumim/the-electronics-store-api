// services/routes/cameras-drones.js - This file contains all of the API routes / endpoints for Cameras & Drones

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
 * /cameras-drones:
 *   get:
 *     summary: Get all cameras and drones products
 *     tags: [Cameras & Drones]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: "DJI Drone"
 *               description: "DJI Phantom 4 Pro V2.0"
 *               price: 1599
 *               category_code: "CAM"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving cameras and drones products
 */
router.get('/cameras-drones', async (req, res) => {
    try {
        // Get cameras and drones products from the db and return it in response
        const foundCamerasDronesProducts = await requests.getCamerasDrones();
        res.status(200).json(foundCamerasDronesProducts);
    } catch (error) {
        res.status(500).json(error);
    }
});