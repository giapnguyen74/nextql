const mongoose = require("mongoose");

/** Simply convert mongoose schema to nextql fields */
function normalizeFields(fields) {
	const _fields = {};
	Object.keys(fields).forEach(k => {
		if (fields[k].constructor == Object && !fields[k].type) {
			_fields[k] = normalizeFields(fields[k]);
		} else {
			_fields[k] = 1;
		}
	});
	return _fields;
}
function hookBeforeCreate(options) {
	if (options.mongoose) {
		const model = mongoose.model(options.name, options.fields);
		options.fields = normalizeFields(options.fields);

		options.methods = Object.assign(
			{
				get({ id }) {
					return model.findById(id);
				},
				find() {
					return model.find();
				},
				create({ data }) {
					var ins = new model(data);
					return ins.save();
				},
				update({ id, data }) {
					return model.findById(id).then(ins => {
						Object.keys(data).forEach(path =>
							ins.set(path, data[path])
						);
						return ins.save();
					});
				},
				remove({ id }) {
					return model.findByIdAndRemove(id);
				}
			},
			options.methods
		);
	}
}

function hookAfterResolveType(source) {
	return source.constructor && source.constructor.modelName;
}

module.exports = {
	install(nextql) {
		nextql.beforeCreate(hookBeforeCreate);
		nextql.afterResolveType(hookAfterResolveType);
	}
};
