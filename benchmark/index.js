var Benchmark = require("benchmark");
var suite = new Benchmark.Suite();

var suites = require("./suites");
Object.keys(suites).forEach(k => suite.add(k, suites[k]));

suite
	.on("cycle", function(event) {
		console.log(String(event.target));
	})
	.on("complete", function() {
		console.log("Fastest is " + this.filter("fastest").map("name"));
	})
	// run async
	.run({ async: true });
