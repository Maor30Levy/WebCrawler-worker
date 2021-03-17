const { findNode, mongoDBCreateNode } = require("../db/node");

const checkURLInDB = async (url) => {
    return await findNode(url);
};

const createNewNode = async (node) => {
    await mongoDBCreateNode(node);
};

module.exports = { checkURLInDB, createNewNode };