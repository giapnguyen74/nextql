const { InlineModel } = require("./model");
const { isPrimitive, NextQLError } = require("./util");
//const set = require("lodash.set");

function set(obj, path, value) {
	const len = path.length - 1;
	let node = obj;
	for (let i = 0; i < len; i++) {
		if (node[path[i]] == undefined) {
			if (Number.isInteger(path[i + 1])) {
				node[path[i]] = [];
			} else {
				node[path[i]] = {};
			}
		}
		node = node[path[i]];
	}
	node[path[len]] = value;
}

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
	let fd = fieldDefine;
	// First phrase resolve fieldDefine is auto or function into final fieldDefine
	if (fd === 1) {
		if (isPrimitive(fieldValue)) {
			return "*";
		} else {
			fd = nextql.resolveType(fieldValue);
			nextql.afterResolveTypeHooks.forEach(
				hook => (fd = hook(fieldValue) || fd)
			);
		}
	}

	if (typeof fd == "function") {
		fd = fieldDefine(fieldValue);
	}

	// Second phrase resolve fieldDefine is explicit into fieldModel name;
	if (fd == undefined) {
		return new NextQLError(
			"Cannot resolve model: " + JSON.stringify(fieldDefine),
			{ path: fieldPath }
		);
	}

	// InlineModel
	if (fd.constructor && fd.constructor == Object) {
		return new InlineModel(fd);
	}

	// ScalarModel
	if (fd === "*") {
		return "*";
	}

	// NamedModel
	const model = nextql.model(fd);
	if (!model) {
		return new NextQLError("Model not found: " + fd, {
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
			return Promise.reject(
				new NextQLError("Cannot query scalar as object", info)
			);
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
		return Promise.reject(
			new NextQLError("Cannot serialize return value", info)
		);
	}
}

/**
 * Given value, valueModel and conditional path; call conditional function and process result
 * @param {*} nextql 
 * @param {*} value 
 * @param {*} valueModel 
 * @param {*} conditionalQuery 
 * @param {*} info 
 * @param {*} context 
 */
function execute_conditional(
	nextql,
	value,
	valueModel,
	conditional,
	query,
	info,
	context
) {
	let model;

	const modelName = valueModel.check(
		value,
		conditional,
		query.$params,
		context,
		info
	);

	if (modelName instanceof Error) {
		return Promise.reject(modelName);
	}

	if (modelName === true) {
		model = valueModel;
	}

	if (typeof modelName == "string" && modelName != "*") {
		model = nextql.model(modelName);
	}

	if (!model) return Promise.resolve();

	return resolve_object_value(nextql, value, model, query, info, context);
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
function resolve_object_value(
	nextql,
	value,
	valueModel,
	valueQuery,
	info,
	context
) {
	if (value == undefined) {
		set(info.result, info.path, null);
		return Promise.resolve();
	}

	if (isPrimitive(value)) {
		return Promise.reject(
			new NextQLError("Cannot query scalar as " + valueModel.name, info)
		);
	}

	return Promise.all(
		Object.keys(valueQuery).map(path => {
			if (path == "$params") return;
			const fieldName = path.split(nextql.aliasSeparator, 1)[0];

			//Conditional query?
			if (fieldName[0] === "?") {
				return execute_conditional(
					nextql,
					value,
					valueModel,
					fieldName,
					valueQuery[path],
					info,
					context
				);
			}

			const newInfo = info_append_path(info, path);
			return valueModel
				.get(
					value,
					fieldName,
					valueQuery[path].$params,
					context,
					newInfo
				)
				.then(fieldValue => {
					let fieldDef;
					if (valueModel.computed[fieldName]) {
						fieldDef = valueModel.fields[fieldName] || 1;
					} else {
						fieldDef = valueModel.fields[fieldName];
					}

					return resolve_value(
						nextql,
						fieldValue,
						fieldDef,
						valueQuery[path],
						newInfo,
						context
					);
				});
		})
	);
}

function resolve_value(nextql, value, modelDef, valueQuery, info, context) {
	//Support value as Promise
	if (value && value.then) {
		return value.then(v =>
			resolve_value(nextql, v, modelDef, valueQuery, info, context)
		);
	}

	if (Array.isArray(value)) {
		return Promise.all(
			value.map((v, idx) => {
				//Fill array with null value first
				const newInfo = info_append_path(info, idx);
				set(newInfo.result, newInfo.path, null);
				return resolve_value(
					nextql,
					v,
					modelDef,
					valueQuery,
					newInfo,
					context
				);
			})
		);
	}

	const valueModel = resolve_type_define(nextql, value, modelDef, info.path);

	if (valueModel instanceof NextQLError) {
		return Promise.reject(valueModel);
	}

	if (valueModel === "*") {
		return resolve_scalar_value(nextql, value, valueQuery, info, context);
	}

	return resolve_object_value(
		nextql,
		value,
		valueModel,
		valueQuery,
		info,
		context
	);
}

function execute_method(nextql, model, methodPath, methodQuery, info, context) {
	const methodName = methodPath.split(nextql.aliasSeparator, 1)[0];

	return model
		.call(methodName, methodQuery.$params, context, info)
		.then(value => {
			const returnDef =
				model.returns[methodName] == undefined
					? 1
					: model.returns[methodName];

			return resolve_value(
				nextql,
				value,
				returnDef,
				methodQuery,
				info,
				context
			);
		});
}

function execute_model(nextql, modelName, modelQuery, info, context) {
	const model = nextql.model(modelName);
	if (!model) {
		return Promise.reject(
			new NextQLError("Model not defined: " + modelName, info)
		);
	}

	return Promise.all(
		Object.keys(modelQuery).map(path =>
			execute_method(
				nextql,
				model,
				path,
				modelQuery[path],
				info_append_path(info, path),
				context
			)
		)
	);
}

module.exports = {
	resolve_object_value,
	resolve_scalar_value,
	resolve_value,
	resolve_type_define,
	execute_conditional,
	execute_method,
	execute_model
};
