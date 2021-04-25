const notificationModel = require("../../models/notifications")
const globalModel = require("../../models/globalModel")
const commonFunction = require("../../functions/commonFunctions")
exports.index = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, '')
   return notificationModel.findAll(req,{limit:20,minid:req.body.id}).then(async result => {
        if(result && result.length > 0){
            await exports.notificationData(req,result).then(async result => { 
                if(req.notifications){
                    globalModel.custom(req,"UPDATE notifications SET notification_send = 1 WHERE owner_id = ?",[req.user.user_id]).then(result => {

                    }).catch(err => {

                    })
                    //unread notifications
                    let unread = 0
                    await globalModel.custom(req,"SELECT COUNT(*) as total FROM notifications WHERE `read` = 0 AND owner_id = ? ",req.user.user_id).then(result => {
                        if(result){
                            const data = JSON.parse(JSON.stringify(result));
                            unread = data[0].total
                        }
                    }).catch(err => {

                    })
                    let pagging = false
                    let items = req.notifications
                    if (items.length > 10) {
                        items = items.splice(0, 10);
                        pagging = true
                    }
                    return res.send({notifications:items,unread:unread,pagging:pagging})
                }else{
                    res.send([])
                }
            }).catch(err => {
                res.send([])
            })
        }else{
            res.send({})
        }
    }).catch(err => {
        res.send([])
    })
}
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}
exports.notificationData = async (req,results) => {
    req.notifications = []
   return new Promise(async function(resolve, reject) {
        await asyncForEach(results, async (notification,i) => {
            await  notificationModel.getNotification(req,notification).then(async result => {
                if(result){
                    req.notifications.push(result)
                }
            })
            if(i == results.length - 1){
                resolve("")
            }
        })
    })
}
exports.read = async (req, res) => {
    const notification_id = req.body.id
    if(req.body.allread){
        globalModel.custom(req,"UPDATE notifications SET `read` = 1 WHERE owner_id = ?",[req.user.user_id])
    }else if(notification_id){
        globalModel.custom(req,"UPDATE notifications SET `is_read` = IF (`is_read`, 0, 1) WHERE notification_id = ? AND owner_id = ?",[notification_id,req.user.user_id])
    }else{
        globalModel.custom(req,"UPDATE notifications SET `is_read` = 1 WHERE  owner_id = ?",[req.user.user_id])
    }
    return res.send({})
}
exports.delete = async (req, res) => {
    const notification_id = req.body.id
    if(notification_id){
        globalModel.custom(req,"DELETE FROM notifications WHERE notification_id = ? AND owner_id = ?",[notification_id,req.user.user_id])
    }
    return res.send({})
}