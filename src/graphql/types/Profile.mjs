import apolloServerModule from 'apollo-server-express'
import user from '../models/User.mjs'
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import md5 from 'md5';
const gql = apolloServerModule.gql

async function mailer (email,subject,html){
  const  transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 2525,
      secure: false,
      pool: true,
      host: "smtp.mailtrap.io",
      auth: {
          user: dotenv.config().parsed.USER_EMAIL,
          pass: dotenv.config().parsed.USER_PASSWORD
      }
  });
    const mailOptions = {
        from: dotenv.config().parsed.USER_EMAIL,
        to: email,
        subject: subject,
        html: html
    };
   try{
       return await  transporter.sendMail(mailOptions);
   }catch (e){}
}
export const type = gql`
    input SignUpInput{
      username: String!
      email: String!
      password: String!
    }
    input SignInInput{
     email: String!,
     password: String!,
    }
    input TryAgainInput{
     id: String!
     email: String!
    }
    input VerificationInput{
     id: String!
     code: String!
    }
    input TokenInput{
    id: String
    token: String
    }
    type SignInResult{
    id: String
    username: String!
    email: String!
    valid: String
    }
    extend type Query {
       testEmail(email: String!):String!
       SignIn(input:SignInInput!):[SignInResult]!
       tryAgain(input: TryAgainInput):String!
       Verification(input: VerificationInput!):Boolean!
    }
    extend type Mutation {
       SignUp(input: SignUpInput): String!
       updateToken(input: TokenInput): String!
    }`;

export const resolvers = {
    Query:{
        testEmail: async (_,{email}) =>{
            const result = await user.findOne({ email: email});
            return result?'This email address already exists':'';
        },
        SignIn: async (_,{input}) =>{
            const result = await user.findOne({ email: input.email,password: md5(input.password)});
            return [result]
        },
        tryAgain: async (_,{input}) =>{
            const result = await user.findOne({ _id: input.id,email: input.email});
            const code = Math.random().toString().slice(-6);
            if (result){
                const mail =await mailer(result.email,'Verification','\n' +
                    '\n' +
                    '<body align="center">\n' +
                    ' <div><span style="font-size: 1.5rem">Hi '+result.username+'</span></div>\n' +
                    ' <div style="margin-top: 20px"><span style="font-size: 1.5rem">Here is the confirmation code for your online from:</span></div>\n' +
                    ' <div style="margin-top: 80px"><h1 style="font-size: 3rem">'+code+'</h1></div>\n' +
                    ' <div  style="margin-top: 20px"><span  style="font-size: 1.5rem">All you have to do is copy the confirmation code and paste it your complate the email verification process.</span></div>\n' +
                    '</body>\n');
                if (mail){
                    await user.updateOne(result,{valid: code});
                }
            }
            return "ok"
        },
        Verification: async (_,{input}) =>{
            const result = await user.findOne({ _id: input.id,valid: input.code});
            if (result){
                await user.updateOne(result,{valid: ''});
                return true
            }else {
                return false
            }
        }
    },
    Mutation: {
        updateToken: async (_,{input})=>{
           const UpdateToken = await user.updateOne({_id: input.id},{token: input.token})
            return "ok"
},
        SignUp: async (_,{input}) =>{
            const result = await user.findOne({ email: input.email });
            const code = Math.random().toString().slice(-6);
            if (!result){
                const mail =await mailer(input.email,'Verification','\n' +
                    '\n' +
                    '<body align="center">\n' +
                    ' <div><span style="font-size: 1.5rem">Hi '+input.username+'</span></div>\n' +
                    ' <div style="margin-top: 20px"><span style="font-size: 1.5rem">Here is the confirmation code for your online from:</span></div>\n' +
                    ' <div style="margin-top: 80px"><h1 style="font-size: 3rem">'+code+'</h1></div>\n' +
                    ' <div  style="margin-top: 20px"><span  style="font-size: 1.5rem">All you have to do is copy the confirmation code and paste it your complate the email verification process.</span></div>\n' +
                    '</body>\n');
                 if (mail){
                     input.valid = code;
                     input.token=''
                     input.password= md5(input.password);
                     const create = await user.create(input)
                     return create?'id:'+create.id:'Invalid data'
                 }else {
                     return 'Please choose a different email';
                 }
            }else {
                return 'This email address already exists'
            }
        }
    }
};