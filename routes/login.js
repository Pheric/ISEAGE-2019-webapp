var express = require('express');
var router = express.Router();
let aerospike = require('../src/aerospike');
let sessionUtils = require('../src/session_utils.js');
let aero = require('aerospike');


router.get('/', function (req, res, next) {
    if (sessionUtils.isUserLoggedIn(req.cookies.username, req.cookies.secret)) {
        global.logger.info("/login get: User already logged in");
        res.redirect('/admin');
    } else {
        global.logger.info("/login get: User not logged in");
        res.render('login.html', {settings: settings})
    }
});
router.post('/', function (req,res,next) {
    if (sessionUtils.isUserLoggedIn(req.cookies.username, req.cookies.secret)) {
        global.logger.info("/login post: user already logged in");
        res.redirect('/admin');
        return;
    }

    res.status(401);

    if (req.body.uname !== undefined && req.body.pass !== undefined) {
        //TODO Add database checks
        aerospike.getUser(req.body.uname, function (err, result) {
            if (aero.status.AEROSPIKE_ERR_RECORD_NOT_FOUND == err.code) {
                res.render('login.html', {settings: settings, failed: true})
                return;
            }
            if(sessionUtils.checkLogin(req.body.uname, req.body.pass, result.bins.pass, result.bins.salt)){ // result.bins.pass === req.body.pass
                sessionUtils.logInUser(req.body.uname, result.admin, res);

                global.logger.info("/login post: user logged in, redir /admin");
                res.redirect('/admin');
            } else {
                global.logger.info("/login post: user login failed: bad password");
                res.render('login.html', {settings: settings, failed: true})
            }
        });
    } else {
        global.logger.info("/login post: user login failed: undefined username or password");
        res.render('login.html', {settings: settings, failed: true})
    }
});

module.exports = router;