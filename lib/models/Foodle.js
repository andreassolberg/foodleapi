"use strict";
var
	mongoose = require('mongoose'),
	uuid = require('node-uuid'),
	moment = require('moment');

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
			maxint: Number
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
				maxint: Number
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

FoodleSchema.methods.requireNotLocked = function(feideconnect) {

	var lock = this.lock();

	if (lock !== null) {
		throw new Error("Cannot respond to a Foodle that is locked.");
	}

}

FoodleSchema.methods.requireAdmin = function(feideconnect) {

	if (this.owner !== feideconnect.userid) {
		throw new Error("You are not allowed to alter this object, because you do not have the adminsitratative privileges.");
	}

}

module.exports = mongoose.model('Foodle', FoodleSchema, "foodles");