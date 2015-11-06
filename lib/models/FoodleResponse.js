var 
	mongoose    = require('mongoose'),
	uuid		= require('node-uuid');

var Schema      = mongoose.Schema;

var FoodleResponseSchema   = new Schema({

	identifier: { type: String, required: true },

	columns: [
		{
			id: { type: String, required: true},
			val: String
		}
	],

	comment: String,

	owner: String,
	userinfo: {
		name: String,
		mail: String
	},

	created : { type: Date, required: true, default: Date.now },
	updated : { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('FoodleResponse', FoodleResponseSchema, "responses");