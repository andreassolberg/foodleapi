"use strict";

var nr = require('newrelic');
var 
	express    = require('express'),
	bodyParser = require('body-parser'),
	config = require('config');


var FeideConnectAPI = require('feideconnectapi').FeideConnectAPI;

var app		= express();

var API 	= require('./lib/api/API').API;


var dbstr	= config.get('db');
var fc = new FeideConnectAPI({
    "password": config.get('feideconnect.key')
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 3000;        // set our port


var A = new API(dbstr);

var fakeMiddleware = function(req, res, next) {
	req.headers.authorization = 'Basic ZmVpZGVjb25uZWN0OjMwZDYzZDliLTM1NzQtNDgzMi1iZTM3LTBjOTMxMjFmY2EyMQ==';
	req.headers['x-feideconnect-userid'] = '76a7a061-3c55-430d-8ee0-6f82ec42501f';
	req.headers['x-feideconnect-userid-sec'] = 'feide:andreas@uninett.no,feide:andreas2@uninett.no';
	req.headers['x-feideconnect-clientid'] = '610cbba7-3985-45ae-bc9f-0db0e36f71ad';
	next();
};

app.use('/api', fc.cors(), fc.setup(), fc.policy({"requireUser": true}), A.getRoute());

app.listen(port);
console.log('Magic happens on port ' + port);


