const express = require('express');
const router = express.Router();
const controller = require("../controllers/livestreaming")
const videoController = require("../controllers/video")
const multer = require("multer")
const middlewareEnable = require("../middleware/enable")

router.use('/media-streaming/:path.html', async (req, res, next) => {
    path = req.params.path+".html"
    // if(path.indexOf(".html") < 0){
    //     path = path+".html"
    // }
    res.sendFile(req.streamingPATH+path)
})

router.get('/:lng?/live-streaming',multer().none(),async (req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"livestreaming",'create')
},controller.create);
router.get('/:lng?/live',multer().none(),(req,res,next) => {
    req.isLiveStreaming = true
    next()
},videoController.browse);
module.exports = router; 