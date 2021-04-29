const redis = require("redis");
const bluebird = require("bluebird");
const { keys } = require('../keys/keys');
bluebird.promisifyAll(redis);

const host = keys.redisHost;
const port = keys.redisPort;
const client = redis.createClient({ host, port });

client.on("error", function (error) {
    console.error(error);
});

module.exports = client;