import apolloServerModule from 'apollo-server-express'
import user from '../models/User.mjs'
import md5 from "md5";
const gql = apolloServerModule.gql

export const type = gql`
      type userData{
       id: String
       username: String!
       email: String!
       valid: String!
    }
    extend type Query {
       getUser(id: String):userData!
    }
    `;
export const resolvers = {
    Query:{
        getUser: async (_,{id})=>{
            console.log(id)
            return {
                id: id,
                username: 'Petros',
                email: 'petros-petrosyan-51@mail.ru',
                valid: ''
            };
        }
    },

};
