var express = require('express');
var router = express.Router();
let aerospike = require('../src/aerospike');
let sessionUtils = require('../src/session_utils.js');


router.get('/', function (req, res, next) {
    if (sessionUtils.isUserLoggedIn(req.cookies.username, req.cookies.secret)) {
        global.logger.info("/login get: User logged in");
        res.redirect('/admin');
    } else {
        global.logger.info("/login get: User not logged in");
        res.render('login.html', {settings: settings})
    }
    /*if(req.cookies.logged_in == "true"){
        res.redirect('/admin')
    } else {
        res.render('login.html', {settings: settings})
    }*/
});
router.post('/', function (req,res,next) {
    if (req.body.uname !== undefined && req.body.pass !== undefined) {
        if (sessionUtils.isUserLoggedIn(req.cookies.username, req.cookies.secret)) {
            global.logger.info("/login post: user already logged in");
            res.redirect('/admin');
            return;
        }

        //TODO Add database checks
        aerospike.getUser(req.body.uname, function (result) {
            if(result.bins.pass === req.body.pass){
                if (!sessionUtils.logInUser(req.body.uname, res)) {
                    global.logger.info("Error while logging in user's session; inputted username is undefined");
                } else {
                    // res.cookie("logged_in", true);
                    // req.cookies.logged_in = true;

                    global.logger.info("/login post: user logged in");
                    res.redirect('/admin');
                    return;
                }
            }

            // Keep here, the db call is async
            global.logger.info("/login post: user login failed");
            res.render('login.html', {settings: settings, failed: true})
        });
    }
});

module.exports = router;