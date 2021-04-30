//Connecting to AWS 
const AWS = require('aws-sdk');
const SESConfig = { region: 'us-east-2' };
if (process.env.AWS_ACCESS_KEY_ID) {
    SESConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    SESConfig.accessSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
}
AWS.config.update(SESConfig);
//Creating AWS services
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const ssm = new AWS.SSM({ apiVersion: '2014-11-06' });

module.exports = { s3, sqs, ssm };