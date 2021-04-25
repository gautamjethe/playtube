const router = require('express').Router()
const multer = require("multer")
const controller = require('../../controllers/api/auth')
const upload = require('../../functions/upload').upload
const resize = require("../../functions/resize")
const path = require("path")
const fs = require("fs")
const { check } = require('express-validator')
const userModel = require("../../models/users")

router.post("/resendVerification",multer().none(),[
    check('email')
        //.isEmail()
       // .withMessage('Please enter valid email.')
        .trim()
      .custom((value, { req }) => {
        value = value || "";
        return userModel.findByEmail(value,req).then(userDoc => {
            if (!userDoc) {
            return Promise.reject(
                'Invalid Credentials'
            );
            }
        });     
      })
  ], controller.resendVerification)

router.post('/login',multer().none(),
    [
    check('email')
        //.isEmail()
       // .withMessage('Please enter valid email.')
        .trim()
      .custom((value, { req }) => {
        value = value || "";
        if (/\@/.test(value)) {
            return userModel.findByEmail(value,req).then(userDoc => {
                if (!userDoc) {
                return Promise.reject(
                    'Invalid Credentials'
                );
                }
            });     
          } else {
            if (value != null) {
                return userModel.findByUsername(value,req).then(userDoc => {
                    if (!userDoc) {
                    return Promise.reject(
                        'Invalid Credentials'
                    );
                    }
                });    
            }
          }
      }),
    check('password')
    .not().isEmpty().withMessage("Password should not be empty!")
  ], controller.login)

router.post('/forgot',multer().none(),
[
check('email')
    .isEmail()
    .withMessage('Please enter valid email.')
    .trim(),
],controller.forgotPassword);
router.post('/reset',multer().none(),controller.reset);
router.post('/signup',(req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        {  width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('file',"upload/images/users/",req)
    currUpload(req,res,function(err){
        if(err){
             req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/users/"
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
[
  check('email')
    .isEmail()
    .trim()
    .withMessage('Please enter a valid email.')
    .custom((value, { req }) => {
      // return true;
      return userModel.findByEmail(value,req).then(userDoc => {
            if (userDoc) {
                return Promise.reject(
                    'E-Mail exists already, please pick a different one.'
                );
            }
        }); 
    }),
    check('username')
        .optional({ checkFalsy:true })
      .custom((value, { req }) => {
        if(req.appSettings['signup_form_username'] == 1){
            if (value.length < 4 || value.length > 40){
                return Promise.reject("'Username must be at least 4 characters long'")
            }
            return userModel.findByUsername(value,req).then(userDoc => {
                if (userDoc) {
                    return Promise.reject(
                        'Username already taken, please choose different username.'
                    );
                }else{
                    const banword = require("../../models/banwords")
                    return banword.find(req,{text:value}).then(result => {
                        if (result) {
                            return Promise.reject(
                                'Username already taken, please choose different username.'
                            );
                        }
                    })
                }
            });    
        }


      }),
  check('password')
    .isLength({ min: 6, max: 16 })
    .withMessage('Password must be at least 6 characters long')
    .trim(),
  check("first_name").not().isEmpty().withMessage("First Name should not be empty!").trim(),
  
],controller.signup)

module.exports = router;