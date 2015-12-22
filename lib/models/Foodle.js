"use strict";
var
	mongoose = require('mongoose'),
	uuid = require('node-uuid'),
	moment = require('moment'),
	extend = require('extend');

var Schema = mongoose.Schema;

var FoodleSchema = new Schema({
	identifier: {
		type: String,
		required: true,
		default: uuid,
		unique: true
	},
	parent: String,
	title: String,
	descr: String,

	isLocked: {
		type: Boolean,
		required: true,
		default: false
	},
	deadline: {
		type: Date
	},
	location: {
		local: String,
		address: String
	},

	publicresponses: {
		type: Boolean,
		required: true,
		default: true
	},

	datetime: {
		start: Date,
		end: Date,
		allDay: Boolean,
		multipleDays: Boolean
	},

	defaults: {
		type: {
			type: String,
			lowercase: true,
			enum: ["flex", "date", "datetime", "check", "checkmaybe"]
		}
	},
	timezone: String,
	columns: [{
		title: String,
		idx: {
			type: String,
			required: false,
			default: uuid
		},
		coltype: {
			type: String,
			lowercase: true,
			required: true,
			enum: ["date", "datetime", "text"]
		},
		datatype: {
			type: String,
			lowercase: true,
			required: true,
			enum: ["text", "number", "check", "checkmaybe", "none", "radio"]
		},
		restrictions: {
			enabled: Boolean,
			maxcheck: Number,
			maxnum: Number
		},


		items: [{
			idx: {
				type: String,
				required: true,
				default: uuid
			},
			coltype: {
				type: String,
				lowercase: true,
				required: true,
				enum: ["date", "datetime", "text"]
			},
			datatype: {
				type: String,
				lowercase: true,
				required: true,
				enum: ["text", "number", "check", "checkmaybe", "none", "radio"]
			},
			restrictions: {
				enabled: Boolean,
				maxcheck: Number,
				maxnum: Number
			},
			title: String
		}]
	}],

	admins: [String],
	groups: [String],
	owner: String,
	ownerinfo: {
		name: String,
		email: String,
		profilephoto: String
	},
	
	clientid: String,

	created: {
		type: Date,
		required: true,
		default: Date.now
	},
	updated: {
		type: Date,
		required: true,
		default: Date.now
	}
}, {
	toObject: { "virtuals": true },
	toJSON: { "virtuals": true }
});

FoodleSchema.virtual('lock').get(function () {
	var locked = false;
	var lock = {};
	var now = moment();
	var deadline = null;
	if (this.deadline) {
		deadline = moment(this.deadline);
	}
	// console.log("Now ", now, " Deadline ", deadline);

	if (deadline && deadline.isBefore(now)) {
		locked = true;
		lock.expired = true;
	}
	if (this.isLocked) {
		locked = true;
		lock.isLocked = true;
	}

	if (locked) {
		return lock;
	}
	return null;
});

FoodleSchema.methods.getColDef = function() {

	var view = [];

	var i, j, x, y;

	for (i = 0; i < this.columns.length; i++) {

		x = extend(true, {}, this.columns[i]);
		x = JSON.parse(JSON.stringify(this.columns[i]));

		if (this.columns[i].items && this.columns[i].items.length > 0) {
			for (j = 0; j < this.columns[i].items.length; j++) {

				y = JSON.parse(JSON.stringify(this.columns[i].items[j]));
				view.push(y);
			
			}

		} else {
			delete x.items;
			view.push(x);
		}
	}

	return view;
}

FoodleSchema.methods.getSummary = function(responses) {


	var summary = {
		"col": this.getColDef(),
		"total": responses.length
	};
	var i, j;

	for(i = 0; i < summary.col.length; i++) {

		for(j = 0; j < responses.length; j++) {

			summary.col[i].summary = 0;

			var colresp = responses[j].getColResp(summary.col[i].idx);
			if (colresp === null) {
				continue;
			}

			if (summary.col[i].datatype === 'check' || summary.col[i].datatype === 'checkmaybe') {

				if (colresp.val === 'yes') {
					summary.col[i].summary++;
				}
	
			} else if (summary.col[i].datatype === 'number') {
				var v = parseInt(colresp.val, 10);
				summary.col[i].summary += v;
			} else {
				summary.col[i].summary++;
			}

		}

	}

	for(i = 0; i < summary.col.length; i++) {

		summary.hasRestrictions = false;
		if (summary.col[i].restrictions && summary.col[i].restrictions.enabled) {
			if (summary.col[i].restrictions.maxcheck) {
				summary.hasRestrictions = true;
				summary.col[i].isLocked = (summary.col[i].summary >= summary.col[i].restrictions.maxcheck);
			}
			if (summary.col[i].restrictions.maxnum) {
				summary.hasRestrictions = true;
				summary.col[i].isLocked = (summary.col[i].summary >= summary.col[i].restrictions.maxnum);
			}

		}

	}


	return summary;

}




FoodleSchema.methods.requireNotLocked = function(feideconnect) {

	if (this.lock !== null) {
		throw new Error("Cannot respond to a Foodle that is locked.");
	}

}

FoodleSchema.methods.requireAdmin = function(feideconnect) {

	if (this.owner !== feideconnect.userid) {
		throw new Error("You are not allowed to alter this object, because you do not have the adminsitratative privileges.");
	}

}

module.exports = mongoose.model('Foodle', FoodleSchema, "foodles");