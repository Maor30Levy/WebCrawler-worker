const {ssm} = require('./aws-connect');

const saveSecret = async (username, secret) => {
    const secretName = username;
    console.log(`Saving secret to ${secretName}`); 
  
    const config = { 
      Name: secretName, 
      Value: secret, 
      Type: 'SecureString', 
      Overwrite: true
    }; 
    try{
        await ssm.putParameter(config).promise();
    }catch(err){
        console.log(err.stack);
    }
    
  };
  
const getSecret = async (secretName) => {
    console.log(`Getting secret for ${secretName}`);
    const params = {
      Name: secretName, 
      WithDecryption: true
    };
    try{
        const result = await ssm.getParameter(params).promise();
        return result.Parameter.Value;
    }catch(err){
        console.log(err.stack)
    }  
};

  module.exports = {
      saveSecret,
      getSecret
  }