let express = require('express');
let router = express.Router();
let as = require('../src/aerospike');


router.get('/aerospike', function (req, res, next) {
    // No database tests for you, comrades
    //as.test();
    res.redirect('/')
});

module.exports = router;