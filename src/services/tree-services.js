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
        maxLevel: parseInt(maxLevel),
        maxPages: parseInt(maxPages),
        gaps: {},
        levelsRecorded: [1]
    };
    await setTree(queueName, tree);
};

const updateTree = async (node, message, currentLevel) => {
    const tree = await getTree(message.qName);
    const root = setNodeByID(node.id, node, tree.root);
    tree.root = root;
    tree.numOfNodes++;
    if (currentLevel > tree.levelsRecorded[tree.levelsRecorded.length - 1])
        tree.levelsRecorded.push(currentLevel);
    await setTree(message.qName, tree);
};

const getNumOfNodesFromDB = async (queueName) => {
    let dbPages = 0;
    const tree = await getTree(queueName);
    if (tree) dbPages = tree.numOfNodes;
    return dbPages;
};

module.exports = { createNewTree, updateTree, getTree, getNumOfNodesFromDB };