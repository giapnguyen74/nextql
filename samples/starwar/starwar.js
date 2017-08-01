const NextQL = require("../../src");
const nextql = new NextQL();
import {
	resolveType,
	getFriends,
	getHero,
	getDroid,
	getHuman
} from "./starWarsData";

nextql.afterResolveType(resolveType);

nextql.model("character", {
	methods: {
		hero({ episode }) {
			return getHero(episode);
		}
	}
});

nextql.model("human", {
	fields: {
		id: 1,
		name: 1,
		appearsIn: 1,
		homePlanet: 1
	},
	computed: {
		secretBackstory() {
			throw new Error("secretBackstory is secret.");
		},
		friends(source) {
			return getFriends(source);
		}
	},
	methods: {
		human({ id }) {
			return getHuman(id);
		}
	}
});

nextql.model("droid", {
	fields: {
		id: 1,
		name: 1,
		appearsIn: 1,
		primaryFunction: 1
	},
	computed: {
		secretBackstory() {
			throw new Error("secretBackstory is secret.");
		},
		friends(source) {
			return getFriends(source);
		}
	},
	methods: {
		droid({ id }) {
			return getDroid(id);
		}
	}
});

module.exports = nextql;
