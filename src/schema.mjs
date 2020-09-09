import apolloServerModule from 'apollo-server-express';
import * as Profile from './graphql/types/Profile.mjs';

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
        Profile.type
    ],
    resolvers: [
       Profile.resolvers
    ]
}