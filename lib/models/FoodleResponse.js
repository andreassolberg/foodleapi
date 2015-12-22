"use strict";

var 
	mongoose    = require('mongoose'),
	uuid		= require('node-uuid');

var Schema      = mongoose.Schema;

var FoodleResponseSchema   = new Schema({

	identifier: { type: String, required: true },

	columns: [
		{
			idx: { type: String, required: true},
			val: String
		}
	],

	comment: String,

	owner: { type: String, required: true},
	userinfo: {
		name: String,
		email: String,
		profilephoto: String
	},

	created : { type: Date, required: true, default: Date.now },
	updated : { type: Date, required: true, default: Date.now }

});



FoodleResponseSchema.methods.getColResp = function(idx) {

	for(var i = 0; i < this.columns.length; i++) {
		if (this.columns[i].idx === idx) {
			return this.columns[i];
		}
	}
	return null;

}



module.exports = mongoose.model('FoodleResponse', FoodleResponseSchema, "responses");