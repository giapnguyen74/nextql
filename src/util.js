function isPrimitive(test) {
	return test !== Object(test);
}

function joinPath(path) {
	return Array.isArray(path) ? path.join(".") : path;
}

module.exports = {
	isPrimitive,
	joinPath
};
