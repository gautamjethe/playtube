const express = require('express');
const router = express.Router();
const controller = require("../controllers/search")
const multer = require("multer")

router.use('/:lng?/search/:type?',multer().none(),controller.index);

module.exports = router;