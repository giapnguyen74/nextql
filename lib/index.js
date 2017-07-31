"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("./model"),
    Model = _require.Model,
    AnonymousModel = _require.AnonymousModel;

var _require2 = require("./util"),
    isPlainObject = _require2.isPlainObject,
    assertOk = _require2.assertOk;

var _set = require("lodash.set");

/**
 * Given a value has no type, resolve as plain object
 */
function resolve_no_type_value(nextql, value, query, context, info) {
	return Promise.all(Object.keys(query).map(function (path) {
		if (path == "$params") return;
		return resolve_value(nextql, nextql.defaultFieldResolver(value, path), 1, query[path], context, {
			result: info.result,
			path: info.path.concat(path)
		});
	}));
}

function resolve_typed_value(nextql, value, valueModel, query, context, info) {
	return Promise.all(Object.keys(query).map(function (path) {
		if (path == "$params") return;

		var fieldName = path.split(nextql.aliasSeparator, 1)[0];
		return Promise.resolve(valueModel.get(value, fieldName, query[path].$params, context)).then(function (fieldValue) {
			if (valueModel.computed[fieldName] || valueModel.fields[fieldName] === 1) {
				return resolve_value(nextql, fieldValue, 1, query[path], context, {
					result: info.result,
					path: info.path.concat(path)
				});
			}

			if (typeof valueModel.fields[fieldName] == "string") {
				return resolve_value(nextql, fieldValue, nextql.model(valueModel.fields[fieldName]), query[path], context, {
					result: info.result,
					path: info.path.concat(path)
				});
			}

			if (isPlainObject(valueModel.fields[fieldName])) {
				return resolve_value(nextql, fieldValue, new AnonymousModel(valueModel.fields[fieldName]), query[path], context, {
					result: info.result,
					path: info.path.concat(path)
				});
			}
		});
	}));
}

function resolve_auto_type_value(nextql, value, query, context, info) {
	if (value == undefined) {
		return;
	}

	if (typeof value != "object") {
		_set(info.result, info.path, value);
		return;
	}

	if (typeof value == "object" && isPlainObject(query)) {
		var modelName = nextql.resolveType(value);
		nextql.afterResolveTypeHooks.forEach(function (hook) {
			return modelName = hook(value) || modelName;
		});
		return modelName == "Object" ? resolve_no_type_value(nextql, value, query, context, info) : resolve_typed_value(nextql, value, nextql.model(modelName), query, context, info);
	}
}

function resolve_value(nextql, value, valueModel, query, context, info) {
	if (value == undefined) return;
	if (typeof value == "function") return;

	if (Array.isArray(value)) {
		return Promise.all(value.map(function (v, idx) {
			return resolve_value(nextql, v, valueModel, query, context, {
				result: info.result,
				path: info.path.concat(idx)
			});
		}));
	}

	if (valueModel === 1) {
		return Promise.resolve(resolve_auto_type_value(nextql, value, query, context, info));
	} else {
		return Promise.resolve(resolve_typed_value(nextql, value, valueModel, query, context, info));
	}
}

function execute_method(nextql, model, methodName, query, context, info) {
	assertOk(isPlainObject(query), "invalid query", 400);

	var params = query.$params;

	return Promise.resolve(model.call(methodName, params, context)).then(function (value) {
		return resolve_value(nextql, value, 1, query, context, info);
	});
}

function execute_model(nextql, modelName, query, context, info) {
	assertOk(isPlainObject(query), "invalid query", 400);

	var model = nextql.model(modelName);
	return Promise.all(Object.keys(query).map(function (path) {
		var methodName = path.split(nextql.aliasSeparator, 1)[0];

		return execute_method(nextql, model, methodName, query[path], context, { result: info.result, path: info.path.concat(path) });
	}));
}

var defaultFieldResolver = function defaultFieldResolver(value, fieldName) {
	return value[fieldName];
};
var defaultResolveType = function defaultResolveType(value) {
	return value.constructor && value.constructor.name;
};

var NextQL = function () {
	function NextQL() {
		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_classCallCheck(this, NextQL);

		this.aliasSeparator = options.aliasSeparator || "/";
		this.defaultFieldResolver = options.defaultFieldResolver || defaultFieldResolver;
		this.resolveType = options.resolveType || defaultResolveType;

		this.beforeCreateHooks = [];
		this.models = {};
		this.afterResolveTypeHooks = [];
	}

	_createClass(NextQL, [{
		key: "model",
		value: function model(name, options) {
			if (!options) {
				assertOk(this.models[name], "no-model: " + name, 400);
				return this.models[name];
			}

			options.name = name;
			this.beforeCreateHooks.forEach(function (hook) {
				return hook(options);
			});

			this.models[name] = new Model(options);
			return this.models[name];
		}
	}, {
		key: "execute",
		value: function execute(query, context) {
			var _this = this;

			assertOk(isPlainObject(query), "invalid query", 400);

			var result = {};

			return Promise.all(Object.keys(query).map(function (path) {
				var modelName = path.split(_this.aliasSeparator, 1)[0];
				return execute_model(_this, modelName, query[path], context, {
					result,
					path: [path]
				});
			})).then(function () {
				return result;
			});
		}
	}, {
		key: "use",
		value: function use(plugin, options) {
			if (typeof plugin == "function") {
				plugin(this, options);
			} else {
				plugin.install(this, options);
			}
			return this;
		}
	}]);

	return NextQL;
}();

module.exports = NextQL;

module.exports.resolvers = {
	resolve_no_type_value,
	resolve_typed_value,
	resolve_auto_type_value,
	resolve_value
};