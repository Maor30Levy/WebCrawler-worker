const express = require('express');
const { worker } = require('../aws/sqs');
const router = new express.Router();

router.post('/', async (req, res) => {
    try {
        await worker(req.body.queueURL);
        res.send();
    } catch (err) {
        res.status(500);
    }
});


module.exports = router;