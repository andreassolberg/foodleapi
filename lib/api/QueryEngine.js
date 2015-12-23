"use strict";

var 
	express   = require('express'),
	mongoose  = require('mongoose'),

	Foodle         = require('../models/Foodle'),
	FoodleResponse = require('../models/FoodleResponse');

mongoose.Promise = global.Promise;



var dateSorter = function(a, b) {

	if (a.updated < b.updated) {
		return -1;
	}
	if (a.updated > b.updated) {
		return 1;
	}
	return 0;
};

var QueryEngine = function(userid) {


	this.userid = userid;
	this.items = {};
	this.groups = [];

}

QueryEngine.prototype.setGroups = function(groups) {
	this.groups = groups;
}

QueryEngine.prototype.setupDB = function(dbstr) {
	// console.log("Setup db with " + dbstr);
	var options = {
		server: { poolSize: 5 }
	};
	mongoose.connect(dbstr, options);
}
QueryEngine.prototype.shutdown = function() {
	mongoose.disconnect();
}

QueryEngine.prototype.addFoodles = function(list) {
	for(var i = 0; i < list.length; i++) {
		this.items[list[i].identifier] = list[i];
	}
}

QueryEngine.prototype.getList = function() {

	var data = [];
	for(var key in this.items) {
		data.push(this.items[key]);
	}
	data.sort(dateSorter);
	return data;
};


QueryEngine.prototype.queryFoodles = function(query) {
	return Foodle.find(query)
		.sort({ "updated": -1 })
		.limit(100)
		.select({
			"_id": false, "__v": false
		});
}

// QueryEngine.prototype.queryFoodleResponseIdentifiers = function(query) {
// 	return Foodle.find(query)
// 		.sort({ "updated": -1 })
// 		.limit(100)
// 		.select({
// 			"_id": false, "__v": false
// 		})
// 		.then(function(foodles) {
// 			that.addFoodles(foodles);
// 		});	
// }




QueryEngine.prototype.fetchMyFoodles = function() {

	var that = this;
	var query = {
		"owner": this.userid
	};
	return this.queryFoodles(query)
		.then(function(foodles) {
			that.addFoodles(foodles);
		});
};


QueryEngine.prototype.fetchByGroups = function() {

	var that = this;
	var query = {
		"owner": {
			"$ne": this.userid
		},
		"groups": {
			"$in": this.groups
		}
	};

	return this.queryFoodles(query)
		.then(function(foodles) {
			that.addFoodles(foodles);
		});

}


QueryEngine.prototype.fetchByAdmin = function() {

	var that = this;
	var query = {
		"owner": {
			"$ne": this.userid
		},
		"admins": {
			"$in": this.groups
		}
	};

	return this.queryFoodles(query)
		.then(function(foodles) {
			that.addFoodles(foodles);
		});

}

QueryEngine.prototype.fetchListOfFoodles = function(list) {

	var that = this;
	var query = {
		"identifier": {
			"$in": list
		}
	};

	// console.log("Query");
	// console.log(JSON.stringify(query));

	return this.queryFoodles(query)
		.then(function(foodles) {
			that.addFoodles(foodles);
		});

}

QueryEngine.prototype.hasFoodle = function(identifier) {
	return (this.items.hasOwnProperty(identifier));
}

QueryEngine.prototype.filterFoodleIdentifiers = function(list) {
	var data = [];
	for(var i = 0; i < list.length; i++) {
		if (!this.hasFoodle(list[i])) {
			data.push(list[i]);
		}
	}
	return data;
}

QueryEngine.prototype.fetchFoodlesIrespondedTo = function() {

	var that = this;
	var query = {
		"owner": this.userid
	};

	return FoodleResponse.find(query)
		.sort({ "updated": -1 })
		.limit(250)
		.select({
			"identifier": true
		})
		.then(function(responses) {

			var identifiers = responses.map(function(item) {
				return item.identifier;
			});
			var filtered = that.filterFoodleIdentifiers(identifiers);
			// console.log(filtered);

			return that.fetchListOfFoodles(filtered);
			// that.addFoodles(responses);
		});

}


QueryEngine.prototype.fetch = function() {
	var that = this;
	return Promise.all([
		that.fetchMyFoodles(),
		that.fetchByGroups(),
		that.fetchByAdmin()
	])
	.then(function() {
		return that.fetchFoodlesIrespondedTo();
	})
	.then(function() {
		return that.getList();
	});
}




exports.QueryEngine = QueryEngine;