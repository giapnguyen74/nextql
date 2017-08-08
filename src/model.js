const { joinPath } = require("./util");
function mergeOptions(model, options) {
	model.fields = Object.assign({}, model.fields, options.fields);
	model.computed = Object.assign({}, model.computed, options.computed);
	model.methods = Object.assign({}, model.methods, options.methods);
	model.returns = Object.assign({}, model.returns, options.returns);
}

class Model {
	constructor(options) {
		this.name = options.name;
		this.$options = options;
		this.fields = {};
		this.computed = {};
		this.methods = {};

		if (this.$options.mixins) {
			this.$options.mixins.forEach(mixin => mergeOptions(this, mixin));
		}
		mergeOptions(this, options);
	}

	call(methodName, params = {}, context = {}, info) {
		if (!this.methods[methodName]) {
			return Promise.reject({
				error: "No method",
				method: methodName,
				model: this.name,
				path: joinPath(info.path)
			});
		}

		try {
			return Promise.resolve(
				this.methods[methodName].apply(this, [params, context])
			);
		} catch (e) {
			return Promise.reject(e);
		}
	}

	get(value, fieldName, params = {}, context = {}, info) {
		try {
			if (this.computed[fieldName]) {
				return Promise.resolve(
					this.computed[fieldName].apply(this, [
						value,
						params,
						context
					])
				);
			}
		} catch (e) {
			return Promise.reject(e);
		}

		if (this.fields[fieldName]) {
			return Promise.resolve(value[fieldName]);
		} else {
			return Promise.reject({
				error: "No field",
				field: fieldName,
				model: this.name,
				path: joinPath(info.path)
			});
		}
	}
}

class InlineModel {
	constructor(fields) {
		this.fields = fields;
		this.computed = {};
	}

	get(value, fieldName, params, context, info) {
		if (this.fields[fieldName]) {
			return Promise.resolve(value[fieldName]);
		} else {
			return Promise.reject({
				error: "No field",
				field: fieldName,
				model: "$inline",
				path: joinPath(info.path)
			});
		}
	}
}

module.exports = {
	Model,
	InlineModel
};
