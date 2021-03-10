const {sqs} = require('./aws-connect');
// const params = {

//     QueueUrl: 'https://sqs.us-east-2.amazonaws.com/129371959195/3-https---www-google-com-50.fifo',
//     MessageAttributeNames: [
//         "id",
//         "url",
//         "level",
//         "maxLevel",
//         "maxPages",
//         "page"
//     ],
//     MaxNumberOfMessages: 1,
//     VisibilityTimeout: 10,
//     WaitTimeSeconds: 2
// }
// sqs.receiveMessage(params, function (err, data){
//     if(err) console.log(err.stack);
//     else {
//         const message = data.Messages[0];
//         const attributes = message.MessageAttributes;
//         const output = {};
//         for(let attribute in attributes){
//             output[attribute] = (attributes[attribute]).StringValue;
//         }
//         return output;
//         }
// });

const listAllQueues = async ()=>{
    const listParams = {};
    try{
      const data = await sqs.listQueues({}).promise();
      if(data.QueueUrls) {
        console.log('Successful fetching')
        const arr = [].concat(data.QueueUrls);
        console.log(arr.length)
        return arr;
      }
      else {
        console.log('No more queues');
        return;
      }
    }catch(err){
      console.log("Error", err);
    }
  };
  const AWSreceiveMessage = async (queueURL)=>{
    const params = {
      QueueUrl: queueURL,
      MessageAttributeNames: [
          "id",
          "qName",
          "url",
          "level",
          "maxLevel",
          "maxPages",
          "page"
      ],
      MaxNumberOfMessages: 1,
      VisibilityTimeout: 60,
      WaitTimeSeconds: 2
    }
    try{
      const data = await sqs.receiveMessage(params).promise();
      if(!data?.Messages) return;
      const message = data.Messages[0];
      const attributes = message.MessageAttributes;
      const output = {};
      for(let attribute in attributes){
        output[attribute] = (attributes[attribute]).StringValue;
      }
      console.log(output.id);
      const receiptHandle = message.ReceiptHandle;
      return {output,receiptHandle};
    }catch(err){
      console.log(err);
    }
  };

const trigger = async ()=>{
    const arr = await listAllQueues();
    if(arr){
        const length = arr.length;
        const index = Math.floor(Math.random()*length);
        AWSreceiveMessage(arr[index]);
    }
}

setInterval(trigger,1500)
  