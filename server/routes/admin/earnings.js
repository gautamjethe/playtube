const express = require('express');
const router = express.Router();

const controller = require("../../controllers/admin/earnings")
const is_admin = require("../../middleware/admin/is-admin")


router.get("/earnings",is_admin,controller.index)
module.exports = router;