const { Model, AnonymousModel } = require("./model");
const { isPlainObject, assertOk } = require("./util");
const _set = require("lodash.set");

/**
 * Given a value has no type, resolve as plain object
 */
function resolve_no_type_value(nextql, value, query, context, info) {
	return Promise.all(
		Object.keys(query).map(path => {
			if (path == "$params") return;
			return resolve_value(
				nextql,
				nextql.defaultFieldResolver(value, path),
				1,
				query[path],
				context,
				{
					result: info.result,
					path: info.path.concat(path)
				}
			);
		})
	);
}

function resolve_typed_value(nextql, value, valueModel, query, context, info) {
	return Promise.all(
		Object.keys(query).map(path => {
			if (path == "$params") return;

			const fieldName = path.split(nextql.aliasSeparator, 1)[0];
			return Promise.resolve(
				valueModel.get(value, fieldName, query[path].$params, context)
			).then(fieldValue => {
				const newInfo = {
					result: info.result,
					path: info.path.concat(path)
				};

				if (
					valueModel.computed[fieldName] ||
					valueModel.fields[fieldName] === 1
				) {
					return resolve_value(
						nextql,
						fieldValue,
						1,
						query[path],
						context,
						newInfo
					);
				}

				if (typeof valueModel.fields[fieldName] == "string") {
					return resolve_value(
						nextql,
						fieldValue,
						nextql.model(valueModel.fields[fieldName]),
						query[path],
						context,
						newInfo
					);
				}

				if (isPlainObject(valueModel.fields[fieldName])) {
					return resolve_value(
						nextql,
						fieldValue,
						new AnonymousModel(valueModel.fields[fieldName]),
						query[path],
						context,
						newInfo
					);
				}
			});
		})
	);
}

function resolve_auto_type_value(nextql, value, query, context, info) {
	if (typeof value != "object") {
		_set(info.result, info.path, value);
		return;
	}

	if (isPlainObject(query)) {
		let modelName = nextql.resolveType(value);
		nextql.afterResolveTypeHooks.forEach(
			hook => (modelName = hook(value) || modelName)
		);
		return modelName == "Object"
			? resolve_no_type_value(nextql, value, query, context, info)
			: resolve_typed_value(
					nextql,
					value,
					nextql.model(modelName),
					query,
					context,
					info
				);
	}
}

function resolve_value(nextql, value, valueModel, query, context, info) {
	if (value == undefined) {
		_set(info.result, info.path, null);
		return;
	}
	if (typeof value == "function") return;
	if (typeof value.then == "function") {
		return value.then(v =>
			resolve_value(nextql, v, valueModel, query, context, info)
		);
	}

	if (Array.isArray(value)) {
		return Promise.all(
			value.map((v, idx) =>
				resolve_value(nextql, v, valueModel, query, context, {
					result: info.result,
					path: info.path.concat(idx)
				})
			)
		);
	}

	if (valueModel === 1) {
		return resolve_auto_type_value(nextql, value, query, context, info);
	} else {
		return resolve_typed_value(
			nextql,
			value,
			valueModel,
			query,
			context,
			info
		);
	}
}

function execute_method(nextql, model, methodName, query, context, info) {
	assertOk(isPlainObject(query), "invalid query", 400);

	const params = query.$params;

	return Promise.resolve(
		model.call(methodName, params, context)
	).then(value => resolve_value(nextql, value, 1, query, context, info));
}

function execute_model(nextql, modelName, query, context, info) {
	assertOk(isPlainObject(query), "invalid query", 400);

	const model = nextql.model(modelName);
	return Promise.all(
		Object.keys(query).map(path => {
			const methodName = path.split(nextql.aliasSeparator, 1)[0];

			return execute_method(
				nextql,
				model,
				methodName,
				query[path],
				context,
				{ result: info.result, path: info.path.concat(path) }
			);
		})
	);
}

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
