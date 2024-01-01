// server.js - This file creates and runs an Express.js web server

// Require in express module
const express = require('express');

// Create instance of an express module
const app = express();

// Require in the dotenv module
// Will load environment variables contained in .env file
require('dotenv').config();

// Require in the cors module and set the origin dynamically
const cors = require('cors');
app.use(cors())
// const originURL = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://electronics-store-8382b35f5fca.herokuapp.com";
// app.use(
//     cors({
//         origin: originURL,
//         credentials: true,
//         allowedHeaders: "Content-Type, Authorization"
//     })
// );

// Enables body parsing
app.use(express.json());

// Enables body parsing of HTML form data
app.use(express.urlencoded({ extended: false }));

// swagger-jsdoc: Allows you to markup routes with jsdoc comments. 
// It then produces a full swagger yml config dynamically which can 
// be passed to swagger-ui-express to produce documentation.
const swaggerJsdoc = require("swagger-jsdoc");

// swagger-ui-express: This module allows you to serve auto-generated swagger-ui generated API docs from express, 
// based on a swagger.json file. The result is living documentation for your API hosted from your API server via a route.
// The Interactive documentation is then hosted at:  http://localhost:8080/api-docs/
const swaggerUi = require("swagger-ui-express");

// Config options for swagger-jsdoc
const options = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "The Electronics Store Express API",
            version: "0.1.0",
            description:
                "This is an Express.js API back-end for The Electronics Store e-commerce web app",
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
            contact: {
                name: "Mark Masoumi",
                url: "https://github.com/masoumim",
                email: "masoumi.mark@gmail.com",
            },
        },
        servers: [
            {
                url: process.env.NODE_ENV === "development" ? "http://localhost:8080" : "https://the-electronics-store-api-962f1726488d.herokuapp.com"
            },
        ],
    },
    apis: ["./services/routes/*.js", "./server.js"],
};

// Use the swaggerJsdoc function to scan through the options passed in as a param and return the converted Swagger specification object.
const specs = swaggerJsdoc(options);

// Serve the interactive SwaggerUI API documentation at '/api-docs'
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Server the Swagger API documentation as JSON
app.get('/swagger.json', function (req, res) {
    res.send(specs);
});

// Require in the authenticateUser method which authenticates user by UID
const authenticateUser = require('./authenticate-user.js');

// Require in the Firebase Admin SDK Auth instance
const auth = require('firebase-admin/auth');

// Require in the Firebase Admin module
const admin = require("firebase-admin");

// Get the service account config info
const serviceAccount = require('./firebase-admin-config.js');

// Initialize the Admin SDK using the service account config info
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Receive a token ID from the front end and use it to decode
// a UID belonging to the currently signed in user on the frontend
app.post('/firebase-auth', async (req, res, next) => {
    // idToken comes from the client app
    auth.getAuth()
        .verifyIdToken(req.body.idToken)
        .then(async (decodedToken) => {
            const uid = decodedToken.uid;
            // Use the UID to authenticate a user
            authenticatedUser = await authenticateUser(uid);

            // If user found in postgresql db with matching uid...
            if (authenticatedUser) res.status(200).json("User Authenticated");
        })
        .catch((error) => {
            console.log(error);
            res.json(error);
        });
});

// Sign the user out of the server by setting the authenticatedUser to null
app.get('/sign-out', (req, res) => {
    authenticatedUser = null;
    res.status(200).json("User signed out on server");
});

/**
 * @swagger
 *  tags:
 *    name: Test User
 *    description: Set user to 'test user' for testing out SwaggerUI API
 * /swagger-test-user:
 *   get:
 *     summary: Set the user to 'test user'
 *     tags: [Test User]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               Test User signed in
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             example:
 *               A user is already signed in. Current user must sign out first.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               Test user already signed in  
 */
app.get('/swagger-test-user', (req, res) => {
    // Only set authenticatedUser to 'test user' if another user not currently signed in.
    if (!authenticatedUser) {
        authenticatedUser = {
            id: 41,
            first_name: 'Test',
            last_name: 'Test',
            email: 'test@test.com',
            uid: 'k8Hjl8AX4CaLYBTE6IAXV5yMNZv2'
        }
        res.status(200).json("Test User signed in");
    }
    else if (authenticatedUser.email !== "test@test.com") {
        res.status(403).json("A user is already signed in. Current user must sign out first");
    }
    else {
        res.status(400).json("Test user already signed in");
    }
});

// Var used to set the request object's 'user' property
let authenticatedUser;

// Set the request object's 'user' property
app.use(function (req, res, next) {
    req.user = authenticatedUser;
    next();
});

// Root page
app.get("/", function (req, res) {
    res.status(200).json("test");
});

// Require in the routers:
const usersRouter = require("./services/routes/users.js");
const registerRouter = require("./services/routes/register.js");
const productsRouter = require("./services/routes/products.js");
const cartRouter = require("./services/routes/cart.js");
const ordersRouter = require("./services/routes/orders.js");
const checkoutRouter = require("./services/routes/checkout.js");
const accountRouter = require("./services/routes/account.js");
// const firebaseAuthRouter = require("./services/routes/firebase-auth.js");
app.use(usersRouter, registerRouter, productsRouter, cartRouter, ordersRouter, checkoutRouter, accountRouter);

// The port which the app will run on
const PORT = process.env.PORT || 8080;

// Start the server listening at PORT
app.listen(PORT, () => {
    console.log(`server is listening on ${PORT}`);
});

