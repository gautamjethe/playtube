const express = require('express');
const router = express.Router();
const multer = require("multer")
const controller = require("../../controllers/admin/mailTemplates")
const is_admin = require("../../middleware/admin/is-admin")

router.get('/mail/templates/:language?/:template_id?',multer().none(), is_admin, controller.index)
router.post('/mail/templates/:language?/:template_id?',multer().none(), is_admin, controller.index)

module.exports = router;