const { getSecret } = require('../aws/ssm');
const keys = {};
const getKeys = async () => {
    try {
        keys.port = await getSecret('workerPort');
        keys.parserHost = await getSecret('parserHost');
        keys.mongoDB = await getSecret('mongoDB');
        keys.workerHost = await getSecret('workerHost');
        return keys
    } catch (err) {
        console.log(err)
    }
};

getKeys();

module.exports = keys;