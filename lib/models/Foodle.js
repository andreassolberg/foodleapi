"use strict";
var 
	mongoose    = require('mongoose'),
	uuid		= require('node-uuid');

var Schema      = mongoose.Schema;

var FoodleSchema   = new Schema({
	identifier: { type: String, required: true, default: uuid, unique: true },
	parent: String,
	title: String,
	descr: String,

	deadline : { type: Date},
	location: {
		local: String,
		address: String
	},

	publicresponses: { type: Boolean, required: true, default: true},

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
	columns: [
		{
			title: String,
			show: { type: Boolean, required: true, default: true},

			items: [
				{
					id: { type: String, required: true, default: uuid },
					type: { 
						type: String, 
						lowercase: true, 
						enum: ["flex", "date", "datetime", "check", "checkmaybe"] 
					},
					title: String
				}
			]
		}
	],

	admins: [String],
	groups: [String],
	owner: String,
	clientid: String,

	created : { type: Date, required: true, default: Date.now },
	updated : { type: Date, required: true, default: Date.now }
});

FoodleSchema.methods.requireAdmin = function (feideconnect) {

	if (this.owner !== feideconnect.userid) {
		throw new Error("You are not allowed to alter this object, because you do not have the adminsitratative privileges.");
	}

}

module.exports = mongoose.model('Foodle', FoodleSchema, "foodles");