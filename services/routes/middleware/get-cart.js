// services/routes/middleware/get-cart.js - This file contains a middleware that attaches the user's cart to the request object

// Require in the requests module
const requests = require("../../requests.js");

async function getCart(req, res, next){
    // Get cart from the db
    const cart = await requests.getCartByUserId(req.user.id);

    // Attach cart to request object
    req.cart = cart;

    // Pass control to the next middleware function
    next();
}

module.exports = getCart