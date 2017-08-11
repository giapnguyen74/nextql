const NextQL = require("../src/index");
const nextql = new NextQL();

const { execute_conditional, execute_model } = require("../src/resolvers");

const { NextQLError } = require("../src/util");

test("execute_conditional#simple", async function() {
	let result = {};
	const model = nextql.model("test", {
		fields: { a: 1, b: 1 },
		computed: {
			"?what": function() {
				return "test";
			}
		}
	});
	await execute_conditional(
		nextql,
		{ a: "a", b: "b" },
		model,
		"?what",
		{ b: 1 },
		{ result, path: ["root"] }
	);
	expect(result).toMatchObject({ root: { b: "b" } });
});

test("execute_conditional#morph_class", async function() {
	let result = {};

	const bmodel = nextql.model("bmodel", {
		fields: { b: 1 },
		computed: {
			"?what": function() {
				return "test";
			}
		}
	});

	const amodel = nextql.model("amodel", {
		fields: { a: 1 },
		computed: {
			"?b": function(source) {
				if (source.b) {
					return "bmodel";
				}
			}
		}
	});
	await execute_conditional(
		nextql,
		{ a: "a", b: "b" },
		amodel,
		"?b",
		{ b: 1 },
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({ root: { b: "b" } });
});

test("execute_conditional#nest_conditional", async function() {
	let result = {};

	const bmodel = nextql.model("bmodel", {
		fields: { b: 1 },
		computed: {
			"?a": function(source) {
				if (source.a) {
					return "amodel";
				}
			}
		}
	});

	const amodel = nextql.model("amodel", {
		fields: { a: 1 },
		computed: {
			"?b": function(source) {
				if (source.b) {
					return "bmodel";
				}
			}
		}
	});
	await execute_conditional(
		nextql,
		{ a: "a", b: "b" },
		amodel,
		"?b",
		{ b: 1, "?a": { a: 1 } },
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({ root: { b: "b", a: "a" } });
});

test("execute_conditional#recursive_conditional", async function() {
	let result = {};

	const bmodel = nextql.model("bmodel", {
		fields: { b: 1 },
		computed: {
			"?a": function(source) {
				if (source.a) {
					return "amodel";
				}
			}
		}
	});

	const amodel = nextql.model("amodel", {
		fields: { a: 1 },
		computed: {
			"?b": function(source) {
				if (source.b) {
					return "bmodel";
				}
			}
		}
	});
	await execute_conditional(
		nextql,
		{ a: "a", b: "b" },
		amodel,
		"?b",
		{ b: 1, "?a": { a: 1, "?b": { b: 1 } } },
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({ root: { b: "b", a: "a" } });
});

test("execute_conditional#invalid", async function() {
	let result = {};
	const model = nextql.model("test", {
		fields: { a: 1, b: 1 },
		computed: {
			"?what": function() {
				return "test";
			}
		}
	});
	await execute_conditional(
		nextql,
		{ a: "a", b: "b" },
		model,
		"?u",
		{ b: 1 },
		{ result, path: ["root"] }
	).catch(err =>
		expect(err.message).toBe("No conditional: test.?u - path: root")
	);
});

test("execute_conditional#invalid_return_conditional", async function() {
	let result = {};
	const model = nextql.model("test", {
		fields: { a: 1, b: 1, c: { d: 1 } },
		computed: {
			"?what": function() {
				return "*";
			}
		}
	});
	await execute_conditional(
		nextql,
		{ a: "a", b: "b" },
		model,
		"?what",
		{ c: 1 },
		{ result, path: ["root"] }
	);
	expect(result).toMatchObject({});
});

test("execute_model#simple_conditional", async function() {
	let result = {};

	const bmodel = nextql.model("bmodel", {
		fields: { b: 1 },
		computed: {
			"?a": function(source) {
				if (source.a) {
					return "amodel";
				}
			}
		}
	});

	const amodel = nextql.model("amodel", {
		fields: { a: 1 },
		computed: {
			"?b": function(source) {
				if (source.b) {
					return "bmodel";
				}
			}
		},
		methods: {
			test() {
				return { a: "a", b: "b" };
			}
		},
		returns: {
			test: "amodel"
		}
	});
	await execute_model(
		nextql,
		"amodel",
		{
			test: {
				a: 1,
				"?b": {
					b: 1
				}
			}
		},
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({ root: { test: { b: "b", a: "a" } } });
});

test("execute_model#alias_conditional", async function() {
	let result = {};

	const bmodel = nextql.model("bmodel", {
		fields: { b: 1 },
		computed: {
			"?a": function(source) {
				if (source.a) {
					return "amodel";
				}
			}
		}
	});

	const amodel = nextql.model("amodel", {
		fields: { a: 1 },
		computed: {
			"?b": function(source) {
				if (source.b) {
					return "bmodel";
				}
			}
		},
		methods: {
			test() {
				return { a: "a", b: "b" };
			}
		},
		returns: {
			test: "amodel"
		}
	});
	await execute_model(
		nextql,
		"amodel",
		{
			test: {
				a: 1,
				"?b/dafsdf": {
					b: 1
				}
			}
		},
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({ root: { test: { b: "b", a: "a" } } });
});

test("execute_model#params_conditional", async function() {
	let result = {};

	nextql.model("any", {
		computed: {
			"?model": function(source, { name }) {
				if (name == "a" && source.a) {
					return "amodel";
				}
				if (name == "b" && source.b) {
					return "bmodel";
				}
			}
		}
	});

	nextql.model("bmodel", {
		fields: { b: 1 }
	});

	const amodel = nextql.model("amodel", {
		fields: { a: 1 },

		methods: {
			test() {
				return [{ a: "a" }, { b: "b" }, { a: "a", b: "b" }];
			}
		},
		returns: {
			test: "any"
		}
	});
	await execute_model(
		nextql,
		"amodel",
		{
			test: {
				"?model/a": {
					$params: { name: "a" },
					a: 1
				},
				"?model/b": {
					$params: { name: "b" },
					b: 1
				}
			}
		},
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({
		root: { test: [{ a: "a" }, { b: "b" }, { b: "b", a: "a" }] }
	});
});

test("execute_model#mix_with_unresolve_value", async function() {
	let result = {};

	nextql.model("any", {
		computed: {
			"?model": function(source, { name }) {
				if (name == "a" && source.a) {
					return "amodel";
				}
				if (name == "b" && source.b) {
					return "bmodel";
				}
			}
		}
	});

	nextql.model("bmodel", {
		fields: { b: 1 }
	});

	const amodel = nextql.model("amodel", {
		fields: { a: 1, c: 1 },

		methods: {
			test() {
				return [{ a: "a" }, { b: "b" }, { a: "a", b: "b" }, { c: "c" }];
			}
		},
		returns: {
			test: "any"
		}
	});
	await execute_model(
		nextql,
		"amodel",
		{
			test: {
				"?model/a": {
					$params: { name: "a" },
					a: 1
				},
				"?model/b": {
					$params: { name: "b" },
					b: 1
				}
			}
		},
		{ result, path: ["root"] }
	);

	expect(result).toMatchObject({
		root: { test: [{ a: "a" }, { b: "b" }, { b: "b", a: "a" }, null] }
	});
});
