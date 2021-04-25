const router = require('express').Router()
const controller = require("../../controllers/api/notifications")
const isLogin = require("../../middleware/is-login")
const multer = require("multer")
router.post('/notifications/read',isLogin,multer().none(), controller.read)
router.post('/notifications/delete',isLogin,multer().none(), controller.delete)
router.use('/notifications',isLogin,multer().none(), controller.index)

module.exports = router;