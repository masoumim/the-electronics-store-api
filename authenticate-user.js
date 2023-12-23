// Require in the requests module
const requests = require("./services/requests.js");

// Authenticates user by finding user in db w/ matching uid
async function authenticateUser(uid) {
    const user = await requests.getUserByUID(uid);
    return user;
}

module.exports = authenticateUser