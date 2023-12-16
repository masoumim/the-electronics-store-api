// services/routes/login.js - This file contains the API route / endpoint for login

// NOTE: For Passport.js authentication middleware to work, 
// the request body in the POST request to /login must be username / password.
// using 'email' as of property name instead of 'username' will cause the authentication to fail.

// Require in the express module
const express = require("express");

// Require in passport.js used for Authentication
const passport = require("passport");

// Create a router
const router = express.Router();

// Export the router
module.exports = router

/**
 * @swagger
 * tags:
 *   name: Login
 *   description: The Login API route
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User Login
 *     tags: [Login]
 *     requestBody:
 *       description: The required request body for login
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             username: masoumi.mark@gmail.com
 *             password: Mark1234567!
 *     responses:
 *       200:
 *         description: Successful Login
 *         content:
 *           application/json:             
 *             example:
 *               Login Successful.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               Login Failed. Incorrect email or password.            
 */

/*
Pass in passport.authenticate() as middleware. 
Using this middleware allows Passport.js to take care of the authentication 
process behind the scenes and creates a user session for us.
If successful, the user will be Serialized
*/
router.post("/login", passport.authenticate("local", { failureRedirect: "/loginfail" }), (req, res) => {
    res.status(200).json("Login Successful");
});

router.get("/loginfail", async (req, res) => {
    res.status(401).json("Login Failed. Incorrect email or password.");
})