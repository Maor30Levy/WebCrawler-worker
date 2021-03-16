const express = require('express');
const { processMessages } = require('../controllers/messageProcessor');
const router = new express.Router();

router.post('/', async (req, res) => {
    try {
        await processMessages(req.body.queueURL);
        res.send();
    } catch (err) {
        res.status(500);
    }
});


module.exports = router;