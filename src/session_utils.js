let argon = require("argon2");
let hm = require("hashmap");

// acct number | secret
let sessionMap = new hm.HashMap();

module.exports = {
    isUserLoggedIn(req) {
        logger.info("handleLoggedIn() called with parameter " + req);

        let username = req.cookies.username, secret = req.cookies.secret;
        return username && secret && isValidInSessionMap(username, secret)
    },
    hashPassword(password, salt = "") {
        // TODO
        argon.hash(password, salt).then(hash => {
            logger.info("Calling hashPassword(" + password + "): " + hash + "; TYPE: " + typeof hash);
        });
        return password;
    }
};

function isValidInSessionMap(username, secret) {
    return sessionMap.has(username) && sessionMap.get(username) === secret;
}