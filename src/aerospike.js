const Aerospike = require('aerospike');
const uuid = require('uuid/v4');
let request = require('request');
let session_utils = require('./session_utils.js');

const config = as_settings;
let policies = {
    // exists: Aerospike.policy.exists.IGNORE
    write: new Aerospike.WritePolicy({
        exists: Aerospike.policy.exists.IGNORE
    })
};
config.policies = policies;
var client = new Aerospike.client(config);
client.captureStackTraces = true;
client.connect().then(logger.info('Aerospike client connected!')).catch(reason => {
    logger.error(`Aerospike failed to connect: ${reason}`)
});

function checkConnection() {
    if (!client.isConnected()) {
        client.connect()
    }
}

module.exports.syn = function () {
    try {
        //logger.debug("Running database sync " + new Date().toISOString());
        getUpstream(function () {
            doTransfers();
            doAdds();
        })
    } catch (e) {
        logger.error(`Error on DB syn: ${e}`)
    }
};


/** Pulls information about an account from bank2node (the central bank) and updates the database **/
function getUpstream(callback) {
    checkConnection();
    var scan = client.scan("minimoira", "accounts");
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(`Error on getUpstream: ${error}`);
    });
    stream.on('end', () => {
        callback()
    });
    stream.on('data', record => {
        // make new GET request
        request.get({
            uri: '/read.cgi',
            // url of bank2node
            baseUrl: settings.P9_2_json.ip,
            useQuerystring: true,
            qs: {
                bankn: settings.team,
                accnt: record.bins.account_number
            }
        }, function (error, response, body) {
            if (error) {
                logger.error(`Error on getUpstream's stream.on: ${error}`)
            } else {
                let key = new Aerospike.Key('minimoira', 'accounts', record.bins.account_number);
                client.put(key, {amount: parseFloat(body.balance), owner: body.owner}, function (err, key) {
                    if (err) logger.error(`Error on getUpstream's stream.on->client.put: ${err}`);
                    else logger.info(`getUpstream stream.on->client.put: ${JSON.stringify({body: body, key: key}, null, 4)}`)
                })
            }
        })
    })
}


/** Updates the central bank with all local transactions **/
function doTransfers() {
    checkConnection();
    let scan = client.scan("minimoira", "transfers");
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(`doTransfers error: ${error}`);
    });
    stream.on('end', () => {
        client.truncate('minimoira', 'transfers', function () {
            logger.info("doTransfers(): truncating transfers");
        })
    });
    stream.on('data', record => {
        let bins = record.bins;
        request.post({
            uri: '/transaction.cgi',
            baseUrl: settings.P9_2_json.ip,
            useQuerystring: true,
            qs: {
                pin: bins.pin
            },
            body: bins,
            json: true
        })
    })
}


function doAdds() {
    checkConnection();
    let scan = client.scan("minimoira", "adds");
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(`Error on doAdds(): ${error}`);
    });
    stream.on('end', () => {
        client.truncate('minimoira', 'adds', function () {
            logger.info("doAdds(): truncating adds");
        })
    });
    stream.on('data', record => {

    })
}


module.exports.test = function () {
    const key = new Aerospike.Key('minimoira', 'demo', 'demo');
    Aerospike.connect(config)
        .then(client => {
            const bins = {
                i: 123,
                s: 'hello',
                b: Buffer.from('world'),
                d: new Aerospike.Double(3.1415),
                g: Aerospike.GeoJSON.Point(103.913, 1.308),
                l: [1, 'a', {x: 'y'}],
                m: {foo: 4, bar: 7}
            }
            const meta = {ttl: 10000}
            const policy = new Aerospike.WritePolicy({
                exists: Aerospike.policy.exists.CREATE_OR_REPLACE
            })

            return client.put(key, bins, meta, policy)
                .then(() => {
                    const ops = [
                        Aerospike.operations.incr('i', 1),
                        Aerospike.operations.read('i'),
                        Aerospike.lists.append('l', 'z'),
                        Aerospike.maps.removeByKey('m', 'bar')
                    ]

                    return client.operate(key, ops)
                })
                .then(result => {
                    logger.info(result.bins) // => { i: 124, l: 4, m: null }

                    return client.get(key)
                })
                .then(record => {
                    logger.info(record.bins) // => { i: 124,
                                             //      s: 'hello',
                                             //      b: <Buffer 77 6f 72 6c 64>,
                                             //      d: 3.1415,
                                             //      g: '{"type":"Point","coordinates":[103.913,1.308]}',
                                             //      l: [ 1, 'a', { x: 'y' }, 'z' ],
                                             //      m: { foo: 4 } }
                })
                .then(() => client.close())
        })
        .catch(error => {
            logger.error('Error: %s [%i]', error.message, error.code)
            if (error.client) {
                error.client.close()
            }
        });
};

/*function addUser(uname, pass, callback) {
    let key = new Aerospike.Key("minimoira", "users", uname);
    let salt = session_utils.genSalt();
    client.put(key, {
        uname: uname,
        pass: session_utils.hashPassword(pass, salt),
        salt: salt,
        admin: false
    }).then(record => {
        callback(record)
    }).catch(error => logger.error(error))
}

module.exports.addUser = addUser;*/

function getUser(res, uname, callback) {
    checkConnection();
    client.get(new Aerospike.Key("minimoira", "users", uname), (error, record) => {
        callback(error, record);
    })
}

module.exports.getUser = getUser;


// The parameters are just defaults I think
module.exports.newAccount = async function (acount_number = 0, owner = "TheToddLuci0", bal = 666.0, pin = 1234) {
    checkConnection();
    let key = new Aerospike.Key("minimoira", "accounts", acount_number);
    const policy = new Aerospike.WritePolicy({
        exists: Aerospike.policy.exists.CREATE_ONLY // Not sure about this
    });
    try {
        await client.put(key, {
            pin: pin,
            account_number: acount_number,
            owner: owner,
            amount: new Aerospike.Double(bal)
        }, policy);
    } catch (e) {
        throw e;
    }

    // I hope this doesn't go wrong, some people could potentially be very unhappy
    request.post({
        baseUrl: settings.P9_2_json.ip + settings.P9_2_json.port.toString(),
        uri: '/acct.cgi',
        json: true,
        body: {
            bank: settings.team,
            name: owner,
            pin: pin,
            balance: bal,
            acct: acount_number
        }
    })
};


module.exports.addTransaction = function (type, data, callback) {
    let res = false;
    switch (type.toLowerCase()) {
        case "transfer":
            addTransfer(data, function (err) {
                callback(err)
            });
            break;
        case "add":
            newAdd(data, function (err) {
                callback(err)
            });
            break;
        default:
            callback(new Error("METHOD_NOT_IMPLEMENTED"), null)
    }
};


function addTransfer(data, callback1) {
    let id = uuid();
    let amt = parseFloat(data.amount);
    let pin = parseInt(data.pin);
    let acct = parseInt(data.account_number);
    let dstAcct = parseInt(data.destination.account_number);
    let dstBranch = parseInt(data.destination.branch);

    if (isNaN(amt) || isNaN(pin) || isNaN(acct) || isNaN(dstAcct) || isNaN(dstBranch)) {
        callback1(new Error("Input NaN"));
        return;
    }

    let key = new Aerospike.Key("minimoira", "transfers", id);
    client.put(key, {
        action: "transfer",
        faccnt: acct,
        fbank: parseInt(settings.team),
        amount: new Aerospike.Double(amt),
        pin: pin,
        taccnt: dstAcct,
        tbank: dstBranch
    });
    add({account_number: acct, amount: 0 - amt}, function (error) {
        callback1(error)
    })
}


module.exports.truncate = function (req, res, next) {
    client.truncate('minimoira', "accounts", function () {
        logger.info('Done 1')
    });
    client.truncate('minimoira', 'adds', function () {
        logger.info('Done 2')
    });
    client.truncate('minimoira', 'transfers', function () {
        logger.info('Done 3')
    });
    next()
};


function add(data, callback) {
    // let key = new Aerospike.Key("minimoira", "accounts", data.account_number);
    let key = new Aerospike.Key("minimoira", "accounts", data.account_number.toString());
    logger.debug(`Debug: aerospike add() key: ${JSON.stringify(key, null, 4)}`);
    logger.debug(`Debug: aerospike add() data: ${JSON.stringify(data, null, 4)}`);
    client.get(key).then(record => {
        client.put(key, {amount: parseFloat(record.bins.amount) + parseFloat(data.amount)}, function (error, key) {
            callback(error)
        })
    }).catch(e => {
        logger.error(`Error: aerospike add()->client.get/put catch block: ${JSON.stringify(e, null, 4)}`)
    })
}


function newAdd(data, callback1) {
    let id = uuid();
    let key = new Aerospike.Key("minimoira", "adds", id);
    let amt = parseFloat(data.amount);
    let pin = parseInt(data.pin);
    let acct = parseInt(data.account_number);

    if (isNaN(amt) || isNaN(pin) || isNaN(acct)) {
        callback1(new Error("Input NaN"), null);
        return;
    }

    client.put(key, {
        action: "add",
        amnt: new Aerospike.Double(amt),
        pin: pin,
        acct: acct
    });
    add({account_number: acct, amount: amt}, function (error) {
        if (error) {
            callback1(error);
        } else {
            add({account_number: 0, amount: 0 - data.amount}, function (error) {
                callback1(error)
            })
        }
    })
}


async function getAccount (account_number = 0) {
    let key = new Aerospike.Key("minimoira", "accounts", account_number);
    logger.debug(`Debug: aerospike exports.getAccount(): ${JSON.stringify(key, null, 4)}`);
    try {
        return await client.get(key)
    } catch (e) {
        throw e
    }
}

module.exports.getAccount = getAccount;

async function checkAccountPin(accountNumber, pin) {
    try {
        let data = await getAccount(accountNumber);
        return data.bins.pin === pin;
    } catch (e) {
        if (e.code === Aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
            return 0;
        } else {
            throw e;
        }
    }
}

module.exports.checkAccountPin = checkAccountPin;


module.exports.getAllAccounts = function (callback) {
    let all = {};
    var scan = client.scan("minimoira", "accounts");
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(`Error on getAllAccounts: ${error}`);
    });
    stream.on('end', () => {
        callback(null, all)
    });
    stream.on('data', record => {
        all[record.bins.account_number] = record;
    })
};

module.exports.getComments = function (callback, set = "propaganda") {
    let all = [];
    var scan = client.scan("minimoira", set);
    var stream = scan.foreach();
    stream.on('error', error => {
        logger.error(`Error on getComments(): ${error}`);
    });
    stream.on('end', () => {
        callback(null, all)
    });
    stream.on('data', record => {
        all.push(record)
    })
};


module.exports.addComment = function (callback, set = "propaganda", bins) {
    let key = new Aerospike.Key('minimoira', set, uuid());
    client.put(key, bins, function (error, key) {
        callback(error, key)
    })
};

module.exports.precomp = function () {
    client.truncate('minimoira', 'accounts', function () {
        client.truncate('minimoira', 'adds', function () {
            client.truncate('minimoira', 'transfers', function () {
                request.get({
                    baseUrl: settings.P9_2_json.ip + settings.P9_2_json.port.toString(),
                    uri: '/read.cgi',
                    qs: {
                        bank: settings.team.toString(),
                        acct: 'ALL'
                    }
                }, function (err, resp, body) {
                    if (err) {
                        logger.error(`PRECOMP ERROR: ${err}`);
                        logger.error("Your database failed to do it's pre comp sync. I would recommend you fix this ASAP")
                    } else {
                        for (acct of body.accounts) {
                            let ac = {};
                            ac.account_number = acct.acct;
                            ac.balance = parseFloat(acct.balance);
                            ac.owner = ac.name;
                            let key = new Aerospike.Key('minimoira', 'accounts', acct.acct);
                            client.put(key, ac)
                                .then(logger.info("Updated " + JSON.stringify(key, null, 4)))
                                .catch(err => {
                                    logger.error(`ERROR: PRECOMP SYNC->client.put catch block: ${err}`);
                                    logger.error("Your database failed to do it's pre comp sync. I would recommend you fix this ASAP")
                                })
                        }
                    }
                })
            })
        })
    })
};
