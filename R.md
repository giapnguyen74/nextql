# NextQL ![nextql logo](images/nextql.png)

NextQL is JSON query language for APIs and a extremely flexible runtime for resolve those queries.
1. Ask what you need, get exactly that. 
2. Get many resource by a single request.
3. No limitation how to define type system.
4. No limitation how to resolve request

## Introduction to NextQL
Instead of complex type system like GraphQL, NextQL use plain object to describe how fulfill data queries.

For example a User model:
```js
{
    fields: {
        id: 1, /* 1 mean NextQL should automatically resolve the field type */
        firstName: 1,
        lastName: 1
    },
    computed: {
        fullName(user){
            return user.firstName + ‘ ’ + user.lastName;
        }
    },
    methods:{
        me(params, ctx){
            return ctx.request.auth.user;
        }   
    }
}
```
User model tell NextQL - user object may have 3 fields id, firstName and lastName. The user also have a computed field fullName which calculated use the function provided. Finally the user model expose a me function to query. Compare with GraphQL, NextQL distinguish between a normal field, a computed field and a query function. So you don’t need to group all expose queries into single root Query type like GraphQL - remember many people ask [Can I split queries and mutators across different files?](https://github.com/apollographql/graphql-tools/issues/186).

When NextQL receive NextQL query which in JSON format, it will start to resolve follow order: model -> method -> fields -> ... recursive fields -> final result.

For example the query
```json
{
    "user": {
        "me": {
            "fullName": 1
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

## Query
NextQL query is a JSON object define what API methods called and what data to return. 

```json
{
    "user": {  
        "me": { 
            "fullName": 1
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
            "$params": { "id": "1000" },
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

By default **/** is alias separator, anything after it doesn't counted. You could config any suffix separator.

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

## Schema
NextQL schema is a groups of models defined as plain Javascript object
```js
const personSchema = {
	fields: {
		firstName: 1, // let NextQL decide its type
		lastName: 1,
        address: "address" // explicit field type
        phone: { // define anonymous type
            work: 1, // let NextQL decide its type
            home: 1
        }
	},

	computed: {
		fullName(source, params, context){
			return source.firstName + source.lastName;
		}
	},

	methods: {
		get(params, context){
			return context.db.get(params.id);
		}
	}
}
```
