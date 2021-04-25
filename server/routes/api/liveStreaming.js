const router = require('express').Router()
const multer = require("multer")
const controller = require('../../controllers/api/video')
const upload = require('../../functions/upload').upload
const resize = require("../../functions/resize")
const path = require("path")
const fs = require("fs")
const { check } = require('express-validator')
const videoModel = require("../../models/videos")
const constant = require("../../functions/constant")
const isLogin = require("../../middleware/is-login"),
fieldErrors = require('../../functions/error'),
errorCodes = require("../../functions/statusCodes")

router.post('/live-streaming/search',multer().none(),controller.getVideos)

router.post('/live-streaming/record/start',multer().none(),controller.cloudRecrodingStart)
router.post('/live-streaming/record/stop',multer().none(),controller.cloudRecrodingStop)
router.post('/live-streaming/add-viewer',multer().none(),controller.addViewer)
router.post('/live-streaming/delete-viewer',multer().none(),controller.removeViewer)
router.post('/live-streaming/create-key',multer().none(),controller.createKey)
router.post('/live-streaming/media-stream/recording',multer().none(),controller.mediaStreamRecord)
router.post('/live-streaming/media-stream/finish',multer().none(),controller.finishStreaming)

router.use('/live-streaming/status',multer().none(),controller.streamingStatus)
router.use('/live-streaming/create-default',isLogin,multer().none(),[
    check("title").not().isEmpty().withMessage(constant.error.TITLEMESSAGE).trim(),
  ],controller.default)


router.post('/live-streaming/create',isLogin,async (req,res,next) => {
    req.liveStreaming = true
    if(req.levelPermissions["livestreaming.quota"] > 0){
        //get count of user uploaded livestreaming
        await videoModel.liveStreamingUploadCount(req,res).then(result => {
            if(result){
                if(result.totalLiveStreaming >= req.levelPermissions["livestreaming.quota"]){
                    req.quotaLimitError = true
                }
            }
        }).catch(error => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.GENERAL }], true), status: errorCodes.serverError }).end();
        })
    }
    
    if(req.quotaLimitError){
        next()
        return
    }

    req.allowedFileTypes = /jpeg|jpg|png|gif/
    var currUpload = upload('image',"upload/images/live-streaming/",req)
    req.imageResize = [
        {  width: req.widthResize, height: req.heightResize }
    ];
    currUpload(req,res,function(err){
        if(err){
             req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/live-streaming/"
                const newFileName = file+"_main"+extension;
                var resizeObj = new resize(pathName,req.fileName,req)
                resizeObj.save(newFileName,{  width: req.widthResize, height: req.heightResize }).then(res => {
                    if(res){
                        fs.unlink(pathName+req.fileName,function (err) {            
                            if (err) {                                                 
                                console.error(err);                                    
                            }                                                          
                        });    
                        req.fileName = newFileName;
                        next()
                    }else{
                        req.imageError = "Your image contains an unknown image file encoding. The file encoding type is not recognized, please use a different image.";
                        next()
                    }
                })
            }else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                next()
            }else{
                next()
            }
        }
    });
},[
    check("title").not().isEmpty().withMessage(constant.error.TITLEMESSAGE).trim(),
  ],controller.create)

module.exports = router;