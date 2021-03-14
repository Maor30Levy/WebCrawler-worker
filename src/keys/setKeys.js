const { saveSecret } = require('../aws/ssm');
const keys = require('./keys');

const setKeys = async () => {
    try {
        const devPort = process.env.PORT;
        const parserHost = process.env.PARSER_HOST;
        const workerHost = process.env.WORKER_HOST;
        await saveSecret('workerPort', devPort);
        await saveSecret('workerHost', workerHost);
    } catch (err) {
        console.log(err);
    }
};

module.exports = { setKeys };