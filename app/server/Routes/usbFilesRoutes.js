const express = require('express');
const router = express.Router();
const { getUsbFiles } = require('../controllers/usbFilesController');

router.get('/usb-files', getUsbFiles);

module.exports = router;