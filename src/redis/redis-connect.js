const redis = require("redis");
const bluebird = require("bluebird");
const keys = require('../keys/keys');
bluebird.promisifyAll(redis);

const host = process.env.PORT ? 'localhost' : keys.redisHost;
const port = process.env.PORT ? 6379 : keys.redisPort;
const client = redis.createClient({ host, port });

client.on("error", function (error) {
    console.error(error);
});

module.exports = client;