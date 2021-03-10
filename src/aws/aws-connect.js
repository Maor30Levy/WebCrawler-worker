//Connecting to AWS 
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});

//Creating AWS services
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const ssm = new AWS.SSM({apiVersion: '2014-11-06'});

module.exports = {s3,sqs,ssm};