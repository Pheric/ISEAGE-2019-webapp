let argon = require("argon2");
let hm = require("hashmap");

// acct number | secret (type string)
let sessionMap = new hm.HashMap();

module.exports = {
    isUserLoggedIn(req) {
        let username = req.cookies.username, secret = req.cookies.secret;
        global.logger.info("isUserLoggedIn() called.");
        return username !== undefined && secret !== undefined && isValidInSessionMap(username, secret)
    },
    hashPassword(password, salt = "") {
        // TODO
        argon.hash(password, salt).then(hash => {
            global.logger.info("Calling hashPassword(" + password + "): " + hash);
        });
        return password;
    }
};

function isValidInSessionMap(username, secret) {
    return sessionMap.has(username) && sessionMap.get(username) === secret;
}