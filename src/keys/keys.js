const keys = {
    mongoDB: process.env.MONGODB,
    port: process.env.PORT,
    parserHost: process.env.PARSER_HOST,
    workerHost: process.env.WORKER_HOST,
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT
};

module.exports = { keys };