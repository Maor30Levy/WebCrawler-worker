const {getSecret} = require('../aws/ssm');

const getKeys = async ()=>{
    try{
        const keys = {
            port: await getSecret('workerPort'),
            parserHost: await getSecret('parserHost'),
            mongoDB: await getSecret('mongoDB'),
            workerHost: await getSecret('workerHost')
        };
        return keys
    }catch(err){
        console.log(err)
    }
};

module.exports = {getKeys};