
const router = require('express').Router()
const controller = require("../../controllers/api/audio")
const isLogin = require("../../middleware/is-login")
const multer = require("multer")
const upload = require('../../functions/upload').upload
const resize = require("../../functions/resize")
const path = require("path")
const { check } = require('express-validator')
const fs = require("fs")
const audioModel = require("../../models/audio")
const privacyMiddleware = require("../../middleware/has-permission")
const middlewareEnable = require("../../middleware/enable")
const commonFunction = require("../../functions/commonFunctions"),
fieldErrors = require('../../functions/error'),
errorCodes = require("../../functions/statusCodes"),
constant = require("../../functions/constant")
router.post('/audio/password/:id',multer().none(),controller.password);

router.post('/audio/delete', isLogin,(req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "audio",'delete')
}, multer().none(), async (req, res, next) => {
    const id = req.body.id 
    await audioModel.findByCustomUrl(id, req, res).then(result => {
        if (result) {
            req.item = result
        }
    }) 

    privacyMiddleware.isValid(req, res, next, 'audio', 'delete')
}, controller.delete)

router.post('/audio/browse', (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "audio",'view')
}, multer().none(), controller.browse)
router.post('/audio/play-count', (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "audio",'view')
}, multer().none(), controller.playCount)

router.post('/audio/peak-data', (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "audio",'create')
}, multer().none(), controller.peekData)

router.post('/audio/upload',isLogin, (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "audio",'create')
}, async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, '', true)
    
    req.allowedFileTypes = /mp3/
    var currUpload = upload('upload', "upload/audio/", req,"fromadmin")
    currUpload(req, res, function (err) {
        console.log(err);
        if (err) {
            req.imageError = "Uploaded audio is too large to upload, please choose smaller audio file and try again.";
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if(req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                next()
            } else {
                next()
            }
        }
    });
},async (req,res,next) => {
    if (!req.body.audio_id && req.levelPermissions["audio.quota"] > 0) {
        //get count of user uploaded video
        await audioModel.userAudioUploadCount(req, res).then(result => {
            if (result) {
                if (result.totalAudios >= req.levelPermissions["audio.quota"]) {
                    req.quotaLimitError = true
                    if(req.fileName){
                        commonFunction.deleteImage( "/upload/audio/"+req.fileName)
                    }
                }
            }
        }).catch(error => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.GENERAL }], true), status: errorCodes.serverError }).end();
        })
    }
    next()
},
 controller.upload)

router.post('/audio/create',isLogin, (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "audio",'create')
}, async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, '', true)
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    var currUpload = upload('image', "upload/images/audio/", req,'audio')
    req.imageResize = [
        { width: req.widthResize, height: req.heightResize }
    ];
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/audio/"
                const newFileName = file + "_main" + extension;
                var resizeObj = new resize(pathName, req.fileName, req)
                resizeObj.save(newFileName,{ width: req.widthResize, height: req.heightResize }).then(res => {
                    if(res){
                        fs.unlink(pathName + req.fileName, function (err) {
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
            }else if(req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                next()
            } else {
                next()
            }
        }
    });
},async (req,res,next) => {
    if (!req.body.audio_id && req.levelPermissions["audio.quota"] > 0) {
        //get count of user uploaded video
        await audioModel.userAudioUploadCount(req, res).then(result => {
            if (result) {
                if (result.totalAudios >= req.levelPermissions["audio.quota"]) {
                    req.quotaLimitError = true
                    if(req.fileName){
                        commonFunction.deleteImage( "/upload/images/audio/"+req.fileName)
                    }
                }
            }
        }).catch(error => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.GENERAL }], true), status: errorCodes.serverError }).end();
        })
    }

    next()
},
check("title")
.optional({ checkFalsy:true })
.custom((value, { req }) => {
    if (req.body.title && req.body.title.trim() ) {
        return Promise.resolve(true)
    } else if(req.body.video_id){
        return Promise.resolve(true)
    }  else{
        return Promise.reject(
            "Title is required field"
        );
    }
}),
 controller.create)
module.exports = router;