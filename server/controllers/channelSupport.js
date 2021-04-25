const commonFunction = require("../functions/commonFunctions")
const packageModel = require("../models/packages")
const recurringPaypal = require("../functions/recurring-paypal")
const oneTimePaypal = require("../functions/one-time-paypal")
const globalModel = require("../models/globalModel")
const dateTime = require("node-datetime")

exports.browse = async (req, res) => {
    let resource_id = req.params.id
    let type = req.params.type
    let itemObject = {}
    let valid = false
    if (resource_id && type) { 
        if(type == "channel"){
            await globalModel.custom(req,"SELECT * from channels where channel_id = ?",[resource_id]).then(result => {
                let item = JSON.parse(JSON.stringify(result));
                if(item && item.length > 0){
                    itemObject = item[0]
                    valid = true
                }
            })
        }
    }
    if(!valid){
        res.redirect("/")
        res.end()
        return
    }

    req.session.orderId = null
    //delete all user pending orders
    await globalModel.custom(req, "DELETE FROM orders WHERE owner_id = ? AND state = 'initial'", [req.user.user_id]).then(result => {
        
    })
    let currentDate = dateTime.create().format("Y-m-d H:M:S")
    //create order
    await globalModel.create(req, { owner_id: req.user.user_id, gateway_id: 1, state: "initial", creation_date: currentDate, source_type: "subscription", source_id: 0 }, "orders").then(result => {
        if (result) {
            req.session.orderId = result.insertId
        } else {

        }
    })
    if (!req.session.orderId) {
        res.redirect("/")
        res.end()
        return
    }
    const data = {}
    data["amount"] = parseFloat(itemObject.channel_subscription_amount).toFixed(2)
    data['id'] = resource_id
    data["description"] = itemObject.description
    data["headingTitle"] = itemObject.title
    data["returnUrl"] = `${process.env.PUBLIC_URL}/support/successulPayment`
    data["cancelUrl"] = `${process.env.PUBLIC_URL}/support/cancelPayment`
    data.frequency = "month"
    data.interval = 1
    data.sku = "order_"+req.session.orderId
    data.title = itemObject.title
    data.frequency = "month"
    data.interval = 1


    itemObject.type = "month"
    itemObject.duration_type = "year"
    itemObject.duration = 50
    itemObject.interval = 1

    return recurringPaypal.init(req, res, data,itemObject).then(result => {
        if (result.url) {
            req.session.resource_id = resource_id
            req.session.tokenUserPayment = result.token
            res.redirect(302, result.url)
        } else {
            res.redirect("/channel/"+itemObject.custom_url)
        }
    }).catch(err => {
        console.log(err, ' ======= Upgrade Channel subscription RECURRING ERR ============')
        return res.redirect("/channel/"+itemObject.custom_url)
    })
     
}

exports.successul = async (req, res, next) => {
    if (!req.session.tokenUserPayment || !req.session.resource_id || !req.session.orderId ) {
        return res.redirect(302, '/')
    } else {
        let resource_id = req.session.resource_id
        let orderID = req.session.orderId
        let orders = {}
        let itemObject = {}
        await globalModel.custom(req, "SELECT * FROM orders where order_id =?",orderID).then(result => {
            let item = JSON.parse(JSON.stringify(result));
            if(item && item.length > 0){
                orders = item[0] 
            } else {
                resource_id = null
            }
        }).catch(err => {
            resource_id = null
        })
        if(orders.source_type == "channel_support"){
            await globalModel.custom(req, "SELECT * FROM channels where channel_id =?",resource_id).then(result => {
                let item = JSON.parse(JSON.stringify(result));
                if(item && item.length > 0){
                    itemObject = item[0] 
                } 
            }).catch(err => {
                
            })
        }
        if (!resource_id || Object.keys(itemObject).length == 0) {
            res.send("/")
            res.end()
        }
        let currentDate = dateTime.create().format("Y-m-d H:M:S")
        await recurringPaypal.execute(req, req.session.tokenUserPayment).then(async executeResult => {
            if (executeResult) {
                orders.type = "month"
                orders.duration_type = "year"
                orders.duration = 50
                orders.interval = 1

                let changed_expiration_date = await recurringPaypal.getExpirationDate(orders)
                await globalModel.create(req, {type:"channel_support",id:req.user.user_id, expiration_date: changed_expiration_date, owner_id: req.user.user_id, id: resource_id, status: executeResult.state.toLowerCase(),creation_date: currentDate, modified_date: currentDate, gateway_profile_id: executeResult.id,order_id:req.session.orderId }, "subscriptions").then(async result => {
                    globalModel.update(req,{gateway_transaction_id:executeResult.id,state:executeResult.state.toLowerCase(),'source_id':result.insertId},"orders","order_id",req.session.orderId)
                    req.query.type = executeResult.state.toLowerCase()
                    req.session.channelPaymentStatus = "success"
                    res.redirect("/channel/"+itemObject.custom_url)
                    res.end()
                })
            } else {
                req.session.channelPaymentStatus = "fail"
                res.redirect("/channel/"+itemObject.custom_url)
                res.end()
            }
        }).catch(err => {
            req.session.channelPaymentStatus = "fail"
            res.redirect("/channel/"+itemObject.custom_url)
            res.end()
        }) 
        
    }
}

exports.cancel = async (req, res, next) => {
    if (!req.session.tokenUserPayment) {
        res.redirect("/upgrade")
        if (req.session.paypalData) {
            req.session.paypalData = null
        }
        res.end()
    }
    req.session.tokenUserPayment = null
    if (req.session.paypalData) {
        req.session.paypalData = null
    }

    let resource_id = req.session.resource_id
    let orderID = req.session.orderId
    let itemObject = {}
    await globalModel.custom(req, "SELECT * FROM orders where order_id =?",orderID).then(result => {
        let item = JSON.parse(JSON.stringify(result));
        if(item && item.length > 0){
            itemObject = item[0]
        } else {
            resource_id = null
        }
    }).catch(err => {
        resource_id = null
    })
    if (!resource_id) {
        res.send("/")
        res.end()
    }
    req.session.channelPaymentStatus = "cancel"
    res.redirect("/channel/"+itemObject.custom_url)
    res.end()
    
}