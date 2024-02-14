// services/routes/register.js - This file contains the API route / endpoint for registration

// Require in the express module
const express = require("express");

// Require in the Firebase Admin SDK Auth instance
const auth = require('firebase-admin/auth');

// Require in validator - used for string validation
const validator = require('validator');

// Import the requests module
const requests = require("../requests.js");

// Create a router
const router = express.Router();

// Export the router
module.exports = router

/**
 * @swagger
 * tags:
 *   name: Register
 *   description: The Register API route
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Register]
 *     requestBody:
 *       description: The required request body for registration
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             firstName: Mark
 *             lastName: Masoumi
 *             email: masoumi.mark@gmail.com 
 *             uid: S0M3UidNumb3r
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:             
 *             example:
 *               Registration was successful.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               Registration failed. Required info missing or invalid.
 *       409:
 *         description: Conflict. User already exists.
 *         content:
 *           application/json:
 *             example:
 *               Registration failed. User with that email address already exists.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Registration failed.            
 */
router.post('/register', async (req, res) => {
    try {
        // Get registration info from the request body                            
        const newUser = { first_name: req.body.firstName, last_name: req.body.lastName, email: req.body.email, uid: req.body.uid }

        // Check if the request body has any missing data
        if (!newUser.first_name || !newUser.last_name || !newUser.email || !newUser.uid) return res.status(400).json("Registration failed. Required info is missing.");

        // Validate user input                
        const validationArray = [];
        validationArray.push(validator.isAlpha(newUser.first_name));
        validationArray.push(validator.isLength(newUser.first_name, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(newUser.last_name));
        validationArray.push(validator.isLength(newUser.last_name, { min: 1, max: 50 }));
        validationArray.push(validator.isEmail(newUser.email));

        // Check if any element in array is false
        const foundInvalidInput = validationArray.some((e) => { return e === false });
        if (foundInvalidInput) return res.status(400).json("Registration failed. Required info is invalid.");

        // Check if a user with that email already exists in the db
        const userCheck = await requests.getUserByEmail(newUser.email);

        if (!userCheck) {
            // Create new user on Postgresql:
            const createdUserPG = await requests.addUser(newUser.first_name, newUser.last_name, newUser.email, newUser.uid);

            // If a user is successfully created, create a new Cart for that user in the DB.
            if (createdUserPG) {
                requests.addCart(createdUserPG.id);

                // Add the 'id' property to the the newUser object
                newUser.id = createdUserPG.id;
            }
        }
        else {
            res.status(409).json("Registration failed. User with that email address already exists.");
        }

        // Respond with the newly added user
        res.status(201).json(newUser);

    } catch (error) {
        res.status(500).json(`Registration failed - error: ${error}`);
    }
});