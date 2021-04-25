const router = require('express').Router()
const controller = require("../../controllers/api/favourite")
const isLogin = require("../../middleware/is-login")
const multer = require("multer")
router.post('/favourites',isLogin,multer().none(), controller.favourite)

module.exports = router;