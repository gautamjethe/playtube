const router = require('express').Router()
const controller = require("../../controllers/api/like")
const isLogin = require("../../middleware/is-login")
const multer = require("multer")
router.post('/likes',isLogin,multer().none(), controller.like)

module.exports = router;