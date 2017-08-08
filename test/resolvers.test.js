const NextQL = require("../src/index");
const nextql = new NextQL();

const {
	resolve_object_value,
	resolve_scalar_value,
	resolve_value,
	resolve_type_define,
	execute_method,
	execute_model,
	NO_MODEL,
	INVALID_MODEL
} = require("../src/resolvers");

class Test {
	constructor(options) {
		Object.assign(this, options);
	}
}

test("resolve_type_define#resolve_def_auto", function() {
	const def = 1;
	expect(resolve_type_define(nextql, "a", def, ["a"])).toBe("*");
	expect(resolve_type_define(nextql, undefined, 1, ["a"])).toBe("*");
	expect(resolve_type_define(nextql, 1, 1, ["a"])).toBe("*");
	expect(resolve_type_define(nextql, {}, def, ["a"])).toBeInstanceOf(
		NO_MODEL
	);
});

test("resolve_type_define#resolve_def_function", function() {
	const def = function(source) {
		return "abc";
	};
	expect(resolve_type_define(nextql, "a", def, ["a"])).toBeInstanceOf(
		NO_MODEL
	);
	expect(resolve_type_define(nextql, {}, def, ["a"])).toBeInstanceOf(
		NO_MODEL
	);
});

test("resolve_type_define#resolve_def_string", function() {
	expect(resolve_type_define(nextql, "a", "abc", ["a"])).toBeInstanceOf(
		NO_MODEL
	);
	expect(resolve_type_define(nextql, {}, "abc", ["a"])).toBeInstanceOf(
		NO_MODEL
	);
});

test("resolve_type_define#resolve_def_scalar", function() {
	expect(resolve_type_define(nextql, "a", "*", ["a"])).toBe("*");
	expect(resolve_type_define(nextql, {}, "*", ["a"])).toBe("*");
});

test("resolve_type_define#invalid_model", function() {
	expect(resolve_type_define(nextql, "a", undefined, ["a"])).toBeInstanceOf(
		INVALID_MODEL
	);

	expect(
		resolve_type_define(nextql, "a", () => undefined, ["a"])
	).toBeInstanceOf(INVALID_MODEL);
});

test("resolve_scalar_value#scalar_as_scalar", async function() {
	let result = {};
	await resolve_scalar_value(nextql, 1, 1, { result, path: ["a", "b"] });
	expect(result).toMatchObject({ a: { b: 1 } });

	result = {};
	await resolve_scalar_value(nextql, undefined, 1, {
		result,
		path: ["a", "b"]
	});
	expect(result).toMatchObject({ a: { b: null } });

	result = {};
	await resolve_scalar_value(nextql, "abc", 1, { result, path: ["a", "b"] });
	expect(result).toMatchObject({ a: { b: "abc" } });

	result = {};
	await resolve_scalar_value(nextql, null, 1, { result, path: ["a", "b"] });
	expect(result).toMatchObject({ a: { b: null } });

	result = {};
	await resolve_scalar_value(nextql, true, 1, { result, path: ["a", "b"] });
	expect(result).toMatchObject({ a: { b: true } });
});

test("resolve_scalar_value#object_as_scalar", async function() {
	let result = {};
	await resolve_scalar_value(nextql, {}, 1, { result, path: ["a", "b"] });
	expect(result).toMatchObject({ a: { b: {} } });

	result = {};
	await resolve_scalar_value(
		nextql,
		{ a: 1, b: { c: 1 }, d: () => true },
		1,
		{ result, path: "a.b" }
	);
	expect(result).toMatchObject({
		a: {
			b: {
				a: 1,
				b: {
					c: 1
				}
			}
		}
	});
});

test("resolve_scalar_value#query_as_object", async function() {
	let result = {};
	await resolve_scalar_value(
		nextql,
		{},
		{ a: 1 },
		{ result, path: "a.b" }
	).catch(err => {
		expect(err).toMatchObject({
			error: "Cannot query scalar as object",
			path: "a.b"
		});
	});
});

test("resolve_object_value#simple_object_simple_query", async function() {
	let result = {};
	const model = nextql.model("test", { fields: { a: 1 } });
	await resolve_object_value(
		nextql,
		{ a: "a" },
		model,
		{ a: 1 },
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({
		root: { a: "a" }
	});
});

test("resolve_object_value#complex_object_invalid_query", async function() {
	let result = {};
	const model = nextql.model("test", { fields: { a: 1 } });
	await resolve_object_value(
		nextql,
		{ a: "a", b: { c: "www" } },
		model,
		{ a: 1, b: { c: 1 } },
		{ result, path: ["root"] }
	).catch(err =>
		expect(err).toMatchObject({
			error: "No field",
			field: "b",
			model: "test"
		})
	);
});

test("resolve_object_value#complex_object_inline_query", async function() {
	let result = {};
	const model = nextql.model("test", { fields: { a: 1, b: { c: 1 } } });
	await resolve_object_value(
		nextql,
		{ a: "a", b: { c: "www" } },
		model,
		{ a: 1, b: { c: 1 } },
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({ root: { a: "a", b: { c: "www" } } });
});

test("resolve_value#invalid_model", async function() {
	let result = {};
	await resolve_value(
		nextql,
		[{ a: "a", b: { c: "www" } }],
		"dafd",
		{ a: 1, b: { c: 1 } },
		{ result, path: ["root"] }
	).catch(err =>
		expect(err).toMatchObject({
			message: "Model not found",
			model: "dafd"
		})
	);

	await resolve_value(
		nextql,
		[{ a: "a", b: { c: "www" } }],
		1,
		{ a: 1, b: { c: 1 } },
		{ result, path: ["root"] }
	).catch(err =>
		expect(err).toMatchObject({
			message: "Model not found",
			model: "Object"
		})
	);
});

test("resolve_value#array_value_object_model", async function() {
	let result = {};
	nextql.model("test", { fields: { a: 1, b: { c: 1 } } });
	await resolve_value(
		nextql,
		[{ a: "a", b: { c: "www" } }],
		"test",
		{ a: 1, b: { c: 1 } },
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({ root: [{ a: "a", b: { c: "www" } }] });
});

test("resolve_value#array_value_scalar", async function() {
	let result = {};

	await resolve_value(nextql, [{ a: "a", b: { c: "www" } }], "*", 1, {
		result,
		path: ["root"]
	});

	expect(result).toMatchObject({ root: [{ a: "a", b: { c: "www" } }] });
});

test("resolve_value#single_value_object_model", async function() {
	let result = {};
	const model = nextql.model("test", { fields: { a: 1, b: { c: 1 } } });
	await resolve_value(
		nextql,
		{ a: "a", b: { c: "www" } },
		"test",
		{ a: 1, b: { c: 1 } },
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({ root: { a: "a", b: { c: "www" } } });
});

test("resolve_value#single_value_scalar", async function() {
	let result = {};

	await resolve_value(nextql, { a: "a", b: { c: "www" } }, "*", 1, {
		result,
		path: ["root"]
	});

	expect(result).toMatchObject({ root: { a: "a", b: { c: "www" } } });
});

test("execute_method#method_auto_return_scalar", async function() {
	let result = {};
	const model = nextql.model("test", {
		fields: { a: 1, b: { c: 1 } },
		methods: {
			test() {
				return "Hello";
			}
		}
	});
	await execute_method(nextql, model, "test", 1, {
		result,
		path: ["root"]
	}).catch(err => console.log(err));

	expect(result).toMatchObject({ root: "Hello" });
});

test("execute_method#method_auto_return_object", async function() {
	let result = {};

	const model = nextql.model("Test", {
		fields: { a: 1, b: { c: 1 } },
		methods: {
			test() {
				return new Test({ a: "a", b: { c: "www" } });
			}
		}
	});
	await execute_method(
		nextql,
		model,
		"test",
		{ a: 1, b: { c: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({ root: { a: "a", b: { c: "www" } } });
});

test("execute_method#method_auto_return_array_object", async function() {
	let result = {};

	const model = nextql.model("Test", {
		fields: { a: 1, b: { c: 1 } },
		returns: {
			test: "Test"
		},
		methods: {
			test() {
				return [{ a: "a", b: { c: "www" } }];
			}
		}
	});
	await execute_method(
		nextql,
		model,
		"test",
		{ a: 1, b: { c: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({ root: [{ a: "a", b: { c: "www" } }] });
});

test("execute_method#method_predefine_return_object", async function() {
	let result = {};

	const model = nextql.model("Test", {
		fields: { a: 1, b: { c: 1 } },
		returns: {
			test: "Test"
		},
		methods: {
			test() {
				return { a: "a", b: { c: "www" } };
			}
		}
	});
	await execute_method(
		nextql,
		model,
		"test",
		{ a: 1, b: { c: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({ root: { a: "a", b: { c: "www" } } });
});

test("execute_method#method_predefine_return_array_object", async function() {
	let result = {};

	const model = nextql.model("Test", {
		fields: { a: 1, b: { c: 1 } },
		methods: {
			test() {
				return [new Test({ a: "a", b: { c: "www" } })];
			}
		}
	});
	await execute_method(
		nextql,
		model,
		"test",
		{ a: 1, b: { c: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({ root: [{ a: "a", b: { c: "www" } }] });
});

test("execute_method#method_fn_return_object", async function() {
	let result = {};

	const model = nextql.model("Test", {
		fields: { a: 1, b: { c: 1 } },
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return { a: "a", b: { c: "www" } };
			}
		}
	});
	await execute_method(
		nextql,
		model,
		"test",
		{ a: 1, b: { c: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({ root: { a: "a", b: { c: "www" } } });
});

test("execute_method#method_predefine_return_array_object", async function() {
	let result = {};

	const model = nextql.model("Test", {
		fields: { a: 1, b: { c: 1 } },
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return [{ a: "a", b: { c: "www" } }];
			}
		}
	});
	await execute_method(
		nextql,
		model,
		"test",
		{ a: 1, b: { c: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({ root: [{ a: "a", b: { c: "www" } }] });
});

test("execute_model#invalid model", async function() {
	let result = {};
	await execute_model(
		nextql,
		"dfads",
		{ test: { a: 1, b: { c: 1 } } },
		{
			result,
			path: ["root"]
		}
	).catch(err =>
		expect(err).toMatchObject({
			message: "Model not defined",
			path: "root"
		})
	);
});

test("execute_model#method_predefine_return_array_object", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 } },
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return [{ a: "a", b: { c: "www" } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 } } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({
		root: { test: [{ a: "a", b: { c: "www" } }] }
	});
});

test("execute_model#scalar_computed", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 } },
		computed: {
			hello() {
				return "hello";
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return [{ a: "a", b: { c: "www" } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 }, hello: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({
		root: { test: [{ a: "a", b: { c: "www" }, hello: "hello" }] }
	});
});

test("execute_model#object_computed", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 } },
		computed: {
			hello() {
				return new Test({ a: "x" });
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return [{ a: "a", b: { c: "www" } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 }, hello: { a: 1 } } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({
		root: { test: [{ a: "a", b: { c: "www" }, hello: { a: "x" } }] }
	});
});

test("execute_model#predefined_object_computed", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 }, hello: "Test" },
		computed: {
			hello() {
				return { a: "x" };
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return [{ a: "a", b: { c: "www" } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 }, hello: { a: 1 } } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({
		root: { test: [{ a: "a", b: { c: "www" }, hello: { a: "x" } }] }
	});
});

test("execute_model#predefined_array_object_computed", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 }, hello: "Test" },
		computed: {
			hello() {
				return [{ a: "x" }];
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return [{ a: "a", b: { c: "www" } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 }, hello: { a: 1 } } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({
		root: { test: [{ a: "a", b: { c: "www" }, hello: [{ a: "x" }] }] }
	});
});

test("execute_model#fn_array_object_computed", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 }, hello: () => "Test" },
		computed: {
			hello() {
				return [{ a: "x" }];
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return [{ a: "a", b: { c: "www" } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 }, hello: { a: 1 } } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({
		root: { test: [{ a: "a", b: { c: "www" }, hello: [{ a: "x" }] }] }
	});
});

test("execute_model#scalar_array_object_computed", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 }, hello: () => "*" },
		computed: {
			hello() {
				return [{ a: "x" }];
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return [{ a: "a", b: { c: "www" } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 }, hello: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({
		root: { test: [{ a: "a", b: { c: "www" }, hello: [{ a: "x" }] }] }
	});
});

test("execute_model#hook", async function() {
	let result = {};

	nextql.afterResolveType(source => (source.a == "x" ? "Test" : undefined));

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 } },
		computed: {
			hello() {
				return [{ a: "x" }];
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test(params) {
				return [{ a: "a", b: { c: params.x } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{
			test: {
				$params: { x: 1 },
				a: 1,

				b: { c: 1 },
				hello: {
					a: 1
				}
			}
		},
		{
			result,
			path: ["root"]
		}
	).catch(err => console.log(err));

	expect(result).toMatchObject({
		root: { test: [{ a: "a", b: { c: 1 }, hello: [{ a: "x" }] }] }
	});
});

test("resolve_scalar_value#error", async function() {
	let result = {};
	await resolve_scalar_value(nextql, () => true, 1, {
		result,
		path: ["root", "x"]
	}).catch(err =>
		expect(err).toMatchObject({
			error: "Cannot serialize return value",
			path: "root.x"
		})
	);
});

test("execute_model#throw_exception_method", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 }, hello: () => "*" },
		computed: {
			hello() {
				return [{ a: "x" }];
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				throw new Error("error");
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 }, hello: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => expect(err.message).toBe("error"));
});

test("execute_model#reject_method", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 }, hello: () => "*" },
		computed: {
			hello() {
				return [{ a: "x" }];
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return Promise.reject("reject");
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 }, hello: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => expect(err).toBe("reject"));
});

test("execute_model#invalid_method", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 }, hello: () => "*" },
		computed: {
			hello() {
				return [{ a: "x" }];
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test() {
				return Promise.reject("reject");
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test2: { a: 1, b: { c: 1 }, hello: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err =>
		expect(err).toMatchObject({
			error: "No method",
			method: "test2",
			model: "Test"
		})
	);
});

test("execute_model#throw_exception_computed", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 }, hello: () => "*" },
		computed: {
			hello() {
				throw new Error("hello");
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test(params) {
				return [{ a: "a", b: { c: params.x } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 }, hello: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => expect(err.message).toBe("hello"));
});

test("execute_model#reject_computed", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 }, hello: () => "*" },
		computed: {
			hello() {
				return Promise.reject("reject");
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test(params) {
				return [{ a: "a", b: { c: params.x } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { c: 1 }, hello: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err => expect(err).toBe("reject"));
});

test("execute_model#no_inline_field", async function() {
	let result = {};

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1 }, hello: () => "*" },
		computed: {
			hello() {
				return true;
			}
		},
		returns: {
			test: () => "Test"
		},
		methods: {
			test(params) {
				return [{ a: "a", b: { c: params.x } }];
			}
		}
	});
	await execute_model(
		nextql,
		"Test",
		{ test: { a: 1, b: { d: 1 }, hello: 1 } },
		{
			result,
			path: ["root"]
		}
	).catch(err =>
		expect(err).toMatchObject({
			error: "No field",
			field: "d",
			model: "$inline",
			path: "root.test.0.b.d"
		})
	);
});
