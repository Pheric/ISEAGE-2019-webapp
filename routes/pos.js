var express = require('express');
const router = express.Router();
const as = require('../src/aerospike');
const aeroStat = require('aerospike').status;


router.get('/balance/:acct/:pin', function (req, res, next) {
    let acct = req.params.acct;
    let pin = req.params.pin;
    as.getAccount(acct, function (err, dat) {
        if(err) {
            if (err.code === aeroStat.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
                res.json({"error": `Invalid account number ${acct}`});
            } else {
                res.json({"error": `Internal database error`});
            }
        } else if (dat.pin != pin) {
            res.json({"error": `invalid pin for account number ${acct}`});
        } else {
            delete dat["pin"];
            delete dat["owner"];
            dat.balance = dat.amount;
            delete dat["amount"];
            res.json(dat);
        }
    });
});
router.get("/balance/all", function (req, res, nexr) {
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

    let required_data = ['account_number', 'amount', 'pin'];
    let ok = true;
    for (let i = 0; i < required_data.length; i++) {
        if (req.body[required_data[i]] === undefined) {
            ok = false;
            break;
        }
    }
    if (!ok) {
        res.status(400);
        s.success = false;
        s.message = "missing required information!";
        res.json(s);
    }
    as.getAccount(req.body.account_number, function (err, dat) {
        if(err) {
            if (err.code === aeroStat.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
                res.json({"error": `Invalid account number ${acct}`});
            } else {
                res.json({"error": `Internal database error`});
            }
        } else if (dat.pin != req.body.pin) {
            res.json({"error": `invalid pin for account number ${acct}`});
        }
    });

    s.recieved = req.body;
    //s.expected = require('../samples/pos_add');
    s.message = "This is the add/subtract balance endpoint.";
    as.addTransaction("add", req.body, function (err) {
        if (err){
            res.status(400);
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

    let required_data = ['account_number', 'amount', 'pin', 'destination'];
    let ok = true;
    for (let i = 0; i < required_data.length; i++) {
        if (req.body[required_data[i]] === undefined) {
            ok = false;
            break;
        }
    }
    if (!ok || req.body.destination.account_number === undefined || req.body.destination.branch === undefined) {
        res.status(400);
        s.success = false;
        s.message = "missing required information!";
        res.json(s);
    }
    let pinCode = as.checkAccountPin(req.body.account_number, req.body.pin);
    if (pinCode !== 1) {
        res.status(401);
        s.success = false;
        s.message = `invalid pin: error: code ${pinCode}`;
        res.json(s);
        return;
    }

    s.recieved = req.body;
    //s.expected = require('../samples/pos_transfer');
    s.message = "This is the transfer balance endpoint.";
    as.addTransaction("transfer", req.body, function (err, result) {
        if (err){
            res.status(400);
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

    let required_data = ['account_number', 'amount', 'pin', 'destination'];
    let ok = true;
    for (let i = 0; i < required_data.length; i++) {
        if (req.body[required_data[i]] === undefined) {
            ok = false;
            break;
        }
    }
    if (!ok || req.body.destination.account_number === undefined || req.body.destination.branch === undefined) {
        res.status(400);
        s.success = false;
        s.message = "missing required information!";
        res.json(s);
    }
    as.getAccount(req.body.account_number, function (err, dat) {
        if(err) {
            if (err.code === aeroStat.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
                res.json({"error": `Invalid account number ${acct}`});
            } else {
                res.json({"error": `Internal database error`});
            }
        } else if (dat.pin != req.body.pin) {
            res.json({"error": `invalid pin for account number ${acct}`});
        }
    });


    s.recieved = req.body;
    //s.expected = require('../samples/pos_transfer');
    s.message = "This is the transfer balance endpoint.";
    as.addTransaction("transfer", req.body, function (err, result) {
        if (err){
            res.status(400);
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