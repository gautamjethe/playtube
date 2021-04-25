const express = require('express')
const router = express.Router()
const controller = require("../../controllers/admin/audio")
const is_admin = require("../../middleware/admin/is-admin")


router.get('/audio/settings',is_admin, controller.settings);
router.post('/audio/settings',is_admin, controller.settings);

router.get('/audio/levels/:level_id?',is_admin, controller.levels);
router.post('/audio/levels/:level_id?',is_admin, controller.levels);

router.get("/audio/delete/:id",is_admin,controller.delete)
router.post("/audio/approve/:id",is_admin,controller.approve)

router.get('/audio/:page?',is_admin, controller.index);
router.post('/audio',is_admin, controller.index);

module.exports = router;