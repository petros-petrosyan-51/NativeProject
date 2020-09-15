import apolloServerModule from 'apollo-server-express'
import user from '../models/User.mjs'
import graphqlSub from 'graphql-subscriptions';
const gql = apolloServerModule.gql
const pubsub = new graphqlSub.PubSub();

export const type = gql`
      type userData{
       id: String
       username: String!
       email: String!
       favorites: [String]
       valid: String!,
       favorite: Boolean
       action: String
    }
    input friendsInput{
      id: String!
      friendId: String!
    }
    extend type Query {
       getUser(id: String):userData!
       searchUser(id: String,str: String):[userData]!
       favoritesGet(id: String):userData
       getFavorite(array: [String]):[userData]!
       searchFriends(id: String,str: String):[userData]
    }
    extend type Mutation{
       addFriends(input: friendsInput): String
       deleteFavorite(input: friendsInput): String
       updateFriend(input: friendsInput):String
       deleteFriend(input: friendsInput):String
    }
     extend type Subscription {
        favoritesSub(id: String): userData
        getFriendsSub(id: String): [userData]
    }
    `;
export const resolvers = {
    Query:{
        getUser: (_,{id})=>{
            return user.findOne({ _id: id});
        },
        searchUser: async (_,{id,str})=>{
            const {friends} = await user.findOne({_id: id},'friends');
            let favorites = [];
            let res =[];
            friends.push(id);
            let result=await user.find({$or: [{username:  {$regex: new RegExp( str, "i")}},{email:  {$regex: new RegExp( str, "i")}}]},'id username email valid')
            result.length=20;
            friends.map(function (item){
               result.map(function (elem,index){
                   if (elem.id.toString()===item.toString()){
                       result.splice(index,1);
                   }
                })
            })
            for (let j in result){
                favorites=await user.findOne({_id: result[j].id},'favorites');
                favorites=favorites.favorites.filter(function (i){
                    return i === id
                });
               if (result[j].valid==="") {
                   if (favorites.length) {
                       res.push({
                           id: result[j].id,
                           username: result[j].username,
                           email: result[j].email,
                           valid: result[j].valid,
                           favorite: true
                       })
                   } else {
                       res.push({
                           id: result[j].id,
                           username: result[j].username,
                           email: result[j].email,
                           valid: result[j].valid,
                           favorite: false
                       })
                   }
               }
            }
            res.length=7;
            return res
        },
        favoritesGet: (_,{id})=>{
            return user.findOne({ _id: id})
        },
        getFavorite: async (_,{array})=>{
           const favorites= array;
            return await user.find({'_id':{ $in: favorites}});
        },
        searchFriends: async (_,{id,str})=>{
            const {friends} = await user.findOne({_id: id},'friends');
            const result = await user.find({$and:[{'_id':{ $in: friends}},{$or: [{username:  {$regex: new RegExp( str, "i")}},{email:  {$regex: new RegExp( str, "i")}}]}]})
            result.length=10;
            return result;
        }
    },
    Mutation:{
        addFriends: async (_,{input})=> {
            const {favorites} = await user.findOne({_id: input.friendId});
            if (!favorites.includes(input.id)) {
                favorites.push(input.id);
            }
            const {ok} = await user.updateOne({_id: input.friendId}, {favorites: favorites});
            if (ok) {
                const result = await user.findOne({_id: input.friendId})
                await pubsub.publish('favoritesSub', {favoritesSub: {
                        friends: result.friends,
                        favorites: result.favorites,
                        id: result.id,
                        username: result.username,
                        email: result.email,
                        password: result.password,
                        action: "add"
                    }});
            }
            return ok.toString();

        },
        deleteFavorite: async (_,{input})=>{
            const {favorites} = await user.findOne({_id: input.friendId});
            favorites.splice(favorites.findIndex(item=>item===input.id));
            const {ok} = await user.updateOne({_id: input.friendId}, {favorites: favorites});
            if (ok) {
                const result = await user.findOne({_id: input.friendId})
                await pubsub.publish('favoritesSub', {favoritesSub: {
                     friends: result.friends,
                     favorites: result.favorites,
                     id: result.id,
                     username: result.username,
                     email: result.email,
                     password: result.password,
                     action: "delete"
                    }});
            }
            return ok.toString();
        },
        deleteFriend: async (_,{input})=>{
            const user1 = await user.findOne({_id: input.id},'friends');
            user1.friends.splice(user1.friends.findIndex(item=>item===input.friendId))
            const user1Update = await user.updateOne({_id: input.id},{friends: user1.friends})
            const user2 = await user.findOne({_id: input.friendId},'friends');
            user2.friends.splice(user2.friends.findIndex(item=>item===input.id))
            const user2Update = await user.updateOne({_id: input.friendId},{friends: user2.friends})
            if (user1Update.ok && user2Update.ok){
                await pubsub.publish('getFriendsSub', {getFriendsSub: {id: user1.id,friends: user1.friends}});
                await pubsub.publish('getFriendsSub', {getFriendsSub: user2});
                return "1";
            }else {
                return "0";
            }

        },
        updateFriend: async (_,{input})=>{
            const {favorites} = await user.findOne({_id: input.friendId});
            favorites.splice(favorites.findIndex(item=>item===input.id));
            const {ok} = await user.updateOne({_id: input.friendId}, {favorites: favorites});
            if (ok){
                const result = await user.findOne({_id: input.friendId})
                await pubsub.publish('favoritesSub', {favoritesSub: {
                        friends: result.friends,
                        favorites: result.favorites,
                        id: result.id,
                        username: result.username,
                        email: result.email,
                        password: result.password,
                        action: "delete"
                    }});
            const user1 = await user.findOne({_id: input.id},'friends')
           user1.friends.push(input.friendId);
            const user1Upadate =await user.updateOne({_id: input.id}, {friends: user1.friends });
            const user2 = await user.findOne({_id: input.friendId},'friends')
                user2.friends.push(input.id);
            const user2Upadate =await user.updateOne({_id: input.friendId}, {friends: user2.friends });
            if (user1Upadate.ok && user2Upadate.ok){
                await pubsub.publish('getFriendsSub', {getFriendsSub: user1});
                await pubsub.publish('getFriendsSub', {getFriendsSub: user2});
                return "1";
            }else {
                return "0"
            }
            }else {
                return '0';
            }
        }
    },
    Subscription: {
        favoritesSub: {
            resolve: (payload, args, context) => {
                if (context.connection.variables.Id.toString() === payload.favoritesSub.id.toString()){
                   return  payload.favoritesSub
                }
            },
            subscribe: async (_, args, context) => {
                return pubsub.asyncIterator('favoritesSub');
            }
        },
        getFriendsSub:{
            resolve: async (payload,args,context) =>{
               if (payload.getFriendsSub.id.toString() ===context.connection.variables.id.toString()){
                   return await  user.find({'_id':{ $in: payload.getFriendsSub.friends}});
               }else {
                   return []
               }
            },
            subscribe: async (_,args,context) =>{
                return pubsub.asyncIterator('getFriendsSub');
            }
        }
    }

};
