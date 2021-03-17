const { processMessages } = require('../services/message-processor');

const worker = async (req, res) => {
    try {
        await processMessages(req.body.queueURL);
        res.send();
    } catch (err) {
        res.status(500);
    }
};

module.exports = { worker };