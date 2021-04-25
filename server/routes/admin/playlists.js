const express = require('express')
const router = express.Router()
const controller = require("../../controllers/admin/playlists")
const is_admin = require("../../middleware/admin/is-admin")


router.get('/playlists/settings',is_admin, controller.settings);
router.post('/playlists/settings',is_admin, controller.settings);

router.get('/playlists/levels/:level_id?',is_admin, controller.levels);
router.post('/playlists/levels/:level_id?',is_admin, controller.levels);

router.get("/playlists/delete/:id",is_admin,controller.delete)
router.post("/playlists/featured/:id",is_admin,controller.featured)
router.post("/playlists/approve/:id",is_admin,controller.approve)

router.post("/playlists/sponsored/:id",is_admin,controller.sponsored)
router.post("/playlists/hot/:id",is_admin,controller.hot)
router.get('/playlists/:page?',is_admin, controller.index);
router.post('/playlists',is_admin, controller.index);

module.exports = router;