const router = require('express').Router()
const multer = require("multer")
const controller = require('../../controllers/api/channel')
const upload = require('../../functions/upload').upload
const resize = require("../../functions/resize")
const path = require("path")
const fs = require("fs")
const { check } = require('express-validator')
const commonFunction = require("../../functions/commonFunctions")
const constant = require("../../functions/constant")
const channelModel = require("../../models/channels")
const privacyMiddleware = require('../../middleware/has-permission')
const middlewareEnable = require("../../middleware/enable")
const fieldErrors = require('../../functions/error')
const errorCodes = require("../../functions/statusCodes")
const isLogin = require("../../middleware/is-login")

router.post('/channels/password/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},multer().none(),controller.password)
router.post('/channels/playlists',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},multer().none(),controller.getPlaylists)
router.post('/channels/supporters',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},multer().none(),controller.getSupporters)
router.post('/channels/artists',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},multer().none(),controller.getArtists)
router.post('/channels/videos',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},multer().none(),controller.getVideos)
router.post('/channels/add-videos',isLogin,(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'create')
},multer().none(),controller.addVideos)
router.post('/channel-category/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},multer().none(),controller.category)
router.post('/channels/get-playlists',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},multer().none(),controller.getPopupPlaylist)
router.post('/channels/add-playlists',isLogin,(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'create')
},multer().none(),controller.addPlaylists)
router.post('/channels/delete-video',isLogin,(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'delete')
},multer().none(),controller.deleteVideo)
router.post('/channels/delete-playlist',isLogin,(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'delete')
},multer().none(),controller.deletePlaylist)
router.post('/channels/delete',isLogin,(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'delete')
},multer().none(),async (req,res,next) => {
    const id = req.body.id
    await channelModel.findByCustomUrl(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    })
    
    privacyMiddleware.isValid(req,res,next,'channel','delete')
},controller.delete)

router.post('/post/delete',isLogin,(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'delete')
},multer().none(),async (req,res,next) => {
    const id = req.body.channel_id
    await channelModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    })
    privacyMiddleware.isValid(req,res,next,'channel','delete')
},controller.deletePost)

router.post('/post/create',isLogin, (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "channel",'create')
}, async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, '', true)
    
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    var currUpload = upload('image', "upload/images/posts/", req)
    req.imageResize = [
        { width: req.widthResize, height: req.heightResize }
    ];
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi" ) {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/posts/"
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
},
check("title")
.optional({ checkFalsy:true })
.custom((value, { req }) => {
    if (req.body.title && req.body.title.trim() ) {
        return Promise.resolve(true)
    }  else{
        return Promise.reject(
            "Message is required field"
        );
    }
}),
 controller.createpost)

router.post('/channels/posts',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},multer().none(),controller.posts)
router.post('/channels-browse',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},multer().none(),controller.browse)
router.post('/channels/reposition-cover',isLogin,multer().none(),(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'edit')
},controller.repositionCover)

router.post('/channels/upload-cover',isLogin,(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'edit')
},async (req,res,next) => {
    await commonFunction.getGeneralInfo(req,res,'',true)

    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        {  width: req.coverWidthResize, height: req.coverHeightResize }
    ];
    if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
        //s3 enable
        req.imageResize = [
            { suffix: 'res', width: req.coverWidthResize, height: req.coverHeightResize  },
            { suffix: 'original' }
        ]
    } 
    var currUpload = upload('image',"upload/images/cover/channels/",req)
    currUpload(req,res,function(err){
        if(err){
             req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/cover/channels/"
                const newFileName = file+"_main"+extension;
                var resizeObj = new resize(pathName,req.fileName,req)
                resizeObj.save(newFileName,{height:req.coverHeightResize,width:req.coverWidthResize}).then(res => {
                    if(res){
                        req.fileName = newFileName;
                        req.originalUrl = req.file ? req.file.filename : false;
                        next()
                    }else{
                        req.imageError = "Your image contains an unknown image file encoding. The file encoding type is not recognized, please use a different image.";
                        next()
                    }
                })
            }else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                Object.keys(req.file).forEach(size => {
                    let obj = JSON.parse(JSON.stringify(req.file[size]))
                    if(size == "res"){
                        req.fileName = obj["key"]
                    }else{
                        req.originalUrl = obj["key"]
                    }
				})
                next()
            }else{
                next()
            }
        }
    });
 },controller.uploadCover)

 router.post('/channels/upload-image',isLogin,(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'edit')
},async (req,res,next) => {
    await commonFunction.getGeneralInfo(req,res,'',true)

    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        {  width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('image',"upload/images/channels/",req)
    currUpload(req,res,function(err){
       
        if(err){
             req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/channels/"
                const newFileName = file+"_main"+extension;
                var resizeObj = new resize(pathName,req.fileName,req)
                resizeObj.save(newFileName,{height:req.heightResize,width:req.widthResize}).then(res => {
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
            }else if(req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                next()
            }else{
                next()
            }
        }
    });
 },controller.uploadMainPhoto)

router.post('/channels/create/:id?',isLogin,(req,res,next) => {
    let permission = "create"
    if(req.params.id){
        permission = "edit"
    }
    middlewareEnable.isEnable(req,res,next,"channel",permission)
},async (req,res,next) => {
    await commonFunction.getGeneralInfo(req,res,'',true)
    if(req.levelPermissions["channel.quota"] > 0){
        //get count of user uploaded video
        await channelModel.userChannelUploadCount(req,res).then(result => {
            if(result){
                if(result.totalChannels >= req.levelPermissions["channel.quota"]){
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
    req.imageResize = [
        {  width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('image',"upload/images/channels/",req)
    currUpload(req,res,function(err){
        if(err){
             req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/channels/"
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
            }else if(req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                next()
            }else{
                next()
            }
        }
    });
 },
 //,async (req,res,next) => {
//     if(req.quotaLimitError){
//         next()
//         return
//     }
//     req.allowedFileTypes = /jpeg|jpg|png|gif/
//     var currUpload = upload('cover',"upload/images/channels/cover/",req)
//     req.imageResize = [
//         {  width: req.coverWidthResize, height: req.coverHeightResize }
//     ];
//     currUpload(req,res,function(err){
//         if(err){
//              req.imageCoverError = err;
//              next()
//         }else{
//             req.fileCoverName = req.file ? req.file.filename : false;
//             if( req.file && req.appSettings.upload_system != "s3"){
//                 const extension = path.extname(req.fileCoverName);
//                 const file = path.basename(req.fileCoverName,extension);
//                 const pathName = req.serverDirectoryPath+"/public/upload/images/channels/cover/"
//                 const newFileName = file+"_main"+extension;
//                 var resizeObj = new resize(pathName,req.fileCoverName,req)
//                 resizeObj.save(newFileName).then(res => {
//                     fs.unlink(pathName+req.fileCoverName,function (err) {            
//                         if (err) {                                                 
//                             console.error(err);                                    
//                         }                                                          
//                     });    
//                     req.fileCoverName = newFileName;
//                     next()
//                 })
//             }else{
//                 next()
//             }
//         }
//     });
// },
  [
    check("title").not().isEmpty().withMessage(constant.error.TITLEMESSAGE).trim(),
  ],controller.create)

module.exports = router;