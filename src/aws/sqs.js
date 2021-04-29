const { sqs } = require('./aws-connect');

const AWSgetNumOfMessagesInQueue = async (queueURL) => {
    try {
        const params = {
            QueueUrl: queueURL,
            AttributeNames: [
                'ApproximateNumberOfMessages',
                'ApproximateNumberOfMessagesDelayed',
                'ApproximateNumberOfMessagesNotVisible'
            ]
        };
        const numOfMessagesInQueue = await sqs.getQueueAttributes(params).promise();
        const attributes = numOfMessagesInQueue.Attributes;
        const availableMessages = parseInt(attributes.ApproximateNumberOfMessages);
        const delayedMessages = parseInt(attributes.ApproximateNumberOfMessagesDelayed);
        const nonVisibleMessages = parseInt(attributes.ApproximateNumberOfMessagesNotVisible);
        return { availableMessages, delayedMessages, nonVisibleMessages };
    } catch (err) {
        console.log('Error fetching the queue');
        return { availableMessages: 0, delayedMessages: 0, nonVisibleMessages: 0 };
    }
}

const AWSCreateMessage = async (queueURL, request) => {
    const params = {
        MessageAttributes: {
            "qName": {
                DataType: "String",
                StringValue: request.qName
            },
            "id": {
                DataType: "String",
                StringValue: request.id
            },
            "url": {
                DataType: "String",
                StringValue: request.url
            },
            "level": {
                DataType: "Number",
                StringValue: request.level
            },
            "maxLevel": {
                DataType: "Number",
                StringValue: request.maxLevel
            },
            "maxPages": {
                DataType: "Number",
                StringValue: request.maxPages
            }
        },
        MessageBody: `${request.url}: ${request.id}`,
        MessageDeduplicationId: request.id,
        MessageGroupId: `Group${request.maxLevel}`,
        QueueUrl: queueURL
    };
    try {
        const data = await sqs.sendMessage(params).promise();
        console.log(`Message ${request.id} added to queue`);
        return messageID = data.MessageId;
    } catch (err) {
        console.log(`Error creating the message: ${err}`);
    }
};

const AWSreceiveMessage = async (queueURL) => {
    const params = {
        QueueUrl: queueURL,
        MessageAttributeNames: [
            "id",
            "qName",
            "url",
            "level",
            "maxLevel",
            "maxPages"
        ],
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 300,
        WaitTimeSeconds: 5
    }
    try {
        const data = await sqs.receiveMessage(params).promise();
        if (!data?.Messages) return;

        const messagesrArray = [];
        for (let message of data.Messages) {
            const attributes = message.MessageAttributes;
            const output = {};
            for (let attribute in attributes) {
                output[attribute] = (attributes[attribute]).StringValue;
            }
            console.log(output.id);
            const receiptHandle = message.ReceiptHandle;
            messagesrArray.push({ output, receiptHandle });
        }
        return messagesrArray;
    } catch (err) {
        console.log(err);
    }
};

const AWSDeleteMessage = async (queueURL, receiptHandle, id) => {
    const deleteParams = {
        QueueUrl: queueURL,
        ReceiptHandle: receiptHandle
    }
    try {
        const data = await sqs.deleteMessage(deleteParams).promise();
        console.log(`Message ${id} deleted`);
    } catch (err) {
        console.log(err);
    }
};


module.exports = {
    AWSgetNumOfMessagesInQueue,
    AWSCreateMessage,
    AWSreceiveMessage,
    AWSDeleteMessage
};