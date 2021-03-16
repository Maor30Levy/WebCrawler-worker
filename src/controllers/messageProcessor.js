const axios = require('axios');
const Node = require("../utils/node");
const Tree = require('../models/treeModel');
const NodeDB = require('../models/nodeModel');
const keys = require('../keys/keys');
const {
    setChildrenNodes,
    getChildrenURLs,
    setNodeByID,
    getNumOfNodesFromDB,
    checkURLInDB
} = require("../utils/functions");

const {
    AWSgetNumOfMessagesInQueue,
    AWSCreateMessage,
    AWSreceiveMessage,
    AWSDeleteMessage,
    AWSDeleteQ
} = require('../aws/sqs');

const createMessage = async (queueURL, request) => {
    return await AWSCreateMessage(queueURL, request);
};

const getMessage = async (queueURL) => {
    return await AWSreceiveMessage(queueURL);
};

const deleteMessage = async (queueURL, receiptHandle, id) => {
    await AWSDeleteMessage(queueURL, receiptHandle, id);
};

const createNewNode = async (node) => {
    const { title, url, children } = node;
    const newNode = new NodeDB({ title, url, children });
    await newNode.save();
};

const createNewTree = async (node, queueName, url, maxLevel, maxPages) => {
    let tree = {
        root: node,
        title: queueName,
        url,
        numOfNodes: 1,
        maxLevel,
        maxPages,
        currentLevel: 2,
        nodesInLevel: 0
    };
    tree = new Tree(tree);
    await tree.save();
};

const updateTree = async (node, message, queueURL, currentLevel) => {
    const tree = await Tree.findOne({ title: message.qName });
    const root = setNodeByID(node.id, node, tree.root);
    tree.root = root;
    tree.markModified('root');
    await tree.save();
    tree.numOfNodes++;
    if (message.nodesInLevel === tree.nodesInLevel) {
        tree.nodesInLevel = 0;
        tree.currentLevel++;
    } else tree.nodesInLevel++;
    const availableMessages = (await AWSgetNumOfMessagesInQueue(queueURL)).availableMessages;
    if (
        (tree.numOfNodes === tree.maxPages) ||
        (availableMessages === 0 && currentLevel === tree.maxLevel)
    ) tree.completed = true;
    await tree.save();
}

const publishNode = async (node, message, isNodeInDB, queueURL, currentLevel) => {
    let tree;
    if (!isNodeInDB) await createNewNode(node);
    if (node.id === '0') {
        await createNewTree(node, message.qName, node.url, message.maxLevel, message.maxPages);
    } else await updateTree(node, message, queueURL, currentLevel);
};

const handleMessage = async (message, queueURL, numOfPages) => {
    const { level, maxLevel, url, id, maxPages, qName } = message;
    try {
        let children = [];
        const node = new Node(url, level, id);
        const nodeFromDB = await checkURLInDB(url);
        if (!nodeFromDB) {
            const parseResult = await axios.post(keys.parserHost, { url });
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
                axios.post(keys.workerHost, { queueURL });
            }
        }
        return true;
    } catch (err) {
        console.log(err);
    }
};

const handlePostWork = async (queueURL, queueName) => {
    try {
        const tree = await Tree.findOne({ title: queueName });
        if (tree.completed) AWSDeleteQ(queueURL);
        else {
            const anotherAvailableMessages = (await AWSgetNumOfMessagesInQueue(queueURL)).availableMessages;
            if (anotherAvailableMessages > 0) axios.post(keys.workerHost, { queueURL });
        }
    } catch (err) {
        console.log(err)
    }
};

const processMessages = async (queueURL) => {
    try {
        const { availableMessages, delayedMessages, nonVisibleMessages } = await AWSgetNumOfMessagesInQueue(queueURL);
        const qMessages = availableMessages + delayedMessages + nonVisibleMessages;
        if (availableMessages > 0) {
            const messages = await getMessage(queueURL);
            if (messages) {
                const queueName = messages[0].output.qName;
                for (let message of messages) {
                    const { output, receiptHandle } = message;
                    const dbPages = await getNumOfNodesFromDB(output.qName);
                    if (await handleMessage(output, queueURL, qMessages + dbPages))
                        await deleteMessage(queueURL, receiptHandle, output.id);
                }
                await handlePostWork(queueURL, queueName);
            }
        }
    } catch (err) {
        console.log(err)
    }

};

module.exports = {
    processMessages
};