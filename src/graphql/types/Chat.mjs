import apolloServerModule from 'apollo-server-express';
import user from '../models/User.mjs';
import chat from '../models/Chat.mjs';
import graphqlSub from 'graphql-subscriptions';
import fetch from "node-fetch";
const gql = apolloServerModule.gql;
const pubsub = new graphqlSub.PubSub();

export const type = gql`
   input MessageInput {
   from: String!
   to: String!
   message: String!
   }
   type MessageType{
    id: String,
    from: String
    to: String
    message: String
    date: String
   }
   extend type Query {
       getMessage(input: MessageInput):[MessageType]
    }
   extend type Mutation {
     addMessage(input: MessageInput!):MessageType
     deleteMessage(id: String):Boolean
   }
    extend type Subscription {
      messageSub(id: String):MessageType
    }
    `;

export const resolvers = {
    Query: {
       getMessage: async (_,{input}) =>{
           const getAllMessage = await chat.find({
               $or: [
                   {from: input.from,to: input.to},
                   {from: input.to,to: input.from}
               ]
           })
           return getAllMessage.sort(function (a,b){
               return new Date(b.date) - new Date(a.date);
           })
       }
    },
    Mutation:{
        addMessage: async (_,{input}) =>{
            const getToUser = await user.findOne({_id: input.to})
            const {token} = getToUser;
            const getFromUser = await user.findOne({_id: input.from})
            if (token){
                const message = {
                    to: token,
                    sound: 'default',
                    title: getFromUser.username,
                    body: input.message,
                    data: { data: 'goes here' },
                };
                const req =  await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(message),
                });
            }
            input.date = new Date();
            const addMessage = await chat.create(input);
            await pubsub.publish('messageSub', {messageSub: addMessage});
            return addMessage
        },
        deleteMessage: async (_,{id})=>{
            const deleteMessage = await chat.deleteOne({_id: id})
            return deleteMessage?true:false

        }
    },
    Subscription: {
        messageSub:{
            resolve:async (payload,args,context) =>{
                if (context.connection.variables.id === payload.messageSub.to){
                    return payload.messageSub
                }
            },
            subscribe: async () =>{
                return pubsub.asyncIterator('messageSub');
            }
        }
    }

}