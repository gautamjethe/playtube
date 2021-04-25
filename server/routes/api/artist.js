const router = require('express').Router()
const controller = require("../../controllers/api/artist")
const multer = require("multer")


router.post('/artists-browse',multer().none(),controller.browse)
router.post('/artist-view',multer().none(),controller.view)
router.post("/artist-photos",multer().none(),controller.photos)
module.exports = router;