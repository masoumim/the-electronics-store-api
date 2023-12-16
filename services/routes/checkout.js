// services/routes/checkout.js - This file contains all of the API routes / endpoints for CHECKOUT

// Require in the express module
const express = require("express");

// Require in validator - used for string validation
const validator = require('validator');

// Require in the requests module
const requests = require("../requests.js");

// Middleware that attaches user's cart to the request object
const getCart = require("./middleware/get-cart.js");

// Middleware to check if checkout session exists and attach it to request obj if it does
const getCheckout = require("./middleware/get-checkout.js");

// Middleware to check if user logged in
const userCheck = require("./middleware/user-check.js");

// Create a router
const router = express.Router();

// Export the router
module.exports = router

/**
 * @swagger
 * tags:
 *   name: Checkout
 *   description: The Checkout API routes
 * components:
 *   schemas:
 *     Checkout:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the checkout session
 *         user_id:
 *           type: integer
 *           description: The user id of the user who the checkout session belongs to
 *         payment_card_id:
 *           type: integer
 *           description: The id of the payment card belonging to the user
 *         shipping_address_id:
 *           type: integer
 *           description: The id of the shipping address belonging to the user
 *         billing_address_id:
 *           type: integer
 *           description: The id of the billing address
 *         stage:
 *           type: text
 *           description: The stage that the shipping process is currently in
 *           example:
 *             - shipping
 *             - payment
 *             - review
 *             - confirmation
 *       example:
 *         id: 1
 *         user_id: 6
 *         payment_card_id: 4
 *         shipping_address_id: 11
 *         cart_id: 3
 *         stage: payment
 *         billing_address_id: 3
 */

/**
 * @swagger
 * /checkout:
 *   post:
 *     summary: Create a Checkout session
 *     tags: [Checkout]
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *               Checkout session successfully created
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               - Cart is empty
 *               - User already has items in checkout
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error creating order               
 */
router.post('/checkout', userCheck, getCart, async (req, res) => {
    try {
        // Check if user's cart is empty
        if(req.cart.num_items === 0) return res.status(400).json("Cart is empty");

        // Check if user already has a checkout session        
        const foundCheckout = await requests.getCheckout(req.user.id);
        if(foundCheckout) return res.status(400).json("User already has items in checkout");
        
        // Create a new checkout session in the DB        
        await requests.addCheckout(req.user.id, req.cart);
                                
        res.status(200).json("Checkout session successfully created");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /checkout:
 *   get:
 *     summary: Get the Checkout session 
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Checkout'
 *             example:
 *               id: 1
 *               user_id: 6
 *               payment_card_id: 4
 *               shipping_address_id: 11
 *               cart_id: 3
 *               stage: payment
 *               billing_address_id: 3
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Checkout session not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving checkout               
 */
router.get('/checkout', userCheck, getCheckout, async (req, res) => {
    try {
        // Send checkout session in response
        res.status(200).json(req.checkout);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /checkout/shipping/update-alt-address:
 *   put:
 *     summary: Update alternate shipping address
 *     tags: [Checkout]
 *     requestBody:
 *       description: The required request body for updating an alternate shipping address
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             firstName: Mark
 *             lastName: Masoumi
 *             address: 99 Baz Boulevard
 *             unit: 4B
 *             city: Hamilton
 *             province: Ontario
 *             country: Canada
 *             postalCode: B1A2Z3
 *             phoneNumber: "5551234567"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Address successfully updated
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               - No alternate shipping address found
 *               - Request Body is missing required data
 *               - Invalid Request Body Data               
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Checkout session not found 
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error updating address               
 */
router.put('/checkout/shipping/update-alt-address', userCheck, getCheckout, async (req, res) => {    
    try {                                                                                
        // Check if there is an alternate shipping address to update
        const foundAltShippingAddress = await requests.getAddressByType(req.user.id, "shipping_alternate");
        if(!foundAltShippingAddress) return res.status(400).json("No alternate shipping address found");

        // Check that request body isn't missing data        
        const reqBodyKeys = Object.keys(req.body);
        const requiredData = ['firstName', 'lastName', 'address', 'city', 'province', 'country', 'postalCode', 'phoneNumber'];
        const hasData = requiredData.every(value => { return reqBodyKeys.includes(value) });
        if (!hasData) return res.status(400).json("Request Body is missing required data");
                                        
        // Validate user input                
        const validationArray = [];
        validationArray.push(validator.isAlpha(req.body.firstName));
        validationArray.push(validator.isLength(req.body.firstName, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.lastName));
        validationArray.push(validator.isLength(req.body.lastName, { min: 1, max: 50 }));
        validationArray.push(validator.isLength(req.body.address, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.city));
        validationArray.push(validator.isLength(req.body.city, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.province));
        validationArray.push(validator.isLength(req.body.province, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.country));
        validationArray.push(validator.isLength(req.body.country, { min: 1, max: 50 }));
        validationArray.push(validator.isAlphanumeric(req.body.postalCode));
        validationArray.push(validator.isLength(req.body.postalCode, { min: 6, max: 6 }));
        validationArray.push(validator.isMobilePhone(req.body.phoneNumber));
                                            
        // Check if any element in array is false
        const foundInvalidInput = validationArray.some((e) => { return e === false });        
        if (foundInvalidInput) return res.status(400).json("Invalid Request Body Data");
        
        // Get the address info from the request body
        const altAddress = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            unit: req.body.unit,
            city: req.body.city,
            province: req.body.province,
            country: req.body.country,
            postalCode: req.body.postalCode,
            phoneNumber: req.body.phoneNumber,
        }

        // Update address
        await requests.updateAddress(foundAltShippingAddress.id, req.user.id, altAddress);
                                
        res.status(200).json("Address successfully updated");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /checkout/shipping/{addressId}:
 *   put:
 *     summary: Update the Checkout session's shipping address
 *     tags: [Checkout]
 *     parameters:
 *       - in: path
 *         name: addressId 
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The Address ID
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Checkout shipping info updated
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               - Address not found
 *               - Invalid address
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Checkout session not found 
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error updating session shipping info
 */
router.put('/checkout/shipping/:addressId', userCheck, getCheckout, async (req, res) => {
    try {        
        // Check if address exists
        const foundAddress = await requests.getAddressById(req.user.id, parseInt(req.params.addressId));
        if (!foundAddress) return res.status(400).json("Address not found");
                
        // Check that the address is a shipping address (primary or alternative)
        if (foundAddress.address_type === "shipping_primary" || foundAddress.address_type === "shipping_alternate") {
            await requests.updateCheckoutShipping(req.user.id, parseInt(req.params.addressId));
            res.status(200).json("Checkout shipping info updated");
        }
        else {
            res.status(400).json("Invalid address");
        }
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /checkout/payment/billing/{addressId}:
 *   put:
 *     summary: Update the Checkout session's billing address
 *     tags: [Checkout]
 *     parameters:
 *       - in: path
 *         name: addressId 
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The Billing Address ID
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Checkout billing address updated
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               - Billing address not found
 *               - Invalid address
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Checkout session not found 
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error updating session billing address info
 */
router.put('/checkout/payment/billing/:addressId', userCheck, getCheckout, async (req, res) => {
    try {        
        // Check if address exists
        const foundAddress = await requests.getAddressById(req.user.id, parseInt(req.params.addressId));
        if (!foundAddress) return res.status(400).json("Address not found");
                
        // Check that the address is a either a primary or billing address
        if (foundAddress.address_type === "shipping_primary" || foundAddress.address_type === "billing") {
            await requests.updateCheckoutBilling(req.user.id, parseInt(req.params.addressId));
            res.status(200).json("Checkout billing address updated");
        }
        else {
            res.status(400).json("Invalid address");
        }
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /checkout/payment/payment-card:
 *   put:
 *     summary: Update the Checkout session's payment card id
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Checkout payment card updated
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               Payment card not found 
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Checkout session not found 
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error updating session payment card
 */
router.put('/checkout/payment/payment-card', userCheck, getCheckout, async (req, res) => {
    try {        
        // Check if payment card exists
        const foundPaymentCard = await requests.getPaymentCard(req.user.id);
        if (!foundPaymentCard) return res.status(400).json("Payment card not found");
                
        // Update checkout session payment card id
        await requests.updateCheckoutPaymentCard(req.user.id, foundPaymentCard.id);

        res.status(200).json("Checkout payment card updated");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /checkout/stage/{stageName}:
 *   put:
 *     summary: Update the Checkout session's stage
 *     tags: [Checkout]
 *     parameters:
 *       - in: path
 *         name: stageName 
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - shipping
 *             - payment
 *             - review
 *             - confirmation
 *             - invalid test
 *         description: The session stage (shipping, payment, review or confirmation)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Checkout stage updated
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               Invalid stage name 
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Checkout session not found 
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error updating session stage
 */
router.put('/checkout/stage/:stageName', userCheck, getCheckout, async (req, res) => {
    try {        
        // Check if stage name parameter is valid
        const stages = ["shipping", "payment", "review", "confirmation"];                
        if(!stages.includes(req.params.stageName)) return res.status(400).json("Invalid stage name");
                
        // Update checkout session stage
        await requests.updateCheckoutStage(req.user.id, req.params.stageName);

        res.status(200).json("Checkout stage updated");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /checkout/shipping/alt-address:
 *   post:
 *     summary: Add alternate shipping address
 *     tags: [Checkout]
 *     requestBody:
 *       description: The required request body for adding an alternate shipping address
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             firstName: Mark
 *             lastName: Masoumi
 *             address: 123 Alternate Avenue
 *             unit: 4B
 *             city: Toronto
 *             province: Ontario
 *             country: Canada
 *             postalCode: A1L2T3
 *             phoneNumber: "5551234567"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *               Address successfully created
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               - Alternate shipping address already exists
 *               - Request Body is missing required data
 *               - Invalid Request Body Data               
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Checkout session not found 
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error creating address               
 */
router.post('/checkout/shipping/alt-address', userCheck, getCheckout, async (req, res) => {
    try {                                                        
        // Check if user has an alternate shipping address already
        const foundAltShippingAddress = await requests.getAddressByType(req.user.id, "shipping_alternate");
        if(foundAltShippingAddress) return res.status(400).json("Alternate shipping address already exists");

        // Check that request body isn't missing data        
        const reqBodyKeys = Object.keys(req.body);
        const requiredData = ['firstName', 'lastName', 'address', 'city', 'province', 'country', 'postalCode', 'phoneNumber'];
        const hasData = requiredData.every(value => { return reqBodyKeys.includes(value) });
        if (!hasData) return res.status(400).json("Request Body is missing required data");
                
        // Validate user input                
        const validationArray = [];
        validationArray.push(validator.isAlpha(req.body.firstName));
        validationArray.push(validator.isLength(req.body.firstName, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.lastName));
        validationArray.push(validator.isLength(req.body.lastName, { min: 1, max: 50 }));
        validationArray.push(validator.isLength(req.body.address, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.city));
        validationArray.push(validator.isLength(req.body.city, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.province));
        validationArray.push(validator.isLength(req.body.province, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.country));
        validationArray.push(validator.isLength(req.body.country, { min: 1, max: 50 }));
        validationArray.push(validator.isAlphanumeric(req.body.postalCode));
        validationArray.push(validator.isLength(req.body.postalCode, { min: 6, max: 6 }));
        validationArray.push(validator.isMobilePhone(req.body.phoneNumber));
                                            
        // Check if any element in array is false
        const foundInvalidInput = validationArray.some((e) => { return e === false });        
        if (foundInvalidInput) return res.status(400).json("Invalid Request Body Data");
        
        // Get the address info from the request body
        const altAddress = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            unit: req.body.unit,
            city: req.body.city,
            province: req.body.province,
            country: req.body.country,
            postalCode: req.body.postalCode,
            phoneNumber: req.body.phoneNumber,
            addressType: "shipping_alternate",
            userId: req.user.id
        }
        
        // Add the address
        await requests.addAddress(altAddress);
                                        
        res.status(200).json("Alternate shipping address created");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /checkout/shipping/alt-address:
 *   get:
 *     summary: Get the alternate shipping address
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               id: 4
 *               firstName: Mark
 *               lastName: Masoumi
 *               address: 123 Alternate Avenue
 *               unit: 4B
 *               city: Toronto
 *               province: Ontario
 *               country: Canada
 *               postalCode: A1L2T3
 *               phoneNumber: "5551234567"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Alternate address not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving alternate address               
 */
router.get('/checkout/shipping/alt-address', userCheck, async (req, res) => {
    try {        
        // Get the alternate address
        const foundAddress = await requests.getAddressByType(req.user.id, "alternate_address");

        // Check if alternate address was found
        if(!foundAddress) return res.status(404).json("Alternate address not found");
        
        // Send alternate address in response
        res.status(200).json(foundAddress);
    } catch (error) {
        res.status(500).json(error);
    }
});