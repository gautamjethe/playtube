const likeModel = require("../../models/likes"),
dateTime = require('node-datetime'),
socketio = require("../../socket")


exports.like = async (req,res,next) => {
    let data = {}
    data['type'] = req.body.type.replace("audios",'audio')
    data['id'] = req.body.id
    data['like_dislike'] = req.body.action
    data['owner_id'] = req.user.user_id
    data['subType'] = req.body.subType
    const reply_comment_id = req.body.reply_comment_id
    var dt = dateTime.create();
    data.reply_comment_id = reply_comment_id
    var formatted = dt.format('Y-m-d H:M:S');
    data['creation_date'] = formatted
    let likeType = ""
    await likeModel.isLiked(data.id,data.type,req,res).then(result => {
        if(result){
            data['likeId'] = result.like_id
            likeType = result.like_dislike
        }
    })
    data['likeType'] = likeType
    
    await likeModel.insert(data,req,res).then(result => {
        
    })
    
    let removeLike = false
    let removeDislike = false
    let insertLike = false
    let insertDislike = false

    if(likeType == data['like_dislike']){
        //remove like / dislike
        if(likeType == "like"){
            //remove like
            removeLike = true
        }else{
            //remove dislike
            removeDislike = true
        }

    }else{
        if(likeType == "like"){
            //remove like and insert dislike
            removeLike = true
            insertDislike = true
        }else if(likeType == "dislike"){
            //remove dislike and insert like
            removeDislike = true
            insertLike = true
        }else if(data['like_dislike'] == "like"){
            //insert like
            insertLike = true
        }else{
            //insert dislike
            insertDislike = true
        }
    }
    socketio.getIO().emit('likeDislike', {
        "itemId": req.body.id,
        "itemType":data['type'],
        "ownerId":req.user.user_id,
        "reply_comment_id":reply_comment_id,
        "removeLike" : removeLike,
        "removeDislike" : removeDislike,
        "insertLike" : insertLike,
        "insertDislike" : insertDislike
    });
    return res.send({})
}