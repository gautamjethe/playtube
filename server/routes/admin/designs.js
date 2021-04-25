const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/designs")
const is_admin = require("../../middleware/admin/is-admin")


router.use(`/designs/assets`,is_admin,controller.assets );
router.use(`/designs/color/:theme?`,is_admin,controller.color );
router.use(`/designs/custom-design`,is_admin,controller.customDesign );


module.exports = router;