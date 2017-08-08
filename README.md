![nextql logo](images/nextql.png)
# NextQL 

NextQL is JSON query language for APIs and a robust and extensible runtime for resolve those queries.

[![npm version](https://badge.fury.io/js/nextql.svg)](http://badge.fury.io/js/nextql)
[![Build Status](https://travis-ci.org/nextql/nextql.svg?branch=master)](https://travis-ci.org/nextql/nextql.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/graphql/nextql/badge.svg?branch=master)](https://coveralls.io/repos/graphql/nextql/badge.svg?branch=master)

1. Ask what you need, get exactly that. 
2. Get many resources by a single request.
3. No limitation how to define type systems.
4. No limitation how to resolve requests.

## Change Logs
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
* [nextql-validate](https://github.com/giapnguyen74/nextql-validate) : Validate nextql methods with fastest-validator.
* [nextql-feathers](https://github.com/giapnguyen74/nextql-feathers) : Extend NextQL with awesome Feathersjs service. NextQL could do real-time/multiple backend/authentication.

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
* **1** : let NextQL decide value type. [How NextQL decide field/method type?](###How NextQL decide field/method type?)
* **"other model name"** : explicit assign value type.
* **"*"** : explicit assign value as scalar value.
* **[Object]** : explicit define value as nested type
* **[Function]** : Given a function, NextQL should call to resolve value type.

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
```json
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

### Arguments
NextQL allow pass arguments to methods and computed fields via reserved **$params** field.

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

## Developing


### Building


### Deploying / Publishing


## Features

## Licensing

"The code in this project is licensed under MIT license."