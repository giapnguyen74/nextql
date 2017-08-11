const { NextQLError } = require("./util");
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
			return Promise.reject(
				new NextQLError(`No method: ${this.name}.${methodName}`, info)
			);
		}

		try {
			return Promise.resolve(
				this.methods[methodName].apply(this, [params, context, info])
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
						context,
						info
					])
				);
			}
		} catch (e) {
			return Promise.reject(e);
		}

		if (this.fields[fieldName]) {
			return Promise.resolve(value[fieldName]);
		} else {
			return Promise.reject(
				new NextQLError(`No field: ${this.name}.${fieldName}`, info)
			);
		}
	}

	check(value, conditional, params = {}, context = {}, info) {
		if (!this.computed[conditional]) {
			return new NextQLError(
				`No conditional: ${this.name}.${conditional}`,
				info
			);
		}

		return this.computed[conditional].apply(this, [
			value,
			params,
			context,
			info
		]);
	}
}

class InlineModel {
	constructor(fields) {
		this.fields = fields;
		this.computed = {};
		this.name = "$inline";
	}

	get(value, fieldName, params, context, info) {
		if (this.fields[fieldName]) {
			return Promise.resolve(value[fieldName]);
		} else {
			return Promise.reject(
				new NextQLError(`No field: ${this.name}.${fieldName}`, info)
			);
		}
	}

	check(value, conditional, params = {}, context = {}, info) {
		return new NextQLError(
			"Not support conditional for inline model",
			info
		);
	}
}

module.exports = {
	Model,
	InlineModel
};
