// services/routes/register.js - This file contains the API route / endpoint for registration

// Require in the express module
const express = require("express");

// Require in bcrypt - used for password encryption
const bcrypt = require("bcrypt");

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
 *             password: Mark1234567!
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
        const newUser = { firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email, password: req.body.password }
                
        // Check if the request body has any missing data
        if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) return res.status(400).json("Registration failed. Required info is missing.");
                
        // Validate user input                
        const validationArray = [];
        validationArray.push(validator.isAlpha(newUser.firstName));
        validationArray.push(validator.isLength(newUser.firstName, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(newUser.lastName));
        validationArray.push(validator.isLength(newUser.lastName, { min: 1, max: 50 }));
        validationArray.push(validator.isEmail(newUser.email));                
        validationArray.push(validator.isStrongPassword(newUser.password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }));
                                
        // Check if any element in array is false
        const foundInvalidInput = validationArray.some((e) => { return e === false });        
        if (foundInvalidInput) return res.status(400).json("Registration failed. Required info is invalid.");
                
        // Check if a user with that email already exists in the db
        const userCheck = await requests.getUserByEmail(newUser.email);

        if (!userCheck) {
            // Encrypt the user's password:
            // 1. Generate salt with 10 Salt Rounds
            const salt = await bcrypt.genSalt(10);

            // 2. Hash password
            const hashedPassword = await bcrypt.hash(newUser.password, salt);
                        
            // 3. Create new user:
            const createdUser = await requests.addUser(newUser.firstName, newUser.lastName, newUser.email, hashedPassword);

            // If a user is successfully created, create a new Cart for that user in the DB.
            if(createdUser){
                requests.addCart(createdUser.id);                
                res.status(201).json("Registration was successful");
            }            
        }
        else{
            res.status(409).json("Registration failed. User with that email address already exists.");                        
        }
    } catch (error) {        
        res.status(500).json(`Registration failed - error: ${error}`);
    }
});