var schedule = require('node-schedule');
var as = require("./aerospike");

module.exports.job = schedule.scheduleJob('* * * * *', function () {
    as.syn();  // No relation to Mr. Gates
});

module.exports.precomp = schedule.scheduleJob('55 7 2 2 *', function () {
    as.precomp()
});