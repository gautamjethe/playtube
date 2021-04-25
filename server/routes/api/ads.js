const router = require('express').Router()
const multer = require("multer")
const controller = require('../../controllers/api/ads')
const upload = require('../../functions/upload').upload
const { check } = require('express-validator')
const commonFunction = require("../../functions/commonFunctions")
const adsModel = require("../../models/userAds")
const fieldErrors = require('../../functions/error')
const errorCodes = require("../../functions/statusCodes")
const isLogin = require("../../middleware/is-login")

const constant = require("../../functions/constant")
const privacyMiddleware = require("../../middleware/has-permission")

router.post('/ads/stats',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.ad_id ? req.body.ad_id : req.query.ad_id
    await adsModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    })
    
    privacyMiddleware.isValid(req,res,next,'member','editads')
},controller.stats)

router.post('/ads/delete',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.ad_id
    await adsModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    })
    
    privacyMiddleware.isValid(req,res,next,'member','deleteads')
},controller.delete)
router.post('/ads/status',isLogin,multer().none(),async (req,res,next) => {
    const id = req.body.ad_id
    await adsModel.findById(id,req,res).then(result => {
        if(result){
            req.item = result
        }
    })
    
    privacyMiddleware.isValid(req,res,next,'member','editads')
},controller.status)
router.post('/ads/create',isLogin,async (req,res,next) => {
    await commonFunction.getGeneralInfo(req,res,'',true)
    if(req.levelPermissions["member.adsquota"] > 0){
        //get count of user uploaded ads
        await adsModel.userAdsUploadCount(req,res).then(result => {
            if(result){
                if(result.totalAds >= req.levelPermissions["member.adsquota"]){
                    req.quotaLimitError = true
                }
            }
        }).catch(() => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.GENERAL }], true), status: errorCodes.serverError }).end();
        })
    }
    next() 
},(req,res,next) => {
    if( req.quotaLimitError){
        next()
        return
    }
    req.allowedFileTypes = /mp4|mov|webm|mpeg|3gp|avi|flv|ogg|mkv|mk3d|mks|wmv/
    req.uploadDirect = true
    var currUpload = upload('upload',"upload/videos/ads/",req,'ads')
    currUpload(req,res,function(err){
        if(err){
            req.imageError = "Uploaded video is too large to upload, please choose smaller video and try again.";
             next()
        }else{
            req.fileName = req.file ? req.file.filename : false;
            next()
        }
    });
},[
    check("name").not().isEmpty().withMessage(constant.error.TITLEMESSAGE).trim(),
  ],controller.create)

module.exports = router;