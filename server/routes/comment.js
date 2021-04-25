const express = require('express');
const router = express.Router();
const controller = require("../controllers/comments")

router.use('/:lng?/comment/:id?',controller.comment);
router.use('/:lng?/reply/:id?',controller.reply);
module.exports = router;