const keys = {
    mongoDB: process.env.MONGODB,
    port: process.env.PORT,
    parserHost: process.env.PARSER_HOST,
    parserPort: process.env.PARSER_PORT,
    workerHost: process.env.WORKER_HOST,
    workerPort: process.env.WORKER_PORT,
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT
};

module.exports = { keys };