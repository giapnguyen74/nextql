const NextQL = require("../src/index");
const nextql = new NextQL();

test("plugin#function", function() {
	nextql.use(function(nq) {
		expect(nextql == nq);
	});
});

test("plugin#object", function() {
	nextql.use({
		install: function(nq) {
			expect(nextql == nq);
		}
	});
});

test("plugin#beforeCreate", function() {
	nextql.use(function(nq) {
		nq.beforeCreate(options => {
			expect(options.fields).not.toBe(undefined);
		});
	});
});

test("execute", async function() {
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
	const result = await nextql
		.execute({
			Test: {
				test: {
					$params: { x: 1 },
					a: 1,

					b: { c: 1 },
					hello: {
						a: 1
					}
				}
			}
		})
		.catch(err => console.log(err));

	expect(result).toMatchObject({
		Test: { test: [{ a: "a", b: { c: 1 }, hello: [{ a: "x" }] }] }
	});
});

test("execute#alias", async function() {
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
	const result = await nextql
		.execute({
			Test: {
				test: {
					$params: { x: 1 },
					a: 1,

					b: { c: 1 },
					hello: {
						a: 1
					},
					"hello/2": {
						a: 1
					}
				},
				"test/2": {
					a: 1
				}
			}
		})
		.catch(err => console.log(err));

	expect(result).toMatchObject({
		Test: {
			test: [
				{
					a: "a",
					b: { c: 1 },
					hello: [{ a: "x" }],
					"hello/2": [{ a: "x" }]
				}
			],
			"test/2": [{ a: "a" }]
		}
	});
});

test("execute#invalid_query", async function() {
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
	const result = await nextql
		.execute(1)
		.catch(err => expect(err).toMatchObject({ error: "Invalid query" }));
});
