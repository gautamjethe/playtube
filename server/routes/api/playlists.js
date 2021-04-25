
const router = require('express').Router()
const controller = require("../../controllers/api/playlists")
const isLogin = require("../../middleware/is-login")
const multer = require("multer")
const upload = require('../../functions/upload').upload
const resize = require("../../functions/resize")
const path = require("path")
const { check } = require('express-validator')
const fs = require("fs")
const playlistModel = require("../../models/playlists")
const privacyMiddleware = require("../../middleware/has-permission")
const middlewareEnable = require("../../middleware/enable")
const commonFunction = require("../../functions/commonFunctions"),
fieldErrors = require('../../functions/error'),
errorCodes = require("../../functions/statusCodes"),
constant = require("../../functions/constant")

router.post('/playlists/delete', isLogin,(req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "playlist",'delete')
}, multer().none(), async (req, res, next) => {
    const id = req.body.id 
    await playlistModel.findByCustomUrl(id, req, res).then(result => {
        if (result) {
            req.item = result
        }
    })

    privacyMiddleware.isValid(req, res, next, 'playlist', 'delete')
}, controller.delete)
router.post('/playlist-view', (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "playlist",'view')
}, multer().none(), controller.view)
router.post('/playlists-browse', (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "playlist",'view')
}, multer().none(), controller.browse)
router.post('/playlist-video-check', (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "playlist",'view')
}, isLogin, multer().none(), controller.getPlaylist)
router.post('/playlists/create',isLogin, (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "playlist",'create')
}, async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, '', true)
    
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    var currUpload = upload('image', "upload/images/playlists/", req)
    req.imageResize = [
        { width: req.widthResize, height: req.heightResize }
    ];
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/playlists/"
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
            }else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                next()
            } else {
                next()
            }
        }
    });
},async (req,res,next) => {
    if (!req.body.playlist_id && req.levelPermissions["playlist.quota"] > 0) {
        //get count of user uploaded video
        await playlistModel.userPlaylistUploadCount(req, res).then(result => {
            if (result) {
                if (result.totalPlaylists >= req.levelPermissions["playlist.quota"]) {
                    req.quotaLimitError = true
                    if(req.fileName){
                        commonFunction.deleteImage( "/upload/images/playlists/"+req.fileName)
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