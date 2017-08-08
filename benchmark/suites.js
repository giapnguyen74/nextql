const NextQL = require("../src");
const nextql = new NextQL();

class RandomDie {
	constructor(numSides) {
		this.numSides = numSides;
	}

	rollOnce() {
		return 1 + Math.floor(Math.random() * this.numSides);
	}

	roll({ numRolls }) {
		var output = [];
		for (var i = 0; i < numRolls; i++) {
			output.push(this.rollOnce());
		}
		return output;
	}
}

nextql.model("RandomDie", {
	computed: {
		rollOnce: (source, params) => source.rollOnce(),
		roll: (source, params) => {
			return source.roll(params);
		}
	},
	methods: {
		getDie({ numSides }) {
			return new RandomDie(numSides || 6);
		}
	}
});

var { buildSchema, graphql } = require("graphql");
var schema = buildSchema(`
type RandomDie {
  numSides: Int!
  rollOnce: Int!
  roll(numRolls: Int!): [Int]
}

type Query {
  getDie(numSides: Int): RandomDie
}
`);

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
type RandomDie {
  numSides: Int!
  rollOnce: Int!
  roll(numRolls: Int!): [Int]
}

type Query {
  getDie(numSides: Int): RandomDie
}
`);

// The root provides the top-level API endpoints
var root = {
	getDie: function({ numSides }) {
		return new RandomDie(numSides || 6);
	}
};

module.exports = {
	"nextql#getDie": {
		defer: true,

		// benchmark test function
		fn: function(deferred) {
			nextql
				.execute({
					RandomDie: {
						getDie: {
							$params: { numSides: 6 },
							rollOnce: 1,
							roll: {
								$params: { numRolls: 3 }
							}
						}
					}
				})
				.then(() => deferred.resolve());
		}
	},
	"graphql#getDie": {
		defer: true,

		// benchmark test function
		fn: function(deferred) {
			// call `Deferred#resolve` when the deferred test is finished
			graphql(
				schema,
				`{
				getDie(numSides: 6) {
				  rollOnce
				  roll(numRolls: 3)
				}
			}`,
				root
			).then(() => deferred.resolve());
		}
	}
};
