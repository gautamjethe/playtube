const followModel = require("../../models/followers"),
dateTime = require('node-datetime'),
socketio = require("../../socket")
exports.follow = async (req,res,next) => {
    let data = {}
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    data['type'] = req.body.type
    data['id'] = req.body.id
    data['owner_id'] = req.user.user_id
    data['creation_date'] = formatted
    await followModel.isFollowed(req,data.type,req.user.user_id,data.id).then(result => {
        if(result){
            data['followId'] = result.follower_id   
        }
    })
    await followModel.insert(data,req,res).then(result => {
        //delete
        if(data['followId']){
            socketio.getIO().emit('unfollowUser', {
                "itemId": req.body.id,
                "itemType":req.body.type,
                "ownerId":req.user.user_id,
            });
        }else{
            //insert
            socketio.getIO().emit('followUser', {
                "itemId": req.body.id,
                "itemType":req.body.type,
                "ownerId":req.user.user_id,
            });
        }
    })
    res.send({})
}