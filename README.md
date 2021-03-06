
<img src="images/logo_next-01.png" width="100" height="100">

# NextQL 

[**What is NextQL?**](https://medium.com/@giapnguyen74/what-is-nextql-5ca4193795ea) : My blog about NextQL's visions, thoughts and brief informations.

NextQL is JSON query language for APIs and a robust and extensible runtime for resolve those queries. [Equivalent](#equivalent-with-graphql) with [Facebook's GraphQL](http://graphql.org/), but much more simple.



[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

1. Ask what you need, get exactly that. 
2. Get many resources by a single request.
3. No limitation how to define type systems.
4. No limitation how to resolve requests.

## TOC
<!-- TOC -->

- [NextQL](#nextql)
	- [TOC](#toc)
	- [Change Logs](#change-logs)
		- [0.0.6 (08-14-2017)](#006-08-14-2017)
		- [0.0.5 (08-10-2017)](#005-08-10-2017)
		- [0.0.3 (08-08-2017)](#003-08-08-2017)
	- [Install](#install)
	- [Plugins](#plugins)
	- [Introduction to NextQL](#introduction-to-nextql)
	- [Type System](#type-system)
		- [getAttr hook](#getattr-hook)
		- [Complex type define](#complex-type-define)
	- [How NextQL decide field/method type?](#how-nextql-decide-fieldmethod-type)
	- [Query](#query)
		- [Conditional Query](#conditional-query)
		- [Self Conditional Query](#self-conditional-query)
		- [Arguments](#arguments)
		- [Alias](#alias)
		- [Traverse related object](#traverse-related-object)
	- [NextQL :heart: Plugins](#nextql-heart-plugins)
	- [Samples](#samples)
	- [APIs](#apis)
		- [execute](#execute)
		- [model](#model)
		- [use](#use)
		- [beforeCreate](#beforecreate)
		- [afterResolveType](#afterresolvetype)
	- [Equivalent with GraphQL](#equivalent-with-graphql)
	- [Testing](#testing)
	- [Benchmarks](#benchmarks)
	- [Licensing](#licensing)

<!-- /TOC -->

## Change Logs
### 0.0.6 (08-14-2017)
* Support conditional queries.
* Support getAttr hook

### 0.0.5 (08-10-2017)
* Fix bugs
* Replace lodash.set by simpler implementation; now nextql have no-dependencies and some increase in raw performance.

### 0.0.3 (08-08-2017)
* Support explicit type defines for methods and computed fields.
* Remove Object typed behavior.
* Introduce new type define: Scalar
* New beforeExecute hook
* Better error messages.
* Back compatible with 0.0.2 except Object typed behavior.


## Install
Install NextQL from npm

```sh
npm install --save nextql
```
## Plugins
* [nextql-configuration](https://github.com/giapnguyen74/nextql-configuration): Pattern to organize and distribute complex NextQL's model systems.
* [nextql-validate](https://github.com/giapnguyen74/nextql-validate) : Validate nextql methods with fastest-validator.
* [nextql-feathers](https://github.com/giapnguyen74/nextql-feathers) : Extend NextQL with awesome Feathersjs service. NextQL could do real-time/multiple backend/authentication.
* [nextql-limit](https://github.com/giapnguyen74/nextql-limit) : Simple solution to protect against excessive or abusive calls (DoS)
* [nextql-neo4j](https://github.com/giapnguyen74/nextql-neo4j) : Use nextql to provide OGM interface for neo4j database.
* [nextql-serverless](https://github.com/giapnguyen74/nextql-serverless) : NextQL serve as serverless aggregator function which invoke and concentrates many functions into single result.

## Introduction to NextQL
NextQL is simply a data query engine inspired by [Facebook GraphQL](http://graphql.org/) but much more simple. NextQL consists a type system based on pure JS objects and a JSON query language.

## Type System
For example a User model:
```js
{
    fields: {
		firstName: 1, /* let NextQL decide field type */
		lastName: 1,
        address: "Address", // explicit field type
        phone: { /* explicit inline type */
            work: 1,
            home: 1
        },
		fullName: "*" // explicit scalar type for computed field [fullName]
	},

	computed: {
		// virtual field computed from source value.
		fullName(source, params, context){
			return source.firstName + source.lastName;
		}
	},

	methods: {
		// exposed method for this model.
		get(params, context){
			return context.db.get(params.id);
		}
	},
	returns: {
		// Define resolve function to return type for method [get]
		get(){
			return "User"
		}
	}
}
```

Every model configuration may have 4 keys:
* **fields** : define model's field name and how to resolve its type.
* **computed** : define model's virtual field and the function to compute value from source object. NextQL will automatically resolve the value type, unless explicit defined in **fields**
* **methods**: define exposed APIs for the model. 
* **returns**: By default NextQL will try to resolve type for method's result. The options allow explicit defined type for return value.

**fields** and **computed** equivalent with GraphQL's fields; **methods** and **returns** equivalent with GraphQL's queries and mutations.

Different with GraphQL, NextQL not enforced strong-typed for field and method values rather use "ducking type system". You have many options for define how to resolve value type:
* **1** : let NextQL decide value type. [How NextQL decide field/method type?](#how-nextql-decide-fieldmethod-type)
* **"other model name"** : explicit assign value type.
* **"*"** : explicit assign value as scalar value.
* **[Object]** : explicit define value as inline nested type
* **[Function]** : Given a function, NextQL should call to resolve value type.

### getAttr hook
By default, nextql resolve directly field from source:
```js
	fieldValue = source[fieldName]
```
Override getAttr hook, you could implement your own field resolver. For example, Neo4j Entry object actually store  value inside "properties" field; so you either model Entry use nested fields or use getAttr hook

without getAttr
```js
{
	fields: { // without getAttr hook you must define Entry with nested properties field
		properties: { 
			name: 1
		}
	}
}
```

with getAttr
```js
{
	fields: { // with getAttr hook, you could define Entry as normal
		name: 1
	},
	getAttr: (source, fieldName){
		return source.properties[fieldName];
	}
}
```


### Complex type define
Combine all those options, you can define very complex model. For example:
```js
test("execute#super_complex_inline_type", async function() {
	// auto resolve for hello field
	nextql.afterResolveType(source => (source.a == "x" ? "Test" : undefined));

	nextql.model("Test", {
		fields: { a: 1, b: { c: 1, d: { x: 1, y: "Test" } } }, // nested of nested with recusive type
		computed: {
			hello() {
				return [{ a: "x" }];
			}
		},
		returns: {
			// function resolve for test method
			test: () => "Test"
		},
		methods: {
			test(params) {
				return [
					{
						a: "a",
						b: {
							c: params.x,
							d: { x: "22", y: { a: "super nest" } }
						}
					}
				];
			}
		}
	});
	const result = await nextql.execute({
		Test: {
			test: {
				$params: { x: 1 },
				a: 1,

				b: {
					c: 1,
					d: {
						x: 1,
						y: {
							a: 1
						}
					}
				},
				hello: {
					a: 1
				}
			}
		}
	});

	expect(result).toMatchObject({
		Test: {
			test: [
				{
					a: "a",
					b: {
						c: 1,
						d: {
							x: "22",
							y: {
								a: "super nest"
							}
						}
					},
					hello: [
						{
							a: "x"
						}
					]
				}
			]
		}
	});
});
```


## How NextQL decide field/method type?
NextQL use a global **resolveType function** to resolve model name from 
object which by default use value constructor name for model name. 
```js
const defaultResolveType = value => value.constructor && value.constructor.name;
```

You can config your own **resolveType** or better use **afterResolveTypeHooks**. You free to choose whatever to resolve type from object. It could be mongoose model name, __type field ... 
 

## Query
NextQL query is a JSON object define what API methods called and what data to return. NextQL will start to resolve query follow order: model -> method -> fields -> ... recursive fields -> final result.

For example the query
```js
{
    "user": { // model
        "me": { // method
            "fullName": 1 //field or computed field
        }
    }
}
```

Could produce the JSON result:
```json
{
    "user":{
        "me": {
            "fullName": "Giap Nguyen Huu"
        }
    }
}
```

Equivalent call **me** method of class **user** then pick **fullName** field from result. It look like combine REST API call with GraphQL query. 
```
/user/me => { fullName }
```

### Conditional Query
NextQL conditional query is close with GraphQL fragment but more powerful. Conditional query is a computed function start with "?".
```js
{
	"user": { 
        "me": { 
            "fullName": 1, 
			"?manager": {
				"subordinates": {
					"fullName": 1
				}
			}
        }
    }
}
```

The results could be
```js
{
    "user":{
        "me": {
            "fullName": "Giap Nguyen Huu",
			"subordinates": [ // This fields only resolve if the computed "?manager" passed.
				{ "fullName": "Tuyen Phuong"}
			]
        }
    }
}
```

The conditonal function is a resolver start with "?". It should return a model name or "true" if the conditionals passed. 

If a model name, the query inside conditional field will resolved with return model. The behavior is same with GraphQL fragment.

If true, the query inside conditonal field will resolved as current model or self conditonal query. 

```js
    nextql.model("a", {
		fields: {
			a: 1
		},
		computed: {
			"?a": function(source, params) { // self conditional resolver
				return source.a ? true : undefined;
			},
			"?b": function(source, params) { // normal conditional resolver; cast source as b model
				return source.b ? "b" : undefined;
			}
		},
		methods: {
			test() {
				return [{ a: "a", b: "b" }, { a: "a" }, { b: "b" }];
			}
		},
		returns: {
			test: "a"
		}
	});

	nextql.model("b", {
		fields: {
			b: 1
		}
	});

	const result = await nextql.execute({
		a: {
			test: {
				"?a": {
					a: 1
				},
				"?b": {
					b: 1
				}
			}
		}
	});
```

The result should be
```js
	{
		a: {
			test: [
				{
					a: "a",
					b: "b"
				},
				{
					a: "a"
				},
				{
					b: "b"
				}
			]
		}
	}
```

### Self Conditional Query
 Self conditional is when the resolver return true. It seems make no sense because the parent query already resolve as current model. But it could useful in some usecases. Assume you have a User model. If a user is admin, it need additional fields. So you either define a User model with additional fields or 3 models: User interface, Admin model and User model. But if you feels use 1 model not clear the relationship and 3 models is overkill and self conditonal could be used.

```js
 nextql.model("User", {
		fields: {
			name: 1
			adminWebsites: 1,
			adminStuffs: 1
		},
		computed: {
			"?admin": function(source, params) { // self conditional resolver
				return source.isAdmin ? true : undefined;
			}
		}
	});

const result = await nextql.execute({
		User: {
			findAll: {
				name: 1
				"?admin": {
					adminWebsites: 1,
					adminStuffs: 1
				}
			}
		}
	});
```

The result should be
```js
	{
		User: {
			fillAll: [
				{ name : "Thanh" }, // not admin
				{ name : "Liem" },// not admin
				{ name: "Giap",  adminWebsites: null, adminStuffs: [1,2,3]}, //admin
			]
		}
	}
```

Next time you decide that Admin is enough complex for another model, just remove admin fields and update ?admin resolver. Client side use the same query without aware your changes.
```js
	"?admin": function(source, params) { 
			return source.isAdmin ? "Admin" : undefined;
		}
```


### Arguments
NextQL allow pass arguments to methods and computed fields and conditional fields via reserved **$params** field.

```json
{   
    "human": {
        "get": {
            "$params": { "id": "1000" },
            "fullName": 1,
            "height": {
                "$params": { "unit": "m"}
            }
        }
    }
}
```

Could produce the JSON result:
```json
{
    "human":{
        "get": {
            "fullName": "Nguyen Huu Giap",
            "height" : 1.69
        }
    }
}
```

You could use params in conditional query.
```js
{
	computed: {
		"?cast": function(source, params){ // I going to cast source in any model
			return params.name;
		}
	}
}
```
Then query:
```js
{
	Person: {
		get: {
			personStuffs: 1,
			"?cast": {
				"$params": { "name": "Drone" }, // Please treat me as a drone
				droneStuffs: 1
			}
		}
	}
}
```
### Alias
Because result field match with query field. If you need call multiple methods, fields you need alias. NextQL alias is a suffix separator which resolver ignore.
```json
{
    "human":{
        "get/1000": {
            "$params": { "id": "1000" },
            "name": 1
        },
        "get/1001": {
            "$params": { "id": "1001" },
            "name": 1
        }
    }
}
```

Could produce the JSON result:
```json
{
    "human":{
        "get/1000": {
            "name": "Nguyen Huu Giap"
        },
        "get/1001": {
            "name": "Dinh Thi Kim Nguyen"
        }
    }
}
```

By default **"/"** is alias separator, anything after it doesn't counted. You could config any suffix separator.

### Traverse related object
You can ask more data from relate objects. 

```json
{
	"person": {
		"get/giapnh": {
			"$params": { "id": "giapnh" },
			"name": 1,
			"children": {
				"name": 1
			}
		},
		"get/nguyen": {
			"$params": { "id": "nguyen" },
			"name": 1,
			"children": {
				"name": 1
			}
		}
	}
}
```

The JSON result should be
```json
{
	"person": {
		"get/giapnh": {
			"name": "Nguyen Huu Giap",
			"children": [{
				"name": "Nguyen Huu Vinh"
			}]
		},
		"get/nguyen": {
			"name": "Dinh Thi Kim Nguyen",
			"children": [{
				"name": "Nguyen Huu Vinh"
			}]
		}
	}
}
```

## NextQL :heart: Plugins
NextQL very simple and flexible. Everything could extensible/customize. NextQL follow Vue plugin pattern.

```js
MyPlugin.install = function (nextql, options) {
  nextql.beforeCreate(schema => schema);
  nextql.afterResolveType(source => source.__type);
}

nextql.use(MyPlugin);
```

* **nextql.beforeCreate** : the hook call before NextQL build Model object from schema. It is powerful hook to customize schema.
* **nextql.afterResolveType** : the hook call after NextQL resolve type from source object. It give you a chance to map source to NextQL model type.

Sample Mongoose plugin - it catch any schema have mongoose option:
* Create mongoose model from schema fields.
* Inject CRUD methods into schema methods.

Finally it help resolve mongoose document into NextQL model.

```js
const mongoose = require("mongoose");

/** Simply convert mongoose schema to nextql fields */
function normalizeFields(fields) {
	const _fields = {};
	Object.keys(fields).forEach(k => {
		if (fields[k].constructor == Object && !fields[k].type) {
			_fields[k] = normalizeFields(fields[k]);
		} else {
			_fields[k] = 1;
		}
	});
	return _fields;
}
function hookBeforeCreate(options) {
	if (options.mongoose) {
		const model = mongoose.model(options.name, options.fields);
		options.fields = normalizeFields(options.fields);

		options.methods = Object.assign(
			{
				get({ id }) {
					return model.findById(id);
				},
				find() {
					return model.find();
				},
				create({ data }) {
					var ins = new model(data);
					return ins.save();
				},
				update({ id, data }) {
					return model.findById(id).then(ins => {
						Object.keys(data).forEach(path =>
							ins.set(path, data[path])
						);
						return ins.save();
					});
				},
				remove({ id }) {
					return model.findByIdAndRemove(id);
				}
			},
			options.methods
		);
	}
}

function hookAfterResolveType(source) {
	return source.constructor && source.constructor.modelName;
}

module.exports = {
	install(nextql) {
		nextql.beforeCreate(hookBeforeCreate);
		nextql.afterResolveType(hookAfterResolveType);
	}
};
```

**Mongoose plugin in action**
```js
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost/nextql', { useMongoClient: true }).catch(error => {
	console.log(error);
	process.exit(1);
});

const nextql = require('../nextql');
const nextqlMongoose = require('./index');
nextql.use(nextqlMongoose);

nextql.model('test', {
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

	return users.test
}
```

Combine beforeCreate hook and afterResolveType hook, you able to create any kind of NextQL schema and behaviors.


## Samples
* [StarWar](https://github.com/giapnguyen74/nextql/tree/master/samples/starwar)

## APIs

### execute
Execute query.
```js
nextql.execute(query, context).then(
	result => result,
	error => error
);
```

### model
Register new model
```js
nextql.model('name', { 
	fields: {},
	computed: {},
	methods: {}
})
```

Lookup model throw execption if not found
```js
nextql.model('name')
```

### use
Register plugin
```js
nextql.use(pluginObj, pluginOpts);
```

### beforeCreate
Register a hook called when new model added. Allow you manipulate model options.
```js
nextql.beforeCreate(options => options);
```

### afterResolveType
Register a hook called when NextQL try resolve type from source. 
```js
nextql.afterResolveType(source => modelName);
```

## Equivalent with GraphQL
Compare two version of [getDie example](http://graphql.org/graphql-js/object-types/), NextQL very close with GraphQL. Very easy to convert GraphQL code into NextQL. NextQL's [StarWar](https://github.com/giapnguyen74/nextql/tree/master/samples/starwar) reuse most of GraphQL sample code except model's definition.

![getdie](images/getdie.png)


## Testing

```
 PASS  test/resolvers.test.js
 PASS  samples/starwar/starwar.test.js
 PASS  test/nextql.test.js
 PASS  test/getDie.test.js

Test Suites: 4 passed, 4 total
Tests:       55 passed, 55 total
Snapshots:   0 total
Time:        0.539s, estimated 1s
Ran all test suites.
------------------|----------|----------|----------|----------|----------------|
File              |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------|----------|----------|----------|----------|----------------|
All files         |    95.26 |    92.63 |    90.91 |    96.15 |                |
 samples/starwar  |    90.24 |       75 |    85.71 |    89.47 |                |
  starWarsData.js |    92.31 |       75 |    85.71 |     91.3 |        104,121 |
  starwar.js      |    86.67 |      100 |      100 |    86.67 |          30,60 |
 src              |    96.64 |    94.25 |    91.89 |    97.92 |                |
  index.js        |    91.43 |    82.35 |    83.33 |    93.75 |          39,81 |
  model.js        |    93.75 |    92.86 |    85.71 |    96.77 |             18 |
  resolvers.js    |      100 |    98.15 |      100 |      100 |             53 |
  util.js         |      100 |      100 |      100 |      100 |                |
------------------|----------|----------|----------|----------|----------------|
```

## Benchmarks
```
node benchmark/index.js
nextql#getDie x 42,284 ops/sec ±0.44% (84 runs sampled)
graphql#getDie x 9,713 ops/sec ±4.18% (78 runs sampled)
Fastest is nextql#getDie
```
Without type checked and parse query string, NextQL significantly faster than GraphQL.


## Licensing

"The code in this project is licensed under MIT license."


[npm-image]: https://badge.fury.io/js/nextql.svg
[npm-url]: https://npmjs.org/package/nextql
[travis-image]: https://travis-ci.org/giapnguyen74/nextql.svg?branch=master
[travis-url]: https://travis-ci.org/giapnguyen74/nextql
[daviddm-image]: https://david-dm.org/giapnguyen74/nextql.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/giapnguyen74/nextql
