const express = require('express')
const router = express.Router()
const controller = require("../../controllers/admin/channels")
const is_admin = require("../../middleware/admin/is-admin")

const resize = require("../../functions/resize")
const upload = require("../../functions/upload").upload
const path = require("path")
const fs = require("fs")

router.get('/channels/artists/delete/:id?',is_admin,controller.deleteArtist)
router.get('/channels/artists/create/:id?',is_admin, controller.createArtists);
router.post('/channels/artists/create/:id?',is_admin,async (req,res,next) => {
    req.checkImage = true;
    next()
} ,async (req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        {  width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('file',"upload/images/channels/artists/",req)
    currUpload(req,res,function(err){
        if(err){
             req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";;
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/channels/artists/"
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
}, controller.createArtists);

router.get('/channels/artists/:page?',is_admin,controller.artists);
router.get('/channels/settings',is_admin, controller.settings);
router.post('/channels/settings',is_admin, controller.settings);

router.get('/channels/levels/:level_id?',is_admin, controller.levels);
router.post('/channels/levels/:level_id?',is_admin, controller.levels);
router.post('/channels/categories/change-order',is_admin,controller.changeOrder);
router.get("/channels/categories",is_admin,controller.categories)
router.get("/channels/categories/delete/:category_id",is_admin,controller.deleteCategories)
router.use("/channels/categories/add/:category_id?",async (req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        {  width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('thumbnail',"upload/images/categories/channels/",req)
    currUpload(req,res,function(err){
        if(err){
             req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";;
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/categories/channels/"
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
},is_admin,controller.addCategories)

router.get("/channels/delete/:id",is_admin,controller.delete)
router.post("/channels/featured/:id",is_admin,controller.featured)
router.post("/channels/approve/:id",is_admin,controller.approve)
router.post("/channels/sponsored/:id",is_admin,controller.sponsored)
router.post("/channels/hot/:id",is_admin,controller.hot)
router.post("/channels/verified/:id",is_admin,controller.verified)
router.get('/channels/:page?',is_admin, controller.index);
router.post('/channels',is_admin, controller.index);

module.exports = router;