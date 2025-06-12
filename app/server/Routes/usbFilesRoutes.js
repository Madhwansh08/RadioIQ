const express = require('express');
const router = express.Router();
const { getUsbFiles, saveToUsb } = require('../controllers/usbFilesController');

router.get('/usb-files', getUsbFiles);
router.post('/save-to-usb', saveToUsb);

module.exports = router;