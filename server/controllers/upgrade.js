const commonFunction = require("../functions/commonFunctions")
const packageModel = require("../models/packages")
const recurringPaypal = require("../functions/recurring-paypal")
const oneTimePaypal = require("../functions/one-time-paypal")
const globalModel = require("../models/globalModel")
const dateTime = require("node-datetime")
exports.browse = async (req, res) => {
    let package_id = req.params.package_id
    let packageObj = {}
    if (package_id) { 
        await packageModel.findById(package_id, req, res).then(result => {
            if (result) {
                packageObj = result
            } else {
                package_id = null
            }
        }).catch(err => {
            package_id = null
        })
    }
    req.getPackages = true

    if (package_id) {
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
            res.redirect("/upgrade")
            res.end()
            return
        }
        await commonFunction.getGeneralInfo(req, res, 'upgrade_browse', true)
        const data = {}
        data["amount"] = parseFloat(packageObj.price).toFixed(2)
        data['id'] = packageObj.package_id
        data["description"] = packageObj.description
        data["headingTitle"] = packageObj.title
        data["returnUrl"] = `${process.env.PUBLIC_URL}/upgrade/successulPayment`
        data["cancelUrl"] = `${process.env.PUBLIC_URL}/upgrade/cancelPayment`
        data.frequency = packageObj.type
        data.interval = packageObj.interval
        data.sku = "order_"+req.session.orderId
        data.title = packageObj.title
        if (packageObj.is_recurring == 1) {
            return recurringPaypal.init(req, res, data,packageObj).then(result => {
                if (result.url) {
                    req.session.package_id = package_id
                    req.session.tokenUserPayment = result.token
                    res.redirect(302, result.url)
                } else {
                    res.redirect("/upgrade")
                }
            }).catch(err => {
                console.log(err, ' ======= Upgrade RECURRING ERR ============')
                return res.redirect("/upgrade")
            })
        } else {
            return oneTimePaypal.init(req, res, data).then(result => {
                if (result.url) {
                    req.session.package_id = package_id
                    req.session.tokenUserPayment = result.token
                    res.redirect(302, result.url)
                    res.end()
                } else {
                    res.redirect("/upgrade")
                    res.end()
                }
            }).catch(err => {
                console.log(err, ' ======= Upgrade ONETIME ERR ============')
                res.redirect("/upgrade")
                res.end()
            })
        }
    } else {
        await commonFunction.getGeneralInfo(req, res, 'upgrade_browse')
    }
    
    if (req.query.data) {
        if(!req.query.packagesExists){
            res.send({data: req.query,pagenotfound:1});
            return
        }
        res.send({ data: req.query })
        res.end()
        return
    }
    if(!req.query.packagesExists){
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    req.app.render(req, res, '/upgrade', req.query)
}

exports.successul = async (req, res, next) => {
    if (!req.session.tokenUserPayment || !req.session.package_id || !req.session.orderId ) {
        return res.redirect(302, '/upgrade')
    } else {
        let package_id = req.session.package_id
        let packageObj = {}
        await packageModel.findById(package_id, req, res).then(result => {
            if (result) {
                packageObj = result
            } else {
                package_id = null
            }
        }).catch(err => {
            package_id = null
        })
        if (!package_id) {
            res.send("/upgrade")
            res.end()
        }
        let currentDate = dateTime.create().format("Y-m-d H:M:S")
        if (packageObj.is_recurring == 1) {
            await recurringPaypal.execute(req, req.session.tokenUserPayment).then(async executeResult => {
                if (executeResult) {
                    let changed_expiration_date = await recurringPaypal.getExpirationDate(packageObj)
                    await globalModel.create(req, {type:"member_subscription",id:req.user.user_id, expiration_date: changed_expiration_date, owner_id: req.user.user_id, package_id: package_id, status: executeResult.state.toLowerCase(),creation_date: currentDate, modified_date: currentDate, gateway_profile_id: executeResult.id,order_id:req.session.orderId }, "subscriptions").then(async result => {
                        globalModel.update(req,{gateway_transaction_id:executeResult.id,state:executeResult.state.toLowerCase(),'source_id':result.insertId},"orders","order_id",req.session.orderId)
                        req.query.type = executeResult.state.toLowerCase()
                        res.redirect("/upgrade/success")
                        res.end()
                    })
                } else {
                    res.redirect("/upgrade/fail")
                    res.end()
                }
            }).catch(err => {
                res.redirect("/upgrade")
                res.end()
            }) 
        } else {
            const PayerID = req.query.PayerID
            await oneTimePaypal.execute(req, res, PayerID, packageObj).then(async executeResult => {
                if (executeResult) {
                    let changed_expiration_date = await recurringPaypal.getExpirationDate(packageObj)
                    await globalModel.create(req, {type:"member_subscription",id:req.user.user_id, expiration_date: changed_expiration_date, owner_id: req.user.user_id, package_id: package_id, status: executeResult.state.toLowerCase(),creation_date: currentDate, modified_date: currentDate, gateway_profile_id: executeResult.transaction_id,order_id:req.session.orderId }, "subscriptions").then(async result => {
                        await globalModel.create(req, {package_id:package_id,type:"member_subscription",id:req.user.user_id,gateway_id:1, gateway_transaction_id: executeResult.transaction_id, owner_id: req.user.user_id, order_id: req.session.orderId, state: executeResult.state.toLowerCase(), price: packageObj.price, currency: req.appSettings.payment_default_currency, creation_date: currentDate, modified_date: currentDate,subscription_id:result.insertId }, "transactions").then(async result => {
                            globalModel.update(req,{gateway_transaction_id:req.session.paypalData.id,state:executeResult.state.toLowerCase(),'source_id':result.insertId},"orders","order_id",req.session.orderId)
                            req.query.type = executeResult.state.toLowerCase()
                            res.redirect("/upgrade/success")
                            res.end()
                        })
                    })
                } else {
                    res.redirect("/upgrade/fail")
                    res.end()
                }                
            }).catch(err => {
                console.log(err)
                res.redirect("/upgrade")
                res.end()
            })
        }
    }
}
exports.paymentSuccessul = async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, 'payment_success')
    if(!req.query.type)
        req.query.type = "completed"
    if (req.query.data) {
        res.send({ data: req.query })
        res.end()
        return
    }
    req.app.render(req, res, '/payment-state', req.query)
}
exports.paymentFail = async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, 'payment_fail')
    if(!req.query.type)
        req.query.type = "failed"
    if (req.query.data) {
        res.send({ data: req.query })
        res.end()
        return
    }
    req.app.render(req, res, '/payment-state', req.query)
}
exports.cancel = (req, res, next) => {
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
    return res.redirect(302, '/upgrade')
}