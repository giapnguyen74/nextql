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

test("getDie", function(done) {
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
		.then(
			result => {
				expect(result).toHaveProperty("RandomDie");
				expect(result).toHaveProperty("RandomDie.getDie");
				expect(result).toHaveProperty("RandomDie.getDie.rollOnce");
				expect(result).toHaveProperty("RandomDie.getDie.roll");

				done();
			},
			error => {
				console.log(error);
				done();
			}
		);
});
