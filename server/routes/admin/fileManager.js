const express = require('express')
const router = express.Router()
const controller = require("../../controllers/admin/fileManager")
const is_admin = require("../../middleware/admin/is-admin")
const upload = require("../../functions/upload").upload

router.get("/file-manager/download-files",is_admin,controller.downloadZip);
router.post("/file-manager/upload-zip",is_admin,(req,res,next) => {
    req.allowedFileTypes = /zip/
    req.uploadDirect = true
    var currUpload = upload('file',"/",req,'fromadmin')
    currUpload(req,res,function(err){
        if(err){
            req.imageError = err.message;
            next()
       }else{
           req.fileName = req.file ? req.file.filename : false;
            next()
       }
    });
},controller.uploadZip);
router.get('/file-manager/download/:id',is_admin, controller.downloadFile);
router.get('/file-manager/delete/:id',is_admin, controller.deleteFile);
router.get('/file-manager/:page?',is_admin,controller.fileManager);


router.post('/file-manager/upload-file',is_admin,(req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|ico|gif|mp4|mp3|mov|docx|doc|ppt|word|txt/
   req.fromadmin = true;
    //req.uploadDirect = true
    var currUpload = upload('file',"resources/",req,'fromadmin')
    currUpload(req,res,function(err){ 
        req.fromadmin = false;
        if(err){
            console.log(err);
            req.imageError = err.message;
            next()
       }else{
           req.fileName = req.file ? req.file.filename : false;
            if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi"){
               req.fileName = req.originalS3ImageName
               next()
           }else{
               next()
           }
       }
    });
}, controller.UploadFileManager);

module.exports = router;