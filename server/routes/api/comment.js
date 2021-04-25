const router = require('express').Router()
const multer = require("multer")
const controller = require('../../controllers/api/comments')
const upload = require('../../functions/upload').upload
const resize = require("../../functions/resize")
const path = require("path")
const fs = require("fs")
const privacyMiddleware = require('../../middleware/has-permission')
const commentModel = require("../../models/comments")
const isLogin = require("../../middleware/is-login")
const globalModel = require("../../models/globalModel")

router.post('/comments/:id/:type',multer().none(),controller.getComments);
router.post('/replies/:id/:type',multer().none(),controller.getReplies);
router.post("/comments/approve",isLogin,multer().none(),controller.approveComments)
router.post('/comments/delete',isLogin,multer().none(),async (req,res,next) => {
    const comment_id = req.body.comment_id
    const replyId = req.body.reply_id
    const type = req.body.type
    if(parseInt(replyId) == 0){
        await commentModel.findById(comment_id,req,res).then(result => {
            if(result){
                req.item = result
            }
        })
    }else{
        await commentModel.findById(replyId,req,res).then(result => {
            if(result){
                req.item = result
            }
        })
    }

    /* get object */

    if(req.item){
        const id = req.body.id
        const type = req.body.type
        let column = "video_id"
        if(type == "channels"){
            column = "channel_id"
        }else if(type == "blogs"){
            column = "blog_id"
        }else if(type == "members"){
            column = "user_id"
        }else if(type == "artists"){
            column = "artist_id"
        }else if(type == "channel_posts"){
            column = "post_id"
        }
        await globalModel.custom(req,"SELECT * FROM  "+ (type == "members" ? "userdetails" : type) + " WHERE "+column+" = "+id).then(results => 
        {
            if(results){
                const result = JSON.parse(JSON.stringify(results));
                itemObj = result[0]
                req.itemData = itemObj
            }
        }).catch(err => {
            console.log(err)
        });
    }
    if(type == "artists" || type == "channel_posts"){
        next()
    }else{
        privacyMiddleware.isValid(req,res,next,req.body.type,'delete')
    }
},controller.delete);

router.post('/comments/create',isLogin,(req,res,next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    var currUpload = upload('image',"upload/images/comments/",req)
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
                const pathName = req.serverDirectoryPath+"/public/upload/images/comments/"
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
},async (req,res,next) => {
    const comment_id = req.body.comment_id
    const replyId = req.body.parent_id
    const type = req.body.type
    if(req.body.fromedit && (comment_id || replyId)){
        if(!replyId){
            await commentModel.findById(comment_id,req,res).then(result => {
                if(result){
                    req.item = result
                }
            })
        }else if(type != "artists"){
            await commentModel.findById(comment_id ? comment_id : replyId,req,res).then(result => {
                if(result){
                    req.item = result
                }
            })
        }
        if(type != "artists")
            privacyMiddleware.isValid(req,res,next,req.body.type,'edit',false)
        else{
            next()
        }
    }else{
        next()
    }
},controller.create)


module.exports = router;