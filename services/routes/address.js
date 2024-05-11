// services/routes/address.js - This file contains a single API route / endpoint for fetching a user's address using their user id and address id

// Require in the express module
const express = require("express");

// Require in the requests module
const requests = require("../requests.js");

// Middleware that attaches user's cart to the request object
const getCart = require("./middleware/get-cart.js");

// Middleware to check if user logged in
const userCheck = require("./middleware/user-check.js");

// Create a router
const router = express.Router();

// Export the router
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: The Addresses API routes
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the address
 *         first_name:
 *           type: string
 *           description: The first name of the person
 *         last_name:
 *           type: string
 *           description: The last name of the person
 *         address:
 *           type: string
 *           description: The address
 *         city:
 *           type: string
 *           description: The city
 *         province:
 *           type: string
 *           description: The province
 *         country:
 *           type: string
 *           description: The country
 *         postal_code:
 *           type: string
 *           description: The postal code
 *         phone_number:
 *           type: string
 *           description: The phone number
 *         address_type:
 *           type: string
 *           description: The type of the address (e.g., Home, Work)
 *         user_id:
 *           type: integer
 *           description: The id of the user who owns the address
 *         unit:
 *           type: string
 *           description: The unit number (if applicable)
 *       example:
 *         id: 1
 *         first_name: John
 *         last_name: Doe
 *         address: 123 Main St
 *         city: Anytown
 *         province: Anyprovince
 *         country: Anycountry
 *         postal_code: A1B2C3
 *         phone_number: 123-456-7890
 *         address_type: Home
 *         user_id: 1
 *         unit: 1A
 */


/**
 * @swagger
 * paths:
 *   /address/{userId}/{addressId}:
 *     get:
 *       summary: Get a specific address by user id and address id
 *       tags: [Addresses]
 *       parameters:
 *         - in: path
 *           name: userId
 *           required: true
 *           schema:
 *             type: integer
 *           description: The user id
 *         - in: path
 *           name: addressId
 *           required: true
 *           schema:
 *             type: integer
 *           description: The address id
 *       responses:
 *         200:
 *           description: The address was successfully retrieved
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Address'
 *         404:
 *           description: The address was not found
 *         500:
 *           description: There was some server error
 */
router.get("/address/:userId/:addressId", userCheck, getCart, async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const addressId = parseInt(req.params.addressId, 10);
    const address = await requests.getAddressById(userId, addressId);
    res.status(200).json(address);
});