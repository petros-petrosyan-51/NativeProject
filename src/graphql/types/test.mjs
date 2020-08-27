import apolloServerModule from 'apollo-server-express'

const gql = apolloServerModule.gql
export const type = gql`
 extend type Query {
        Hello: String!
    }

    extend type Mutation {
       addHello: String!
    }`;

export const resolvers = {
    Query: {
      Hello: () =>{
          return "Hello"
      }
    },
    Mutation: {
        addHello: () =>{
          return "Hello"
      }
    }
};