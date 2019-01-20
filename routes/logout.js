var express = require('express');
var router = express.Router();
let sessionUtils = require('../src/session_utils.js');

router.use('/', function (req,res,next) {
    sessionUtils.logoutUser(res);
    res.redirect('/');
});

module.exports = router;