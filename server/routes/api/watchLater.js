const router = require('express').Router()
const controller = require("../../controllers/api/watchLater")
const isLogin = require("../../middleware/is-login")
const multer = require("multer")
router.post('/watch-later',isLogin,multer().none(), controller.index)

module.exports = router;