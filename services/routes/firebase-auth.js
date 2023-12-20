// Require in the express module
const express = require("express");

// Require in the Firebase Admin SDK Auth instance
const auth = require('firebase-admin/auth');

var admin = require("firebase-admin");

var serviceAccount = require('../../firebase-admin-config.js');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Create a router
const router = express.Router();

// Export the router
module.exports = router

router.post('/firebase-auth', async (req, res) => { 
    // idToken comes from the client app
    auth.getAuth()
        .verifyIdToken(req.body.tokenId)
        .then((decodedToken) => {            
            const uid = decodedToken.uid;
            // TODO: Use the UID to authenticate a user 
            res.status(200).json("Token Received");
        })
        .catch((error) => {
            console.log(error);
            res.json(error);
        });
});