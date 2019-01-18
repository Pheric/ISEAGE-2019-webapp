var express = require('express');
var router = express.Router();
let aerospike = require('../src/aerospike');
let sessionUtils = require('../src/session_utils.js');


router.get('/', function (req, res, next) {
    logger.info("Logging in user, running isUserLoggedIn(): " + sessionUtils.isUserLoggedIn(req));

    if (sessionUtils.isUserLoggedIn(req)) {
        res.redirect('/admin');
    } else {
        res.render('login.html', {settings: settings})
    }
    /*if(req.cookies.logged_in == "true"){
        res.redirect('/admin')
    } else {
        res.render('login.html', {settings: settings})
    }*/
});
router.post('/', function (req,res,next) {
   //TODO Add database checks
    aerospike.getUser(req.body.uname, function (result) {
        if(result.bins.pass == req.body.pass){
            if (!sessionUtils.logInUser(req, res)) {
                global.logger.info("Error while logging in user's session; inputted username must be undefined");
            } else {
                // res.cookie("logged_in", true);
                // req.cookies.logged_in = true;

                res.redirect('/admin');
                return;
            }
        }

        res.render('login.html', {settings: settings, failed: true})
    });

});

module.exports = router;