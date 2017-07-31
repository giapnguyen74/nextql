"use strict";

function assertOk(condition, message, code) {
	if (!condition) {
		var error = new Error(message);
		error.name = "NextQL Error";
		error.code = code;
		throw error;
	}
}

function isPlainObject(obj) {
	return obj && obj.constructor == Object;
}

module.exports = {
	assertOk,
	isPlainObject
};