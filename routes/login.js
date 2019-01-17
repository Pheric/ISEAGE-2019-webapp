var express = require('express');
var router = express.Router();
let aerospike = require('../src/aerospike');


router.get('/', function (req, res, next) {
    if(req.cookies.logged_in == "true"){
        res.redirect('/admin')
    } else {
        res.render('login.html', {settings: settings})
    }
});
router.post('/', function (req,res,next) {
   //TODO Add database checks
    aerospike.getUser(req.body.uname, function (result) {
        if(result.bins.pass == req.body.pass){
            res.cookie("logged_in", true);
            req.cookies.logged_in = true;
            res.redirect('/admin')
        } else {
            res.render('login.html', {settings: settings, failed: true})
        }
    });

});

module.exports = router;