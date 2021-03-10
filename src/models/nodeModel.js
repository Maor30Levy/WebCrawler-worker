const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
    title: {
        type: String,
        default: ''
    },
    url: {
        type: String,
        required: true
    },
    children: {
        type: Array,
        default: []
    }
});


const NodeDB = mongoose.model('NodeDB', nodeSchema);

module.exports = NodeDB;