const router = require('express').Router()
const controller = require("../../controllers/api/user")
const multer = require("multer")
const upload = require('../../functions/upload').upload
const resize = require("../../functions/resize")
const path = require("path")
const fs = require("fs")
const globalModel = require("../../models/globalModel")
const userModel = require("../../models/users")
const privacyMiddleware = require("../../middleware/has-permission")
const { check } = require('express-validator')
const constant = require("../../functions/constant")
const isLogin = require("../../middleware/is-login")

router.post('/members/playlists',multer().none(),controller.getPlaylists)
router.post('/members/reposition-cover',isLogin,multer().none(),async(req,res,next) => {
    const id = req.body.user_id
    await userModel.findById(id, req, res,'users').then(result => {
        if (result) {
            req.item = result
        }
    })
    privacyMiddleware.isValid(req, res, next, 'member', 'edit')
},controller.repositionCover)
router.post('/members/upload-cover',isLogin, async (req, res, next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        { width: req.coverWidthResize, height: req.coverHeightResize }
    ];
    if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
        //s3 enable
        req.imageResize = [
            { suffix: 'res', width: req.coverWidthResize, height: req.coverHeightResize  },
            { suffix: 'original' }
        ]
    } 
    var currUpload = upload('image', "upload/images/cover/members/", req)
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/cover/members/"
                const newFileName = file + "_main" + extension; 
                var resizeObj = new resize(pathName, req.fileName, req)
                resizeObj.save(newFileName,{height:req.coverHeightResize,width:req.coverWidthResize}).then((res) => {
                    if(res){
                        req.fileName = newFileName;
                        req.originalUrl = req.file ? req.file.filename : false;
                        next()
                    }else{
                        req.imageError = "Your image contains an unknown image file encoding. The file encoding type is not recognized, please use a different image.";
                        next()
                    }
                })
            } else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi"){
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
            }else {
                next()
            }
        }
    });
},async(req,res,next) => {
    const id = req.body.user_id
    await userModel.findById(id, req, res,'users').then(result => {
        if (result) {
            req.item = result
        }
    })
    privacyMiddleware.isValid(req, res, next, 'member', 'edit')
}, controller.uploadCover)

router.post('/members/upload-image',isLogin, async (req, res, next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        { width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('image', "upload/images/members/", req)
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/members/"
                const newFileName = file + "_main" + extension;
                var resizeObj = new resize(pathName, req.fileName, req)
                resizeObj.save(newFileName,{height:req.heightResize,width:req.widthResize}).then((res) => {
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
            } else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                next()
            }else {
                next()
            }
        }
    });
},async(req,res,next) => {
    const id = req.body.user_id
    await userModel.findById(id, req, res,'users').then(result => {
        if (result) {
            req.item = result
        }
    })
    privacyMiddleware.isValid(req, res, next, 'member', 'edit')
}, controller.uploadMainPhoto)
router.use("/members/newsletter",multer().none(),[
    check('email')
        .isEmail()
        .withMessage('Please enter valid email.')
        .trim()
  ],controller.newsletter)

router.post("/members/adult",multer().none(),controller.adult)
router.post("/members/theme-mode",multer().none(),controller.mode)

router.post("/members/language",multer().none(),controller.language)
router.post("/members/browse",multer().none(),controller.browse)

router.post("/members/balance-withdraw",isLogin,multer().none(),async(req,res,next) => {
    const id = req.body.owner_id
    await userModel.findById(id, req, res,'users').then(result => {
        if (result) {
            req.item = result
        }
    })
    privacyMiddleware.isValid(req, res, next, 'member', 'edit',false) 
},[
    check('paypal_email')
      .isEmail()
      .trim()
      .withMessage('Please enter a valid email.'),
    check("amount").not().isEmpty().withMessage("Amount is required field.").trim(),
  ],controller.createWithdraw)

router.post("/members/withdraws",isLogin,multer().none(),async(req,res,next) => {
    const id = req.body.user_id
    await userModel.findById(id, req, res).then(result => {
        if (result) {
            req.item = result
        }
    })
    privacyMiddleware.isValid(req, res, next, 'member', 'edit',false)
},controller.withdraws)
router.post('/members/withdraw-delete',isLogin, multer().none(), async (req, res, next) => {
    const id = req.body.user_id
    await userModel.findById(id, req, res).then(result => {
        if (result) {
            req.item = result
        }
    })
    privacyMiddleware.isValid(req, res, next, 'member', 'delete',false)
}, controller.withdrawDelete)

router.post('/members/monetization',isLogin, multer().none(), async (req, res, next) => {
    const id = req.body.user_id
    await userModel.findById(id, req, res,true).then(result => {
        if (result) {
            req.item = result
        }
    })
    privacyMiddleware.isValid(req, res, next, 'member', 'edit',false)
}, controller.monetization)
router.post('/members/edit', isLogin,multer().none(), async (req, res, next) => {
    const id = req.body.user_id
    await userModel.findById(id, req, res,true).then(result => {
        if (result) {
            req.item = result
        }
    })

    privacyMiddleware.isValid(req, res, next, 'member', 'edit',false)
}, 
[
    check('email')
      .isEmail()
      .trim()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        // return true;
        if (req.item.email != value && typeof req.body.first_name == "undefined") {
            return globalModel.custom(req, "SELECT users.user_id FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id WHERE users.user_id != ? AND email = ?", [req.body.user_id, value]).then(result => {
                if (result && result.length > 0) {
                    return Promise.reject( constant.member.EMAILTAKEN)
                }
            })
        }else{
            return Promise.resolve(true)
        } 
      }),
      check('username')
      .optional({ checkFalsy:true })
        .custom((value, { req }) => {
            if (req.item.username != value ) {
                if(req.levelPermissions['member.username'] == 1){
                    if (value.length < 4 || value.length > 40){
                        return Promise.reject("'Username must be at least 4 characters long'")
                    }
                    return globalModel.custom(req, "SELECT users.user_id FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id WHERE users.user_id != ? AND username = ?", [req.body.user_id, value]).then(result => {
                        if (result && result.length > 0) {
                            return Promise.reject( constant.member.USERNAMETAKEN)
                        }else{
                            const banword = require("../../models/banwords")
                            return banword.find(req,{text:value}).then(result => {
                                if (result) {
                                    return Promise.reject(
                                        constant.member.USERNAMETAKEN
                                    );
                                }
                            })
                        }
                    })
                }else{
                    return Promise.resolve(true)
                }
            } else{
                return Promise.resolve(true)
            }  
        }),
     ], controller.edit) 

router.post('/members/password',isLogin,multer().none(),async(req,res,next) => {
    const id = req.body.user_id
    req.passwordGet = true
    await userModel.findById(id, req, res,true).then(result => {
        req.passwordGet = false
        if (result) {
            req.item = result
        }
    })
    privacyMiddleware.isValid(req, res, next, 'member', 'edit',false)
},controller.password)
router.post('/members/verification', async (req, res, next) => {

    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        { width: 1000, height: 1000 }
    ];
    var currUpload = upload('image', "upload/images/members/verifications/", req)
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/members/verifications/"
                const newFileName = file + "_main" + extension;
                var resizeObj = new resize(pathName, req.fileName, req)
                resizeObj.save(newFileName).then((res) => {
                    if(res){
                        fs.unlink(pathName + req.fileName, function (err) {
                            if (err) {
                                console.log(err);
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
},async(req,res,next) => {
    const id = req.body.user_id
    await userModel.findById(id, req, res,'users').then(result => {
        if (result) {
            req.item = result
        }
    })
    privacyMiddleware.isValid(req, res, next, 'member', 'edit',false)
},controller.verification)
router.post('/members/delete',isLogin, multer().none(),[
    check('password')
      .isLength({ min: 6, max: 16 })
      .withMessage('Must be at least 6 chars long')
      .trim(),
  ], async (req, res, next) => {
    const id = req.body.user_id
    req.passwordGet = true
    await userModel.findById(id, req, res,true).then(result => {
        req.passwordGet = false
        if (result) {
            req.item = result
        }
    })
    privacyMiddleware.isValid(req, res, next, 'member', 'delete')
}, controller.delete)

router.post('/members/videos', multer().none(), controller.getVideos)
router.post('/members/blogs', multer().none(), controller.getBlogs)
router.post('/members/channels', multer().none(), controller.getChannels)
router.post('/members/blogs', multer().none(), controller.getBlogs)

module.exports = router;