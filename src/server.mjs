import express from 'express'
import mongoose from 'mongoose'
import graphqlServer from './graphql/graphql-server.mjs'
const HOST = '0.0.0.0';
const PORT = 8080;
const app = express();
app.get('/healthz', (req, res) => {
    res.sendStatus(200)
});

app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin', ['*']);
    next();
});
mongoose.connect(
    "mongodb://localhost:27017/NativeProject",
    { useNewUrlParser: true, useCreateIndex: true }
).then(() => console.log('mongoose: connected to db'));
graphqlServer.start((arg) => {
    console.log("Server is running on localhost:4000")
});
app.listen(PORT, HOST);

