module.exports = function (req, res, next) {
    if (!req.cookies.cdc_session) {
        res.cookie('last_activity', new Date().getTime());
    } else {
        res.cookie('last_activity', new Date().getTime())
    }
    next();
};