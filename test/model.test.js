const { Model, AnonymousModel } = require("../src/model");
test("anonymous model#new", function() {
	const model = new AnonymousModel({ a: 1, b: 1 });
	expect(model.fields).toMatchObject({ a: 1, b: 1 });
});

test("anonymous model#get ok", function() {
	const model = new AnonymousModel({ a: 1, b: 1 });
	expect(model.get({ a: "hello" }, "a")).toBe("hello");
});

test("anonymous model#get fail", function() {
	const model = new AnonymousModel({ a: 1, b: 1 });
	expect(() => model.get({ a: "hello" }, "x")).toThrowError();
});

test("model#mixins", function() {
	const model1 = {
		fields: {
			a: 1
		}
	};

	const model = {
		mixins: [model1],
		fields: {
			b: 1
		}
	};

	const m = new Model(model);
	expect(m.fields).toMatchObject({ a: 1, b: 1 });
});

test("model#call", function() {
	const model = {
		methods: {
			a() {
				return "a called";
			}
		}
	};
	const m = new Model(model);

	expect(m.call("a", {})).toBe("a called");
});

test("model#call no-method", function() {
	const model = {
		methods: {
			a() {
				return "a called";
			}
		}
	};
	const m = new Model(model);

	expect(() => m.call("b", {})).toThrowError();
});

test("model#get", function() {
	const model = {
		fields: {
			a: 1
		}
	};
	const m = new Model(model);

	expect(m.get({ a: "hello" }, "a")).toBe("hello");
});

test("model#get undefined", function() {
	const model = {
		fields: {
			a: 1
		}
	};
	const m = new Model(model);

	expect(m.get({ b: "hello" }, "a")).toBe(undefined);
	expect(m.get({ b: "hello" }, "c")).toBe(undefined);
});

test("model#get computed", function() {
	const model = {
		fields: {
			a: 1
		},
		computed: {
			a() {
				return "b";
			},
			b() {
				return "c";
			}
		}
	};
	const m = new Model(model);

	expect(m.get({ a: "hello" }, "b")).toBe("c");
	expect(m.get({ a: "hello" }, "a")).toBe("b");
	expect(m.get({ b: "hello" }, "a")).toBe("b");
});
