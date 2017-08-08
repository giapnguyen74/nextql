const util = require("util");
function isPrimitive(test) {
	return test !== Object(test);
}

class NextQLError extends Error {
	constructor(message, more) {
		const path = Array.isArray(more.path) ? more.path.join(".") : more.path;
		super(message + " - path: " + path);
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = {
	isPrimitive,
	NextQLError
};
