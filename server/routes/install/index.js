const express = require('express');
const router = express.Router();
const controller = require("../../controllers/install/index");

router.post('/install/run-queries', controller.install)

router.use('/install', controller.index)

module.exports = router