const axios = require('axios');
const Node = require("../utils/node");
const { keys } = require('../keys/keys');
const { setChildrenNodes, getChildrenURLs } = require("../utils/functions");
const { createNewTree, updateTree, getTree, getNumOfNodesFromDB } = require('./tree-services');
const {
    getNumOfMessages,
    createMessage,
    getMessage,
    deleteMessage
} = require('./queue-and-message-services')
const { checkURLInDB, createNewNode } = require('./node-sevices');

const workerURL = `http://${keys.workerHost}:${keys.workerPort}`
const parserURL = `http://${keys.parserHost}:${keys.parserPort}`
const publishNode = async (node, message, isNodeInDB, currentLevel) => {
    if (!isNodeInDB) await createNewNode(node);
    if (node.id === '0') {
        await createNewTree(node, message.qName, node.url, message.maxLevel, message.maxPages);
    } else await updateTree(node, message, currentLevel);
};

const handleMessage = async (message, queueURL, numOfPages) => {
    const { maxLevel, url, id, maxPages, qName } = message;
    const level = parseInt(message.level);
    try {
        let children = [];
        const node = new Node(url, level, id);
        const nodeFromDB = await checkURLInDB(url);
        if (!nodeFromDB) {
            const parsedResult = await axios.post(parserURL, { url });
            node.title = parsedResult.data.title;
            children = parsedResult.data.children;
            node.children = setChildrenNodes(children, level + 1, id);
            await publishNode(node, message, false, level);
        } else {
            node.title = nodeFromDB.title;
            children = getChildrenURLs(nodeFromDB.children);
            node.children = setChildrenNodes(children, level + 1, id);
            await publishNode(node, message, true, level);

        }
        let pagesGap = parseInt(maxPages) - numOfPages;
        const levelGap = parseInt(maxLevel) - level;
        for (let i = 0;
            levelGap > 0 && pagesGap > 0 && i < children.length;
            i++, pagesGap--) {
            const footer = i > 9 ? `/${i}/` : i;
            const request = {
                qName,
                id: id + footer,
                url: children[i],
                level: `${level + 1}`,
                maxLevel,
                maxPages
            }
            await createMessage(queueURL, request);
            axios.post(workerURL, { queueURL });
        }
        return true;
    } catch (err) {
        console.log(err);
    }
};

const handlePostWork = async (queueURL, queueName) => {
    try {
        const tree = getTree(queueName);
        if (!tree.completed) {
            const anotherAvailableMessages = (await getNumOfMessages(queueURL)).availableMessages;
            if (anotherAvailableMessages > 0) axios.post(workerURL, { queueURL });
        }
    } catch (err) {
        console.log(err)
    }
};

const processMessages = async (queueURL) => {
    try {
        const { availableMessages } = await getNumOfMessages(queueURL);

        if (availableMessages > 0) {
            const messages = await getMessage(queueURL);
            if (messages) {
                const queueName = messages[0].output.qName;
                for (let message of messages) {
                    const { output, receiptHandle } = message;
                    const { availableMessages, delayedMessages, nonVisibleMessages } = await getNumOfMessages(queueURL);
                    const qMessages = availableMessages + delayedMessages + nonVisibleMessages;
                    const dbPages = output.id === '0' ? 0 : await getNumOfNodesFromDB(output.qName);
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

module.exports = { processMessages };