const favouriteModel = require("../../models/favourites"),
dateTime = require('node-datetime'),
socketio = require("../../socket")

exports.favourite = async (req,res,next) => {
    let data = {}
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    data['type'] = req.body.type.replace("audios",'audio')
    data['id'] = req.body.id
    data['owner_id'] = req.user.user_id
    data['creation_date'] = formatted
    await favouriteModel.isFavourite(data.id,data.type,req,res).then(result => {
        if(result){
            data['favouriteId'] = result.favourite_id
        }
    })
    await favouriteModel.insert(data,req,res).then(result => {
        if(data['favouriteId']){
            socketio.getIO().emit('unfavouriteItem', {
                "itemId": req.body.id,
                "itemType":data['type'],
                "ownerId":req.user.user_id,
            });
        }else{
            //insert
            socketio.getIO().emit('favouriteItem', {
                "itemId": req.body.id,
                "itemType":data['type'],
                "ownerId":req.user.user_id,
            });
        }
        res.send({})
    })
}