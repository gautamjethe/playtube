const express = require('express');
const router = express.Router();

const controller = require("../../controllers/admin/pages")
const is_admin = require("../../middleware/admin/is-admin")
const resize = require("../../functions/resize")
const upload = require("../../functions/upload").upload
const path = require("path")
const fs = require("fs")

router.get("/pages/content",is_admin,controller.pagesContent)
router.post("/pages/content",is_admin,controller.pagesContent)

router.get('/pages/delete/:id?',is_admin, controller.delete);
router.get('/pages/create/:id?',is_admin, controller.create);
router.post('/pages/create/:id?',is_admin,async (req,res,next) => {
    req.checkImage = true;
    next()
},async (req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        {  width: req.coverWidthResize, height: req.coverHeightResize }
    ];
    req.uploadFields = [
        { 
          name: 'file', 
          maxCount: 1 
        }, 
        { 
          name: 'filebanner', 
          maxCount: 1 
        }
      ];
    var currUpload = upload(false,"upload/images/pages/",req)
    currUpload(req,res,function(err){
        if(err){
             req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";;
             next()
        }else{
            req.fileName = req.files && req.files.file && req.files.file.length ? req.files.file[0].filename : false;
            if( req.fileName && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/pages/"
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
            }else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.fieldImageName['file']
                next()
            }else{
                next()
            }
        }
    });
}
,async (req,res,next) => {
    req.filebanner = req.files && req.files.filebanner && req.files.filebanner.length ? req.files.filebanner[0].filename : false;
    if( req.filebanner && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi"){
        const extension = path.extname(req.filebanner);
        const file = path.basename(req.filebanner,extension);
        const pathName = req.serverDirectoryPath+"/public/upload/images/pages/"
        const newFileName = file+"_main"+extension;
        var resizeObj = new resize(pathName,req.filebanner,req)
        resizeObj.save(newFileName).then(res => {
            fs.unlink(pathName+req.filebanner,function (err) {            
                if (err) {                     
                    console.error(err);                                    
                }                                                          
            });    
            req.filebanner = newFileName;
            next()
        })
    }else if(req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi"){
        req.filebanner = req.fieldImageName['banner']
        next()
    }else{
        next()
    }
}
, controller.create);

router.use('/pages/default',is_admin,async (req,res,next) => {
    req.checkImage = true;
    next()
},async (req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        {  width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('file',"upload/images/pages/",req)
    currUpload(req,res,function(err){
        if(err){
             req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";;
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/pages/"
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
            }else if(req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi") {
                req.fileName = req.originalS3ImageName
                next()
            }else{
                next()
            }
        }
    });
}, controller.default);


router.get(`/pages/:page?`, is_admin,controller.index);

module.exports = router;