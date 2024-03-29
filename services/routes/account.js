// services/routes/account.js - This file contains all of the API routes / endpoints for ACCOUNT

// Require in the express module
const express = require("express");

// Require in validator - used for string validation
const validator = require('validator');

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
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving primary shipping address
 */
router.get('/account/primary-address', async (req, res) => {
    try {
        if (req.user && req.user.id) {
            // Get primary address from the db and return it in response
            const foundPrimaryAddress = await requests.getAddressByType(req.user.id, "shipping_primary");
            res.status(200).json(foundPrimaryAddress);
        } else {
            res.status(200).json(null);
        }
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
        if (req.user && req.user.id) {
            // Check if user has a primary shipping address already
            const foundPrimaryAddress = await requests.getAddressByType(req.user.id, "shipping_primary");

            if (foundPrimaryAddress) {
                return res.status(400).json("Primary shipping address already exists");
            }
            else {
                // Check that request body isn't missing data        
                const reqBodyKeys = Object.keys(req.body);
                const requiredData = ['firstName', 'lastName', 'streetNumber', 'streetName', 'city', 'province', 'country', 'postalCode', 'phoneNumber'];
                const hasData = requiredData.every(value => { return reqBodyKeys.includes(value) });
                if (!hasData) return res.status(400).json("Request Body is missing required data");

                // Validate user input                
                const validationArray = [];

                // First Name
                validationArray.push(validator.isAlpha(req.body.firstName));
                validationArray.push(validator.isLength(req.body.firstName, { min: 1, max: 50 }));
                // Last Name
                validationArray.push(validator.isAlpha(req.body.lastName));
                validationArray.push(validator.isLength(req.body.lastName, { min: 1, max: 50 }));
                // Street Number
                validationArray.push(validator.isInt(req.body.streetNumber, { min: 1, max: 99999 }));
                // Street Name
                validationArray.push(validator.isAlpha(req.body.streetName, "en-US", { ignore: " " }));
                validationArray.push(validator.isLength(req.body.streetName, { min: 1, max: 50 }));
                // City
                validationArray.push(validator.isAlpha(req.body.city));
                validationArray.push(validator.isLength(req.body.city, { min: 1, max: 50 }));
                // Country
                validationArray.push(validator.isAlpha(req.body.country));
                validationArray.push(validator.isLength(req.body.country, { min: 1, max: 50 }));
                // Postal Code
                validationArray.push(validator.isAlphanumeric(req.body.postalCode));
                validationArray.push(validator.isLength(req.body.postalCode, { min: 6, max: 6 }));
                // Phone Number
                validationArray.push(validator.isNumeric(req.body.phoneNumber));
                validationArray.push(validator.isLength(req.body.phoneNumber, { min: 10, max: 10 }));

                // Check if any element in array is false
                const foundInvalidInput = validationArray.some((e) => { return e === false });
                if (foundInvalidInput) return res.status(400).json("Invalid Request Body Data");

                // Concatenate 'Street Number' and 'Street Address' into a single string called 'address'
                const addressConcat = req.body.streetNumber + " " + req.body.streetName;

                // Get the address info from the request body
                const address = {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    address: addressConcat,
                    city: req.body.city,
                    unit: req.body.unit,
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
            }
        } else {
            return res.status(401).json("User not logged in");
        }
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
        if (!foundPrimaryAddress) return res.status(400).json("No primary address found");

        // Check that request body isn't missing data        
        const reqBodyKeys = Object.keys(req.body);
        const requiredData = ['firstName', 'lastName', 'streetNumber', 'streetName', 'city', 'province', 'country', 'postalCode', 'phoneNumber'];
        const hasData = requiredData.every(value => { return reqBodyKeys.includes(value) });
        if (!hasData) return res.status(400).json("Request Body is missing required data");

        // Validate user input                
        const validationArray = [];

        // First Name
        validationArray.push(validator.isAlpha(req.body.firstName));
        validationArray.push(validator.isLength(req.body.firstName, { min: 1, max: 50 }));
        // Last Name
        validationArray.push(validator.isAlpha(req.body.lastName));
        validationArray.push(validator.isLength(req.body.lastName, { min: 1, max: 50 }));
        // Street Number
        validationArray.push(validator.isInt(req.body.streetNumber, { min: 1, max: 99999 }));
        // Street Name
        validationArray.push(validator.isAlpha(req.body.streetName, "en-US", { ignore: " " }));
        validationArray.push(validator.isLength(req.body.streetName, { min: 1, max: 50 }));
        // City
        validationArray.push(validator.isAlpha(req.body.city));
        validationArray.push(validator.isLength(req.body.city, { min: 1, max: 50 }));
        // Country
        validationArray.push(validator.isAlpha(req.body.country));
        validationArray.push(validator.isLength(req.body.country, { min: 1, max: 50 }));
        // Postal Code
        validationArray.push(validator.isAlphanumeric(req.body.postalCode));
        validationArray.push(validator.isLength(req.body.postalCode, { min: 6, max: 6 }));
        // Phone Number
        validationArray.push(validator.isNumeric(req.body.phoneNumber));
        validationArray.push(validator.isLength(req.body.phoneNumber, { min: 10, max: 10 }));

        // Check if any element in array is false
        const foundInvalidInput = validationArray.some((e) => { return e === false });
        if (foundInvalidInput) return res.status(400).json("Invalid Request Body Data");

        // Concatenate 'Street Number' and 'Street Address' into a single string called 'address'
        const addressConcat = req.body.streetNumber + " " + req.body.streetName;

        // Get the address info from the request body and use it to set the Primary Shipping Address
        const address = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: addressConcat,
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
        if (req.user && req.user.id) {
            // Get billing address from the db and return it in response
            const foundBillingAddress = await requests.getAddressByType(req.user.id, "billing");
            res.status(200).json(foundBillingAddress);
        } else {
            res.status(200).json(null);
        }
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
        if (req.user && req.user.id) {
            // Check if user has a billing address already
            const foundBillingAddress = await requests.getAddressByType(req.user.id, "billing");

            if (foundBillingAddress) {
                return res.status(400).json("Billing address already exists");
            }
            else {
                // Check that request body isn't missing data        
                const reqBodyKeys = Object.keys(req.body);
                const requiredData = ['firstName', 'lastName', 'streetNumber', 'streetName', 'city', 'province', 'country', 'postalCode', 'phoneNumber'];
                const hasData = requiredData.every(value => { return reqBodyKeys.includes(value) });
                if (!hasData) return res.status(400).json("Request Body is missing required data");

                // Validate user input                
                const validationArray = [];

                // First Name
                validationArray.push(validator.isAlpha(req.body.firstName));
                validationArray.push(validator.isLength(req.body.firstName, { min: 1, max: 50 }));
                // Last Name
                validationArray.push(validator.isAlpha(req.body.lastName));
                validationArray.push(validator.isLength(req.body.lastName, { min: 1, max: 50 }));
                // Street Number
                validationArray.push(validator.isInt(req.body.streetNumber, { min: 1, max: 99999 }));
                // Street Name
                validationArray.push(validator.isAlpha(req.body.streetName, "en-US", { ignore: " " }));
                validationArray.push(validator.isLength(req.body.streetName, { min: 1, max: 50 }));
                // City
                validationArray.push(validator.isAlpha(req.body.city));
                validationArray.push(validator.isLength(req.body.city, { min: 1, max: 50 }));
                // Country
                validationArray.push(validator.isAlpha(req.body.country));
                validationArray.push(validator.isLength(req.body.country, { min: 1, max: 50 }));
                // Postal Code
                validationArray.push(validator.isAlphanumeric(req.body.postalCode));
                validationArray.push(validator.isLength(req.body.postalCode, { min: 6, max: 6 }));
                // Phone Number
                validationArray.push(validator.isNumeric(req.body.phoneNumber));
                validationArray.push(validator.isLength(req.body.phoneNumber, { min: 10, max: 10 }));

                // Check if any element in array is false
                const foundInvalidInput = validationArray.some((e) => { return e === false });
                if (foundInvalidInput) return res.status(400).json("Invalid Request Body Data");

                // Concatenate 'Street Number' and 'Street Address' into a single string called 'address'
                const addressConcat = req.body.streetNumber + " " + req.body.streetName;

                // Get the address info from the request body
                const address = {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    address: addressConcat,
                    city: req.body.city,
                    unit: req.body.unit,
                    province: req.body.province,
                    country: req.body.country,
                    postalCode: req.body.postalCode,
                    phoneNumber: req.body.phoneNumber,
                    addressType: "billing",
                    userId: req.user.id
                }
                // Add the address
                await requests.addAddress(address);
                res.status(201).json("Billing Address successfully created");
            }
        } else {
            return res.status(401).json("User not logged in");
        }
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
        if (!foundBillingAddress) return res.status(400).json("No billing address found");

        // Check that request body isn't missing data        
        const reqBodyKeys = Object.keys(req.body);
        const requiredData = ['firstName', 'lastName', 'streetNumber', 'streetName', 'city', 'province', 'country', 'postalCode', 'phoneNumber'];
        const hasData = requiredData.every(value => { return reqBodyKeys.includes(value) });
        if (!hasData) return res.status(400).json("Request Body is missing required data");

        // Validate user input                
        const validationArray = [];

        // First Name
        validationArray.push(validator.isAlpha(req.body.firstName));
        validationArray.push(validator.isLength(req.body.firstName, { min: 1, max: 50 }));
        // Last Name
        validationArray.push(validator.isAlpha(req.body.lastName));
        validationArray.push(validator.isLength(req.body.lastName, { min: 1, max: 50 }));
        // Street Number
        validationArray.push(validator.isInt(req.body.streetNumber, { min: 1, max: 99999 }));
        // Street Name
        validationArray.push(validator.isAlpha(req.body.streetName, "en-US", { ignore: " " }));
        validationArray.push(validator.isLength(req.body.streetName, { min: 1, max: 50 }));
        // City
        validationArray.push(validator.isAlpha(req.body.city));
        validationArray.push(validator.isLength(req.body.city, { min: 1, max: 50 }));
        // Country
        validationArray.push(validator.isAlpha(req.body.country));
        validationArray.push(validator.isLength(req.body.country, { min: 1, max: 50 }));
        // Postal Code
        validationArray.push(validator.isAlphanumeric(req.body.postalCode));
        validationArray.push(validator.isLength(req.body.postalCode, { min: 6, max: 6 }));
        // Phone Number
        validationArray.push(validator.isNumeric(req.body.phoneNumber));
        validationArray.push(validator.isLength(req.body.phoneNumber, { min: 10, max: 10 }));

        // Check if any element in array is false
        const foundInvalidInput = validationArray.some((e) => { return e === false });
        if (foundInvalidInput) return res.status(400).json("Invalid Request Body Data");

        // Concatenate 'Street Number' and 'Street Address' into a single string called 'address'
        const addressConcat = req.body.streetNumber + " " + req.body.streetName;

        // Get the address info from the request body
        const address = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: addressConcat,
            unit: req.body.unit,
            city: req.body.city,
            province: req.body.province,
            country: req.body.country,
            postalCode: req.body.postalCode,
            phoneNumber: req.body.phoneNumber,
        }

        // Update address
        await requests.updateAddress(foundBillingAddress.id, req.user.id, address);

        res.status(200).json("Address successfully updated");
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
        if (!foundBillingAddress) return res.status(404).json("Billing address not found");

        // Delete the billing address
        await requests.deleteAddress(foundBillingAddress.id);

        res.status(200).json("Billing address successfully deleted");
    } catch (error) {
        res.status(500).json(error);
    }
});


// TODO: Delete this
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
        if (!matchedPassword) return res.status(400).json("Incorrect Password");

        // Validate user input:
        const strongPassword = validator.isStrongPassword(req.body.newPassword, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 });
        if (!strongPassword) return res.status(400).json("New password is invalid");
        if (req.body.newPassword !== req.body.newPasswordConfirm) return res.status(400).json("Passwords don't match");

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