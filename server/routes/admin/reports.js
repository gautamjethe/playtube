const express = require('express');
const router = express.Router();
const is_admin = require("../../middleware/admin/is-admin")
const controller = require("../../controllers/admin/reports")

router.get(`/reports/delete/:id`,is_admin,controller.delete)
router.get(`/reports/dismiss/:id`,is_admin,controller.dismiss)
router.get(`/reports/:page?`,is_admin,controller.index );


module.exports = router;