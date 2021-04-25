const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/movies")
const is_admin = require("../../middleware/admin/is-admin")

const resize = require("../../functions/resize")
const upload = require("../../functions/upload").upload
const path = require("path")
const fs = require("fs")



router.get("/movies/cast-crew/gallery/:cast_crew_id/:page?",is_admin,controller.getGalleries)
router.get("/movies/cast-crew/gallery/create/:cast_crew_id/:id?",is_admin,controller.createGallery)
router.get("/movies/cast-crew/gallery/delete/:id",is_admin,controller.deleteGallery)

router.post('/movies/cast-crew/gallery/create/:cast_crew_id/:id?', is_admin, async (req, res, next) => {
    req.checkImage = true;
    next()
}, async (req, res, next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        { width: 800, height: 800 }
    ];
    var currUpload = upload('file', "upload/images/cast-crew/gallery/", req)
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = err.message;
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/cast-crew/gallery/"
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
            }else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                req.fileName = req.originalS3ImageName
                next()
            } else {
                next()
            }
        }
    });
}, controller.createGallery);

router.get('/movies/cast-crew/delete/:id?', is_admin, controller.deleteCastncrew)
router.get('/movies/cast-crew/create/:id?', is_admin, controller.createCastncrew);
router.post('/movies/cast-crew/create/:id?', is_admin, async (req, res, next) => {
    req.checkImage = true;
    next()
}, async (req, res, next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        { width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('file', "upload/images/movies/cast-crew/", req)
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = err.message;
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/movies/cast-crew/"
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
            }else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                next()
            } else {
                next()
            }
        }
    });
}, controller.createCastncrew);

//
router.get('/movies/cast-crew/:page?', is_admin, controller.castncrew);

router.get('/movies/sold-movies/delete/:id', is_admin, controller.deleteSoldMovies);
router.get('/movies/sold-movies/:page?', is_admin, controller.soldMovies);

router.get('/movies/settings', is_admin, controller.settings);
router.post('/movies/settings', is_admin, controller.settings);

router.get('/movies/levels/:level_id?', is_admin, controller.levels);
router.post('/movies/levels/:level_id?', is_admin, controller.levels);
router.post('/movies/categories/change-order', is_admin, controller.changeOrder);

router.get("/movies/categories/delete/:category_id", is_admin, controller.deleteCategories)
router.use("/movies/categories/add/:category_id?", is_admin, async (req, res, next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        { width: req.widthResize, height: req.heightResize }
    ]; 
    var currUpload = upload('thumbnail', "upload/images/categories/movies/", req)
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = err.message;
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/categories/movies/"
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
            }else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                next()
            } else {
                next()
            }
        }
    });
}, controller.addCategories)
router.get("/movies/categories", is_admin, controller.categories)



router.get("/movies/delete/:id",is_admin,controller.delete)
router.post("/movies/featured/:id",is_admin,controller.featured)
router.post("/movies/approve/:id",is_admin,controller.approve)

router.post("/movies/sponsored/:id",is_admin,controller.sponsored)
router.post("/movies/hot/:id",is_admin,controller.hot)
router.get('/movies/:page?',is_admin, controller.index);
router.post('/movies',is_admin, controller.index);

module.exports = router; 