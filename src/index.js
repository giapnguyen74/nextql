const { Model } = require("./model");
const { execute_model } = require("./resolvers");

const defaultResolveType = value => value.constructor && value.constructor.name;

class NextQL {
	constructor(options = {}) {
		this.aliasSeparator = options.aliasSeparator || "/";
		this.resolveType = options.resolveType || defaultResolveType;

		this.models = {};
		this.beforeCreateHooks = [];
		this.afterResolveTypeHooks = [];
		this.beforeExecuteHooks = [];
	}

	model(name, options) {
		if (!options) {
			return this.models[name];
		}

		options.name = name;
		this.beforeCreateHooks.forEach(hook => hook(options));

		this.models[name] = new Model(options);
		return this.models[name];
	}

	execute(query, context) {
		if (!(query instanceof Object)) {
			return Promise.reject({
				error: "Invalid query"
			});
		}

		let check;
		this.beforeExecuteHooks.forEach(hook => (check = hook(query) || check));
		if (check instanceof Error) {
			return Promise.reject(check);
		}

		let result = {};
		return Promise.all(
			Object.keys(query).map(path => {
				//const modelName = path.split(this.aliasSeparator, 1)[0];
				return execute_model(
					this,
					path,
					query[path],
					{
						result,
						path: [path]
					},
					context
				);
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

	beforeExecute(hook) {
		this.beforeExecuteHooks.push(hook);
	}
}

module.exports = NextQL;
