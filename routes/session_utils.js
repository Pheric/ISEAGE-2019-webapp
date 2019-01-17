let argon = require("argon2");
let hashmap = require("hashmap");

// acct number | secret
let sessions = new HashMap();

function handleLoggedIn (req) {
    logger.info("handleLoggedIn() called with parameter " + req);
}

function hashPassword (password) {
    // TODO
    argon.hash(password).then(hash => {
        logger.info("Calling hashPassword(" + password + "): " + hashed);
    });
    return password;
}