const express = require('express')
const router = express.Router()
const controller = require("../../controllers/admin/videos")
const is_admin = require("../../middleware/admin/is-admin")
const resize = require("../../functions/resize")
const upload = require("../../functions/upload").upload
const path = require("path")
const fs = require("fs")
const multer= require("multer")


router.get("/videos/artists/gallery/:artist_id/:page?",is_admin,controller.getGalleries)
router.get("/videos/artists/gallery/create/:artist_id/:id?",is_admin,controller.createGallery)
router.get("/videos/artists/gallery/delete/:id",is_admin,controller.deleteGallery)

router.post('/videos/artists/gallery/create/:artist_id/:id?', is_admin, async (req, res, next) => {
    req.checkImage = true;
    next()
}, async (req, res, next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        { width: 800, height: 800 }
    ];
    var currUpload = upload('file', "upload/images/artists/gallery/", req)
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = err.message;
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/artists/gallery/"
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
}, controller.createGallery);

router.get('/videos/artists/delete/:id?', is_admin, controller.deleteArtist)
router.get('/videos/artists/create/:id?', is_admin, controller.createArtists);
router.post('/videos/artists/create/:id?', is_admin, async (req, res, next) => {
    req.checkImage = true;
    next()
}, async (req, res, next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        { width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('file', "upload/images/videos/artists/", req)
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = err.message;
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/videos/artists/"
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
}, controller.createArtists);

//
router.get('/videos/artists/:page?', is_admin, controller.artists);

router.get('/videos/sold-video/delete/:id', is_admin, controller.deleteSoldVideo);
router.get('/videos/sold-videos/:page?', is_admin, controller.soldVideos);

router.get('/videos/settings', is_admin, controller.settings);
router.post('/videos/settings', is_admin, controller.settings);

router.get("/videos/import/youtube",is_admin,controller.youtubeImport)
router.post("/videos/import/create",multer().none(),is_admin,controller.createImportedVideos)

router.get("/videos/import/dailymotion/:page?",is_admin,controller.dailyMotionImport)

router.get('/videos/levels/:level_id?', is_admin, controller.levels);
router.post('/videos/levels/:level_id?', is_admin, controller.levels);
router.post('/videos/categories/change-order', is_admin, controller.changeOrder);

router.get("/videos/categories/delete/:category_id", is_admin, controller.deleteCategories)
router.use("/videos/categories/add/:category_id?", is_admin, async (req, res, next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        { width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('thumbnail', "upload/images/categories/videos/", req)
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = err.message;
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/categories/videos/"
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
}, controller.addCategories)
router.get("/videos/categories", is_admin, controller.categories)



router.get("/videos/delete/:id",is_admin,controller.delete)
router.post("/videos/featured/:id",is_admin,controller.featured)
router.post("/videos/approve/:id",is_admin,controller.approve)

router.post("/videos/sponsored/:id",is_admin,controller.sponsored)
router.post("/videos/hot/:id",is_admin,controller.hot)
router.get('/videos/:page?',is_admin, controller.index);
router.post('/videos',is_admin, controller.index);

module.exports = router;