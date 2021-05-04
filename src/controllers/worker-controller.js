const { processMessages } = require('../services/message-processor');

const worker = async (req, res) => {
    try {
        await processMessages(req.body.queueURL);
        return res.send();
    } catch (err) {
        return res.status(500);
    }
};

module.exports = { worker };