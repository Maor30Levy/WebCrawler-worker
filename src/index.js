const express = require('express');
const cors = require('cors');
let keys;
const initServer = async () => {
    try {
        if (process.env.PORT) {
            await require('./keys/setKeys').setKeys();
        }
        keys = require('./keys/keys');
        const app = express();
        const { connectMongo } = require('./db/mongoose');
        connectMongo(keys.mongoDB);
        const redisClient = require('./redis/redis-connect');
        redisClient.on("ready", function () {
            console.log('Redis client connected');
        });
        const messagesRouter = require('./routers/messagesRouter');
        const port = keys.port;
        app.use(express.json());
        app.use(cors());
        app.use(messagesRouter);
        app.listen(port, () => {
            console.log(`Server is up on port ${port}!`)
        });
    } catch (err) {
        console.log(err);
    }

};

initServer();

