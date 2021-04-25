const commonFunction = require("../functions/commonFunctions")
const adsModel = require("../models/userAds")
const privacyModel = require("../models/privacy")
const categoryModel = require("../models/categories")
const oneTimePaypal = require("../functions/one-time-paypal")
const globalModel = require("../models/globalModel")
const dateTime = require("node-datetime")
const constant = require("../functions/constant")

exports.recharge = async (req, res) => {
    let amount = req.query.amount
    req.session.orderId = null
    if (!amount || isNaN(amount) || !req.user) {
        await commonFunction.getGeneralInfo(req, res, "")
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    let fromBalance = req.query.fromBalance
    let fromVideo = req.query.fromVideo
    if(fromVideo){
        req.session.redirectURL = req.header('Referer')
    }
    let currentDate = dateTime.create().format("Y-m-d H:M:S")
    amount = parseFloat(amount).toFixed(2)
    const data = {}
    data["amount"] = amount
    data["returnUrl"] = `${process.env.PUBLIC_URL}/ads/successulPayment`
    data["cancelUrl"] = `${process.env.PUBLIC_URL}/ads/cancelPayment`
    data.title = constant.general.WALLETRECHARGE
    req.session.adsAmount = amount
    req.session.fromBalance = fromBalance
    
    //delete all user pending orders
    await globalModel.custom(req,"DELETE FROM orders WHERE owner_id = ? AND state = 'pending'",[req.user.user_id]).then(result => {
        
    })
    //create order
    await globalModel.create(req, {owner_id:req.user.user_id,gateway_id:1,state:"pending",creation_date:currentDate,source_type:"wallet_user",source_id:req.user.user_id}, "orders").then(result => {
        if (result) {
            req.session.orderId = result.insertId
        } else {

        }
    })
    if (!req.session.orderId) {
        req.session.adsPaymentStatus = "fail"
        res.redirect("/dashboard/ads")
        res.end()
        return
    }
    data.sku = "user_wallet_"+req.session.orderId
    return oneTimePaypal.init(req, res, data).then(result => {
        if (result.url) {
            req.session.ad_user_id = req.user.user_id
            req.session.adstokenUserPayment = result.token
            res.redirect(302, result.url)
            res.end()
        } else {
            req.session.adsPaymentStatus = "fail"
            res.redirect("/dashboard/ads")
            res.end()
        }
    }).catch(err => {
        console.log(err, ' ======= Upgrade ONETIME ERR ============')
        res.redirect("/dashboard/ads")
        res.end()
    })
}

exports.successul = async (req, res, next) => {
    if (!req.user || !req.session.adstokenUserPayment || !req.session.ad_user_id || !req.session.adsAmount || !req.session.orderId) {
        return res.redirect(302, '/dashboard/ads')
    } else {
        let currentDate = dateTime.create().format("Y-m-d H:M:S")
        const PayerID = req.query.PayerID
        await oneTimePaypal.execute(req, res, PayerID, { price: parseFloat(req.session.adsAmount) }).then(async executeResult => {
            if (executeResult) {
                await globalModel.custom(req, "SELECT wallet FROM users WHERE user_id = ?", [req.session.ad_user_id]).then(async result => {
                    if (result) {
                        const walletData = parseFloat(JSON.parse(JSON.stringify(result))[0].wallet) + parseFloat(req.session.adsAmount);
                        await globalModel.update(req, { wallet: walletData }, "users", "user_id", req.session.ad_user_id).then(async result => {
                            if (result) {
                                await globalModel.create(req, {order_id:0,subscription_id:0,type:"wallet",id:req.session.ad_user_id,package_id:0,admin_commission:0, gateway_transaction_id: executeResult.transaction_id, owner_id: req.session.ad_user_id, state: executeResult.state, price: req.session.adsAmount, currency: req.appSettings.payment_default_currency, creation_date: currentDate, modified_date: currentDate }, "transactions").then(async result => {
                                    //update order table
                                    req.session.ad_user_id = null
                                    globalModel.update(req,{gateway_transaction_id:executeResult.transaction_id,state:executeResult.state},"orders","order_id",req.session.orderId)
                                    req.session.adsPaymentStatus = "success"
                                    if(req.session.redirectURL){
                                        res.redirect(req.session.redirectURL)
                                    }else if(req.session.fromBalance){
                                        res.redirect("/dashboard/balance");
                                    }else{
                                        res.redirect("/dashboard/ads")
                                    }
                                    res.end()
                                })
                            } else {
                                req.session.adsPaymentStatus = "fail"
                                if(req.session.redirectURL){
                                    res.redirect(req.session.redirectURL)
                                }else if(req.session.fromBalance){
                                    res.redirect("/dashboard/balance");
                                }else{
                                    res.redirect("/dashboard/ads")
                                }
                                res.end()
                            }
                        })
                    } else {
                        req.session.adsPaymentStatus = "fail"
                        if(req.session.redirectURL){
                            res.redirect(req.session.redirectURL)
                        }else if(req.session.fromBalance){
                            res.redirect("/dashboard/balance");
                        }else{
                            res.redirect("/dashboard/ads")
                        }
                        res.end()
                    }
                })
            } else {
                req.session.adsPaymentStatus = "fail"
                if(req.session.redirectURL){
                    res.redirect(req.session.redirectURL)
                }else if(req.session.fromBalance){
                    res.redirect("/dashboard/balance");
                }else{
                    res.redirect("/dashboard/ads")
                }
                res.end()
            }
        }).catch(err => {
            req.session.adsPaymentStatus = "fail"
            if(req.session.redirectURL){
                res.redirect(req.session.redirectURL)
            }else if(req.session.fromBalance){
                res.redirect("/dashboard/balance");
            }else{
                res.redirect("/dashboard/ads")
            }
            res.end()
        })
    }
}

exports.cancel = (req, res, next) => {
    if (!req.session.adstokenUserPayment) {
        if(req.session.fromBalance){
            res.redirect("/dashboard/balance");
        }else{
            res.redirect("/dashboard/ads")
        }
        if (req.session.paypalData) {
            req.session.paypalData = null
        }
        res.end()
    }
    req.session.ad_user_id = null
    req.session.adstokenUserPayment = null
    if (req.session.paypalData) {
        req.session.paypalData = null
    }
    req.session.adsPaymentStatus = "cancel"
    if(req.session.redirectURL){
        res.redirect(req.session.redirectURL)
    }else if(req.session.fromBalance){
        res.redirect("/dashboard/balance");
    }else{
        res.redirect("/dashboard/ads")
    }
    return res.end();
}

exports.create = async (req, res) => {
    let adType = "ads_create"
    let isValid = true
    const adId = req.params.id
    if (adId) {
        adType = "ads_edit"
        await adsModel.findById(adId, req, res, true).then(async ad => {
            req.query.editItem = ad
            req.query.adId = adId
            await privacyModel.permission(req, 'member', 'editads', ad).then(result => {
                isValid = result
            }).catch(err => {
                isValid = false
            })
        }).catch(err => {
            isValid = false
        })
    }else{
        if(!req.appSettings['video_ffmpeg_path'] && req.user.level_id != 1){
            if (req.query.data) {
                res.send({ data: req.query, pagenotfound: 1 });
                return
            }
            req.app.render(req, res, '/page-not-found', req.query);
            return
        }
    }
    await commonFunction.getGeneralInfo(req, res, adType)
    if (!isValid) {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }

    //get categories
    const categories = []
    await categoryModel.findAll(req, { type: "video" }).then(result => {
        result.forEach(function (doc, index) {
            if (doc.subcategory_id == 0 && doc.subsubcategory_id == 0) {
                const docObject = doc
                //2nd level
                let sub = []
                result.forEach(function (subcat, index) {
                    if (subcat.subcategory_id == doc.category_id) {
                        let subsub = []
                        result.forEach(function (subsubcat, index) {
                            if (subsubcat.subsubcategory_id == subcat.category_id) {
                                subsub.push(subsubcat)
                            }
                        });
                        if (subsub.length > 0) {
                            subcat["subsubcategories"] = subsub;
                        }
                        sub.push(subcat)
                    }
                });
                if (sub.length > 0) {
                    docObject["subcategories"] = sub;
                }
                categories.push(docObject);
            }
        })
    })
    if (categories.length > 0)
        req.query.adCategories = categories

    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/create-ad', req.query);
}