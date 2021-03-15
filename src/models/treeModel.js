const mongoose = require('mongoose');
const Node = require('./nodeModel');
const treeSchema = new mongoose.Schema({
    root: {
        type: Object,
        default: {}
    },
    title: {
        type: String,
        required: true
    },
    numOfNodes: {
        type: Number,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    maxLevel: {
        type: Number,
        required: true
    },
    maxPages: {
        type: Number,
        required: true
    },
    completed: {
        type: Boolean
    },
    currentLevel: {
        type: Number
    },
    nodesInLevel: {
        type: Number
    }
});


const Tree = mongoose.model('Tree', treeSchema);

module.exports = Tree;