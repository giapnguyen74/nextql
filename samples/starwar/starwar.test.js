const nextql = require("./starwar");
test("Correctly identifies R2-D2 as the hero of the Star Wars Saga", async () => {
	const query = {
		character: {
			hero: {
				name: 1
			}
		}
	};
	const result = await nextql.execute(query);
	expect(result).toMatchObject({
		character: {
			hero: {
				name: "R2-D2"
			}
		}
	});
});

test("Allows us to query for the ID and friends of R2-D2", async () => {
	const query = {
		character: {
			hero: {
				id: 1,
				name: 1,
				friends: {
					name: 1
				}
			}
		}
	};
	const result = await nextql.execute(query);
	expect(result).toMatchObject({
		character: {
			hero: {
				id: "2001",
				name: "R2-D2",
				friends: [
					{
						name: "Luke Skywalker"
					},
					{
						name: "Han Solo"
					},
					{
						name: "Leia Organa"
					}
				]
			}
		}
	});
});

it("Allows us to query for the friends of friends of R2-D2", async () => {
	const query = {
		character: {
			hero: {
				name: 1,
				friends: {
					name: 1,
					appearsIn: 1,
					friends: {
						name: 1
					}
				}
			}
		}
	};
	const result = await nextql.execute(query);
	expect(result).toMatchObject({
		character: {
			hero: {
				name: "R2-D2",
				friends: [
					{
						name: "Luke Skywalker",
						appearsIn: [4, 5, 6],
						friends: [
							{
								name: "Han Solo"
							},
							{
								name: "Leia Organa"
							},
							{
								name: "C-3PO"
							},
							{
								name: "R2-D2"
							}
						]
					},
					{
						name: "Han Solo",
						appearsIn: [4, 5, 6],
						friends: [
							{
								name: "Luke Skywalker"
							},
							{
								name: "Leia Organa"
							},
							{
								name: "R2-D2"
							}
						]
					},
					{
						name: "Leia Organa",
						appearsIn: [4, 5, 6],
						friends: [
							{
								name: "Luke Skywalker"
							},
							{
								name: "Han Solo"
							},
							{
								name: "C-3PO"
							},
							{
								name: "R2-D2"
							}
						]
					}
				]
			}
		}
	});
});

it("Allows us to query for Luke Skywalker directly, using his ID", async () => {
	const query = {
		human: {
			human: {
				$params: { id: "1000" },
				name: 1
			}
		}
	};
	const result = await nextql.execute(query);
	expect(result).toMatchObject({
		human: {
			human: {
				name: "Luke Skywalker"
			}
		}
	});
});

it("Allows us to create a generic query, then pass an invalid ID to get null back", async () => {
	const query = {
		human: {
			human: {
				$params: { id: "not valid id" },
				name: 1
			}
		}
	};
	const result = await nextql.execute(query);
	expect(result).toMatchObject({
		human: {
			human: null
		}
	});
});

it("Allows us to query for Luke, changing his key with an alias", async () => {
	const query = {
		human: {
			"human/luke": {
				$params: { id: "1000" },
				name: 1
			}
		}
	};
	const result = await nextql.execute(query);
	expect(result).toMatchObject({
		human: {
			"human/luke": {
				name: "Luke Skywalker"
			}
		}
	});
});

it("Allows us to query for both Luke and Leia, using two root fields and an alias", async () => {
	const query = {
		human: {
			"human/luke": {
				$params: { id: "1000" },
				name: 1
			},
			"human/leia": {
				$params: { id: "1003" },
				name: 1
			}
		}
	};

	const result = await nextql.execute(query);
	expect(result).toMatchObject({
		human: {
			"human/luke": {
				name: "Luke Skywalker"
			},
			"human/leia": {
				name: "Leia Organa"
			}
		}
	});
});

it("Allows us to query using duplicated content", async () => {
	const query = {
		human: {
			"human/luke": {
				$params: { id: "1000" },
				name: 1,
				homePlanet: 1
			},
			"human/leia": {
				$params: { id: "1003" },
				name: 1,
				homePlanet: 1
			}
		}
	};

	const result = await nextql.execute(query);
	expect(result).toMatchObject({
		human: {
			"human/luke": {
				name: "Luke Skywalker",
				homePlanet: "Tatooine"
			},
			"human/leia": {
				name: "Leia Organa",
				homePlanet: "Alderaan"
			}
		}
	});
});

it("Fail fast on accessing secretBackstory", async () => {
	const query = {
		character: {
			hero: {
				name: 1,
				secretBackstory: 1
			}
		}
	};

	const result = await nextql
		.execute(query)
		.catch(error =>
			expect(error.message).toBe("secretBackstory is secret.")
		);
});
