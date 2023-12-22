// Require in the express module
const express = require("express");

// Require in the Firebase Admin SDK Auth instance
const auth = require('firebase-admin/auth');

// Require in the Firebase Admin module
const admin = require("firebase-admin");

// Get the service account config info
const serviceAccount = require('../../firebase-admin-config.js');

// Initialize the Admin SDK using the service account config info
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Create a router
const router = express.Router();

// Export the router
module.exports = router

// Receive a token ID from the front end and use it to decode
// a UID belonging to the currently signed in user
router.post('/firebase-auth', async (req, res) => { 
    // idToken comes from the client app
    auth.getAuth()
        .verifyIdToken(req.body.idToken)
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