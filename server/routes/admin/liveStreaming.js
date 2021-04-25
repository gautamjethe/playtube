const express = require('express')
const router = express.Router()
const controller = require("../../controllers/admin/liveStreaming")
const is_admin = require("../../middleware/admin/is-admin")


router.get('/live-streaming/settings', is_admin, controller.settings);
router.post('/live-streaming/settings', is_admin, controller.settings);

router.get('/live-streaming/levels/:level_id?', is_admin, controller.levels);
router.post('/live-streaming/levels/:level_id?', is_admin, controller.levels);


router.get("/live-streaming/delete/:id",is_admin,controller.delete)


module.exports = router;