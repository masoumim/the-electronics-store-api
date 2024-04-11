// services/routes/cart.js - This file contains all of the API routes / endpoints for a CART

// Require in the express module
const express = require("express");

// Require in the requests module
const requests = require("../requests.js");

// Middleware to check if user logged in
const userCheck = require("./middleware/user-check.js");

// Middleware that attaches the user's cart to the request object
const getCart = require("./middleware/get-cart.js");

// Create a router
const router = express.Router();

// Export the router
module.exports = router

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: The Cart API routes
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the cart
 *         user_id:
 *           type: integer
 *           description: The user id of the user who the cart belongs to
 *         num_items:
 *           type: integer
 *           description: The number of items in the cart
 *         total:
 *           type: number
 *           description: The cart total
 *         subtotal:
 *           type: number
 *           description: The cart subtotal
 *         taxes:
 *           type: number
 *           description: The cart taxes
 *       example:
 *         id: 1
 *         user_id: 6
 *         num_items: 4
 *         total: 100.50
 *         subtotal: 90.50
 *         taxes: 10
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get Cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *             example:
 *               id: 1
 *               user_id: 6
 *               num_items: 4
 *               total: 100.50
 *               subtotal: 90.00
 *               taxes: 10.50
 *               cart_products: [{product_id: 7, quantity: 3},{product_id: 10, quantity: 1}]
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
 *               Error retrieving cart               
 */
router.get('/cart', userCheck, getCart, async (req, res) => {
    try {        
        // Send cart object in response
        res.status(200).json(req.cart);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /cart/add/{productId}:
 *   post:
 *     summary: Add product to cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId 
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The product ID
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Product successfully added to Cart
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               - Product is out of stock
 *               - Not enough inventory to add to cart
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
 *               Product not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error adding product to cart               
 */
router.post('/cart/add/:productId', userCheck, getCart, async (req, res) => {
    try {
        console.log(`Adding product with ID ${req.params.productId} to cart`);

        const product = await requests.getProductById(parseInt(req.params.productId));
        if (!product) {
            console.log(`Product with ID ${req.params.productId} not found`);
            return res.status(404).json("Product not found");
        }

        if(product.inventory === 0) {
            console.log(`Product with ID ${req.params.productId} is out of stock`);
            return res.status(400).json("Product is out of stock");
        }

        for(const cartProduct of req.cart.cart_product) {            
            if(cartProduct.product_id === parseInt(req.params.productId)){                
                if (cartProduct.quantity === product.inventory) {
                    console.log(`Not enough inventory to add product with ID ${req.params.productId} to cart`);
                    return res.status(400).json("Not enough inventory to add to cart");
                }
            }
        }
        
        await requests.addProductToCart(req.cart.id, parseInt(req.params.productId));
        console.log(`Product with ID ${req.params.productId} successfully added to cart`);

        const foundCheckout = await requests.getCheckout(req.user.id);
        if(foundCheckout) await requests.updateCheckoutStage(req.user.id, "shipping");
                                        
        res.status(200).json("Product successfully added to Cart");
    } catch (error) {
        console.log(`Error adding product with ID ${req.params.productId} to cart: ${error}`);
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /cart/remove/{productId}:
 *   post:
 *     summary: Remove product from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId 
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The product ID
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Product successfully removed from Cart
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               Product not in cart
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
 *               Product not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error removing product from cart               
 */
router.post('/cart/remove/:productId', userCheck, getCart, async (req, res) => {
    try {
        // Check if the product exists
        const product = await requests.getProductById(parseInt(req.params.productId));
        if (!product) return res.status(404).json("Product not found");

        // Remove product from the cart
        const removedProduct = await requests.removeProductFromCart(req.cart.id, parseInt(req.params.productId));

        if (removedProduct) {
            const foundCheckout = await requests.getCheckout(req.user.id);
            const updatedCart = await requests.getCartByUserId(req.user.id);

            // Check if user has items in checkout
            if (foundCheckout) {
                // If cart is now empty, delete checkout session
                if (updatedCart.num_items === 0) {
                    await requests.deleteCheckout(req.user.id);
                }
                else {
                    // Set the checkout session stage to "shipping"
                    await requests.updateCheckoutStage(req.user.id, "shipping");
                }
            }
            res.status(200).json("Product successfully removed from Cart");
        }
        else {
            res.status(400).json("Product not in cart or quantity is 1");
        }
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /cart/delete/{productId}:
 *   get:
 *     summary: Delete product from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId 
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The product ID
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Product successfully deleted from Cart
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               Product not in cart
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
 *               Product not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error removing product from cart               
 */
router.get('/cart/delete/:productId', userCheck, getCart, async (req, res) => {
    try {
        // Check if the product exists
        const product = await requests.getProductById(parseInt(req.params.productId));
        if (!product) return res.status(404).json("Product not found");

        // Delete product from the cart
        const deletedProduct = await requests.deleteProductFromCart(req.cart.id, parseInt(req.params.productId));

        if (deletedProduct) {
            const foundCheckout = await requests.getCheckout(req.user.id);
            const updatedCart = await requests.getCartByUserId(req.user.id);

            // Check if user has items in checkout
            if (foundCheckout) {
                // If cart is now empty, delete checkout session
                if (updatedCart.num_items === 0) {
                    await requests.deleteCheckout(req.user.id);
                }
                else {
                    // Set the checkout session stage to "shipping"
                    await requests.updateCheckoutStage(req.user.id, "shipping");
                }
            }
            res.status(200).json("Product successfully deleted from Cart");
        }
        else {
            res.status(400).json("Product not not deleted from cart");
        }
    } catch (error) {
        res.status(500).json(error);
    }
});