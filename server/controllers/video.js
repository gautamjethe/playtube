const commonFunction = require("../functions/commonFunctions")
const settingModel = require("../models/settings")
const artistModel = require("../models/artists")
const categoryModel = require("../models/categories")
const videoModel = require("../models/videos")
const privacyModel = require("../models/privacy")
const privacyLevelModel = require("../models/levelPermissions")
const userModel = require("../models/users")
const recentlyViewed = require("../models/recentlyViewed")
const dateTime = require("node-datetime")
const playlistModel = require("../models/playlists")
const globalModel = require("../models/globalModel")
const oneTimePaypal = require("../functions/one-time-paypal")
const  axios = require("axios")
const md5 = require("md5")

exports.purchase = async (req, res) => {
    let id = req.params.id
    req.session.orderId = null
    req.session.videoId = null
    
    if (!id || isNaN(id) || !req.user) {
        await commonFunction.getGeneralInfo(req, res, "page_not_found")
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    let video = {}
    await videoModel.findById(id,req).then(result => {
        if(result){
            video = result
        }
    })
    if(!Object.keys(video).length || parseFloat(video.price) <= 0){
        await commonFunction.getGeneralInfo(req, res, "page_not_found")
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    let isValid = true
    //check video aleady purchased
    await videoModel.checkVideoPurchased({id:video.video_id,owner_id:req.user.user_id},req).then(result => {
        if(result){
            isValid = false
        }
    }).catch(err => {
    })
    if(!isValid){
        await commonFunction.getGeneralInfo(req, res, "page_not_found")
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    let currentDate = dateTime.create().format("Y-m-d H:M:S")
    const data = {}
    data["amount"] = parseFloat(video.price).toFixed(2)
    data["returnUrl"] = `${process.env.PUBLIC_URL}/videos/successulPayment/`+video.video_id
    data["cancelUrl"] = `${process.env.PUBLIC_URL}/videos/cancelPayment/`+video.video_id
    data.title = "Purchase Video: "+video.title
    req.session.videoId = video.video_id 
    //delete all user pending orders
    await globalModel.custom(req,"DELETE FROM orders WHERE owner_id = ? AND state = 'initial' AND source_type = 'video_purchase'",[req.user.user_id]).then(result => {
        
    })
    //create order
    await globalModel.create(req, {owner_id:req.user.user_id,gateway_id:1,state:"initial",creation_date:currentDate,source_type:"video_purchase",source_id:video.video_id}, "orders").then(result => {
        if (result) {
            req.session.orderId = result.insertId
        } else {

        }
    })
    if (!req.session.orderId) {
        req.session.videoPaymentStatus = "fail"
        res.redirect("/watch/"+video.custom_url)
        res.end()
        return
    }
    data.sku = "video_purchase_"+req.session.orderId
    return oneTimePaypal.init(req, res, data).then(result => {
        if (result.url) {
            req.session.video_user_id = req.user.user_id
            req.session.videotokenUserPayment = result.token
            res.redirect(302, result.url)
            res.end()
        } else {
            console.log( ' ======= Video Purchase ONETIME ERR Paypal============')
            req.session.videoPaymentStatus = "fail"
            res.redirect("/watch/"+video.custom_url)
            res.end()
        }
    }).catch(err => {
        console.log(err, ' ======= Video Purchase ONETIME ERR ============')
        res.redirect("/watch/"+video.custom_url)
        res.end()
    })
}

exports.successul = async (req, res, next) => {
    let id = req.params.id
    if(id != req.session.videoId){
        await commonFunction.getGeneralInfo(req, res, "page_not_found")
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    let video = {}
    await videoModel.findById(id,req).then(result => {
        if(result){
            video = result
        }
    })
    if(!req.user.user_id || !Object.keys(video).length || parseFloat(video.price) <= 0){
        await commonFunction.getGeneralInfo(req, res, "page_not_found")
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }

    

    if (!req.user || !req.session.videotokenUserPayment || !req.session.video_user_id || !req.session.videoId || !req.session.orderId) {
        return res.redirect(302, "/watch/"+video.custom_url)
    } else {
        let currentDate = dateTime.create().format("Y-m-d H:M:S")
        const PayerID = req.query.PayerID
        await oneTimePaypal.execute(req, res, PayerID, { price: parseFloat(video.price).toFixed(2) }).then(async executeResult => {
            if (executeResult) {
                let commission_amount = 0
                let commissionType = parseFloat(req.appSettings['video_commission_type'])
                let commissionTypeValue = parseFloat(req.appSettings['video_commission_value'])
                //calculate admin commission
                if(commissionType == 2 && commissionTypeValue > 0){
                    commission_amount = ((video.price).toFixed(2) * (commissionTypeValue/100)).toFixed(2);
                }else if(commissionType == 1 && commissionTypeValue > 0){
                    commission_amount = commissionTypeValue;
                }
                if(commission_amount > parseFloat(video.price).toFixed(2)){
                    commission_amount = 0
                }
                await globalModel.create(req, {type:"video_purchase",id:video.video_id, owner_id: req.session.video_user_id, package_id: 0, status: executeResult.state.toLowerCase(),creation_date: currentDate, modified_date: currentDate, gateway_profile_id: executeResult.transaction_id,order_id:req.session.orderId }, "subscriptions").then(async result => {
                    const videoPurchaseModel = require("../models/videoPurchase")
                    await videoPurchaseModel.insertTransaction(req, {order_id:req.session.orderId,admin_commission:commission_amount, gateway_transaction_id: executeResult.transaction_id, owner_id: req.session.video_user_id, state: executeResult.state.toLowerCase(), price: parseFloat(video.price).toFixed(2) - commission_amount, currency: req.appSettings.payment_default_currency, creation_date: currentDate, modified_date: currentDate,id:video.video_id,type:"video_purchase" }).then(async result => {
                        //update order table
                        req.session.video_user_id = null
                        req.session.videoId = null
                        req.session.videotokenUserPayment = null
                        globalModel.update(req,{gateway_transaction_id:executeResult.transaction_id,state:executeResult.state.toLowerCase(),'source_id':video.video_id},"orders","order_id",req.session.orderId)
                        req.session.videoPaymentStatus = "success"
                        res.redirect("/watch/"+video.custom_url)
                        res.end()                     
                    })
                })
            } else {
                req.session.adsPaymentStatus = "fail"
                res.redirect("/watch/"+video.custom_url)
                res.end()
            }
        }).catch(err => {
            req.session.adsPaymentStatus = "fail"
            res.redirect("/watch/"+video.custom_url)
            res.end()
        })
    }
}

exports.cancel = async (req, res, next) => {
    let id = req.params.id
    if(id != req.session.videoId){
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    let video = {}
    await videoModel.findById(id,req).then(result => {
        if(result){
            video = result
        }
    })
    if(!Object.keys(video).length || !parseFloat(video.price) <= 0){
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    if (!req.session.videotokenUserPayment) {
        res.redirect("/watch/"+video.custom_url)
        if (req.session.paypalData) {
            req.session.paypalData = null
        }
        res.end()
    }
    req.session.video_user_id = null
    req.session.videoId = null
    req.session.videotokenUserPayment = null
    if (req.session.paypalData) {
        req.session.paypalData = null
    }
    req.session.videoPaymentStatus = "cancel"
    return res.redirect(302, "/watch/"+video.custom_url)
}


exports.categories = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, 'browse_video_category_view')
    req.query.type = "video"
    let category = {}
    await categoryModel.findAll(req, { type: req.query.type,orderBy:" categories.item_count DESC " }).then(result => {
        if (result)
            category = result
    }).catch(error => {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    })

    if (!Object.keys(category).length) {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    req.query.category = category
    await commonFunction.updateMetaData(req,{title:category.title,description:category.description,image:category.image})

    const limit = 12
    const data = { limit: limit, orderby: " view_count DESC" }

    await videoModel.getVideos(req, data).then(result => {
        if (result) {
            let items = result
            req.query.items = items
        }
    })
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/categories', req.query);
}
exports.category = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, 'video_category_view')
    req.query.categoryId = req.params.id
    req.query.type = "video"
    let category = {}
    await categoryModel.findByCustomUrl({ id: req.query.categoryId, type: req.query.type }, req, res).then(result => {
        if (result)
            category = result
    }).catch(error => {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    })

    if (!Object.keys(category).length) {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    req.query.category = category
    await commonFunction.updateMetaData(req,{title:category.title,description:category.description,image:category.image})
    if (category.subcategory_id == 0 && category.subsubcategory_id == 0) {
        await categoryModel.findAll(req, { type: "video", subcategory_id: category.category_id, item_count: 1 }).then(result => {
            if (result) {
                req.query.subcategories = result
            }
        });
    } else if (category.subcategory_id > 0) {
        await categoryModel.findAll(req, { type: "video", subsubcategory_id: category.category_id, item_count: 1 }).then(result => {
            if (result) {
                req.query.subsubcategories = result
            }
        });
    }
    const limit = 13
    const data = { limit: limit }
    if (category.subcategory_id == 0 && category.subsubcategory_id == 0) {
        data['category_id'] = category.category_id
    } else if (category.subcategory_id > 0) {
        data['subcategory_id'] = category.category_id
    } else if (category.subsubcategory_id > 0) {
        data['subsubcategory_id'] = category.category_id
    }


    //get all blogs as per categories
    await videoModel.getVideos(req, data).then(result => {
        if (result) {
            req.query.pagging = false
            let items = result
            if (result.length > limit - 1) {
                items = result.splice(0, limit - 1);
                req.query.pagging = true
            }
            req.query.items = items
        }
    })
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/category', req.query);
}
exports.browse = async (req, res) => {
    const queryString = req.query 

    const limit = 13
    const data = { limit: limit }
    req.query.search = {}
    req.query.pageType = req.params.pageType
    data['pageType'] = req.query.pageType
    if(data.pageType == "trending"){
        await commonFunction.getGeneralInfo(req, res, 'treading_video_browse')
    }else if(data.pageType == "top"){
        await commonFunction.getGeneralInfo(req, res, 'top_video_browse')
    }else if(data.pageType == "latest"){
        await commonFunction.getGeneralInfo(req, res, 'latest_video_browse')
    }else if(req.isLiveStreaming){
        await commonFunction.getGeneralInfo(req, res, 'live_video_browse')
    }else{
        await commonFunction.getGeneralInfo(req, res, 'video_browse')
    }
    
    if(req.isLiveStreaming){
         data['liveStreamingPage'] = true
         req.query.liveStreamingPage = 1;
    }
   
    
    data['type'] = queryString.type
    if (queryString.q && !queryString.tag) {
        req.query.search.q = queryString.q
        data['title'] = queryString.q
    }
    if (queryString.tag) {
        req.query.search.tag = queryString.tag
        req.query.search.q = queryString.tag
        data['tags'] = queryString.tag
    }
    if (queryString.category_id) {
        data['category_id'] = queryString.category_id
        req.query.search.category_id = queryString.category_id
    }
    if (queryString.subcategory_id) {
        data['subcategory_id'] = queryString.subcategory_id
        queryString.category_id = queryString.subcategory_id
        req.query.search.subcategory_id = queryString.subcategory_id
    }
    if (queryString.subsubcategory_id) {
        data['subsubcategory_id'] = queryString.subsubcategory_id
        queryString.category_id = queryString.subsubcategory_id
        req.query.search.subsubcategory_id = queryString.subsubcategory_id
    }

    if (queryString.sort == "latest") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "videos.video_id desc"
    } else if (queryString.sort == "favourite" && req.appSettings['video_favourite'] == 1) {
        req.query.search.sort = queryString.sort
        data['orderby'] = "videos.favourite_count desc"
    } else if (queryString.sort == "view") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "videos.view_count desc"
    } else if (queryString.sort == "like" && req.appSettings['video_like'] == "1") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "videos.like_count desc"
    } else if (queryString.sort == "dislike" && req.appSettings['video_dislike'] == "1") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "videos.dislike_count desc"
    } else if (queryString.sort == "rated" && req.appSettings['video_rating'] == "1") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "videos.rating desc"
    } else if (queryString.sort == "commented" && req.appSettings['video_comment'] == "1") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "videos.comment_count desc"
    }

    if (queryString.type == "featured" && req.appSettings['video_featured'] == 1) {
        req.query.search.type = queryString.type
        data['is_featured'] = 1
    } else if (queryString.type == "sponsored" && req.appSettings['video_sponsored'] == 1) {
        req.query.search.type = queryString.type
        data['is_sponsored'] = 1
    } else if (queryString.type == "hot" && req.appSettings['video_hot'] == 1) {
        req.query.search.type = queryString.type
        data['is_hot'] = 1
    }

    //get all videos as per categories
    await videoModel.getVideos(req, data).then(result => {
        if (result) {
            req.query.pagging = false
            let items = result
            if (result.length > limit - 1) {
                items = result.splice(0, limit - 1);
                req.query.pagging = true
            }
            req.query.videos = items
        }
    })
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
        req.query.categories = categories

    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    if(req.isLiveStreaming){
        req.app.render(req, res, '/live', req.query);
    }else
        req.app.render(req, res, '/videos', req.query);
}
exports.view = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, 'video_view')
    req.query.videoId = req.params.id
    
    let video = {}
    let playlistId = req.query.list
    let playlist = {}
    if (playlistId) {
        await playlistModel.findByCustomUrl(playlistId, req).then(async result => {
            if (result) {
                playlist = result
                await userModel.findById(result.owner_id, req, res).then(result => {
                    playlist.owner = result
                }).catch(error => {

                })
            }
        }).catch(err => {
            if (req.query.data) {
                res.send({ data: req.query, pagenotfound: 1 });
                return
            }
            req.app.render(req, res, '/page-not-found', req.query);
        })
    }
    if ((playlistId && !Object.keys(playlist).length) || (playlistId && Object.keys(playlist).length && playlist.private == 1 && (!req.user || req.user.user_id != playlist.owner_id))) {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    if (playlistId) {
        //get playlist videos
        await videoModel.getVideos(req, { playlist_id: playlist.playlist_id }).then(result => {
            if (result && result.length > 0) {
                req.query.playlistVideos = result
                req.query.playlist = playlist
            } else {
                if (req.query.data) {
                    res.send({ data: req.query, pagenotfound: 1 });
                    return
                }
                req.app.render(req, res, '/page-not-found', req.query);
                return
            }
        }).catch(error => {

        })
    }
    
   

    let showVideo = true
    req.isview = true;
    //set referer
    let referer  = ""
    try{
        referer = req.header('Referer');
    }catch(err){
        console.log(err)
    }
    //add user referer
    if(referer){
        let currentServerURL = process.env.PUBLIC_URL
        var currentHost = new URL(currentServerURL);
        var a = new URL(referer);
        if(a.hostname != currentHost.hostname){
            let insertObject = {}
            insertObject['owner_id'] = req.user ? req.user.user_id : 0
            insertObject['sitename'] = a.hostname
            insertObject['url'] = referer
            insertObject['type'] = "video"
            insertObject['ip'] = typeof req.headers != "undefined" && req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : (req.connection && req.connection.remoteAddress ? req.connection.remoteAddress : "")
            insertObject['creation_date'] =  new Date(dateTime.create().format("Y-m-d H:M:S"));
            await globalModel.create(req,insertObject,'referers').then(res => {})
        }
    }


    await videoModel.getVideos(req, { custom_url: req.query.videoId ? req.query.videoId : "notfound", videoview: true }).then(result => {
        if (result && result.length > 0) {
            video = result[0]
        } else {
            showVideo = false
        }
    }).catch(error => {
        showVideo = false
    })
    req.isview = false;
    if (Object.keys(video).length) {
        await privacyModel.check(req, video, 'video').then(result => {
            showVideo = result
        }).catch(error => {
            showVideo = false
        })
    }
    if (!showVideo) {
        if (req.query.data) {
            res.send({data: req.query,permission_error:1});
            return
        }
        req.app.render(req, res, '/permission-error', req.query);
        return
    }
    if (!Object.keys(video).length || ((video.status != 1 || video.approve != 1) && (!req.user || (video.owner_id != req.user.user_id && req.levelPermissions['video.view'] != 2)))) {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    await commonFunction.updateMetaData(req,{title:video.title,description:video.description,image:video.image,keywords:video.tags})

    await privacyLevelModel.findBykey(req,"video",'sell_videos',video.level_id).then(result => {
        if(result == 1)
            video.sell_videos = true
    })
    await privacyLevelModel.findBykey(req,"video",'donation',video.level_id).then(result => {
        if(result == 1)
            video.donation = result
    })
    
    await privacyModel.permission(req, 'video', 'delete', video).then(result => {
        video.canDelete = result
    }).catch(err => {

    })
    await privacyModel.permission(req, 'video', 'edit', video).then(result => {
        video.canEdit = result
    }).catch(err => {

    })

    let settings = await settingModel.settingData(req);
    if(parseInt(settings['live_stream_start']) == 1 && parseInt(video.is_livestreaming) == 1){
        if(settings['live_streaming_type'] == 1)
            req.query.agora_app_id = settings["agora_app_id"];
        //get time diff
        let currentTime = new Date(dateTime.create().format("Y-m-d H:M:S")).getTime();
        let videoTime = new Date(dateTime.create(video.creation_date).format("Y-m-d H:M:S")).getTime();
        const diff = currentTime - videoTime;
        req.query.currentTime =  Math.floor(diff / 1000);
        let condition = []
        //get chat messages for live streaming
        let sql = 'SELECT displayname,livestreaming_chats.owner_id as user_id, livestreaming_chats.chat_id,livestreaming_chats.message,livestreaming_chats.creation_date,IF(userdetails.avtar IS NULL OR userdetails.avtar = "",(SELECT value FROM `level_permissions` WHERE name = CASE WHEN userdetails.gender = "male" THEN "default_mainphoto" WHEN userdetails.gender = "female" THEN "default_femalemainphoto" END AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as image from livestreaming_chats inner join users on users.user_id = livestreaming_chats.owner_id inner join userdetails ON userdetails.user_id = livestreaming_chats.owner_id WHERE  '
        if(settings['live_streaming_type'] == 1 || !video.mediaserver_stream_id){
            condition.push(video.channel_name)
            sql += "livestreaming_chats.channel = ? ORDER BY chat_id ASC LIMIT 100";
        }else{ 
            condition.push(video.custom_url)
            sql += "livestreaming_chats.id = ? ORDER BY chat_id ASC LIMIT 100";
        }
        await globalModel.custom(req,sql,condition).then(result => {
            if(result){
                const chats = JSON.parse(JSON.stringify(result));
                video.chatcomments = chats
            }
        });

    }
    
    //fetch user ads
    if(video.approve == 1){
        if((video.type == 3 || video.type == 11) && parseFloat(video.price) <= 0 && !video.canEdit){
            let ads_cost_perclick = req.query.appSettings['ads_cost_perclick']
            let ads_cost_perview = req.query.appSettings['ads_cost_perview']
            let sql = "SELECT advertisements_user.* from advertisements_user LEFT JOIN users ON users.user_id = advertisements_user.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE users.active = 1 AND users.approve = 1 AND advertisements_user.approve = 1 AND advertisements_user.completed = 1 "
            sql += " AND ( CASE WHEN advertisements_user.type = 1 AND users.wallet >= "+ ads_cost_perclick + " THEN true "
            sql += " WHEN advertisements_user.type = 2 AND users.wallet >= "+ ads_cost_perview + " THEN true "
            sql += " ELSE false  END ) AND ( category_id = 0 OR category_id = ? ) AND ( subcategory_id = 0 OR subcategory_id = ? ) AND ( subsubcategory_id = 0 OR subsubcategory_id = ? )"
            if(video.adult == 1){
                sql += " AND ( advertisements_user.adult IS NULL OR  advertisements_user.adult = 1) "
            }else if(video.adult == 0){
                sql += " AND ( advertisements_user.adult IS NULL OR  advertisements_user.adult = 0) "
            }

            sql += " ORDER BY RAND() DESC LIMIT 1 "
            await globalModel.custom(req,sql,[video.category_id,video.subcategory_id,video.subsubcategory_id]).then(result => {
                if(result){
                    const adsResults = JSON.parse(JSON.stringify(result));
                    if(adsResults && adsResults.length){
                        req.query.userAdVideo = adsResults[0]
                        const adsTransaction = require("../models/adsTransactions")
                        const ads = adsResults[0]
                        if(ads.type == 2){
                            adsTransaction.adSpent(req,{owner_id:ads.owner_id,ad_id:ads.ad_id,amount:req.query.appSettings['ads_cost_perview'],type:"view",creation_date:dateTime.create().format("Y-m-d H:M:S")})
                            //reduce ad owner wallet amount
                            adsTransaction.reduceOwnerWalletAmount(req,{owner_id:ads.owner_id,amount:req.query.appSettings['ads_cost_perview']})
                        }
                    }
                }
            })
            if(!req.query.userAdVideo){
                //fetch admin ads
                let sql = "SELECT * from advertisements_admin WHERE advertisements_admin.active = 1 "

                sql += " AND ( category_id = 0 OR category_id = ? ) AND ( subcategory_id = 0 OR subcategory_id = ? ) AND ( subsubcategory_id = 0 OR subsubcategory_id = ? ) "

                if(video.adult == 1){
                    sql += " AND ( adult IS NULL OR adult = 1) "
                }else if(video.adult == 2){
                    sql += " AND ( adult IS NULL OR adult = 0) "
                }
                sql += " ORDER BY RAND() DESC LIMIT 1 "
                
                await globalModel.custom(req,sql,[video.category_id,video.subcategory_id,video.subsubcategory_id]).then(result => {
                    if(result){
                        const adsResults = JSON.parse(JSON.stringify(result));
                        if(adsResults && adsResults.length){
                            req.query.adminAdVideo = adsResults[0]
                            globalModel.custom(req,"UPDATE advertisements_admin SET view_count = view_count + 1 WHERE ad_id = ?",[adsResults[0].ad_id]).then(result => {

                            })
                        }
                    }
                })
            }
        }else if((video.type == 3 || video.type == 11) && (parseFloat(video.price) > 0 && video.sell_videos) && req.user && !video.canEdit){
            //check video purchased
            await videoModel.checkVideoPurchased({id:video.video_id,owner_id:req.user.user_id},req).then(result => {
                if(result){
                    video.videoPurchased = true
                }
            }).catch(err => {
            })
        }
    }
    if(video.canEdit){
        video.videoPurchased = true
    }
    if (req.session.adsPaymentStatus) {
        req.query.adsPaymentStatus = req.session.adsPaymentStatus
        req.session.adsPaymentStatus = null
    }
    //fetch artists
    if (video.artists && video.artist != "" && req.appSettings['video_artists'] == "1") {
        await artistModel.findByIds(video.artists, req, res).then(result => {
            if (result)
                video.artists = result
        }).catch(error => {

        })
    }
    //video user details
    await userModel.findById(video.owner_id, req, res).then(result => {
        video.owner = result
    }).catch(error => {

    })
    if(req.session.videoPaymentStatus){
        video.videoPaymentStatus = true
        req.session.videoPaymentStatus = null
    }
    //fetch artists
    let LimitNumArtist = 17;
    let pageArtist = 1
    let offsetArtist = (pageArtist - 1) * LimitNumArtist
    if (video.artists && video.artist != "" && req.appSettings['video_artists'] == "1") {
        await artistModel.findByIds(video.artists, req, res, LimitNumArtist, offsetArtist).then(result => {
            let pagging = false
            if (result) {
                pagging = false
                if (result.length > LimitNumArtist - 1) {
                    result = result.splice(0, LimitNumArtist - 1);
                    pagging = true
                }
                video.artists = {
                    'pagging': pagging,
                    results: result
                }
            }
        }).catch(error => {
            console.log(error)
        })
    } else {
        video.artists = {
            'pagging': false,
            results: []
        }
    }

    
    video.watermark  = req.appSettings['video_watermark']
   
    //category details
    if (video.category_id) {
        await categoryModel.findById(video.category_id, req, res).then(result => {
            if (result) {
                video.category = result
            }
        }).catch(err => {

        })
        if (video.subcategory_id) {
            await categoryModel.findById(video.subcategory_id, req, res).then(result => {
                if (result) {
                    video.subcategory = result
                }
            }).catch(err => {

            })
            if (video.subsubcategory_id) {
                await categoryModel.findById(video.subsubcategory_id, req, res).then(result => {
                    if (result) {
                        video.subsubcategory = result
                    }
                }).catch(err => {

                })
            }
        }
    }

     //tip data if enabled
     if(parseInt(req.appSettings['video_tip']) == 1 && video.approve == 1){
        //get tip data
        await videoModel.getTips(req,{resource_id:video.video_id,resource_type:"video",view:true}).then(result => {
            if(result && result.length > 0)
                video.tips = result
        })

        let LimitNum = 13;
        let page = 1
        let offsetDonor = (page - 1) * LimitNum

        //get donors
        await videoModel.donors({video_id:video.video_id, limit: LimitNum, offset:offsetDonor}, req).then(result => {
            let pagging = false
            if (result) {
                pagging = false
                if (result.length > LimitNum - 1) {
                    result = result.splice(0, LimitNum - 1);
                    pagging = true
                }
                video.donors = {
                    'pagging': pagging,
                    results: result
                }
            }
        }).catch(error => {

        })
    }
    
    if (!req.query.password && (req.appSettings['video_adult'] != 1 ||  (video.adult == 0 || (video.adult == 1 && req.query.adultAllowed)))) {
        req.query.video = video
        delete req.query.video.password
        if(video.approve == 1)
        recentlyViewed.insert(req, { id: video.video_id, owner_id: video.owner_id, type: 'videos', creation_date: dateTime.create().format("Y-m-d H:M:S") }).catch(err => {

        })
    }else{
        req.query.adultVideo = video.adult
    }
    //related videos category || tags
    await videoModel.getVideos(req, { orderby:" view_count desc ",category_id: video.category_id, tags: video.tags, not_video_id: video.video_id, 'related': true, limit: 10 }).then(result => {
        if (result) {
            req.query.relatedVideos = result
        }
    }).catch(err => {

    })

    if(!req.query.relatedVideos || req.query.relatedVideos.length < 10){
        await videoModel.getVideos(req, { orderby:" view_count desc ", not_videos_id: req.query.relatedVideos, limit: 10 - (req.query.relatedVideos && req.query.relatedVideos.length ? req.query.relatedVideos.length : 0),not_video_id: video.video_id, }).then(result => {
            if (result) {
                if(req.query.relatedVideos && req.query.relatedVideos.length){
                    req.query.relatedVideos = req.query.relatedVideos.concat(result)
                }else{
                    req.query.relatedVideos = result
                }
                
            }
        }).catch(err => {
    
        })
    }

    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    if(req.embed){
        req.app.render(req, res, '/embed', req.query);
    }else{
        req.app.render(req, res, '/watch', req.query);
    }
}
exports.adClicked = async(req,res,next) => {
    let id = req.params.id
    let type = req.params.type
    let valid = false
    if(type == "admin"){
        await globalModel.custom(req,"SELECT * FROM advertisements_admin WHERE ad_id = ?",[id]).then(result => {
            if(result){
                const adsResults = JSON.parse(JSON.stringify(result));
                if(adsResults && adsResults.length){
                    let ad = adsResults[0]
                    globalModel.custom(req,"UPDATE advertisements_admin SET click_count = click_count + 1 WHERE ad_id = ?",[ad.ad_id]).then(result => {
                    
                    })
                    valid = true
                    res.redirect(decodeURI(ad.click_link));
                }
            } 
        })
    }else if(type == "user"){
        await globalModel.custom(req,"SELECT advertisements_user.*,users.level_id FROM advertisements_user LEFT JOIN users ON users.user_id = advertisements_user.owner_id WHERE users.user_id IS NOT NULL AND users.active = 1 AND users.approve = 1 AND  ad_id = ?",[id]).then(async result => {
            if(result){
                const adsResults = JSON.parse(JSON.stringify(result));
                if(adsResults && adsResults.length){
                    const adsTransaction = require("../models/adsTransactions")
                    let ads = adsResults[0]
                    const permissionModel = require("../models/levelPermissions")
                    permissionModel.findBykey(req,"member",'monetization',ads.level_id).then(result => {
                        if(req.user && ads.owner_id != req.user.user_id && result){
                            if(result == 1 && req.appSettings['ads_cost_publisher'] > 0){
                                //set monetization balance to video owner account
                                 const videoMonetization = require("../models/videoMonetizations")
                                 videoMonetization.earning(req,{owner_id:ads.owner_id,ad_id:ads.ad_id,resource_id:req.user.user_id,amount:req.appSettings['ads_cost_publisher'],creation_date:dateTime.create().format("Y-m-d H:M:S")})
                            }
                        }
                    })
                    

                    if(ads.type == 1){
                        //reduce ad owner wallet amount
                        adsTransaction.reduceOwnerWalletAmount(req,{owner_id:ads.owner_id,amount:req.appSettings['ads_cost_perview']})
                    }
                    adsTransaction.adSpent(req,{owner_id:ads.owner_id,ad_id:ads.ad_id,amount:req.appSettings['ads_cost_perview'],type:"click",creation_date:dateTime.create().format("Y-m-d H:M:S")})
                    valid = true
                    res.redirect(decodeURI(ads.url));
                }
            }
        })
    }
    if(!valid){
        res.redirect("/")
    }
}
exports.create = async (req, res) => {
    
    let isValid = true
    let videoPageType = "video_create"
    const videoId = req.params.id
    if (videoId) {
        videoPageType = "video_edit"
        await videoModel.findByCustomUrl(videoId, req, res, true).then(async video => {
            req.query.editItem = video
            req.query.videoId = videoId
            await privacyModel.permission(req, 'video', 'edit', video).then(result => {
                isValid = result
            }).catch(err => {
                isValid = false
            })
        }).catch(err => {
            isValid = false
        })
    }
    await commonFunction.getGeneralInfo(req, res, videoPageType)
    if (!isValid) {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    if(!req.user){
        if (req.query.data) {
            res.send({data: req.query,user_login:1});
            return
        }
        req.app.render(req, res, '/login', req.query);
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
        req.query.videoCategories = categories


    //tip data if enabled
    if(parseInt(req.appSettings['video_tip']) == 1 && req.query.editItem){
        //get tip data
        await videoModel.getTips(req,{resource_id:req.query.editItem.video_id,resource_type:"video",view:true}).then(result => {
            if(result && result.length > 0)
                req.query.editItem.tips = result
        })
    }

    //check package enable
    if(req.appSettings["video_sell"]){
        await privacyLevelModel.findBykey(req,"video",'sell_videos',req.user.level_id).then(result => {
            if(result == 1)
                req.query.sell_videos = result
        })
    }
    
    
    //get artists
    if (settingModel.getSetting(req, "video_artists", 1) != 0) {
        await artistModel.findAll(req, { type: "video" }).then(artist => {
            if (artist)
                req.query.videoArtists = artist;
        })
    }
    // if(req.appSettings['livestreamingtype'] && req.appSettings['livestreamingtype'] == 0 && (typeof req.appSettings['antserver_media_token'] == "undefined" || req.appSettings['antserver_media_token'] == 1)){
    //     let maximum = 15000
    //     let minimum = 12987
    //     let date = new Date()
    //     let time = date.getTime()
    //     let number = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    //     let streamingId = "" + number + time
    //     if(req.appSettings['antserver_media_singlekey'] == 1){
    //         streamingId = md5(""+req.user.user_id+process.env.SECRETKEY)
    //     }
    //     await exports.createKey(req,streamingId).then(response => {
    //         req.query.tokenStream = response.token
    //     }).catch(err => {
    //         console.log(err)
    //     });
    //     req.query.streamingId = streamingId
    // }else if(req.appSettings['antserver_media_singlekey'] == 1){
    //     req.query.streamingId = md5(""+req.user.user_id+process.env.SECRETKEY);

    // }
    
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/create-video', req.query);
}

exports.createKey = (req,streamingId) => {
    return new Promise(async (resolve,reject) => {
        const https = require('https');
        const agent = new https.Agent({  
            rejectUnauthorized: false
        });
        let reqData = {listenerHookURL:process.env.PUBLIC_URL+"/api/live-streaming/status","streamId":streamingId,"type": "liveStream","name": req.user.user_id+" - "+req.user.displayname+" live streaming",rtmpURL:"rtmp://"+(req.appSettings['antserver_media_url'].replace("https://","").replace("http://",""))+"/LiveApp"}
        var config = {
            method: 'post',
            url: req.appSettings["antserver_media_url"].replace("https://","http://")+":5080/LiveApp/rest/v2/broadcasts/create",
            headers: { 
                'Content-Type': 'application/json;charset=utf-8'
            },
            data : JSON.stringify(reqData),
            //httpsAgent: agent
        };
        axios(config)
        .then(function (response) {
        if(response.data.status == "created"){
            var myDate = new Date();
            myDate.setHours(myDate.getHours()+24);
            var config = {
                method: 'get',
                url: req.appSettings["antserver_media_url"].replace("https://","http://")+":5080/LiveApp/rest/v2/broadcasts/"+streamingId+"/token?expireDate="+(myDate.getTime() / 1000).toFixed(0)+"&type=publish",
                headers: { 
                    'Content-Type': 'application/json;charset=utf-8'
                },
                //httpsAgent: agent
            };
            axios(config)
            .then(function (response) {
                if(response.data.tokenId){
                    resolve({ token:response.data.tokenId });
                }else{
                    reject(response.error)
                }
            })
        }else{
            console.log(response.data);
            reject(false);
        }        
        })
        .catch(function (error) {
            console.log(error)
            reject(error);
        });
    });
}