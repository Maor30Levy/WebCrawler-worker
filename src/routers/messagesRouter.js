const express = require('express');
const { worker } = require('../controllers/worker-controller');
const router = new express.Router();

router.post('/', worker);

module.exports = router;