var express = require('express');
var router = express.Router();
let as = require('../src/aerospike');
let sessionUtils = require('../src/session_utils.js');


router.get('/', function (req,res,next) {
    if(!sessionUtils.isUserLoggedIn(req)){
        res.redirect('/login');
        return;
    }

    res.render("admin.html", {settings: settings});
});
router.get('/newAccount', function (req, res, next) {
    if(!sessionUtils.isUserLoggedIn(req)){
        res.redirect('/login');
        return;
    }

    res.render('newAccount.html', {settings: settings})
});
router.post('/newAccount', function (req, res, next) {
    if(!sessionUtils.isUserLoggedIn(req)){
        res.redirect('/login');
        return;
    }

    as.newAccount(req.body.account_number, req.body.owner, req.body.bal, req.body.pin);
    res.redirect("/account/num/" + req.body.account_number.toString())
});
router.get('/add', function (req, res, next) {
    if(!sessionUtils.isUserLoggedIn(req)){
        res.redirect('/login');
        return;
    }

    res.render('add.html',{settings: settings})
});
router.post('/add', function (req, res, next) {
    if(!sessionUtils.isUserLoggedIn(req)){
        res.redirect('/login');
        return;
    }

    as.addTransaction("add", req.body, function (err, result) {
        if (err){throw err}
        else {
            res.redirect('/account/num/'+req.body.account_number)
        }
    })
});
router.get('/transfer', function (req, res, next) {
    if(!sessionUtils.isUserLoggedIn(req)){
        res.redirect('/login');
        return;
    }

    res.render('transfer.html', {settings: settings})
});
router.post('/transfer', function (req, res, next) {
    if(!sessionUtils.isUserLoggedIn(req)){
        res.redirect('/login');
        return;
    }

    req.body.destination={account_number: req.body.dacct, branch: req.body.dbranch};
    as.addTransaction("transfer", req.body, function (err, result) {
        if (err){throw err}
        else {
            res.redirect('/account/num/'+req.body.account_number)
        }
    })
});

module.exports = router;