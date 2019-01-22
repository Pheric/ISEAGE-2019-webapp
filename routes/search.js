var express = require('express');
var router = express.Router();
var unique = require('array-unique');

router.post('/', function (req, res, next) {
    searchReturn(req.body.search_terms, res);
});
router.get('/:url_search_term', function (req, res, next) {
    searchReturn(req.params.url_search_term, res);
});
router.get('/:url_search_term/', function (req, res, next) {
    searchReturn(req.params.url_search_term, res);
});
router.get('/', function (req, res, next) {
    throw {status: 200, message: "Boris can't search for nothing comrade"}
});

function searchReturn(terms, res) {
    if (!terms) {
        throw {status: 200, message: "Boris can't search for nothing comrade"};
    }

    quick_search(terms, (results) => {
        res.render('search.html', {settings: settings, results: results});
    })
}

function quick_search(query, callback) {
    var results = [];
    query = query.split(/[ ,]/);
    for (word of query) {
        switch (word.toLowerCase()) {
            case "api":
                results.push({text: "API References", link: "/api"});
                break;
            case "login":
                results.push({text: "Login page", link: "/login"});
                break;
            case "about":
                results.push({text: "More information", link: "/about"});
                break;
            case "logout":
                results.push({text: "Logout page", link: "/logout"});
                break;
            case "transfer":
                results.push({text: "Transfer funds", link: "/admin/transfer"});
                break;
            case "create":
                results.push({text: "Create a new account", link: "/admin/create"});
                break;
            case "deposit":
            case "withdraw":
            case "cash":
                results.push({text: "Add/Withdraw funds", link: "/admin/add"});
                break;
            case "account":
                results.push({test: "Account details", link:'account/num/1'});
                break;
            case "reserve":
                results.push({text: "Branch reserve details", link: 'account/num/0'});
                break;
            case "admin":
                results.push({text: "Admin page", link: "/admin"});
                break;
        }
    }
    if (results.length > 0) {
        callback(unique(results));
    } else {
        callback(null)
    }
}

module.exports = router;