const {
    AWSgetNumOfMessagesInQueue,
    AWSCreateMessage,
    AWSreceiveMessage,
    AWSDeleteMessage,
    AWSDeleteQ
} = require('../aws/sqs');


const getNumOfMessages = async (queueURL) => {
    return await AWSgetNumOfMessagesInQueue(queueURL);
}

const createMessage = async (queueURL, request) => {
    return await AWSCreateMessage(queueURL, request);
};

const getMessage = async (queueURL) => {
    return await AWSreceiveMessage(queueURL);
};

const deleteMessage = async (queueURL, receiptHandle, id) => {
    await AWSDeleteMessage(queueURL, receiptHandle, id);
};

const deleteQueue = async (queueURL) => {
    await AWSDeleteQ(queueURL);
};

module.exports = {
    getNumOfMessages,
    createMessage,
    getMessage,
    deleteMessage,
    deleteQueue
}


