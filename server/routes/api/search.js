const router = require('express').Router()
const multer = require("multer")
const controller = require("../../controllers/api/search")

router.post('/search/:type?', multer().none(), controller.index)


module.exports = router;