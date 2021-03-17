const { redisSetTree, redisGetTree } = require('../redis/tree-functions');
const { setNodeByID } = require('../utils/functions');

const setTree = async (queueName, tree) => {
    await redisSetTree(queueName, tree);
};

const getTree = async (queueName) => {
    return await redisGetTree(queueName);
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
    await setTree(queueName, tree);
};

const updateTree = async (node, message, queueURL, currentLevel) => {
    const tree = await getTree(message.qName);
    const root = setNodeByID(node.id, node, tree.root);
    tree.root = root;
    tree.numOfNodes++;
    if (message.nodesInLevel === tree.nodesInLevel) {
        tree.nodesInLevel = 0;
        tree.currentLevel++;
    } else tree.nodesInLevel++;
    if (
        (tree.numOfNodes === tree.maxPages) ||
        currentLevel > tree.maxLevel
    ) tree.completed = true;
    await setTree(message.qName, tree);
};

const getNumOfNodesFromDB = async (queueName) => {
    let dbPages = 0;
    const tree = getTree(queueName);
    if (tree) dbPages = tree.numOfNodes;
    console.log(tree.numOfNodes)
    return dbPages;
};

module.exports = { createNewTree, updateTree, getTree, getNumOfNodesFromDB };