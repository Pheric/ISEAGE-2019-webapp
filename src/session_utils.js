let argon = require("argon2");
let hm = require("hashmap");
let uuid = require('uuid/v4');

// acct number | secret (type string)
let sessionMap = new hm.HashMap();

let funcs = {
    // returns true if the user is logged in according to session cookies
    isUserLoggedIn(username, secret) {
        return username !== undefined && secret !== undefined && isValidInSessionMap(username, secret)
    },
    // sets cookies and adds user to the session map
    logInUser(username, res) {
        global.logger.info(`logInUser(): Setting session for user ${username}`);
        let salt = uuid();
        sessionMap.set(username, salt);
        res.cookie("username", username, { maxAge: 1000 * 60 * 20 /* 20 minutes */});
        res.cookie("secret", salt, { maxAge: 1000 * 60 * 10 /* 10 minutes */, httpOnly: true });
    },
    hashPassword(password, salt = "") {
        // TODO
        argon.hash(password, salt).then(hash => {
            global.logger.info("Calling hashPassword(" + password + "): " + hash);
        });
        return password;
    },
    checkLogin(req, res, next) {
        if(!funcs.isUserLoggedIn(req.cookies.username, req.cookies.secret)){
            res.redirect('/login');
        } else {
            next();
        }
    }
};

module.exports = funcs;

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