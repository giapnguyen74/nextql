"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("./util"),
    assertOk = _require.assertOk;

function mergeOptions(model, options) {
	model.name = options.name;
	Object.assign(model.fields, options.fields);
	Object.assign(model.computed, options.computed);
	Object.assign(model.methods, options.methods);
}

var Model = function () {
	function Model(options) {
		var _this = this;

		_classCallCheck(this, Model);

		options.fields = options.fields || {};
		options.computed = options.computed || {};
		options.methods = options.methods || {};

		this.$options = options;
		this.fields = {};
		this.computed = {};
		this.methods = {};

		if (this.$options.mixins) {
			this.$options.mixins.forEach(function (mixin) {
				return mergeOptions(_this, mixin);
			});
		}
		mergeOptions(this, options);
	}

	_createClass(Model, [{
		key: "call",
		value: function call(methodName) {
			var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			var context = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

			assertOk(this.methods[methodName], "no-method: " + methodName, 404);
			return this.methods[methodName].apply(this, [params, context]);
		}
	}, {
		key: "get",
		value: function get(value, fieldName) {
			var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
			var context = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

			if (this.computed[fieldName]) {
				return this.computed[fieldName].apply(this, [value, params, context]);
			}

			if (this.fields[fieldName]) {
				return value[fieldName];
			}
		}
	}]);

	return Model;
}();

var AnonymousModel = function () {
	function AnonymousModel(fields) {
		_classCallCheck(this, AnonymousModel);

		this.fields = fields;
		this.computed = {};
	}

	_createClass(AnonymousModel, [{
		key: "get",
		value: function get(value, fieldName) {
			assertOk(this.fields[fieldName] != undefined, "no-field: " + fieldName, 400);
			return value[fieldName];
		}
	}]);

	return AnonymousModel;
}();

module.exports = {
	Model,
	AnonymousModel
};