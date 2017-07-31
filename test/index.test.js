const NextQL = require("../src");
const nextql = new NextQL();
const {
	resolve_no_type_value,
	resolve_typed_value,
	resolve_auto_type_value
} = NextQL.resolvers;

test("nextql#resolve_no_type_value: simple", function(done) {
	const result = {};
	resolve_no_type_value(
		nextql,
		{ a: "hello" },
		{ a: 1 },
		{},
		{ result, path: ["x"] }
	).then(() => {
		expect(result).toMatchObject({ x: { a: "hello" } });
		done();
	});
});

test("nextql#resolve_no_type_value: complex", function(done) {
	const result = {};
	resolve_no_type_value(
		nextql,
		{ a: "hello", b: { c: "hello" } },
		{ a: 1, b: { c: 1 } },
		{},
		{ result, path: ["x"] }
	).then(() => {
		expect(result).toMatchObject({ x: { a: "hello", b: { c: "hello" } } });
		done();
	});
});

test("nextql#resolve_typed_value: simple", function(done) {
	nextql.model("model1", {
		fields: {
			a: 1,
			b: 1
		}
	});
	const result = {};

	resolve_typed_value(
		nextql,
		{ a: "a", b: "b" },
		nextql.model("model1"),
		{ a: 1, b: 1 },
		{},
		{
			result,
			path: ["x"]
		}
	).then(() => {
		expect(result).toMatchObject({
			x: {
				a: "a",
				b: "b"
			}
		});
		done();
	});
});

test("nextql#resolve_typed_value: nested", async function() {
	nextql.model("model1", {
		fields: {
			a: 1,
			b: {
				c: 1,
				d: {
					e: 1
				}
			}
		}
	});
	const result = {};

	await resolve_typed_value(
		nextql,
		{ a: "a", b: { c: "c", d: { e: "e" } } },
		nextql.model("model1"),
		{ a: 1, b: { c: 1, d: { e: 1 } } },
		{},
		{
			result,
			path: ["x"]
		}
	).then(() => {
		expect(result).toMatchObject({
			x: {
				a: "a",
				b: { c: "c", d: { e: "e" } }
			}
		});
	});
});

test("nextql#resolve_typed_value: ref", async function() {
	nextql.model("model2", {
		fields: {
			x: 1,
			y: 1
		}
	});

	nextql.model("model1", {
		fields: {
			a: 1,
			b: "model2"
		}
	});
	const result = {};

	await resolve_typed_value(
		nextql,
		{ a: "a", b: { x: "x", y: "y" } },
		nextql.model("model1"),
		{ a: 1, b: { x: 1, y: 1 } },
		{},
		{
			result,
			path: ["x"]
		}
	).then(() => {
		expect(result).toMatchObject({
			x: {
				a: "a",
				b: { x: "x", y: "y" }
			}
		});
	});
});

test("nextql#resolve_auto_type_value single", async function() {
	let result = {};
	const path = ["x"];
	await resolve_auto_type_value(
		nextql,
		undefined,
		{ a: 1 },
		{},
		{ result, path }
	);

	expect(result).toMatchObject({});

	await resolve_auto_type_value(nextql, 1, { a: 1 }, {}, { result, path });
	expect(result).toMatchObject({
		x: 1
	});

	result = {};

	await resolve_auto_type_value(
		nextql,
		{ a: "x" },
		{ a: 1 },
		{},
		{ result, path }
	);
	expect(result).toMatchObject({
		x: {
			a: "x"
		}
	});
});
