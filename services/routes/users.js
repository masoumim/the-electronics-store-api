// services/routes/users.js - This file contains all of the API routes / endpoints for a USER

// Require in the express module
const express = require("express");

// Require in validator - used for string validation
const validator = require('validator');

// Require in the requests module
const requests = require("../requests.js");

// Middleware to check if user logged in and has same ID as route parameter
const userCheck = require("./middleware/user-check.js");

// Create a router
const router = express.Router();

// Export the router
module.exports = router

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The Users API routes
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the user
 *         firstName:
 *           type: string
 *           description: The first name of the user
 *         lastName:
 *           type: string
 *           description: The last name of the user
 *         email:
 *           type: string
 *           description: The email address of the user
 *         password:
 *           type: string
 *           description: The user's password
 *       example:
 *         id: 1
 *         firstName: Joe
 *         lastName: Smith
 *         email: jsmith@gmail.com
 *         password: joe123
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id 
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The user ID
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: 1
 *               firstName: Jane
 *               lastName: Smith
 *               email: jane@smith.com
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             example:
 *               User ID does not match ID in URL
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving user               
 */
router.get('/users/:id', userCheck, async (req, res) => {
    try {
        // Get user from the db
        const user = await requests.getUserById(parseInt(req.params.id));

        // Send user object in response
        res.status(200).json({ id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email });
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id 
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The user ID
 *     requestBody:
 *       description: Updated user info
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: baz@qux.com
 *             firstName: Baz
 *             lastName: Qux
 *     responses:
 *       200:
 *         description: An updated user object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: 1
 *               firstName: Jane
 *               lastName: Smith
 *               email: jane@smith.com
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               Update failed. Required info is invalid.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             example:
 *               User ID does not match ID in URL
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error updating user               
 */
router.put('/users/:id', userCheck, async (req, res) => {
    try {
        // Validate user input
        const validationArray = [];        
        if(req.body.email){
            validationArray.push(validator.isEmail(req.body.email));
        }
        if(req.body.firstName){
            validationArray.push(validator.isAlpha(req.body.firstName));
            validationArray.push(validator.isLength(req.body.firstName, { min: 1, max: 50 }));
        }
        if(req.body.lastName){
            validationArray.push(validator.isAlpha(req.body.lastName));
            validationArray.push(validator.isLength(req.body.lastName, { min: 1, max: 50 }));
        }
        
        // Check if any element in array is false
        const foundInvalidInput = validationArray.some((e) => { return e === false });
        if (foundInvalidInput) return res.status(400).json("Update failed. Required info is invalid.");   

        // Update user info in db
        const firstName = req.body.firstName ? req.body.firstName : req.user.firstName;
        const lastName = req.body.lastName ? req.body.lastName : req.user.lastName;
        const email = req.body.email ? req.body.email : req.user.email;
        const updatedUser = await requests.updateUser(req.user.id, firstName, lastName, email);

        // Send updated user object in response
        res.status(200).json({ id: updatedUser.id, firstName: updatedUser.first_name, lastName: updatedUser.last_name, email: updatedUser.email });
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id 
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The user ID
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               User successfully deleted.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             example:
 *               User ID does not match ID in URL
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error deleting user               
 */
router.delete('/users/:id', userCheck, async (req, res) => {
    try {
        await requests.deleteUser(req.user.id);
        req.logout(() => {});
        res.status(200).json("User successfully deleted");
    } catch (error) {
        res.status(500).json(error);
    }
});