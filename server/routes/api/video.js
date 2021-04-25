const router = require('express').Router()
const multer = require("multer")
const controller = require('../../controllers/api/video')
const upload = require('../../functions/upload').upload
const resize = require("../../functions/resize")
const path = require("path")
const fs = require("fs")
const { check } = require('express-validator')
const videoModel = require("../../models/videos")
const commonFunction = require("../../functions/commonFunctions")
const constant = require("../../functions/constant")
const privacyMiddleware = require("../../middleware/has-permission")
const isLogin = require("../../middleware/is-login")

const fieldErrors = require('../../functions/error')
const errorCodes = require("../../functions/statusCodes")
const nocache = (req, resp, next) => {
    resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    resp.header('Expires', '-1');
    resp.header('Pragma', 'no-cache');
    next();
}

router.use('/live-streaming/access_token', nocache, controller.generateAccessToken);

router.post('/videos/password/:id',multer().none(),controller.password);
router.post('/videos-browse',multer().none(),controller.browse)
router.post('/video-category/:id',multer().none(),controller.category)
router.post('/videos/artists',multer().none(),controller.artists);
router.post('/videos/delete',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.video_id
    await videoModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    }) 
    
    privacyMiddleware.isValid(req,res,next,'video','delete')
},controller.delete)

router.post('/videos/search',multer().none(),controller.getVideos)
router.post('/videos/donors',multer().none(),controller.getDonors)
router.post('/send-tip',isLogin,multer().none(),controller.sendTip)

router.post('/videos/create',isLogin,(req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    var currUpload = upload('image',"upload/images/videos/video/",req)
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
                const pathName = req.serverDirectoryPath+"/public/upload/images/videos/video/"
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
router.post('/videos/import-url',isLogin,multer().none(),async (req,res,next) => {
    await commonFunction.getGeneralInfo(req,res,'',true)
    if(req.levelPermissions["video.quota"] > 0){
        //get count of user uploaded video
        await videoModel.userVideoUploadCount(req,res).then(result => {
            if(result){
                if(result.totalVideos >= req.levelPermissions["video.quota"]){
                    req.quotaLimitError = true
                }
            }
        }).catch(error => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.GENERAL }], true), status: errorCodes.serverError }).end();
        })
    }
    next()
},controller.importUrl)

router.post('/videos/upload',isLogin,async (req,res,next) => {
    await commonFunction.getGeneralInfo(req,res,'',true)
    if(req.user.levelFlag != "superadmin" && req.levelPermissions["video.storage"] != 0 && req.levelPermissions["video.storage"] < req.user.upload_content_length + req.headers["content-length"]){
        req.uploadLimitError = true
    }
    if(!req.uploadLimitError && req.levelPermissions["video.quota"] > 0){
        //get count of user uploaded video
        await videoModel.userVideoUploadCount(req,res).then(result => {
            if(result){
                if(result.totalVideos >= req.levelPermissions["video.quota"]){
                    req.quotaLimitError = true
                }
            }
        }).catch(error => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.GENERAL }], true), status: errorCodes.serverError }).end();
        })
    }
    next()
},(req,res,next) => {
    if(req.uploadLimitError || req.quotaLimitError){
        next()
        return
    }
    req.allowedFileTypes = /mp4|mov|webm|mpeg|3gp|avi|flv|ogg|mkv|mk3d|mks|wmv/
    req.uploadDirect = true
    var currUpload = upload('upload',"upload/videos/video/",req,"video")
    currUpload(req,res,function(err){
        if(err){
             req.imageError = "Uploaded video is too large to upload, please choose smaller video and try again.";
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            next()
        }
    });
},controller.upload)
module.exports = router;