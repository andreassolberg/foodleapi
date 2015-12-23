"use strict";

var 
	config = require('config'),
	QueryEngine = require('./lib/api/QueryEngine').QueryEngine;

var env 	= process.argv[2] || process.env.NODE_ENV || 'production';
var dbstr	= config.get('db');


var userid = "76a7a061-3c55-430d-8ee0-6f82ec42501f";
var engine = new QueryEngine(userid);
engine.setupDB(dbstr);
engine.setGroups(["fc:org:uninett.no", "fc:org:uninett.no:unit:AVD-U20"]);

var debugList = function(items) {

	console.log("---- List of foodles ----");
	// console.log(items);
	for(var i = 0; i < items.length; i++) {
		console.log(" " + i + " " + items[i].identifier + " " + items[i].title );
		console.log("       created " + items[i].created);
		console.log("        owner  " + items[i].owner);
		console.log("        admins " + JSON.stringify(items[i].admins));
		console.log("        groups " + JSON.stringify(items[i].groups));
	}
	console.log("---- ");

}


console.log("Running query");


engine.fetch()
	.then(function() {
		debugList(engine.getList());
		engine.shutdown();
	})
	.catch(function(err) {
		console.error("Error " + err.message);
		console.log(JSON.stringify(err.stack, undefined, 2));
	});


