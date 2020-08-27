import graphqlYoga from "graphql-yoga"
import schema from '../schema.mjs'


export default new graphqlYoga.GraphQLServer({
    typeDefs: schema.typeDefs,
    resolvers: schema.resolvers,
    context: async context => {
        return ({
            ...context
        })
    },
    playground: {
        settings: {
            'editor.theme': 'light'
        }
    }
});