let argon = require("argon2");
let hm = require("hashmap");

// acct number | secret (type string)
let sessionMap = new hm.HashMap();

module.exports = {
    isUserLoggedIn(req) {
        let username = req.cookies.username, secret = req.cookies.secret;
        logger.info("isUserLoggedIn() called. Cookies: username: " + username + " secret: " + secret + " isValidInSessionmap(): " + isValidInSessionMap(username, secret));
        return username && secret && isValidInSessionMap(username, secret)
    },
    hashPassword(password, salt = "") {
        // TODO
        argon.hash(password, salt).then(hash => {
            logger.info("Calling hashPassword(" + password + "): " + hash);
        });
        return password;
    }
};

function isValidInSessionMap(username, secret) {
    return sessionMap.has(username) && sessionMap.get(username) === secret;
}