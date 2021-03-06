global.settings = require('./settings');
global.as_settings = require('./as_settings');
let winston = require('winston');
global.logger = winston.createLogger({
    level: 'silly',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: './logs/error.log', level: 'error'}),
        new winston.transports.File({filename: './logs/combined.log'})
    ]
});
var createError = require('http-errors');
var express = require('express');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var app_logger = require('morgan');
const nunjucks = require("nunjucks");
let fs = require('fs');
let as = require('./src/aerospike');
require('ip_serializer');
app.use('/truncate', as.truncate);
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    }));
}

let njenv = new nunjucks.Environment(new nunjucks.FileSystemLoader('views', {watch:true}), {
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true
});
njenv.addGlobal("settings", settings)
    .express(app);

var logStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'}); //TODO this needs pointed to /var/log
app.use(app_logger('common', {stream: logStream}));
app.use(app_logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
let init = require("./src/init_session");
app.use(init);

let sessionUtils = require('./src/session_utils.js');

app.use(express.static(path.join(__dirname, '/public')));
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
let search_router = require('./routes/search');
let api_router = require("./routes/api");
app.use('/', indexRouter);
app.use('/search', search_router.search());
app.use('/users', usersRouter);
app.use('/api', api_router);
app.use('/test', require('./routes/test'));
app.use('/admin', sessionUtils.checkLoggedIn, sessionUtils.checkAdmin, require("./routes/admin"));
app.use('/login', require("./routes/login"));
app.use('/careers', require("./routes/now_hiring"));
app.use('/schedule', require('./routes/sched'));
app.use('/account', sessionUtils.checkLoggedIn, sessionUtils.checkAdmin, require('./routes/account'));
app.use('/about', require('./routes/about'));
//app.use('/settings', require('./routes/settings'));
app.use('/logout', require('./routes/logout.js'));

// 400 error
app.use(function (req, res, next) {
    res.status(404);
    res.render('error.html', { settings: settings, error: "404, page not found" })
});
app.use(function (err, req, res, next) {
    //res.locals.message = err.message;
    //res.locals.error = err;
    logger.error(`app.js 500 series error: ${err}`);
    logger.error(`app.js 500 series error contd: ${JSON.stringify({
        level:err.level,
        message: err.message,
        stack: err.stack
    }, null, 4)}`);

    res.status(err.status || 500);
    res.render('error.html', {
        settings: settings,
        error: "An error occurred. Try again later."
    });
});

module.exports = app;