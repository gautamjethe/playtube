const router = require('express').Router()
const controller = require("../../controllers/api/rating")
const isLogin = require("../../middleware/is-login")
const multer = require("multer")
router.post('/ratings/stats', multer().none(), controller.stats)
router.post('/ratings', isLogin, multer().none(), controller.rating)


module.exports = router;