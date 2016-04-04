// Copyright 2016, all rights reserved.
// Author: Dmitry Dudin <dima.dudin@gmail.com>

'use strict';

const
    resolver = require('dns'),
    dnsd = require('dnsd'),
    async = require('async');

const
    RESOLVERS = ['192.168.0.1'], // 8.8.8.8
    PORT = 55553,
    server = dnsd.createServer().listen(PORT, '127.0.0.1');

server.on('listening', function() {
    resolver.setServers(RESOLVERS);
    console.log('DNS Server running at: 127.0.0.1, on port: %s', PORT);
});

server.on('request', function(req, res) {
    console.log('%s:%s/%s %j',
        req.connection.remoteAddress,
        req.connection.remotePort,
        req.connection.type,
        req);

    async.each(req.question, function(query, callback) {
        resolver.resolve(query.name, query.type, function(err, results) {
            if (err) {
                console.error(err);
                return callback(err);
            }

            console.log('%j', results);

            switch (query.type) {
                case 'SOA':
                    var item = results;
                    res.answer.push({
                        name: query.name,
                        type: query.type,
                        data: {
                            mname: item.nsname,
                            rname: item.hostmaster,
                            serial: item.serial,
                            refresh: item.refresh,
                            retry: item.retry,
                            expire: item.expire,
                            ttl: item.minttl
                        },
                        ttl: 3600
                    });
                    break;
                case 'A':
                    results.forEach(function(item) {
                        checkHost(item, function(err, response) {
                            res.answer.push({
                                name: query.name,
                                type: query.type,
                                data: response,
                                ttl: 3600
                            });
                        });
                    });
                    break;
                case 'AAAA':
                    results.forEach(function(item) {
                        checkHost(item, function(err, response) {
                            res.answer.push({
                                name: query.name,
                                type: query.type,
                                data: response,
                                ttl: 3600
                            });
                        });
                    });
                    break;
                case 'NS':
                    results.forEach(function(item) {
                        res.answer.push({
                            name: query.name,
                            type: query.type,
                            data: item,
                            ttl: 3600
                        });
                    });
                    break;
                case 'MX':
                    results.forEach(function(item) {
                        res.answer.push({
                            name: query.name,
                            type: query.type,
                            data: [item.priority, item.exchange],
                            ttl: 3600
                        });
                    });
                    break;
                case 'PTR':
                    results.forEach(function(item) {
                        checkIP(item, function(err, response) {
                            res.answer.push({
                                name: query.name,
                                type: query.type,
                                data: response,
                                ttl: 3600
                            });
                        });
                    });
                    break;
            }
            callback();
        });

    }, function(err) {
        console.log('ANSWER: %j', res.answer);
        console.log('RESPONSE: %j', res.answer);
        res.end();
    });
});

// Check Host
function checkHost(host, callback) {
    //
    callback(null, host);
}

// Check IP
function checkIP(ip, callback) {
    //
    callback(null, ip);
}

function exit() {
    server.close();
    process.exit();
}

process.on('SIGINT', function() {
    exit();
});

process.on('SIGTERM', function() {
    exit();
});
