"use strict";

var 
	express   = require('express'),
	mongoose  = require('mongoose'),

	Foodle         = require('../models/Foodle'),
	FoodleResponse = require('../models/FoodleResponse');

mongoose.Promise = global.Promise;


var API = function(dbstr) {
	this.dbstr = dbstr;

	this.init();
	this.setupRoute();
};

API.prototype.init = function() {
	mongoose.connect(this.dbstr);
}

API.prototype.sendNotFound = function(res) {
	res.status(404).json({
		"message": "Did not found object"
	});
}


API.prototype.setupRoute = function() {

	var that = this;

	this.router = express.Router();


	this.router.route('/foodles/')
	.post(function(req, res) {
		
		req.body.owner = req.feideconnect.userid;
		req.body.clientid = req.feideconnect.clientid;
		delete req.body.created;
		delete req.body.updated;

		var foodle = new Foodle(req.body);
		foodle.save()
			.then(function() {
				res.json(foodle);
			}, function(err) {
				console.error("Error", err);
				res.status(500).json(err);
			});
		
	})
	// Get a list of all foodles
	.get(function(req, res) {

		var query = {"owner": req.feideconnect.userid};

		Foodle.find(query)
		.limit(100)
		.select({
			"_id": false, "__v": false
		})
		.then(function(foodle) {
			res.json(foodle);
		}, function(err) {
			console.error("Error", err);
			res.status(500).json(err);
		});
	});


	this.router.route('/foodles/:id')
	.get(function(req, res) {
		Foodle.findOne({
			"identifier": req.params.id
		})
		.select({
			"_id": false, "__v": false
		})
		.then(function(foodle) {
			if (foodle === null) {
				return that.sendNotFound(res);
			}
			res.json(foodle);
		}, function(err) {
			console.error("Error", err);
			res.status(500).json(err);
		});
	})
    .patch(function(req, res) {

		Foodle.findOne({
			"identifier": req.params.id
		})
    	.exec()
    	.then(function(foodle) {

			if (foodle === null) {
				return that.sendNotFound(res);
			}

    		delete req.body.owner;
			delete req.body.created;
			delete req.body._id;
			req.body.updated = Date.now();

			foodle.requireAdmin(req.feideconnect);

    		for(var key in req.body) {
    			if (!req.body.hasOwnProperty(key)) {
    				continue;
    			}
    			foodle[key] = req.body[key];
    		}
    		console.log("About to save", JSON.stringify(foodle, undefined, 1));

            foodle.save()
            	.then(function() {
					res.json(foodle);
            	}, function(err) {
					console.error("Error updating", err);
					res.status(500).json(err);
            	});


		})
		.catch(function(err) {
			console.error("Error looking up object.", err);
			res.status(500).json(err);
		});


    })
	.delete(function(req, res) {
        Foodle.remove({
        	owner: req.feideconnect.userid,
            identifier: req.params.id
        }).exec()
    	.then(function() {
			res.json({ message: 'Successfully deleted' });
    	}, function(err) {
			console.error("Error deleting", err);
			res.status(500).json(err);
    	});
	});

	this.router.route('/foodles/:id/full')
	.get(function(req, res) {
		var query = {"identifier": req.params.id};

		Promise.all([
			Foodle.findOne({"identifier": req.params.id}).exec(),
			FoodleResponse.find(query).limit(100).select({"_id": false, "__v": false}).exec()
		])
		.then(function(data) {

			var responseData = {
				"foodle": data[0],
				"responses": data[1],
				"myresponse": null,
				"summary": data[0].getSummary(data[1])
			};

			for(var i = 0; i < responseData.responses.length; i++) {
				if (responseData.responses[i].owner === req.feideconnect.userid) {
					responseData.myresponse = responseData.responses[i];
				}
			}

			if (!data[0].allowedResponses(req.feideconnect)) {
				responseData.responses = null;
			}

			res.json(responseData);
		})
		.catch(function(err) {
			console.error("Error looking up object.", err.stack);
			res.status(500).json(err);
		});
	});

	this.router.route('/foodles/:id/responses/')
	.get(function(req, res) {
		var query = {"identifier": req.params.id};
		FoodleResponse.find(query)
		.limit(100)
		.select({
			"_id": false, "__v": false
		})
		.exec()
		.then(function(list) {

			// TODO Implement access control 
			// 
			// foodle.requireAllowedResponses(feideconnect)
			res.json(list);
		})
		.catch(function(err) {
			console.error("Error looking up object.", err.stack);
			res.status(500).json(err);
		});
	});

	this.router.route('/foodles/:id/myresponse')
	.get(function(req, res) {
		var query = {"owner": req.feideconnect.userid, "identifier": req.params.id};
		FoodleResponse.findOne(query)
		.exec()
		.then(function(response) {
			res.json(response);
		})
		.catch(function(err) {
			console.error("Error looking up object.", err);
			res.status(500).json(err);
		});
	})
	.post(function(req, res) {

		var foodle = null;

		var foodlequery = {"identifier": req.params.id};
		var query = {"owner": req.feideconnect.userid, "identifier": req.params.id};

		Foodle.findOne(foodlequery)
			.then(function(fdata) {
				foodle = fdata;

				return FoodleResponse.findOne(query).exec();
			})
			.then(function(response) {


				console.log("About to send response to this foodle " + foodle.title);

				foodle.requireNotLocked();

				req.body.identifier = req.params.id;
				req.body.owner = req.feideconnect.userid;
				req.body.clientid = req.feideconnect.clientid;

				delete req.body.created;
				delete req.body.updated;

				if (response === null) {
					response = new FoodleResponse(req.body);
				} else {
					req.body.updated = Date.now();
		    		for(var key in req.body) {
		    			if (!req.body.hasOwnProperty(key)) {
		    				continue;
		    			}
		    			response[key] = req.body[key];
		    		}
				}

				console.log("ABout to INSERT response");
				console.log(JSON.stringify(req.body, undefined, 4));

				response.save()
					.then(function() {
						res.json(response);
					}, function(err) {
						console.error("Error", err);
						// console.error(err.stack);
						res.status(500).json({
							"name": err.name,
							"message": err.message
						});
					});

			})
			.catch(function(err) {
				console.error("Error looking up object.", err);
				res.status(500).json({
					"name": err.name,
					"message": err.message
				});
			});

	})
	.delete(function(req, res) {
		var query = {"owner": req.feideconnect.userid, "identifier": req.params.id};
        FoodleResponse.remove({
        	owner: req.feideconnect.userid,
            identifier: req.params.id
        }).exec()
    	.then(function() {
			res.json({ message: 'Successfully deleted' });
    	}, function(err) {
			console.error("Error deleting", err);
			res.status(500).json(err);
    	});
	});

	return this.router;

}


API.prototype.getRoute = function() {
	return this.router;
}



exports.API = API;


