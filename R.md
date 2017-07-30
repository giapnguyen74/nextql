#NextQL ![nextql logo](images/nextql.png)

NextQL is JSON query language for APIs and a extremely flexible runtime for resolve those queries.
1. Ask what you need, get exactly that. 
2. Get many resource by a single request.
3. No limitation how to describe type system.
4. No limitation how to resolve request

##Introduction to NextQL
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
    "me": {
        "fullName": 1
    }
}
```

Could produce the JSON result:
```json
{
    "me": {
        "fullName": "Giap Nguyen Huu"
    }
}
```
