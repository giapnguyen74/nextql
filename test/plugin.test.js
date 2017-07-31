const NextQL = require("../src");
const nextql = new NextQL();

test('plugin', async function(){
    nextql.use(function(nextql){
        expect(nextql).toBe(nextql)
    });

    nextql.use({install:function(nextql){
        expect(nextql).toBe(nextql)
    }});


    nextql.use(function(nextql){
        nextql.afterResolveType(source => source.__type);
        nextql.beforeCreate(options => options)
    });

    nextql.model('model1', {
        methods: {
            test(){
                return {
                    __type: 'x'
                }
            }
        }
    })

    nextql.model('x', {
        computed: {
            a(){
                return "what"
            }
        }
    })

    const result = await nextql.execute({
        model1: {
            test: {
                a: 1
            }
        }
    });

    expect(result).toMatchObject({
        model1: {
            test: {
                a: 'what'
            }
        }
    })
})