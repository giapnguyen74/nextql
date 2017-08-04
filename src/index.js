const { assertOk, isPlainObject } = require("./util");
const { Model } = require("./model");
const {execute_model,
    execute_method, 
    resolve_value, 
    resolve_auto_type_value,
    resolve_typed_value, 
	resolve_no_type_value} = require('./resolvers');
	
const defaultFieldResolver = (value, fieldName) => value[fieldName];
const defaultResolveType = value => value.constructor && value.constructor.name;

class NextQL {
	constructor(options = {}) {
		this.aliasSeparator = options.aliasSeparator || "/";
		this.defaultFieldResolver =
			options.defaultFieldResolver || defaultFieldResolver;
		this.resolveType = options.resolveType || defaultResolveType;

		this.beforeCreateHooks = [];
		this.models = {};
		this.afterResolveTypeHooks = [];
	}

	model(name, options) {
		if (!options) {
			assertOk(this.models[name], "no-model: " + name, 400);
			return this.models[name];
		}

		options.name = name;
		this.beforeCreateHooks.forEach(hook => hook(options));

		this.models[name] = new Model(options);
		return this.models[name];
	}

	execute(query, context) {
		assertOk(isPlainObject(query), "invalid query", 400);

		let result = {};

		return Promise.all(
			Object.keys(query).map(path => {
				const modelName = path.split(this.aliasSeparator, 1)[0];
				return execute_model(this, modelName, query[path], context, {
					result,
					path: [path]
				});
			})
		).then(() => result);
	}

	use(plugin, options) {
		if (typeof plugin == "function") {
			plugin(this, options);
		} else {
			plugin.install(this, options);
		}
		return this;
	}

	afterResolveType(hook) {
		this.afterResolveTypeHooks.push(hook);
	}

	beforeCreate(hook) {
		this.beforeCreateHooks.push(hook);
	}
}

module.exports = NextQL;

module.exports.resolvers = {
	resolve_no_type_value,
	resolve_typed_value,
	resolve_auto_type_value,
	resolve_value,
	execute_method,
	execute_model
};
