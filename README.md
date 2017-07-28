# NextQL
> Yet another graph query language

Both love and hate GraphQL.
#### Love
* Elimination of N+1 queries
* Async resolve results from multi backends, then combine into single result.

#### Hate
* Text based query? It is so SQL - we back to era of query builder tools.
* Root query and mutation? It is nightmare to convert a tons of REST apis to GraphQL.
* Strong typed. Sorry I not fan of strong typed language.
* Not flexible. Most request features still go nowhere: Annotation, Input interface. 

# Introduction to NextQL
NextQL like GraphQL
* Specify the exactly data needed for a view and fetch that data in a single network request.
* Traverse graph data or related objects.

Different with GraphQL
* No strong typed or schema
* JSON based query
* No root queries or mutations

## Query
NextQL query is a JSON object
```
{
	"person": {
		"me": {
			"name": 1
		}
	}
}
```

It meaning you tell NextQL service goto "person" model and invoke "me" method, then pick "name" field of the result of previos method call.

The JSON result should be
```
{
	"person": {
		"me": {
			"name": "Nguyen Huu Giap"
		}
	}
}
```

### Arguments
Argments pass over specify field "$param"
```
{
	"person": {
		"get": {
			"$params": { "id": "giapnh" },
			"name": 1
		}
	}
}
```
The JSON result should be
```
{
	"person": {
		"get": {
			"name": "Nguyen Huu Giap"
		}
	}
}
```
### Aliases
Field name has postfix to seperate the same method call with different arguments
```
{
	"person": {
		"get/giapnh": {
			"$params": { "id": "giapnh" },
			"name": 1
		},
		"get/nguyen": {
			"$params": { "id": "nguyen" },
			"name": 1
		}
	}
}
```
The JSON result should be
```
{
	"person": {
		"get/giapnh": {
			"name": "Nguyen Huu Giap"
		},
		"get/nguyen": {
			"name": "Dinh Thi Kim Nguyen"
		}
	}
}
```
You should able config alias seperator whatever you want "get$giapnh" or "get#giapnh"

### Traverse related object
Follow link field.
```
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
```
{
	"person": {
		"get/giapnh": {
			"name": "Nguyen Huu Giap",
			"children": {
				"name": "Nguyen Huu Vinh"
			}
		},
		"get/nguyen": {
			"name": "Dinh Thi Kim Nguyen",
			"children": {
				"name": "Nguyen Huu Vinh"
			}
		}
	}
}
```



## Installing / Getting started


## Developing


### Building



### Deploying / Publishing


## Features

What's all the bells and whistles this project can perform?
* What's the main functionality
* You can also do another thing
* If you get really randy, you can even do this



## Licensing

"The code in this project is licensed under MIT license."

