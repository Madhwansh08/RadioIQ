
const express = require('express');
const router = express.Router();
const { shutdownPC } = require('../controllers/shutdownController');

router.post('/shut', shutdownPC);

module.exports = router;