const router = require('express').Router()
const multer = require("multer")
const controller = require('../../controllers/api/blog')
const upload = require('../../functions/upload').upload
const resize = require("../../functions/resize")
const path = require("path")
const fs = require("fs")
const { check } = require('express-validator')
const commonFunction = require("../../functions/commonFunctions")
const constant = require("../../functions/constant")
const blogModel = require("../../models/blogs")
const privacyMiddleware = require("../../middleware/has-permission")
const middlewareEnable = require("../../middleware/enable")
const isLogin = require("../../middleware/is-login")

router.use('/blogs/upload-image',isLogin, (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "blog",'edit')
}, async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, '', true)
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    var currUpload = upload('file', "upload/images/blogs/editors/", req)
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
                const pathName = req.serverDirectoryPath + "/public/upload/images/blogs/editors/"
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
}, controller.upload)
router.post('/blogs/delete',isLogin,(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"blog",'delete')
}, multer().none(), async (req, res, next) => {
    const id = req.body.id
    await blogModel.findByCustomUrl(id, req, res).then(result => {
        if (result) {
            req.item = result
        }
    })

    privacyMiddleware.isValid(req, res, next, 'blog', 'delete')
}, controller.delete)
router.post('/blog-category/:id', (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "blog",'view')
}, multer().none(), controller.category)
router.post('/blogs-browse', (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "blog",'view')
}, multer().none(), controller.browse)
router.post('/blogs/create',isLogin, (req, res, next) => {
    middlewareEnable.isEnable(req, res, next, "blog",'create')
}, async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, '', true)
    if (req.levelPermissions["blog.quota"] > 0) {
        //get count of user uploaded video
        await blogModel.userBlogUploadCount(req, res).then(result => {
            if (result) {
                if (result.totalBlogs >= req.levelPermissions["blog.quota"]) {
                    req.quotaLimitError = true
                }
            }
        }).catch(error => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.GENERAL }], true), status: errorCodes.serverError }).end();
        })
    }

    if (req.quotaLimitError) {
        next()
        return
    }
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    var currUpload = upload('image', "upload/images/blogs/", req)
    req.imageResize = [
        { width: 1200, height: req.heightResize }
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
                const pathName = req.serverDirectoryPath + "/public/upload/images/blogs/"
                const newFileName = file + "_main" + extension;
                var resizeObj = new resize(pathName, req.fileName, req)
                resizeObj.save(newFileName,{ width: 1200, height: req.heightResize }).then(res => {
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
    [
        check("title").not().isEmpty().withMessage(constant.error.TITLEMESSAGE).trim(),
        check("description").not().isEmpty().withMessage(constant.error.DESCRIPTIONMESSAGE).trim(),
    ], controller.create)


module.exports = router;