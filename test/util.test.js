const { assertOk, isPlainObject } = require("../src/util");

test("assertOk#true", function() {
	assertOk(true, "nothing", 200);
});

test("assertOk#fail", function() {
	expect(() => assertOk(false, "error", 200)).toThrow("error");
});

test("isPlainObject#false", function() {
	expect(isPlainObject(new Error())).toBeFalsy();
	expect(isPlainObject(1)).toBeFalsy();
	expect(isPlainObject(() => true)).toBeFalsy();
});

test("isPlainObject#true", function() {
	expect(isPlainObject({ a: 1 })).toBeTruthy();
	expect(isPlainObject({})).toBeTruthy();
});
