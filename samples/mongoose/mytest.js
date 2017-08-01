const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

mongoose
	.connect("mongodb://localhost/nextql", { useMongoClient: true })
	.catch(error => {
		console.log(error);
		process.exit(1);
	});

const NextQl = require("../../src");
const nextqlMongoose = require("./index");

const nextql = new NextQl();
nextql.use(nextqlMongoose);

nextql.model("test", {
	mongoose: true,
	fields: {
		_id: String,
		name: String
	}
});

async function run() {
	const users = await nextql.execute({
		test: {
			find: {
				name: 1
			}
		}
	});

	return users.test;
}

run().then(console.log, console.error);
