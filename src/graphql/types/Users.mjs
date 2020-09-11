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
       searchUser(id: String,str: String):[userData]!
    }
    `;
export const resolvers = {
    Query:{
        getUser: (_,{id})=>{
            return user.findOne({ _id: id});
        },
        searchUser: async (_,{id,str})=>{
            const {friends} = await user.findOne({_id: id},'friends');
            friends.push(id);
            let result=await user.find({$or: [{username:  {$regex: new RegExp( str, "i")}},{email:  {$regex: new RegExp( str, "i")}}]},'id username email valid')
            result.length=7;
            friends.map(function (item){
               result.map(function (elem,index){
                   if (elem.id.toString()===item.toString()){
                       result.splice(index,1);
                   }
                })
            })
            return result
        }
    },

};
