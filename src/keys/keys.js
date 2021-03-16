const { getSecret } = require('../aws/ssm');
const keys = {};
const getKeys = async () => {
    try {
        keys.mongoDB = await getSecret('mongoDB');
        keys.port = await getSecret('workerPort');
        keys.parserHost = await getSecret('parserHost');
        keys.workerHost = await getSecret('workerHost');
        return keys
    } catch (err) {
        console.log(err)
    }
};

getKeys();

module.exports = keys;