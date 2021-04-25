const commentModel = require("../../models/comments")
const async = require('async'),
      fieldErrors = require('../../functions/error'),
      errorCodes = require("../../functions/statusCodes"),
      constant = require("../../functions/constant"),
      dateTime = require('node-datetime'),
      globalModel = require("../../models/globalModel"),
      commonFunction = require("../../functions/commonFunctions"),
      socketio = require("../../socket"),
    notifications = require("../../models/notifications")


exports.delete = async(req,res) => {
    const id = req.body.id
    const type = req.body.type.replace("audios",'audio')
    const reply_id = req.body.reply_id
    const comment_id = req.body.comment_id

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
    }else if(type == "playlists"){
        column = "playlist_id"
    }else if(type == "audio"){
        column = "audio_id"
    }
    if(!reply_id || reply_id == 0){
        let comment = {}
        await commentModel.findById(comment_id,req,res).then(result => {
            if(result){
                comment = result
            }
        })
        globalModel.delete(req,"comments",'comment_id',comment_id).then(result => {
            if(comment.image){
                commonFunction.deleteImage(req,res,comment.image,'comment/image')
            }
            globalModel.custom(req,"DELETE FROM comments WHERE parent_id =?",[comment_id]).then(result => {

            }).catch(err => {
                
            })
            //reduce from main item
            globalModel.custom(req,"UPDATE "+ (type == "members" ? "userdetails" : type) + " SET comment_count = comment_count - 1 WHERE "+column+" = "+id,function(err,results,fields)
            {

            });
            socketio.getIO().emit('deleteComment', {
                "commentId": comment_id,
                "id":id,
                "type":type,
            });
        }).catch(err => {
        })
    }else{
        let comment = {}
        await commentModel.findById(reply_id,req,res).then(result => {
            if(result){
                comment = result
            }
        })
        globalModel.delete(req,"comments",'comment_id',reply_id).then(result => {
            if(comment.image){
                commonFunction.deleteImage(req,res,comment.image,'comment/image')
            }
            // globalModel.custom(req,"DELETE FROM comments WHERE parent_id =?",[comment_id]).then(result => {

            // }).catch(err => {
                
            // })
            //reduce from main item
            globalModel.custom(req,"UPDATE comments SET reply_count = reply_count - 1 WHERE comment_id = "+comment.parent_id,function(err,results,fields)
            {

            });

            socketio.getIO().emit('deleteReply', {
                "commentId": comment_id,
                "replyId" : reply_id,
                "id":id,
                "type":type,
            });

        }).catch(err => {
        })
    }
    res.send({})
}
exports.getComments = async(req,res) => {
    const id = req.params.id
    const type = req.params.type
    const search = req.body.search

    let LimitNum = 6
    let page = 1
    if(req.params.page == ''){
         page = 1
    }else{
        //parse int Convert String to number 
         page = parseInt(req.body.page) ? parseInt(req.body.page) : 1
    }
    
    let offset = (page - 1)*(LimitNum - 1)
    
    let data = {}
    data['id'] = id
    data['type'] = type
    data['offset'] = offset
    data['limit'] = LimitNum
    data['search'] = search
    data['approved'] = req.body.approved == "approved" ? false : true
    await commentModel.getComments(data,req,res).then(async result => {
        if(result && result.length > 0){
            let pagging = false
            if(result.length > LimitNum-1){
                result = result.splice(0, LimitNum-1)
                pagging = true
            }
            const comments = []
            async.forEachOf(result,async function (comment, i, callback){
               // result.forEach(async comment => {
                    data['comment_id'] = comment.comment_id
                    data['offset'] = 0
                  await  commentModel.getReplies(data,req,res).then(async reply => {
                        if(reply && reply.length > 0){
                            let pagging = false
                            if(reply.length > LimitNum-1){
                                reply = reply.splice(0, LimitNum-1)
                                pagging = true
                            }
                            const dataReply = {}
                            dataReply.pagging = pagging
                            dataReply.reply = reply
                            comment['replies'] = dataReply
                        }
                    })
                    comments.push(comment)
                    if(i == result.length - 1){
                         res.send({pagging:pagging,comments:comments})
                    }
               // })
            },function(err){
                if(err){
                 res.send({pagging:pagging,comments:comments})
                }
            });
        }else{
            res.send({pagging:false,comments:[]})
        }
    })
}

exports.getReplies = async(req,res) => {
    const id = req.params.id
    const type = req.params.type
    const comment_id = req.body.comment_id

    let LimitNum = 6
    let page = 2
    if(req.params.page == ''){
         page = 2
    }else{
        //parse int Convert String to number 
         page = parseInt(req.body.page) ? parseInt(req.body.page) : 2
    }
    
    let offset = (page - 1)*(LimitNum - 1)
    
    let data = {}
    data['id'] = id
    data['type'] = type
    data['offset'] = offset
    data['limit'] = LimitNum
    data['comment_id'] = comment_id
    data['approved'] = req.body.approved == "approved" ? false : true
    await  commentModel.getReplies(data,req,res).then(async reply => {
        if(reply && reply.length > 0){
            let pagging = false
            if(reply.length > LimitNum-1){
                reply = reply.splice(0, LimitNum-1)
                pagging = true
            }
            const dataReply = {}
            dataReply.pagging = pagging
            dataReply.reply = reply
            return res.send(dataReply)
        }else{
            res.send({})
        }
    })   
}
exports.create = async(req,res) => {
    const id = req.body.id
    const type = req.body.type.replace("audios",'audio')    
    const parent_id = req.body.parent_id
    const comment_id = req.body.comment_id
    const removeImage = req.body.remove_image
    const title = req.body.message
    if(req.imageError){
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    const data = {}
    if(removeImage){
        data.image = "";
    }
    if(req.fileName){
        data.image = "/upload/images/comments/"+req.fileName
    }
    if(title){
        data['message'] = title
    }
    if(parent_id){
        data['parent_id'] = parent_id
    }
    if(!comment_id){
        var dt = dateTime.create();
        var formatted = dt.format('Y-m-d H:M:S');
        data.creation_date = formatted
        data['id'] = id
        data['type'] = type
        data['owner_id'] = req.user.user_id
    }
    if(comment_id){
        //update existing comment
        let comment = {}
        await commentModel.findById(comment_id,req,res).then(result => {
            if(result){
                comment = result
            }
        })
        await globalModel.update(req,data,"comments",'comment_id',comment_id).then(result => {
            if((req.fileName || removeImage) && comment.image){
                commonFunction.deleteImage(req,res,comment.image,'comment/image')
            }else if(!req.fileName && comment.image){
                data.image = comment.image
            }
            if(parent_id){
                //reply edited
                socketio.getIO().emit('replyEdited', {
                    "commentId": parent_id,
                    "replyId":comment_id,
                    "id":id,
                    "type":type,
                    comment:{image:data.image,message:title}
                });
            }else{
                //comment edited
                socketio.getIO().emit('commentEdited', {
                    "commentId": comment_id,
                    "id":id,
                    "type":type,
                    comment:{image:data.image,message:title}
                });
            }
            return res.send({})
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }else{
        //update main table
        let column = "video_id"
        if(type == "channels"){
            column = "channel_id"
        }else if(type == "blogs"){
            column = "blog_id"
        }else if(type == "members"){
            column = "user_id"
        }else if(type == "artists"){
            column = "artist_id"
        }else if(type == "playlists"){
            column = "playlist_id"
        }else if(type == "channel_posts"){
            column = "post_id"
        }else if(type == "audio"){
            column = "audio_id"
        }
        let itemObj = {}
        //get main content table
        
        await globalModel.custom(req,"SELECT * FROM "+ (type == "members" ? "userdetails" : type) + "  WHERE "+column+" = ? ",[id]).then(results => 
            {
                if(results){
                    const result = JSON.parse(JSON.stringify(results));
                    itemObj = result[0]
                    data['custom_url'] = column == "user_id" ? result[0].username : (column == "post_id" ? result[0].post_id : result[0].custom_url);
                }
            }).catch(err => {
            })

        if(!Object.keys(itemObj).length){
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        }
        data['approved'] = 1;
        let commentReplyUpdate = ""
        if(typeof itemObj.autoapprove_comments != undefined){
            let typeObj = (type == "members" ? "user_id" : "owner_id")
            if(itemObj[typeObj] != req.user.user_id){
                if(req.appSettings['autoapproveverified_user_comment'] == 0 || req.user.verified != 1){
                    data['approved'] = itemObj.autoapprove_comments
                    commentReplyUpdate = true
                }
            }
        }
        if(!data['approved']){
            data['approved'] = 0
        }
        //create new comment
        await globalModel.create(req,data,"comments").then(async result => {
            if(result){
                const commentId = result.insertId
                if(parent_id){ 
                    //get comment owner
                    let commentObj = {}
                    await globalModel.custom(req,"SELECT * FROM comments  WHERE comment_id = ? ",[parent_id]).then(results => 
                    {
                        if(results){
                            const result = JSON.parse(JSON.stringify(results));
                            commentObj = result[0]
                        }
                    }).catch(err => {
                    })
                    //insert notification
                    notifications.insert(req, {insert:true,owner_id: commentObj[(data.type == "members" ? "user_id" : "owner_id")], type: type+"_reply_comment", subject_type: "users", subject_id: req.user.user_id, object_type: "comments", object_id: commentId }).then(result => {

                    }).catch(err => {

                    })
                    await commentModel.getReplies({limit:1,offset:0,data_comment_id:commentId,comment_id:parent_id},req,res).then(result => {
                        if(result){
                            socketio.getIO().emit('replyCreated', {
                                "commentId": parent_id,
                                "replyId":commentId,
                                "id":id,
                                "type":type,
                                "approved":data['approved'],
                                "owner_id":req.user.user_id,
                                comment:result[0]
                            });
                        }
                    })
                    //increase reply count
                   // if(!commentReplyUpdate){
                        await globalModel.custom(req,"UPDATE comments SET reply_count = reply_count + 1 WHERE comment_id = ?",[parent_id]).then(result => {
                        }).catch(err => {                        
                        });
                   // }else{
                        await globalModel.custom(req,"UPDATE comments SET replies_approved = replies_approved + 1 WHERE comment_id = ?",[parent_id]).then(result => {
                        }).catch(err => {                        
                        });
                   // }
                    
                }else{
                    await commentModel.getComments({limit:1,offset:0,data_comment_id:commentId},req,res).then(result => {
                        if(result){
                            notifications.insert(req, {insert:true,owner_id: itemObj[(data.type == "members" ? "user_id" : "owner_id")], type: type+"_comment", subject_type: "users", subject_id: req.user.user_id, object_type: data.type, object_id: data.id }).then(result => {

                            }).catch(err => {
        
                            })
                            socketio.getIO().emit('commentCreated', {
                                "commentId": commentId,
                                "id":id,
                                "type":type,
                                "approved":data['approved'],
                                "owner_id":req.user.user_id,
                                comment:result[0]
                            });
                        }
                    })
                  //  if(!commentReplyUpdate){
                        await globalModel.custom(req,"UPDATE "+ (type == "members" ? "userdetails" : type) + " SET comment_count = comment_count + 1 WHERE "+column+" = ? ",[id],function(err,results,fields)
                        {

                        }).catch(err => {
                        });
                  //  }
                }
                return res.send({})
            }else{
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }
}

exports.approveComments = async(req,res) => {
    const reply_id = req.body.reply_comment_id
    const comment_id = req.body.id
    if(!reply_id || reply_id == 0){
        globalModel.custom(req,"UPDATE comments SET approved = 1 WHERE comment_id = ?",[comment_id]).then(res => {
           
        }).catch(err => {
            console.log(err)
        })
        
    }else{
       
        globalModel.custom(req,"UPDATE comments SET replies_approved = replies_approved - 1 WHERE comment_id = ?",[comment_id]).then( res => {
            globalModel.custom(req,"UPDATE comments SET approved = 1 WHERE comment_id = ?",[reply_id]).then(res => {
           
            }).catch(err => {
                console.log(err)
            })
           
        }).catch(err => {
            console.log(err)
        })
    }
    res.send({})
}
