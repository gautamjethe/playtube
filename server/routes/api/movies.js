const router = require('express').Router()
const multer = require("multer")
const controller = require('../../controllers/api/movie')
const upload = require('../../functions/upload').upload
const resize = require("../../functions/resize")
const path = require("path")
const fs = require("fs")
const { check } = require('express-validator')
const movieModel = require("../../models/movies")
const commonFunction = require("../../functions/commonFunctions")
const constant = require("../../functions/constant")
const privacyMiddleware = require("../../middleware/has-permission")
const isLogin = require("../../middleware/is-login")

const fieldErrors = require('../../functions/error')
const errorCodes = require("../../functions/statusCodes")

router.post('/movies/password/:id',multer().none(),controller.password);
router.post('/movies-browse',multer().none(),controller.browse)
router.post('/movie-category/:id',multer().none(),controller.category)

router.post('/cast-and-crew',isLogin,multer().none(),controller.castnCrew);

router.post('/movies/genres/create',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.movie_id
    await movieModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    })
   next()
},controller.createGeneres);

router.post('/movies/genres/delete',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.movie_id
    await movieModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    }) 
    
    privacyMiddleware.isValid(req,res,next,'movie','delete')
},controller.deleteGeneres);
router.post('/movies/country/create',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.movie_id
    await movieModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    })
   next()
},controller.createCountry);

router.post('/movies/country/delete',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.movie_id
    await movieModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    }) 
    
    privacyMiddleware.isValid(req,res,next,'movie','delete')
},controller.deleteCountry);

router.post('/movies/delete',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.movie_id
    await movieModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    }) 
    
    privacyMiddleware.isValid(req,res,next,'movie','delete')
},controller.delete)

router.post('/movies/delete-image',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.movie_id
    await movieModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    }) 
    
    privacyMiddleware.isValid(req,res,next,'movie','delete')
},controller.deleteImage)

router.post('/movies/upload-image/:movie_id',isLogin,async (req,res,next) => {
    const id = req.params.movie_id
    await movieModel.findById(id,req,false).then(result => {
        if(result){
            req.item = result
        }
    }) 
    
    privacyMiddleware.isValid(req,res,next,'movie','create')
},isLogin,(req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    var currUpload = upload('image',"upload/images/movies/images/",req)
    req.imageResize = [
        {  width: req.widthResize, height: req.heightResize }
    ];
    currUpload(req,res,function(err){
        if(err){
            req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
            next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/movies/images/"
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
},controller.uploadImage);

router.post('/movies/search',multer().none(),controller.getMovies)
router.get('/movies/cast/auto-suggest/:isMovie?',multer().none(),controller.castAutosuggest)

router.post('/movies/episode/create-cast',isLogin,multer().none(),[
    check("cast_crew_member_id").not().isEmpty().withMessage(constant.error.MEMBERSELECTERROR).trim(),
    check("character").not().isEmpty().withMessage(constant.movie.CHARRACTERERROR).trim()
  ],controller.createCastCrew)

router.post('/movies/season/cast/delete',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.movie_id
    await movieModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    }) 
    
    privacyMiddleware.isValid(req,res,next,'movie','delete')
},controller.deleteCrew)

router.post('/movies/season/episode/delete',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.movie_id
    await movieModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    }) 
    
    privacyMiddleware.isValid(req,res,next,'movie','delete')
},controller.deleteEpisode)

router.post('/movies/season/crew/delete',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.movie_id
    await movieModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    }) 
    
    privacyMiddleware.isValid(req,res,next,'movie','delete')
},controller.deleteCrew)

router.post('/movies/season/delete',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.movie_id
    await movieModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    }) 
    privacyMiddleware.isValid(req,res,next,'movie','delete')
},controller.deleteSeason)

router.post('/movies/create-season',isLogin,multer().none(),controller.createSeason)

router.post('/movies/episode/create',isLogin,(req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    var currUpload = upload('image',"upload/images/movies/episode/",req)
    req.imageResize = [
        {  width: req.widthResize, height: req.heightResize }
    ];
    currUpload(req,res,function(err){
        if(err){
            req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
            next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            if( req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi"){
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName,extension);
                const pathName = req.serverDirectoryPath+"/public/upload/images/movies/episode/"
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
},[
    check("title").not().isEmpty().withMessage(constant.error.TITLEMESSAGE).trim(),
    check("episode_number").not().isEmpty().withMessage(constant.movie.EPISODENUMBER).trim(),
    check("release_date").not().isEmpty().withMessage(constant.movie.RELEASEDATE).trim()
  ],controller.episodeCreate)

router.post('/movies/create',isLogin,async (req,res,next) => {
    await commonFunction.getGeneralInfo(req,res,'',true)
    
    if(parseInt(req.levelPermissions["movie.quota"]) > 0){
        //get count of user uploaded video
        await movieModel.userVideoUploadCount(req,res).then(result => {
            if(result){
                if(result.totalmovies >= req.levelPermissions["movie.quota"]){
                    req.quotaLimitError = true
                }
            }
        }).catch(error => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.GENERAL }], true), status: errorCodes.serverError }).end();
        })
    }
    next()
},(req,res,next) => {
    if(!req.quotaLimitError){
        req.allowedFileTypes = /jpeg|jpg|png|gif/
        var currUpload = upload('image',"upload/images/movies/movie/",req)
        req.imageResize = [
            {  width: req.widthResize, height: req.heightResize }
        ];
        currUpload(req,res,function(err){
            if(err){
                req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";
                next()
            }else{
                req.fileName = req.file ? req.file.filename : false;
                if( req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi"){
                    const extension = path.extname(req.fileName);
                    const file = path.basename(req.fileName,extension);
                    const pathName = req.serverDirectoryPath+"/public/upload/images/movies/movie/"
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
    }else{
        next()
    }
},[
    check("title").not().isEmpty().withMessage(constant.error.TITLEMESSAGE).trim(),
  ],controller.create)
module.exports = router;