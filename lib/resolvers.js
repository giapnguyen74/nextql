"use strict";

var _require = require("./model");

const InlineModel = _require.InlineModel;

var _require2 = require("./util");

const isPrimitive = _require2.isPrimitive,
      NextQLError = _require2.NextQLError;

const set = require("lodash.set");

function info_append_path(info, path) {
	return Object.assign({}, info, {
		path: info.path.concat(path)
	});
}

/**
 * Give field value and field define, resolve field model or error
 * field path provided for log
 * @param {*} nextql 
 * @param {string} path 
 * @param {*} value 
 * @param {*} typeDef
 * @return {*} model
 */
function resolve_type_define(nextql, fieldValue, fieldDefine, fieldPath) {
	let fieldModel;

	if (fieldDefine == undefined) {
		return new NextQLError("Cannot resolve model: " + JSON.stringify(fieldDefine), { path: fieldPath });
	}

	if (fieldDefine.constructor && fieldDefine.constructor == Object) {
		return new InlineModel(fieldDefine);
	}

	if (fieldDefine === 1) {
		if (isPrimitive(fieldValue)) {
			fieldModel = "*";
		} else {
			fieldModel = nextql.resolveType(fieldValue);
			nextql.afterResolveTypeHooks.forEach(hook => fieldModel = hook(fieldValue) || fieldModel);
		}
	}

	if (typeof fieldDefine == "function") {
		fieldModel = fieldDefine(fieldValue);
	}

	if (typeof fieldDefine == "string") {
		fieldModel = fieldDefine;
	}

	if (fieldModel == undefined) {
		return new NextQLError("Cannot resolve model: " + JSON.stringify(fieldDefine), { path: fieldPath });
	}

	//scalar field
	if (fieldModel === "*") {
		return fieldModel;
	}

	const model = nextql.model(fieldModel);
	if (!model) {
		return new NextQLError("Model not found: " + fieldModel, {
			path: fieldPath
		});
	}

	return model;
}

/**
 * Given value and valueQuery; resolve value as a scalar
 * @param {*} nextql 
 * @param {*} value 
 * @param {*} valueQuery 
 * @param {*} info 
 */
function resolve_scalar_value(nextql, value, valueQuery, info) {
	if (value == undefined) {
		set(info.result, info.path, null);
		return Promise.resolve();
	}

	if (valueQuery !== 1) {
		const keylen = Object.keys(valueQuery).length;
		const queryAsObject = valueQuery.$params ? keylen > 1 : keylen > 0;
		if (queryAsObject) {
			return Promise.reject(new NextQLError("Cannot query scalar as object", info));
		}
	}

	if (isPrimitive(value)) {
		set(info.result, info.path, value);
		return Promise.resolve();
	}

	// non-primitive value as scalar, not good solution yet
	try {
		set(info.result, info.path, JSON.parse(JSON.stringify(value)));
		return Promise.resolve();
	} catch (e) {
		return Promise.reject(new NextQLError("Cannot serialize return value", info));
	}
}

/**
 * Given value, valueModel, valueQuery; recursive resolve field value 
 * @param {*} nextql 
 * @param {*} value 
 * @param {*} valueModel 
 * @param {*} valueQuery 
 * @param {*} info 
 * @param {*} context 
 */
function resolve_object_value(nextql, value, valueModel, valueQuery, info, context) {
	return Promise.all(Object.keys(valueQuery).map(path => {
		if (path == "$params") return;
		const newInfo = info_append_path(info, path);

		const fieldName = path.split(nextql.aliasSeparator, 1)[0];
		return valueModel.get(value, fieldName, valueQuery[path].$params, context, newInfo).then(fieldValue => {
			let fieldDef;
			if (valueModel.computed[fieldName]) {
				fieldDef = valueModel.fields[fieldName] || 1;
			} else {
				fieldDef = valueModel.fields[fieldName];
			}

			return resolve_value(nextql, fieldValue, fieldDef, valueQuery[path], newInfo, context);
		});
	}));
}

function resolve_value(nextql, value, modelDef, valueQuery, info, context) {
	//Support value as Promise
	if (value && value.then) {
		return value.then(v => resolve_value(nextql, v, modelDef, valueQuery, info, context));
	}

	if (Array.isArray(value)) {
		return Promise.all(value.map((v, idx) => resolve_value(nextql, v, modelDef, valueQuery, info_append_path(info, idx), context)));
	}

	const valueModel = resolve_type_define(nextql, value, modelDef, info.path);

	if (valueModel instanceof NextQLError) {
		return Promise.reject(valueModel);
	}

	if (valueModel === "*") {
		return resolve_scalar_value(nextql, value, valueQuery, info, context);
	}

	return resolve_object_value(nextql, value, valueModel, valueQuery, info, context);
}

function execute_method(nextql, model, methodPath, methodQuery, info, context) {
	const methodName = methodPath.split(nextql.aliasSeparator, 1)[0];

	return model.call(methodName, methodQuery.$params, context, info).then(value => {
		const returnDef = model.returns[methodName] == undefined ? 1 : model.returns[methodName];

		return resolve_value(nextql, value, returnDef, methodQuery, info, context);
	});
}

function execute_model(nextql, modelName, modelQuery, info, context) {
	const model = nextql.model(modelName);
	if (!model) {
		return Promise.reject(new NextQLError("Model not defined: " + modelName, info));
	}

	return Promise.all(Object.keys(modelQuery).map(path => execute_method(nextql, model, path, modelQuery[path], info_append_path(info, path), context)));
}

module.exports = {
	resolve_object_value,
	resolve_scalar_value,
	resolve_value,
	resolve_type_define,
	execute_method,
	execute_model
};