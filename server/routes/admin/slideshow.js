const express = require('express')
const router = express.Router()
const controller = require("../../controllers/admin/slideshow")
const is_admin = require("../../middleware/admin/is-admin")
const resize = require("../../functions/resize")
const upload = require("../../functions/upload").upload
const path = require("path")
const fs = require("fs")




router.get('/slideshow/delete/:id',is_admin,controller.delete);

router.get('/slideshow/create/:id?',is_admin, controller.create);
router.post('/slideshow/create/:id?',is_admin,async (req,res,next) => {
    req.checkImage = true;
    next()
},async (req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        {  width: req.coverWidthResize, height: req.coverHeightResize }
    ];
    var currUpload = upload('file',"upload/images/slideshow/",req,'fromadmin')
    currUpload(req,res,function(err){
        if(err){
             req.imageError = err.message;
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/slideshow/"
                const newFileName = file+"_main"+extension;
                var resizeObj = new resize(pathName,req.fileName,req)
                resizeObj.save(newFileName).then(res => {
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
}, controller.create);
router.get('/slideshow/:page?',is_admin,controller.index);
module.exports = router;