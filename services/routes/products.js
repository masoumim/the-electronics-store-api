// services/routes/products.js - This file contains all of the API routes / endpoints for PRODUCTS

// Require in the express module
const express = require("express");

// Require in the requests module
const requests = require("../requests.js");

// Create a router
const router = express.Router();

// Export the router
module.exports = router

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: The Products API routes
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the product
 *         name:
 *           type: string
 *           description: The first name of the product
 *         description:
 *           type: string
 *           description: The description of the product
 *         inventory:
 *           type: integer
 *           description: The amount of stock held in inventory
 *         price:
 *           type: number
 *           description: The price of the product
 *         category code:
 *           type: string
 *           description: The code representing the category of the product
 *         discount type:
 *           type: string
 *           description: The type of discount the product has (none, countdown, normal)
 *         total sold:
 *           type: integer
 *           description: The total number of sales
 *         img filename:
 *           type: string
 *           description: The path to the filename of the product image
 *         discount percent:
 *           type: integer
 *           description: The discount percent
 *         item code:
 *           type: string
 *           description: The unique item code for a product.     
 *       example:
 *         id: 1
 *         name: PlayStation 5
 *         description: Sony PlayStation 5 game console
 *         inventory: 25
 *         price: 649.95
 *         category code: GAMCONPLA
 *         discount type: none
 *         total sold: 50
 *         img filename: ps5.jpg
 *         discount percent: 0
 *         item code: GAMCONPS000001
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Products sorted by category code
 *       - in: query
 *         name: discount 
 *         schema:
 *           type: string
 *         description: Products sorted by discount type
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *             example:
 *               - id: 1
 *                 name: PlayStation 5
 *                 description: Sony PlayStation 5 game console
 *                 inventory: 25
 *                 price: 649.95
 *                 category_code: GAMCONPLA
 *                 discount_type: none
 *                 total_sold: 50
 *                 img_filename: ps5.jpg
 *                 discount percent: 0
 *                 item_code: SONPLA000001
 *               - id: 2
 *                 name: Samsung 43" LED TV
 *                 description: 4K UHD Smart TV with CrystalClear Image technology and Game Mode for super fast frame rates.
 *                 inventory: 10
 *                 price: 449.95
 *                 category_code: HOMTELLED
 *                 discount_type: none
 *                 total sold: 75
 *                 img_filename: samsungled.jpg
 *                 discount percent: 0
 *                 item_code: SAMLED000001
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               Error retrieving products               
 */
router.get('/products', async (req, res) => {
    try {
        let products;
        // Check if there are any queries in the URL
        if (Object.entries(req.query).length !== 0) {
            // If there is a single query parameter, determine it's key / value and pass them to the getProductsByQuery method
            if (Object.entries(req.query).length === 1) {
                switch (Object.keys(req.query)[0]) {
                    case 'category':
                        products = await requests.getProductByQuery('category_code', Object.values(req.query)[0].toUpperCase());
                        break;
                    case 'discount':
                        products = await requests.getProductByQuery('discount_type', Object.values(req.query)[0]);
                        break;
                }
            }
            else {
                // Otherwise, if there are multiple query params, pass both param values to getProductsByMultiQuery
                products = await requests.getProductsByMultiQuery(Object.values(req.query)[0], Object.values(req.query)[1]);
            }
        }
        else {
            // Get all products from the db
            products = await requests.getAllProducts();
        }
        // Send array of objects in response
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id 
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
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *             example:
 *               id: 1
 *               name: PlayStation 5
 *               description: Sony PlayStation 5 game console
 *               inventory: 25
 *               price: 649.95
 *               category_code: GAMCONPLA
 *               discount_type: none
 *               total_sold: 50
 *               img_filename: ps5.jpg
 *               discount percent: 0
 *               item_code: SONPLA000001
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
 *               Error retrieving product               
 */
router.get('/products/:id', async (req, res) => {
    try {
        // Get products from the db
        const product = await requests.getProductById(parseInt(req.params.id));

        // Send 404 response if product not in db
        if(!product) return res.status(404).json("Product not found");

        // Send product object in response
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json(error);
    }
});