let argon = require("argon2");
let hm = require("hashmap");

// acct number | secret
let sessionMap = new hm.HashMap();

module.exports = {
    handleLoggedIn(req) {
        logger.info("handleLoggedIn() called with parameter " + req);
    },
    hashPassword(password) {
        // TODO
        argon.hash(password).then(hash => {
            logger.info("Calling hashPassword(" + password + "): " + hashed);
        });
        return password;
    }
};