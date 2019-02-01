var express = require('express');
var router = express.Router();
let as = require('../src/aerospike');


router.get('/', function (req,res,next) {
    res.render("admin.html", {settings: settings});
});
router.get('/newAccount', function (req, res, next) {
    res.render('newAccount.html', {settings: settings})
});
router.post('/newAccount', async function (req, res, next) {
    if (req.body.account_number === undefined || req.body.owner === undefined || req.body.bal === undefined || req.body.pin === undefined ) {
        res.render('error.html', {error: "one or more of the required fields is undefined!"})
    } else {
        try {
            await as.newAccount(req.body.account_number, req.body.owner, req.body.bal, req.body.pin);
            res.redirect("/account/num/" + req.body.account_number.toString());
            global.logger.info(`Account created, redir /account/num/${req.body.account_number} `)
        } catch (e) {
            res.render('error.html', {error: "account creation failed. Does this account already exist?"})
        }
    }
});
router.get('/add', function (req, res, next) {
    res.render('add.html',{settings: settings})
});
router.post('/add', function (req, res, next) {
    as.addTransaction("add", req.body, function (err, result) {
        if (err){throw err}
        else {
            res.redirect('/account/num/'+req.body.account_number)
        }
    })
});
router.get('/transfer', function (req, res, next) {
    res.render('transfer.html', {settings: settings})
});
router.post('/transfer', function (req, res, next) {
    req.body.destination={account_number: req.body.dacct, branch: req.body.dbranch};
    as.addTransaction("transfer", req.body, function (err, result) {
        if (err){throw err}
        else {
            res.redirect('/account/num/'+req.body.account_number)
        }
    })
});

module.exports = router;