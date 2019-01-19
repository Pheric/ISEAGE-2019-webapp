let argon = require("argon2");
let hm = require("hashmap");

// acct number | secret (type string)
let sessionMap = new hm.HashMap();

module.exports = {
    // returns true if the user is logged in according to session cookies
    isUserLoggedIn(req) {
        let username = req.cookies.username, secret = req.cookies.secret;
        return username !== undefined && secret !== undefined && isValidInSessionMap(username, secret)
    },
    // sets cookies and adds user to the session map
    logInUser(username, res) {
        if (username === undefined) return false;

        argon2.generateSalt().then(salt => {
            global.logger.info("Setting session for user " + username);
            sessionMap.set(username, salt);
            res.cookie("secret", salt, { maxAge: 1000 * 60 * 10 /* 10 minutes */, httpOnly: true })
        });

        return true;
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
    if (sessionMap.has(username)) {
        if (sessionMap.get(username) !== secret) {
            // Delete the user from the session list to prevent attackers from stealing the session
            sessionMap.delete(username);
            return false;
        }
        return true;
    }
    return false;
}