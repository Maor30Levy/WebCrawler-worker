const { sqs } = require('./aws-connect');
const axios = require('axios');
const { getSecret } = require('../aws/ssm');
const Node = require("../utils/node");
const Tree = require('../models/treeModel');
const NodeDB = require('../models/nodeModel');

const {
  setChildrenNodes,
  getChildrenURLs,
  setNodeByID,
  getNumOfNodesFromDB,
  checkURLInDB
} = require("../utils/functions");


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
    console.log(err);
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
      },
      "nodesInLevel": {
        DataType: "Number",
        StringValue: request.nodesInLevel
      },
      "currentNodeInLevel": {
        DataType: "Number",
        StringValue: request.currentNodeInLevel
      }
    },
    MessageBody: `${request.url}: ${request.id}`,
    MessageDeduplicationId: request.id,
    MessageGroupId: `Group${request.maxLevel}`,
    QueueUrl: queueURL
  };
  try {
    const data = await sqs.sendMessage(params).promise();
    console.log("Success", data.MessageId);
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
      "maxPages",
      "page"
    ],
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 60,
    WaitTimeSeconds: 2
  }
  try {
    const data = await sqs.receiveMessage(params).promise();
    if (!data?.Messages) return;
    const message = data.Messages[0];
    const attributes = message.MessageAttributes;
    const output = {};
    for (let attribute in attributes) {
      output[attribute] = (attributes[attribute]).StringValue;
    }
    console.log(output.id);
    const receiptHandle = message.ReceiptHandle;
    return { output, receiptHandle };
  } catch (err) {
    console.log(err);
  }
};

const AWSDeleteMessage = async (queueURL, receiptHandle) => {
  const deleteParams = {
    QueueUrl: queueURL,
    ReceiptHandle: receiptHandle
  }
  try {
    const data = await sqs.deleteMessage(deleteParams).promise();
    console.log(data);
  } catch (err) {
    console.log(err);
  }
};

const deleteQ = async (queueURL) => {
  const deleteParams = {
    QueueUrl: queueURL
  };
  try {
    await sqs.deleteQueue(deleteParams).promise();
    console.log("Queue deleted");
  } catch (err) {
    console.log("Error deleting the queue", err);
  }
};




const createMessage = async (queueURL, request) => {
  return await AWSCreateMessage(queueURL, request);
};

const getMessage = async (queueURL) => {
  return await AWSreceiveMessage(queueURL);
};

const deleteMessage = async (queueURL, receiptHandle) => {
  await AWSDeleteMessage(queueURL, receiptHandle);
};


const publishNode = async (node, message, isNodeInDB, queueURL, currentLevel) => {
  let tree;
  if (!isNodeInDB) {
    const { title, url, children } = node;
    const newNode = new NodeDB({ title, url, children });
    await newNode.save();
  }
  if (node.id === '0') {
    tree = new Tree({
      root: node,
      title: message.qName,
      url: node.url,
      numOfNodes: 1,
      maxLevel: message.maxLevel,
      maxPages: message.maxPages,
      currentLevel: 2
    });
  } else {
    tree = await Tree.findOne({ title: message.qName });
    const root = setNodeByID(node.id, node, tree.root);
    tree.root = root;
    tree.markModified('root');
    await tree.save();
    tree.numOfNodes++;
    if (message.nodesInLevel === message.currentNodeInLevel) tree.currentLevel++;
    const availableMessages = (await AWSgetNumOfMessagesInQueue(queueURL)).availableMessages;
    if (
      (tree.numOfNodes === tree.maxPages) ||
      (availableMessages === 0 && currentLevel === tree.maxLevel)
    ) tree.completed = true;
  }
  await tree.save();
  return;
};

const handleMessage = async (message, queueURL, numOfPages) => {
  const { level, maxLevel, url, id, maxPages, qName } = message;
  const tree = await Tree.findOne({ title: qName });
  if (tree?.currentLevel != parseInt(level)) return false;
  let children = [];
  const node = new Node(url, level, id);
  try {
    const nodeFromDB = await checkURLInDB(url);
    if (!nodeFromDB) {
      const parserAPI = await getSecret('parserHost');
      const parseResult = await axios.post(parserAPI, { url });
      node.title = parseResult.data.title;
      children = parseResult.data.children;
      node.children = setChildrenNodes(children, level, id);
      await publishNode(node, message, false, queueURL, parseInt(level));
    } else {
      node.title = nodeFromDB.title;
      node.children = nodeFromDB.children;
      await publishNode(node, message, true, queueURL, parseInt(level));
      children = getChildrenURLs(nodeFromDB.children);
    }
    let pagesGap = parseInt(maxPages) - numOfPages;
    const levelGap = parseInt(maxLevel) - parseInt(level);
    if (levelGap > 0) {
      for (let i = 0;
        pagesGap > 0 && i < children.length;
        i++, pagesGap--) {
        const footer = i > 9 ? `/${i}/` : i;
        const request = {
          qName,
          id: id + footer,
          url: children[i],
          level: `${parseInt(level) + 1}`,
          maxLevel,
          maxPages,
          nodesInLevel: `${children.length}`,
          currentNodeInLevel: `${i + 1}`
        }
        await createMessage(queueURL, request);
        const workerHost = await getSecret('workerHost');
        axios.post(workerHost, { queueURL });
      }
    }
    return true;
  } catch (err) {
    console.log(err);
  }
};

const handlePostWork = async (queueURL, queueName) => {
  const tree = await Tree.findOne({ title: queueName });
  if (tree.completed) deleteQ(queueURL);
  else {
    const anotherAvailableMessages = (await AWSgetNumOfMessagesInQueue(queueURL)).availableMessages;
    if (anotherAvailableMessages > 0) {
      const workerHost = await getSecret('workerHost');
      axios.post(workerHost, { queueURL });
    }
  }
}

const worker = async (queueURL) => {
  const { availableMessages, delayedMessages, nonVisibleMessages } = await AWSgetNumOfMessagesInQueue(queueURL);
  const qMessages = availableMessages + delayedMessages + nonVisibleMessages;
  if (qMessages) {
    const { output, receiptHandle } = await getMessage(queueURL);

    const dbPages = await getNumOfNodesFromDB(output.qName);
    if (await handleMessage(output, queueURL, qMessages + dbPages))
      await deleteMessage(queueURL, receiptHandle);
    await handlePostWork(queueURL, output.qName);

  }
};

module.exports = {
  worker
};