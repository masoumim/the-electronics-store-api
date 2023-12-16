// services/routes/middleware/get-checkout.js - This file contains a middleware to check if a checkout session exists. If so, it is attached to the request object

// Require in the requests module
const requests = require("../../requests.js");

async function getCheckout(req, res, next){    
    // Get the checkout session from the db
    const foundCheckout = await requests.getCheckout(req.user.id);

    // Check if checkout session is found
    if(!foundCheckout) return res.status(404).json("Checkout session not found");
    
    // Attach checkout session to request object
    req.checkout = foundCheckout;

    // Pass control to the next middleware function
    next();
}

module.exports = getCheckout