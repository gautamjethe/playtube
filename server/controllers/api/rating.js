const ratingModel = require("../../models/ratings")
const dateTime = require("node-datetime")
socketio = require("../../socket")

exports.rating = async(req, res, next) => {
    let data = {}
    data['type'] = req.body.type
    data['id'] = req.body.id
    data['owner_id'] = req.user.user_id
    data['creation_date'] = dateTime.create().format("Y-m-d H:M:S")
    data.rating = req.body.rating

    let isRated = false
    await ratingModel.isRated({ type: req.body.type, id: req.body.id }, req).then(result => {
        if (result) {
            isRated = true
        }
    })
    res.send({})
    await ratingModel.insert(data, req, res).then(result => {
        if (result) {
            if (!isRated) {
                //insert
                socketio.getIO().emit('ratedItem', {
                    "itemId": req.body.id,
                    "itemType": req.body.type,
                    "ownerId": req.user.user_id,
                    "type": "new",
                    rating: result
                });
            } else {
                //updated
                socketio.getIO().emit('ratedItem', {
                    "itemId": req.body.id,
                    "itemType": req.body.type,
                    "type": "updated",
                    "ownerId": req.user.user_id,
                    rating: result
                });
            }
        }
    })
}

exports.stats = async(req, res) => {
    const id = req.body.id
    const type = req.body.type
    const responseData = {}
    let isRated = false
    responseData.isRated = isRated
    await ratingModel.isRated({ type: req.body.type, id: req.body.id }, req).then(result => {
        if (result) {
            responseData.isRated = true
            responseData.ownRating = result.rating
        }
    })
    responseData.totalRating = 0
    await ratingModel.totalRating({ type: req.body.type, id: req.body.id },req).then(result => {
        if(result){
            responseData.totalRating = result.count
        }
    })

    responseData.fiveStar = 0
    responseData.fourStar = 0
    responseData.threeStar = 0
    responseData.twoStar = 0
    responseData.oneStar = 0

    await ratingModel.ratingStars({ type: req.body.type, id: req.body.id,rating:5 },req).then(result => {
        if(result){
            responseData.fiveStar = result.count
        }
    })

    await ratingModel.ratingStars({ type: req.body.type, id: req.body.id,rating:4 },req).then(result => {
        if(result){
            responseData.fourStar = result.count
        }
    })

    await ratingModel.ratingStars({ type: req.body.type, id: req.body.id,rating:3 },req).then(result => {
        if(result){
            responseData.threeStar = result.count
        }
    })

    await ratingModel.ratingStars({ type: req.body.type, id: req.body.id,rating:2 },req).then(result => {
        if(result){
            responseData.twoStar = result.count
        }
    })

    await ratingModel.ratingStars({ type: req.body.type, id: req.body.id,rating:1 },req).then(result => {
        if(result){
            responseData.oneStar = result.count
        }
    })

    
    res.send(responseData)


}