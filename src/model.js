const { assertOk } = require("./util");

function mergeOptions(model, options) {
	model.name = options.name;
	Object.assign(model.fields, options.fields);
	Object.assign(model.computed, options.computed);
	Object.assign(model.methods, options.methods);
}

class Model {
	constructor(options) {
		options.fields = options.fields || {};
		options.computed = options.computed || {};
		options.methods = options.methods || {};

		this.$options = options;
		this.fields = {};
		this.computed = {};
		this.methods = {};

		if (this.$options.mixins) {
			this.$options.mixins.forEach(mixin => mergeOptions(this, mixin));
		}
		mergeOptions(this, options);
	}

	call(methodName, params = {}, context = {}) {
		assertOk(this.methods[methodName], "no-method: " + methodName, 404);
		return this.methods[methodName].apply(this, [params, context]);
	}

	get(value, fieldName, params = {}, context = {}) {
		if (this.computed[fieldName]) {
			return this.computed[fieldName].apply(this, [
				value,
				params,
				context
			]);
		}

		if (this.fields[fieldName]) {
			return value[fieldName];
		}
	}
}

class AnonymousModel {
	constructor(fields) {
		this.fields = fields;
		this.computed = {};
	}

	get(value, fieldName) {
		assertOk(
			this.fields[fieldName] != undefined,
			"no-field: " + fieldName,
			400
		);
		return value[fieldName];
	}
}

module.exports = {
	Model,
	AnonymousModel
};
