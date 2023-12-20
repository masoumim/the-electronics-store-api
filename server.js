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
const originURL = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://electronics-store-8382b35f5fca.herokuapp.com";
app.use(
    cors({
        origin: originURL,
        credentials: true,
        allowedHeaders: "Content-Type, Authorization"
    })
);

// Request in the pg module used for connecting to PostgreSQL databases
const { Pool } = require('pg');

// Require in the Passport.JS - used for Authentication
const passport = require("passport");

// Import the Passport config
require("./services/passport.js");

// Require in express-session to enable session support
const session = require("express-session");

// pgSession is used to store a users session in a postgreSQL db
const pgSession = require('connect-pg-simple')(session);

// Enables body parsing
app.use(express.json());

// Enables body parsing of HTML form data
app.use(express.urlencoded({ extended: false }));

// Create a new PostgreSQL pool to be used for the sessions table
const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.enable("trust proxy");

if (process.env.NODE_ENV === "development") {
    // Configure the session options
    app.use(
        session({
            secret: process.env.SESSION_SECRET,
            cookie: { maxAge: 300000000, secure: "auto" },
            resave: false,
            saveUninitialized: false,
            store: new pgSession({
                pool: pgPool,                // Connection pool
                tableName: 'session'         // Table used to store user's session data           
            })
        })
    );
}
else {
    app.use(
        session({
            secret: process.env.SESSION_SECRET,
            cookie: { maxAge: 300000000, secure: true, httpOnly: true, sameSite: "none" },
            store: new pgSession({
                pool: pgPool,                // Connection pool
                tableName: 'session'         // Table used to store user's session data           
            })
        })
    );
}

// Passport.JS is a middleware and must be implemented using app.use(). 
// The initialize() method initializes the authentication module across our app.
app.use(passport.initialize());

/*
We want to allow for persistent logins, and we can do this by calling session() on our passport module
The session() middleware alters the request object and is able to attach 
a ‘user’ value that can be retrieved from the session id.
*/
app.use(passport.session());

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
                url: "http://localhost:8080",
            },
        ],
    },
    apis: ["./services/routes/*.js"],
};

// Use the swaggerJsdoc function to scan through the options passed in as a param and return the converted Swagger specification object.
const specs = swaggerJsdoc(options);

// Serve the interactive SwaggerUI API documentation at '/api-docs'
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Server the Swagger API documentation as JSON
app.get('/swagger.json', function(req, res) {    
    res.send(specs);
  });

app.get("/", function (req, res) {
    res.status(200).json("test");
});

// Require in the routers:
const usersRouter = require("./services/routes/users.js");
const registerRouter = require("./services/routes/register.js");
const loginRouter = require("./services/routes/login.js");
const logoutRouter = require("./services/routes/logout.js");
const productsRouter = require("./services/routes/products.js");
const cartRouter = require("./services/routes/cart.js");
const ordersRouter = require("./services/routes/orders.js");
const checkoutRouter = require("./services/routes/checkout.js");
const accountRouter = require("./services/routes/account.js");
const firebaseAuthRouter = require("./services/routes/firebase-auth.js");
app.use(usersRouter, registerRouter, loginRouter, logoutRouter, productsRouter, cartRouter, ordersRouter, checkoutRouter, accountRouter, firebaseAuthRouter);

// The port which the app will run on
const PORT = process.env.PORT || 8080;

// Start the server listening at PORT
app.listen(PORT, () => {
    console.log(`server is listening on ${PORT}`);
});