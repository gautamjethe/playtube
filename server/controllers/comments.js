const commonFunction = require("../functions/commonFunctions")
const commentModel = require("../models/comments")
const globalModel = require("../models/globalModel")
const async = require('async')


exports.getComment = (req,res,result,isReply = false) => {
    return new Promise(function(resolve, reject) {
        let comments = []
        async.forEachOf(result,async function (comment, i, callback){
            // result.forEach(async comment => {
                let LimitNum = 6
                let data = {}
                data['comment_id'] = comment.comment_id
                data['offset'] = 0
                data['limit'] = LimitNum
            if(isReply){
                await globalModel.custom(req,"SELECT CEIL(COUNT(*) / 5 ) as page FROM comments WHERE parent_id = ? AND comment_id >= ? ORDER BY comment_id DESC",[comment.comment_id,req.params.id]).then(result => {
                    if(result){
                        const count = JSON.parse(JSON.stringify(result));
                        if(count && count.length){
                            req.query.pageNumber = count[0].page + 1
                            data['limit'] = 5 * parseInt(count[0].page) + 1
                        }
                    }
                });
            }
            await  commentModel.getReplies(data,req,res).then(async reply => {
                    if(reply && reply.length > 0){
                        let pagging = false
                        if(reply.length > data['limit']-1){
                            reply = reply.splice(0, data['limit']-1)
                            pagging = true
                        }
                        const dataReply = {}
                        dataReply.pagging = pagging
                        if(req.query.pageNumber){
                            dataReply.page = req.query.pageNumber
                        }
                        dataReply.reply = reply
                        comment['replies'] = dataReply
                    }
                })
                comments.push(comment)
                if(i == result.length - 1){
                   resolve(comments)
               }
            // })
        },function(err){
            if(err){
                resolve(comments)
            }
        });
    })
}

exports.comment = async (req, res) => {
    let id = req.params.id
    req.query.commentId = id
    await commonFunction.getGeneralInfo(req,'comments')
    //get comments
    await commentModel.getComments({data_comment_id:id,limit:1},req,res).then(async result => {
        if(result && result.length){
            let comment = result[0]
            //get item

            await globalModel.custom(req,"SELECT * FROM "+(comment.type == "members" ? "users" : comment.type)+" WHERE "+(comment.type == "members" ? "username" : (comment.type == "channel_posts" ? "post_id" : "custom_url"))+" = ? ",[comment.custom_url]).then(result => {
                if(result && result.length){
                    const item = JSON.parse(JSON.stringify(result));
                    if(item.length){
                        req.query.item = item[0]
                    }
                }
            })
            if(!req.query.item){
                if (req.query.data) {
                    res.send({data: req.query});
                    return 
                }
                req.app.render(req, res,  '/page-not-found', req.query);
                return
            }
            await commonFunction.updateMetaData(req,{title:"Comment",description:comment.description,image:comment.image})
            await exports.getComment(req,res,result).then(result => {
                req.query.pagging = false 
                req.query.comments = result
                if (req.query.data) {
                    res.send({data: req.query});
                    return 
                }
                req.app.render(req, res,  '/comment', req.query);
            })
        }else{
            if (req.query.data) {
                res.send({data: req.query,pagenotfound:1});
                return 
            }
            req.app.render(req, res,  '/page-not-found', req.query);
        }
    })
}


exports.reply = async (req, res) => {
    let id = req.params.id
    await commonFunction.getGeneralInfo(req,'replies')
    //get comments
    req.query.replyId = id
    await commentModel.getComments({reply_id:id,limit:1},req,res).then(async result => {
        if(result && result.length){
            let comment = result[0]
            await globalModel.custom(req,"SELECT * FROM "+(comment.type == "members" ? "users" : comment.type)+" WHERE "+(comment.type == "members" ? "username" : (comment.type == "channel_posts" ? "post_id" : "custom_url"))+" = ? ",[comment.custom_url]).then(result => {
                 if(result && result.length){
                     const item = JSON.parse(JSON.stringify(result));
                     if(item.length){
                         req.query.item = item[0]
                     }
                 }
             })
             if(!req.query.item){
                if (req.query.data) {
                    res.send({data: req.query});
                    return 
                }
                req.app.render(req, res,  '/page-not-found', req.query);
                return
            }
            await commonFunction.updateMetaData(req,{title:"Reply",description:comment.description,image:comment.image})
            await exports.getComment(req,res,result,true).then(result => {
                req.query.pagging = false 
                req.query.comments = result
                if (req.query.data) {
                    res.send({data: req.query});
                    return 
                }
                req.app.render(req, res,  '/reply', req.query);
            })
        }else{
            if (req.query.data) {
                res.send({data: req.query,pagenotfound:1});
                return 
            }
            req.app.render(req, res,  '/page-not-found', req.query);
        }
    })

}