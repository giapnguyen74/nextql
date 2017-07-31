"use strict";

var _require = require("./model");

const Model = _require.Model,
      AnonymousModel = _require.AnonymousModel;

var _require2 = require("./util");

const isPlainObject = _require2.isPlainObject,
      assertOk = _require2.assertOk;


function resolve_no_type_value(nextql, value, query, context) {
	const results = {};
	return Promise.all(Object.keys(query).map(path => {
		if (path == "$params") return;
		return resolve_value(nextql, nextql.defaultFieldResolver(value, fieldName), 1, query[path], context);
	})).then(() => results);
}

function resolve_typed_value(nextql, value, valueModel, query, context) {
	const results = {};
	return Promise.all(Object.keys(query).map(path => {
		if (path == "$params") return;

		const fieldName = path.split(nextql.aliasSeparator, 1)[0];
		return Promise.resolve(model.get(value, fieldName, query.$params, context)).then(fieldValue => {
			if (valueModel.computed[fieldName] || valueModel.fields[fieldName] === 1) {
				return resolve_value(nextql, fieldValue, 1, query[path], context);
			}

			if (isPlainObject(valueModel.fields[fieldName])) {
				return resolve_value(nextql, value, new AnonymousModel(valueModel.fields[fieldName]), query[path], context);
			}
		}).then(fieldValue => fieldValue != undefined ? results[paht] = fieldValue : undefined);
	})).then(() => results);
}

function resolve_auto_type_value(nextql, value, query, context) {
	if (typeof value != "object") {
		return value; //primitive type
	}

	if (typeof value == "object" && isPlainObject(query)) {
		let modelName = nextql.resolveType(value);
		nextql.afterResolveTypeHooks.forEach(hook => modelName = hook(value) || modelName);

		return typeof modelName == "string" ? resolve_typed_value(nextql, value, nextql.model(modelName), query, context) : resolve_no_type_value(nextql, value, query, context);
	}
}

function resolve_value(nextql, value, valueModel, query, context) {
	if (value == undefined) return;
	if (typeof value == "function") return;

	if (Array.isArray(value)) {
		const results = [];
		return Promise.all(value.map(v => resolve_value(nextql, v, valueModel, query, context).then(r => r != undefined ? results.push(r) : undefined))).then(() => results);
	}

	if (valueModel === 1) {
		return resolve_auto_type_value(nextql, value, query, context);
	} else {
		return resolve_typed_value(nextql, value, valueModel, query, context);
	}
}

function execute_method(nextql, model, methodName, query, context) {
	assertOk(isPlainObject(query), "invalid query", 400);

	const params = query.$params;

	return Promise.resolve(model.call(methodName, params, context)).then(value => this.resolve_value(nextql, value, 1, query, context));
}

function execute_model(nextql, modelName, query, context) {
	assertOk(isPlainObject(query), "invalid query", 400);

	let result = {};
	const model = nextql.model(modelName);
	return Promise.all(Object.keys(query).map(path => {
		const methodName = path.split(nextql.aliasSeparator, 1)[0];

		return execute_method(nextql, model, methodName, query[path], context).then(value => value != undefined ? result[path] = value : undefined);
	})).then(() => result);
}

const defaultFieldResolver = (value, fieldName) => value[fieldName];
const defaultResolveType = value => value.constructor && value.constructor.name;

class NextQL {
	constructor(options = {}) {
		this.aliasSeparator = options.aliasSeparator || "/";
		this.defaultFieldResolver = options.defaultFieldResolver || defaultFieldResolver;
		this.resolveType = options.resolveType || defaultResolveType;

		this.beforeCreateHooks = [];
		this.models = {};
		this.afterResolveTypeHooks = [];
	}

	model(name) {
		if (!options) {
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
		return Promise.all(Object.keys(query).map(path => {
			const modelName = path.split(this.aliasSeparator, 1)[0];
			return execute_model(this, modelName, query[path], context).then(value => value != undefined ? result[path] = value : undefined);
		})).then(() => result);
	}

	use(plugin, options) {
		if (typeof plugin == "function") {
			plugin(this, options);
		} else {
			plugin.install(this, options);
		}
		return this;
	}
}

module.exports = NextQL;