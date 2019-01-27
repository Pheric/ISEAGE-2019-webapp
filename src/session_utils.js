let argon = require("argon2");
let hm = require("hashmap");
let uuid = require('uuid/v4');

// acct number | secret (type string)
let sessionMap = new hm.HashMap();
let admins = [];

let funcs = {
    // returns true if the user is logged in according to session cookies
    isUserLoggedIn(username, secret) {
        return username !== undefined && secret !== undefined && isValidInSessionMap(username, secret)
    },
    // sets cookies and adds user to the session map
    logInUser(username, admin, res) {
        global.logger.info(`logInUser(): Setting session for user ${username}`);
        let salt = uuid();
        sessionMap.set(username, salt);
        res.cookie("username", username, { maxAge: 1000 * 60 * 20 /* 20 minutes */});
        res.cookie("secret", salt, { maxAge: 1000 * 60 * 10 /* 10 minutes */, httpOnly: true });

        if (admin) admins.push(username);
    },
    hashPassword(password, salt = "") {
        // TODO
        argon.hash(password, salt).then(hash => {
            global.logger.info("Calling hashPassword(" + password + "): " + hash);
        });
        return password;
    },
    genSalt() {
        return uuid();
    },
    checkLogin(password, secret, salt) {
        return argon.verify(secret, password + salt);
    },
    checkLoggedIn(req, res, next) {
        if(!funcs.isUserLoggedIn(req.cookies.username, req.cookies.secret)){
            res.redirect('/login');
        } else {
            next();
        }
    },
    checkAdmin(req, res, next) {
        if (req.cookies.username !== undefined && admins.includes(req.cookies.username)) {
            next();
        } else {
            res.status(403);
            res.render("error.html", {error: "403 unauthorized"})
        }
    },
    logoutUser(res) {
        res.cookie("username", "", {maxAge: 1});
        res.cookie("secret", "", {maxAge: 1});
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