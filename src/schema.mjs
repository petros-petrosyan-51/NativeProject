import apolloServerModule from 'apollo-server-express';
import * as Test from './graphql/types/test.mjs';

const gql = apolloServerModule.gql;
const Root = gql`
    type Query {
        _empty: String
    }
    type Mutation {
        _empty: String
    }
  type Subscription {
    _empty: String
  }
`;

export default {
    typeDefs: [
        Root,
        Test.type
    ],
    resolvers: [
       Test.resolvers
    ]
}