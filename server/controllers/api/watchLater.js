const watchLaterModel = require("../../models/watchLater"),
dateTime = require('node-datetime'),
socketio = require("../../socket")

exports.index = async (req,res,next) => {
    let data = {}
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    data['id'] = req.body.id
    data['owner_id'] = req.user.user_id
    data['creation_date'] = formatted
    await watchLaterModel.isActive(data.id,req,res).then(result => {
        if(result){
            data['watchLaterId'] = result.watchlater_id
        }
    })
    await watchLaterModel.insert(data,req,res).then(result => {
        if(data['watchLaterId']){
            socketio.getIO().emit('unwatchlater', {
                "itemId": req.body.id,
                "ownerId":req.user.user_id,
            });
        }else{
            //insert
            socketio.getIO().emit('watchlater', {
                "itemId": req.body.id,
                "ownerId":req.user.user_id,
            });
        }
        res.send({})
    })
}