// services/routes/orders.js - This file contains all of the API routes / endpoints for ORDERS

// Require in the express module
const express = require("express");

// Require in the requests module
const requests = require("../requests.js");

// Middleware to attached the user's cart to the request object
const getCart = require("./middleware/get-cart.js");

// Middleware to check if user logged in
const userCheck = require("./middleware/user-check.js");

// Middleware to check if checkout session exists and attach it to request obj if it does
const getCheckout = require("./middleware/get-checkout.js");

// Create a router
const router = express.Router();

// Export the router
module.exports = router

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: The Orders API routes
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the order
 *         user_id:
 *           type: integer
 *           description: The user id of the user who the cart belongs to
 *         order_date:
 *           type: date
 *           description: The date of the order
 *         total:
 *           type: number
 *           description: The order total
 *         subtotal:
 *           type: number
 *           description: The order subtotal
 *         taxes:
 *           type: number
 *           description: The total taxes
 *         num_items:
 *           type: number
 *           description: The number of items in the order
 *         payment_card_id:
 *           type: integer
 *           description: The id of the payment card used in the order
 *         shipping_address_id:
 *           type: integer
 *           description: The id of the shipping address used in the order
 *         billing_address_id:
 *           type: integer
 *           description: The id of the billing address used in the order
 *       example:
 *         id: 5
 *         user_id: 6
 *         order_date: 2023-12-11T00:00:00.000Z
 *         total: 100.50
 *         subtotal: 90.50
 *         taxes: 10
 *         num_items: 2
 *         payment_card_id: 3
 *         shipping_address_id: 2
 *         billing_address_id: 6         
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get Orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *             example:
 *               id: 5
 *               user_id: 6
 *               order_date: 2023-12-11T00:00:00.000Z
 *               total: 100.50
 *               subtotal: 90.50
 *               taxes: 10
 *               num_items: 2
 *               payment_card_id: 3
 *               shipping_address_id: 2
 *               billing_address_id: 6 
 *               order_products: [{order_id: 1, product_id: 7, quantity: 3},{order_id: 1, product_id: 10, quantity: 1}]
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
 *               No orders found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving orders               
 */
router.get('/orders', userCheck, async (req, res) => {
    try {        
        // Get the orders belonging to the user
        const foundOrders = await requests.getOrders(req.user.id);

        // Check if orders were found
        if(foundOrders.length === 0) return res.status(404).json("No orders found");
        
        // Send orders in response
        res.status(200).json(foundOrders);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /orders/create:
 *   post:
 *     summary: Create an order
 *     tags: [Orders]
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *               Order successfully created
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
 *               - Checkout session not at confirmation stage
 *               - Checkout data not set
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
 *               Error creating order               
 */
router.post('/orders/create', userCheck, getCart, getCheckout, async (req, res) => {
    try {        
        // Check if checkout session is at the confirmation stage
        if(req.checkout.stage !== "confirmation") return res.status(400).json("Checkout session not at confirmation stage");

        // Confirm checkout info is set
        if(!req.checkout.payment_card_id || !req.checkout.shipping_address_id || !req.checkout.billing_address_id) return res.status(400).json("Checkout data not set");
        
        // Create a new order in the DB        
        await requests.addOrder(req.user.id, req.cart.id);
                                        
        res.status(200).json("Order successfully created");
    } catch (error) {
        res.status(500).json(error);
    }
});