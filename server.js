const express = require('express')
const expressGraphQL = require('express-graphql').graphqlHTTP;
const{
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull

} = require('graphql')

const xlsx = require('xlsx')

const app = express()

//reading excel data
const workbook = xlsx.readFile("phoneo.xlsx")
const worksheet = workbook.Sheets[workbook.SheetNames[0]]
const excelData = xlsx.utils.sheet_to_json(worksheet)

const RootQueryType = new GraphQLObjectType({
    name: 'query',
    description: 'root query',
    fields: ()=> ({
        calls: {
            type: new GraphQLList(PhoneType),
            resolve: () => excelData
        },
        callsByCaller: {
            type: new GraphQLList(PhoneType),
            description: 'list of calls by a specific person',
            args:{
                callerName: {
                    type: GraphQLString
                }
            },
            resolve: (parent, args)=> {
                const filteredCalls = excelData.filter(call => call.Name === args.callerName);
                return filteredCalls;
            }
        },
        topFrequentContacts: {
            type: new GraphQLList(PhoneType),
            description: 'top n frequently contacted persons for a specific person',
            args: {
                caller: {
                    type: GraphQLString
                },
                n: {
                    type: GraphQLInt
                }
            },
            resolve: (parent, args) => {
                const filtered = excelData.filter(call => call.Name === args.caller)
                const fmap = {}  //to store frequency
                filtered.forEach(call => {
                    if (fmap[call.Recipient]){
                        fmap[call.Recipient]++
                    }
                    else{
                        fmap[call.Recipient] = 1
                    }
                })
                //sort
                const sortedfiltered = Object.keys(fmap).sort((a,b)=>fmap[b]-fmap[a])
                const top = sortedfiltered.slice(0, args.n)
                const topFrequentCalls = filtered.filter(call=> top.includes(call.Recipient))
                return topFrequentCalls;

            }
        }
    })
})

const PhoneType = new GraphQLObjectType({
    name: 'calls',
    fields: () => ({
        Name: { 
            type: GraphQLString 
            },
        Phone: {
             type: GraphQLString 
            },
        Recipient: {
             type: GraphQLString
             },
        Recipient_phone: {
             type: GraphQLString 
            },
        Duration: {
             type: GraphQLString 
            },
        Network: {
             type: GraphQLString 
            },
    })
});
const schema = new GraphQLSchema({
    query: RootQueryType
})

app.use('/graphql', expressGraphQL({
    schema: schema,
    graphiql : true
    
}) )


app.listen(5000, ()=> console.log('Haii'))