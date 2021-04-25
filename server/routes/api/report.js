const router = require('express').Router()
const controller = require("../../controllers/api/report")
const isLogin = require("../../middleware/is-login")
const multer = require("multer")
router.post('/report',isLogin,multer().none(), controller.index)

module.exports = router;