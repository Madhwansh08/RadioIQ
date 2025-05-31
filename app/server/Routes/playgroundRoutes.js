const express = require('express');
const router = express.Router();
const playgroundController = require("../controllers/playgroundController");

router.get("/data-pg", playgroundController.getPlaygroundData);

module.exports = router;

