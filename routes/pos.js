var express = require('express');
const router = express.Router();
const as = require('../src/aerospike');


router.get('/balance/:acct/:pin', function (req, res, next) {
    let acct = req.params.acct;
    let pin = req.params.pin;
    as.getAccount(acct, function (err, dat) {
        if(err) {
            if (err.code === require('aerospike').status.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
                res.json({"error": `Invalid account number ${acct}`});
            } else {
                res.json({"error": `Internal database error`});
            }
        } else if (dat.pin != pin) {
            res.json({"error": `invalid pin for account number ${acct}`});
        } else {
            delete dat["pin"];
            delete dat["owner"];
            delete dat["account"];
            dat.balance = dat.amount;
            res.json(dat);
        }
    });
});
router.get("/balance/all", function (req, res, nexr) {
    // TODO Check API key
    let s = {};
    s.recieved = req.body;
    s.message = "Your balances, comrade";
    s.balances = [];
    as.getAllAccounts(function (err, all) {
        for (i of Object.keys(all)){
            s.balances.push({
                balance: all[i].bins.amount,
                account_number: i
            })

        }
        res.json(s)
    })
});
router.post('/add', function (req, res, next) {
    let s = {};
    s.recieved = req.body;
    s.expected = require('../samples/pos_add');
    s.message = "This is the add/subtract balance endpoint.";
    as.addTransaction("add", req.body, function (err, result) {
        if (err){
            res.status(418);
            s.success = false;
            s.error = err;
            res.json(s)
        } else{
            res.status(201);
            s.success = true;
            res.json(s)
        }
    })
});
router.post('/transfer', function (req, res, next) {
    let s = {};
    s.recieved = req.body;
    s.expected = require('../samples/pos_transfer');
    s.message = "This is the transfer balance endpoint.";
    as.addTransaction("transfer", req.body, function (err, result) {
        if (err ){
            res.status(418);
            s.success = false;
            s.error = err;
            res.json(s)
        } else{
            res.status(201);
            s.success = true;
            res.json(s)
        }
    })
});
router.put('/transfer', function (req, res, next) {
    let s = {};
    s.recieved = req.body;
    s.expected = require('../samples/pos_transfer');
    s.message = "This is the transfer balance endpoint.";
    as.addTransaction("transfer", req.body, function (err, result) {
        if (err ){
            res.status(418);
            s.success = false;
            s.error = err;
            res.json(s)
        } else{
            res.status(201);
            s.success = true;
            res.json(s)
        }
    })
});


module.exports = router;