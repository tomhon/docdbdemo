// "use strict";

var documentClient = require("documentdb").DocumentClient;
var config = require("./config");
var url = require('url');
var restify = require('restify');
var localdb = Array();


function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

function respondbye(req, res, next) {
  res.send('goodbye ' + req.params.name);
  next();
}

var server = restify.createServer();
server.get('/hello/:name', respond);
server.get('/goodbye/:name', respondbye);
server.get('/docdb/:name', refreshdb);
server.head('/hello/:name', respond);
server.pre(restify.pre.userAgentConnection());

server.listen( function() {
  console.log('%s listening at %s', server.name, server.url);
});

function refreshdb(req, res, next) {
    getDatabase(req, res, next)
        .then(() => getCollection(req, res, next))
        .then(() => queryCollection(req, res, next))
        .then(() => res.send('Query Returned' + JSON.stringify(localdb)))
        .then(() => { exit(req, res, next,`Completed successfully`); })
        .catch((error) => { exit(req, res, next,`Completed with error ${JSON.stringify(error)}`) });

};



var client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });

var HttpStatusCodes = { NOTFOUND: 404 };
var databaseUrl = `dbs/${config.database.id}`;
var collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;

function getDatabase(req, res, next) {
    console.log(`Getting database:\n${config.database.id}\n`);

    return new Promise((resolve, reject) => {
        client.readDatabase(databaseUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createDatabase(config.database, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
            } else {
                console.log('Succeeded ' + result);
                resolve(result);
            }
        });
    });
}

function getCollection(req, res, next) {
    console.log(`Getting collection:\n${config.collection.id}\n`);

    return new Promise((resolve, reject) => {
        client.readCollection(collectionUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createCollection(databaseUrl, config.collection, { offerThroughput: 400 }, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
    });
}

function queryCollection(req, res, next) {
    console.log(`Querying collection through index:\n${config.collection.id}`);

    return new Promise((resolve, reject) => {
        client.queryDocuments(
            collectionUrl,
            'SELECT r.name FROM root r'
        ).toArray((err, results) => {
            if (err) reject(err)
            else {
                for (var queryResult of results) {
                    let resultString = JSON.stringify(queryResult);
                    console.log(`\tQuery returned ${resultString}`);
                    localdb.push(queryResult);
                    console.log('localdb length =' + localdb.length);
                }
                console.log();
                resolve(results);
            }
        });
    });
};


function exit(req, res, next,message) {
    console.log(message);
    console.log('Press any key to exit');
    // process.stdin.setRawMode(true);
    // process.stdin.resume();
    // process.stdin.on('data', process.exit.bind(process, 0));
}

