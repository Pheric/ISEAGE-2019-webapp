let express = require('express');
let router = express.Router();
let as = require('../src/aerospike');


router.post('/', function (req, res, next) {
    as.addComment(function () {
        res.redirect('/about/'+req.body.set)
    }, req.body.set === "propaganda" ? "propaganda" : "comments", req.body)
});

router.get('/:set?', function (req, res, next) {
    as.getComments(function (err, all) {
        let comments = new Map();
        for(i of all)
            comments.set(i.bins.uname, i.bins.comment);
        res.render('about.html', {settings: settings, comments: comments})
    }, req.params.set && req.params.set === "comments" ? "comments" : "propaganda")
});


module.exports=router;