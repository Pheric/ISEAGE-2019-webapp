let express = require('express');
let router = express.Router();
let as = require('../src/aerospike');

router.get('/num/:account_number', async function (req, res, next) {
    try {
        let data = await as.getAccount(req.params.account_number);
        res.render("account.html", {account: data})
    } catch (e) {
        res.render("error.html", {error: e})
    }
});
router.post('/num/:account_number', async function (req, res, next) {
    try {
        let data = await as.getAccount(req.params.account_number);
        res.render("account.html", {account: data})
    } catch (e) {
        res.render("error.html", {error: e})
    }
});
router.get('/', function (req, res, next) {
    as.getAllAccounts(function (err, all) {
        if(err){
            res.send(err);
        }else{
            res.json({all: all})
        }
    })
});

module.exports = router;