const router = require('express').Router()
const controller = require("../../controllers/api/follower")
const isLogin = require("../../middleware/is-login")
const multer = require("multer")
router.post('/follow',isLogin,multer().none(), controller.follow)

module.exports = router;