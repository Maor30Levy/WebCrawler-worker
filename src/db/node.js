const NodeDB = require("./models/nodeModel");

const findNode = async (url) => {
    const node = await NodeDB.findOne({ url });
    return node
};

const mongoDBCreateNode = async (node) => {
    const { title, url, children } = node;
    const newNode = new NodeDB({ title, url, children });
    await newNode.save();
};

module.exports = { findNode, mongoDBCreateNode };