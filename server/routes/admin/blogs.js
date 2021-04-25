const express = require('express')
const router = express.Router()
const controller = require("../../controllers/admin/blogs")
const is_admin = require("../../middleware/admin/is-admin")

const resize = require("../../functions/resize")
const upload = require("../../functions/upload").upload
const path = require("path")
const fs = require("fs")

router.get('/blogs/settings',is_admin, controller.settings);
router.post('/blogs/settings',is_admin, controller.settings);

router.get('/blogs/levels/:level_id?',is_admin, controller.levels);
router.post('/blogs/levels/:level_id?',is_admin, controller.levels);

router.post('/blogs/categories/change-order',is_admin,controller.changeOrder);
router.get("/blogs/categories",is_admin,controller.categories)
router.get("/blogs/categories/delete/:category_id",is_admin,controller.deleteCategories)
router.use("/blogs/categories/add/:category_id?",async (req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        {  width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('thumbnail',"upload/images/categories/blogs/",req)
    currUpload(req,res,function(err){
        if(err){
             req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";;
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/categories/blogs/"
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
            }else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                req.fileName = req.originalS3ImageName
                next()
            }else{
                next()
            }
        }
    });
},is_admin,controller.addCategories)

router.get("/blogs/delete/:id",is_admin,controller.delete)
router.post("/blogs/featured/:id",is_admin,controller.featured)
router.post("/blogs/approve/:id",is_admin,controller.approve)

router.post("/blogs/sponsored/:id",is_admin,controller.sponsored)
router.post("/blogs/hot/:id",is_admin,controller.hot)
router.get('/blogs/:page?',is_admin, controller.index);
router.post('/blogs',is_admin, controller.index);

module.exports = router;