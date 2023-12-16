// services/routes/account.js - This file contains all of the API routes / endpoints for ACCOUNT

// Require in the express module
const express = require("express");

// Require in validator - used for string validation
const validator = require('validator');

// Used for hashing passwords
const bcrypt = require("bcrypt");

// Get formatted timestamps
const timestamp = require('time-stamp');

// Middleware to check if user logged in
const userCheck = require("./middleware/user-check.js");

// Require in the requests module
const requests = require("../requests.js");

// Create a router
const router = express.Router();

// Export the router
module.exports = router

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: The Account API routes
 */

/**
 * @swagger
 * /account/primary-address:
 *   get:
 *     summary: Get primary shipping address
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               id: 2
 *               firstName: Mark
 *               lastName: Masoumi
 *               address: 456 Foo Street
 *               unit: "2"
 *               city: Toronto
 *               province: Ontario
 *               country: Canada
 *               postalCode: X1Y2Z3
 *               phoneNumber: "5551234567"
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Primary shipping address not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving primary shipping address
 */
router.get('/account/primary-address', async (req, res) => {
    try {
        // Get primary address from the db
        const foundPrimaryAddress = await requests.getAddressByType(req.user.id, "shipping_primary");

        // Send 404 response if primary address not in db
        if(!foundPrimaryAddress) return res.status(404).json("Primary shipping address not found");

        // Send primary address in response
        res.status(200).json(foundPrimaryAddress);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/primary-address:
 *   post:
 *     summary: Add primary shipping address
 *     tags: [Account]
 *     requestBody:
 *       description: The required request body for adding a primary shipping address
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             firstName: Mark
 *             lastName: Masoumi
 *             address: 456 Foo Street
 *             unit: "2"
 *             city: Toronto
 *             province: Ontario
 *             country: Canada
 *             postalCode: X1Y2Z3
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
 *               - Request Body is missing required data
 *               - Invalid Request Body Data
 *               - Primary shipping address already exists
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error creating address               
 */
router.post('/account/primary-address', userCheck, async (req, res) => {
    try {                                        
        // Check if user has a primary shipping address already
        const foundPrimaryAddress = await requests.getAddressByType(req.user.id, "shipping_primary");
        if(foundPrimaryAddress) return res.status(400).json("Primary shipping address already exists");

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
        const address = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            unit: req.body.unit,
            city: req.body.city,
            province: req.body.province,
            country: req.body.country,
            postalCode: req.body.postalCode,
            phoneNumber: req.body.phoneNumber,
            addressType: "shipping_primary",
            userId: req.user.id
        }
                
        // Add the address
        await requests.addAddress(address);
                                        
        res.status(201).json("Primary shipping address created");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/primary-address:
 *   put:
 *     summary: Update primary shipping address
 *     tags: [Account]
 *     requestBody:
 *       description: The required request body for updating primary address
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             firstName: Mark
 *             lastName: Masoumi
 *             address: 111 Bar Avenue
 *             unit: ""
 *             city: Toronto
 *             province: Ontario
 *             country: Canada
 *             postalCode: B1A2R3
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
 *               - Invalid Request Body Data
 *               - Request Body is missing required data
 *               - No primary address found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error updating address               
 */
router.put('/account/primary-address', userCheck, async (req, res) => {    
    try {                                                                                
        // Check if there is a primary address to update
        const foundPrimaryAddress = await requests.getAddressByType(req.user.id, "shipping_primary");
        if(!foundPrimaryAddress) return res.status(400).json("No primary address found");

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
        const address = {
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
        await requests.updateAddress(foundPrimaryAddress.id, req.user.id, address);
                                
        res.status(200).json("Address successfully updated");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/billing-address:
 *   get:
 *     summary: Get billing address
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               id: 2
 *               firstName: Mark
 *               lastName: Masoumi
 *               address: 123 Billing Street 
 *               city: Toronto
 *               province: Ontario
 *               country: Canada
 *               postalCode: B1I2L3
 *               phoneNumber: "5551234567"
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Billing address not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving billing address
 */
router.get('/account/billing-address', async (req, res) => {
    try {
        // Get billing address from the db
        const foundBillingAddress = await requests.getAddressByType(req.user.id, "billing");

        // Send 404 response if billing address not in db
        if(!foundBillingAddress) return res.status(404).json("Billing address not found");

        // Send billing address in response
        res.status(200).json(foundBillingAddress);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/billing-address:
 *   post:
 *     summary: Add billing address
 *     tags: [Account]
 *     requestBody:
 *       description: The required request body for adding a billing address
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             firstName: Mark
 *             lastName: Masoumi
 *             address: 123 Billing Street
 *             city: Toronto
 *             province: Ontario
 *             country: Canada
 *             postalCode: B1I2L3
 *             phoneNumber: "5551234567"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *               Billing Address successfully created
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:               
 *               - Request Body is missing required data
 *               - Invalid Request Body Data
 *               - Billing address already exists
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error creating billing address               
 */
router.post('/account/billing-address', userCheck, async (req, res) => {
    try {                                        
        // Check if user has a billing address already
        const foundBillingAddress = await requests.getAddressByType(req.user.id, "billing");
        if(foundBillingAddress) return res.status(400).json("Billing address already exists");

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
        const address = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            unit: req.body.unit,
            city: req.body.city,
            province: req.body.province,
            country: req.body.country,
            postalCode: req.body.postalCode,
            phoneNumber: req.body.phoneNumber,
            addressType: "billing",
            userId: req.user.id
        }
                
        // Add the billing address
        await requests.addAddress(address);
                                        
        res.status(201).json("Billing Address successfully created");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/billing-address:
 *   put:
 *     summary: Update billing address
 *     tags: [Account]
 *     requestBody:
 *       description: The required request body for updating billing address
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             firstName: Mark
 *             lastName: Masoumi
 *             address: 555 Billing Avenue 
 *             city: Toronto
 *             province: Ontario
 *             country: Canada
 *             postalCode: B1I2L3
 *             phoneNumber: "5551234567"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Billing address successfully updated
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               - Invalid Request Body Data
 *               - Request Body is missing required data
 *               - No billing address found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error updating billing address               
 */
router.put('/account/billing-address', userCheck, async (req, res) => {    
    try {                                                                                
        // Check if there is a billing address to update
        const foundBillingAddress = await requests.getAddressByType(req.user.id, "billing");
        if(!foundBillingAddress) return res.status(400).json("No billing address found");

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
        
        // Get the billing address info from the request body
        const address = {
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

        // Update billing address
        await requests.updateAddress(foundBillingAddress.id, req.user.id, address);
                                
        res.status(200).json("Billing address successfully updated");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/billing-address:
 *   delete:
 *     summary: Delete billing address
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Billing address successfully deleted
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Billing address not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error deleting billing address
 */
router.delete('/account/billing-address', async (req, res) => {
    try {
        // Get billing address from the db
        const foundBillingAddress = await requests.getAddressByType(req.user.id, "billing");

        // Send 404 response if billing address not in db
        if(!foundBillingAddress) return res.status(404).json("Billing address not found");

        // Delete the billing address
        await requests.deleteAddress(foundBillingAddress.id);

        res.status(200).json("Billing address successfully deleted");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/change-password:
 *   post:
 *     summary: Change Password
 *     tags: [Account]
 *     requestBody:
 *       description: Updated Password
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             currentPassword: Current1234567! 
 *             newPassword: New1234567!
 *             newPasswordConfirm: New1234567!
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Password successfully updated.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               - Password change failed. Required info is missing.
 *               - Incorrect Password
 *               - New password is invalid
 *               - Passwords don't match
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error updating user               
 */
router.post('/account/change-password', userCheck, async (req, res) => {
    try {                
        // Check if the request body has any missing data
        if (!req.body.currentPassword || !req.body.newPassword || !req.body.newPasswordConfirm) return res.status(400).json("Password change failed. Required info is missing.");
                
        // Confirm current password matches password in DB
        const user = await requests.getUserById(req.user.id);            
        const matchedPassword = await bcrypt.compare(req.body.currentPassword, user.password);                
        if(!matchedPassword) return res.status(400).json("Incorrect Password");
                
        // Validate user input:
        const strongPassword = validator.isStrongPassword(req.body.newPassword, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 });
        if(!strongPassword) return res.status(400).json("New password is invalid");
        if(req.body.newPassword !== req.body.newPasswordConfirm) return res.status(400).json("Passwords don't match");

        // Encrypt new password        
        // Generate salt with 10 Salt Rounds
        const salt = await bcrypt.genSalt(10);

        // Hash password
        const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);
                                
        // Update user password in db
        await requests.updateUserPassword(req.user.id, hashedPassword);

        res.status(200).json("Password successfully updated.");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/payment-card:
 *   post:
 *     summary: Add Payment Card
 *     tags: [Account]
 *     requestBody:
 *       description: New Payment Card
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             cardNumber: "4111111111111111"
 *             firstName: Mark
 *             lastName: Masoumi
 *             securityCode: "123" 
 *             expirationMonth: "01"
 *             expirationYear: "25"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *               Payment Card successfully created
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               - User already has payment card
 *               - Request Body is missing required data
 *               - Invalid Request Body Data
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error adding payment card               
 */
router.post('/account/payment-card', userCheck, async (req, res) => {
    try {
        
        // Check if user already has payment card saved
        const foundPaymentCard = await requests.getPaymentCard(req.user.id);
        if(foundPaymentCard) return res.status(400).json("User already has payment card");
        
        // Check that request body isn't missing data        
        const reqBodyKeys = Object.keys(req.body);
        const requiredData = ['cardNumber', 'firstName', 'lastName', 'securityCode', 'expirationMonth', 'expirationYear'];        
        const hasData = requiredData.every(value => { return reqBodyKeys.includes(value) });                
        if(!hasData) return res.status(400).json("Request Body is missing required data");
                                                
        // Validate input                              
        const validationArray = [];
        validationArray.push(validator.isCreditCard(req.body.cardNumber));
        validationArray.push(validator.isLength(req.body.firstName, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.firstName));
        validationArray.push(validator.isLength(req.body.lastName, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.lastName));
        validationArray.push(validator.isNumeric(req.body.securityCode));
        validationArray.push(validator.isLength(req.body.securityCode, { min: 3, max: 3 }));
        validationArray.push(validator.isNumeric(req.body.expirationMonth));
        validationArray.push(validator.isLength(req.body.expirationMonth, { min: 2, max: 2 }));
        validationArray.push(validator.isNumeric(req.body.expirationYear));
        validationArray.push(validator.isLength(req.body.expirationYear, { min: 2, max: 2 }));
        
        // Check expiration date validity
        const currentMonth = timestamp('MM');
        const currentYear = timestamp('YYYY').slice(2, 4);
        let invalidExpiration = false;
        if(parseInt(req.body.expirationYear) < parseInt(currentYear)) invalidExpiration = true;
        if ((parseInt(req.body.expirationYear) === parseInt(currentYear)) && parseInt(req.body.expirationMonth) <= parseInt(currentMonth)) invalidExpiration = true;
                        
        // Check if any element in array is false || the expiration date is invalid
        const foundInvalidInput = validationArray.some((e) => { return e === false });
        if (foundInvalidInput || invalidExpiration) return res.status(400).json("Invalid Request Body Data");
                
        // Get the payment card info from the request body
        const paymentCard = {
            cardNumber: req.body.cardNumber,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            securityCode: req.body.securityCode,
            expirationMonth: req.body.expirationMonth,
            expirationYear: req.body.expirationYear,
            paymentCardType: "payment",
            userId: req.user.id            
        }
        
        // Save payment card to DB
        await requests.addPaymentCard(paymentCard);

        res.status(201).json("Payment Card successfully created");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/payment-card:
 *   put:
 *     summary: Update Payment Card
 *     tags: [Account]
 *     requestBody:
 *       description: Updated Payment Card
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             cardNumber: "5555555555554444"
 *             firstName: Mark
 *             lastName: Masoumi
 *             securityCode: "123" 
 *             expirationMonth: "05"
 *             expirationYear: "25"
 *     responses:
 *       201:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Payment Card successfully updated
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               - User does not have payment card 
 *               - Request Body is missing required data
 *               - Invalid Request Body Data 
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               User not logged in
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error updating payment card               
 */
router.put('/account/payment-card', userCheck, async (req, res) => {
    try {
        
        // Check if user has payment card to updated
        const foundPaymentCard = await requests.getPaymentCard(req.user.id);
        if(!foundPaymentCard) return res.status(400).json("User does not have payment card");
        
        // Check that request body isn't missing data        
        const reqBodyKeys = Object.keys(req.body);
        const requiredData = ['cardNumber', 'firstName', 'lastName', 'securityCode', 'expirationMonth', 'expirationYear'];        
        const hasData = requiredData.every(value => { return reqBodyKeys.includes(value) });                
        if(!hasData) return res.status(400).json("Request Body is missing required data");
                                                
        // Validate input                              
        const validationArray = [];
        validationArray.push(validator.isCreditCard(req.body.cardNumber));
        validationArray.push(validator.isLength(req.body.firstName, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.firstName));
        validationArray.push(validator.isLength(req.body.lastName, { min: 1, max: 50 }));
        validationArray.push(validator.isAlpha(req.body.lastName));
        validationArray.push(validator.isNumeric(req.body.securityCode));
        validationArray.push(validator.isLength(req.body.securityCode, { min: 3, max: 3 }));
        validationArray.push(validator.isNumeric(req.body.expirationMonth));
        validationArray.push(validator.isLength(req.body.expirationMonth, { min: 2, max: 2 }));
        validationArray.push(validator.isNumeric(req.body.expirationYear));
        validationArray.push(validator.isLength(req.body.expirationYear, { min: 2, max: 2 }));
        
        // Check expiration date validity
        const currentMonth = timestamp('MM');
        const currentYear = timestamp('YYYY').slice(2, 4);
        let invalidExpiration = false;
        if(parseInt(req.body.expirationYear) < parseInt(currentYear)) invalidExpiration = true;
        if ((parseInt(req.body.expirationYear) === parseInt(currentYear)) && parseInt(req.body.expirationMonth) <= parseInt(currentMonth)) invalidExpiration = true;
                        
        // Check if any element in array is false || the expiration date is invalid
        const foundInvalidInput = validationArray.some((e) => { return e === false });
        if (foundInvalidInput || invalidExpiration) return res.status(400).json("Invalid Request Body Data");
                
        // Get the payment card info from the request body
        const paymentCard = {
            cardNumber: req.body.cardNumber,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            securityCode: req.body.securityCode,
            expirationMonth: req.body.expirationMonth,
            expirationYear: req.body.expirationYear                      
        }
        
        // Update the payment card to DB
        await requests.updatePaymentCard(foundPaymentCard.id, req.user.id, paymentCard);

        res.status(201).json("Payment Card successfully updated");
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/payment-card:
 *   get:
 *     summary: Get payment card
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               card_number: "4111111111111111"
 *               first_name: Mark
 *               last_name: Masoumi
 *               security_code: "123"
 *               expiration_month: "01"
 *               expiration_year: "25"
 *               user_id: 10
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Payment card not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving payment card               
 */
router.get('/account/payment-card', async (req, res) => {
    try {
        // Get payment card from the db
        const paymentCard = await requests.getPaymentCard(req.user.id);

        // Send 404 response if payment card not in db
        if(!paymentCard) return res.status(404).json("Payment card not found");

        // Send payment card object in response
        res.status(200).json(paymentCard);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /account/payment-card:
 *   delete:
 *     summary: Delete payment card
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Payment card successfully deleted
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             example:
 *               Payment card not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error deleting payment card               
 */
router.delete('/account/payment-card', async (req, res) => {
    try {
        // Get payment card from the db
        const paymentCard = await requests.getPaymentCard(req.user.id);

        // Send 404 response if payment card not in db
        if(!paymentCard) return res.status(404).json("Payment card not found");

        // Delete the payment card
        await requests.deletePaymentCard(paymentCard.id, req.user.id);

        res.status(200).json("Payment card successfully deleted");
    } catch (error) {
        res.status(500).json(error);
    }
});