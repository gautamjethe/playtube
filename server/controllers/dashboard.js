const commonFunction = require("../functions/commonFunctions")
const categoryModel = require("../models/categories")
const channelModel = require("../models/channels")
const blogModel = require("../models/blogs")
const videoModel = require("../models/videos")
const playlistModel = require("../models/playlists")
const privacyModel = require("../models/privacy")
const userModel = require("../models/users")
const levelModel = require("../models/levels")
const levelPermission = require("../models/levelPermissions")
const constant = require("../functions/constant")
const notificationSettings = require("../models/emailNotificationSettings")
const adsModel = require("../models/userAds")
const globalModel = require("../models/globalModel")
const audioModel = require("../models/audio")



exports.index = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, 'dashboard')
    if (!req.user) {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }

   
    let type = req.params.type

    let user = {...req.user}
    let filter = req.params.filter ? req.params.filter : ''

    if (req.query.user) {
        await userModel.findByUsername(req.query.user, req, res).then(result => {
            if (result){
                user = result
                req.query.username = req.query.user
            }
            else {
                if (req.query.data) {
                    res.send({ data: req.query, pagenotfound: 1 });
                    return
                }
                req.app.render(req, res, '/page-not-found', req.query);
                return
            }
        }).catch(error => {
            if (req.query.data) {
                res.send({ data: req.query, pagenotfound: 1 });
                return
            }
            req.app.render(req, res, '/page-not-found', req.query);
            return
        })
    }
    let owner_id = user.user_id
    await globalModel.custom(req,"UPDATE users set streamkey = MD5(CONCAT(user_id,'"+(process.env.SECRETKEY ? process.env.SECRETKEY : '') +"')) WHERE streamkey IS NULL AND user_id = ?",[owner_id]).then(result => {}).catch(err => {});
    await userModel.findById(owner_id, req, res, true).then(result => {
        if (result) {
            user = result    
        }
    })
    await privacyModel.permission(req, 'member', 'delete', user).then(result => {
        user.canDelete = result
    })
    await privacyModel.permission(req, 'member', 'edit', user).then(result => {
        user.canEdit = result
    })
    if((req.levelPermissions['member.edit'] != 2 && req.user.user_id != user.user_id)){
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    if (!type) {
        if (user.canEdit) {
            type = "general"
        } else {
            type = "password"
        }
    }

    user.verificationFunctionality = req.appSettings["member_verification"] == 1 ? true : false;    

    let isValid = false
    let data = {}

    let response = {
        pagging: false,
        results: []
    }
    data.owner_id = owner_id
    const privacyLevelModel = require("../models/levelPermissions")
    if(req.appSettings['enable_monetization'] == 1){
        await privacyLevelModel.findBykey(req,"member",'monetization',user.level_id).then(result => {
            if(result == 1 && parseFloat(req.appSettings['ads_cost_publisher']) > 0)
                req.query.memberMonetization = result
        })
    }
    let permission = req.levelPermissions
    // if (req.user.user_id != owner_id) {
    //     await levelPermission.findById(level_id, req, res, true).then(result => {
    //         permission = result
    //     })
    // }
    if(req.query.memberMonetization){
        if(parseFloat(req.appSettings['ads_cost_publisher']) > 0){
            await privacyLevelModel.findBykey(req,"member",'monetization_threshold_amount',user.level_id).then(result => {
                req.query.monetization_threshold_amount = result
            })
        }
    }
    
    let canSell = false
    //check package enable
    await privacyLevelModel.findBykey(req,"video",'sell_videos',user.level_id).then(result => {
        if(result == 1){
            canSell = result
        }
    })
   
    if(canSell || req.query.memberMonetization)
        req.query.userShowBalance = canSell

    //channel subscription enable

    if(req.appSettings['channel_support'] == 1){
        req.query.userShowBalance = true
    }

    if (type == "videos") {
        data.limit = 13;
        if (!filter) {
            filter = "my"
        }
        if (filter == "my") {
            isValid = true
            data.myContent = true
            req.query.canDelete = false
            req.query.canEdit = false
            await privacyModel.permission(req, 'videos', 'delete', user).then(result => {
                req.query.canDelete = result
            })
            await privacyModel.permission(req, 'videos', 'edit', user).then(result => {
                req.query.canEdit = result
            })
        } else if (filter == "my_recent") {
            isValid = true
            data.myCustom = 1
            data.recentlyViewed = 1
            data.customSearch = true
        } else if (filter == "my_rated" && req.appSettings["video_rating"]) {
            isValid = true
            data.myrated = 1
            data.myCustom = 1
            data.customSearch = true
        } else if (filter == "my_favourited" && req.appSettings["video_favourite"]) {
            isValid = true
            data.myfav = 1
            data.myCustom = 1
            data.customSearch = true
        } else if (filter == "my_commented" && req.appSettings["video_comment"]) {
            isValid = true
            data.mycommented = 1
            data.myCustom = 1
            data.customSearch = true
        } else if (filter == "my_liked" && req.appSettings["video_like"]) {
            isValid = true
            data.mylike = 1
            data.myCustom = 1
            data.customSearch = true
        } else if (filter == "my_disliked" && req.appSettings["video_dislike"]) {
            isValid = true
            data.myCustom = 1
            data.mydislike = 1
            data.customSearch = true
        } else if (filter == "viewed") {
            isValid = true
            data.orderby = "videos.view_count DESC"
        } else if (filter == "watchlater") {
            isValid = true
            data.mywatchlater = 1
            data.customSearch = true
        } else if (filter == "favourited" && req.appSettings["video_favourite"]) {
            isValid = true
            data.orderby = "videos.favourite_count DESC"
        } else if (filter == "liked" && req.appSettings["video_like"]) {
            isValid = true
            data.orderby = "videos.like_count DESC"
        } else if (filter == "commented" && req.appSettings["video_comment"]) {
            isValid = true
            data.orderby = "videos.comment_count DESC"
        } else if (filter == "disliked" && req.appSettings["video_dislike"]) {
            isValid = true
            data.orderby = "videos.dislike_count DESC"
        } else if (filter == "rated" && req.appSettings["video_rating"]) {
            isValid = true
            data.orderby = "videos.rating DESC"
        }
        if (isValid) {
            await videoModel.getVideos(req, data).then(result => {
                let pagging = false
                if (result.length > data.limit - 1) {
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                response = {
                    pagging: pagging,
                    results: result
                }
            })
        }
    } else if (type == "blogs") {
        if( req.appSettings["enable_blog"] == 1){
        if (!filter) {
            filter = "my"
        }
        if (filter == "my") {
            isValid = true
            data.myContent = true
            req.query.canDelete = false
            req.query.canEdit = false
            await privacyModel.permission(req, 'blogs', 'delete', user).then(result => {
                req.query.canDelete = result
            })
            await privacyModel.permission(req, 'blogs', 'edit', user).then(result => {
                req.query.canEdit = result
            })
        } else if (filter == "my_recent") {
            isValid = true
            data.recentlyViewed = 1
            data.customSearch = true
            data.myCustom = 1
        } else if (filter == "my_rated" && req.appSettings["blog_rating"]) {
            isValid = true
            data.myCustom = 1
            data.myrated = 1
            data.customSearch = true
        } else if (filter == "my_favourited" && req.appSettings["blog_favourite"]) {
            isValid = true
            data.myCustom = 1
            data.myfav = 1
            data.customSearch = true
        } else if (filter == "my_commented" && req.appSettings["blog_comment"]) {
            isValid = true
            data.myCustom = 1
            data.mycommented = 1
            data.customSearch = true
        } else if (filter == "my_liked" && req.appSettings["blog_like"]) {
            isValid = true
            data.myCustom = 1
            data.mylike = 1
            data.customSearch = true
        } else if (filter == "my_disliked" && req.appSettings["blog_dislike"]) {
            isValid = true
            data.myCustom = 1
            data.mydislike = 1
            data.customSearch = true
        } else if (filter == "viewed") {
            isValid = true
            data.orderby = "blogs.view_count DESC"
        } else if (filter == "favourited" && req.appSettings["blog_favourite"]) {
            isValid = true
            data.orderby = "blogs.favourite_count DESC"
        } else if (filter == "commented" && req.appSettings["blog_comment"]) {
            isValid = true
            data.orderby = "blogs.comment_count DESC"
        } else if (filter == "liked" && req.appSettings["blog_like"]) {
            isValid = true
            data.orderby = "blogs.like_count DESC"
        } else if (filter == "disliked" && req.appSettings["blog_dislike"]) {
            isValid = true
            data.orderby = "blogs.dislike_count DESC"
        } else if (filter == "rated" && req.appSettings["blog_rating"]) {
            isValid = true
            data.orderby = "blogs.rating DESC"
        }
        if (isValid) {
            data.limit = 13;
            await blogModel.getBlogs(req, data).then(result => {
                let pagging = false
                if (result.length > data.limit - 1) {
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                response = {
                    pagging: pagging,
                    results: result
                }
            })
        }
    }
    }else if(type == "audio"){
        
        if(req.appSettings["enable_audio"] == 1){
        if(!filter){
            filter = "my"
        }
        if(filter == "my"){
            isValid = true
            req.query.canDelete = false
            req.query.canEdit = false
            await privacyModel.permission(req,'audio','delete',user).then(result => {
                req.query.canDelete = result
            })
            await privacyModel.permission(req,'audio','edit',user).then(result => {
                req.query.canEdit = result
            })
            data.myContent = true
        }else if(filter == "my_recent"){
            isValid = true
            data.recentlyViewed = 1
            data.myCustom = 1
            data.customSearch = true
        }else if(filter == "my_rated" && req.appSettings["audio_rating"]){
            isValid = true
            data.myCustom = 1
            data.myrated = 1
            data.customSearch = true
        }else if(filter == "my_favourited" && req.appSettings["audio_favourite"]){
            isValid = true
            data.myCustom = 1
            data.myfav = 1
            data.customSearch = true
        }else if(filter == "my_commented" && req.appSettings["audio_comment"]){
            isValid = true
            data.myCustom = 1
            data.mycommented = 1
            data.customSearch = true
        }else if(filter == "my_liked" && req.appSettings["audio_like"]){
            isValid = true
            data.myCustom = 1
            data.mylike = 1
            data.customSearch = true
        }else if(filter == "my_disliked" && req.appSettings["audio_dislike"]){
            isValid = true
            data.myCustom = 1
            data.mydislike = 1
            data.customSearch = true
        }else if(filter == "viewed"){
            isValid = true
            data.orderby = "view_count DESC"
        }else if(filter == "favourited" && req.appSettings["audio_favourite"]){
            isValid = true
            data.orderby = "favourite_count DESC"
        }else if(filter == "liked" && req.appSettings["audio_like"]){
            isValid = true
            data.orderby = "like_count DESC"
        }else if(filter == "commented" && req.appSettings["audio_comment"]){
            isValid = true
            data.orderby = "comment_count DESC"
        }else if(filter == "disliked" && req.appSettings["audio_dislike"]){
            isValid = true
            data.orderby = "dislike_count DESC"
        }else if(filter == "rated" && req.appSettings["audio_rating"]){
            isValid = true
            data.orderby = "rating DESC"
        }
        if(isValid){
            data.limit = 17
            let page = 1
            if(req.body.page == ''){
                page = 1;
            }else{
                //parse int Convert String to number 
                page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
            }
            
            data.offset = (page - 1)*(data.limit - 1)
            
            await audioModel.getAudios(req,data).then(result => {
                let pagging = false
                if(result.length > data.limit - 1){
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                response = {
                    pagging:pagging,
                    results:result
                }
            })
        }
    }
    } else if (type == "playlists") {
        if(req.appSettings["enable_playlist"] == 1){
        if (!filter) {
            filter = "my"
        }
        if (filter == "my") {
            isValid = true
            data.myContent = true
            req.query.canDelete = false
            req.query.canEdit = false
            await privacyModel.permission(req, 'playlists', 'delete', user).then(result => {
                req.query.canDelete = result
            })
            await privacyModel.permission(req, 'playlists', 'edit', user).then(result => {
                req.query.canEdit = result
            })
        } else if (filter == "my_recent") {
            isValid = true
            data.myCustom = 1
            data.recentlyViewed = 1
            data.customSearch = true
        } else if (filter == "my_rated" && req.appSettings["playlist_rating"]) {
            isValid = true
            data.myCustom = 1
            data.myrated = 1
            data.customSearch = true
        } else if (filter == "my_favourited" && req.appSettings["playlist_favourite"]) {
            isValid = true
            data.myCustom = 1
            data.myfav = 1
            data.customSearch = true
        } else if (filter == "my_commented" && req.appSettings["playlist_comment"]) {
            isValid = true
            data.myCustom = 1
            data.mycommented = 1
            data.customSearch = true
        } else if (filter == "my_liked" && req.appSettings["playlist_like"]) {
            isValid = true
            data.myCustom = 1
            data.mylike = 1
            data.customSearch = true
        } else if (filter == "my_disliked" && req.appSettings["playlist_dislike"]) {
            isValid = true
            data.myCustom = 1
            data.mydislike = 1
            data.customSearch = true
        } else if (filter == "viewed") {
            isValid = true
            data.orderby = "playlists.view_count DESC"
        } else if (filter == "favourited" && req.appSettings["playlist_favourite"]) {
            isValid = true
            data.orderby = "playlists.favourite_count DESC"
        } else if (filter == "liked" && req.appSettings["playlist_like"]) {
            isValid = true
            data.orderby = "playlists.like_count DESC"
        } else if (filter == "commented" && req.appSettings["playlist_comment"]) {
            isValid = true
            data.orderby = "playlists.comment_count DESC"
        } else if (filter == "disliked" && req.appSettings["playlist_dislike"]) {
            isValid = true
            data.orderby = "playlists.dislike_count DESC"
        } else if (filter == "rated" && req.appSettings["playlist_rating"]) {
            isValid = true
            data.orderby = "playlists.rating DESC"
        }
        if (isValid) {
            data.limit = 17;
            await playlistModel.getPlaylists(req, data).then(result => {
                let pagging = false
                if (result.length > data.limit - 1) {
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                response = {
                    pagging: pagging,
                    results: result
                }
            })
        }
    }
    } else if (type == "members") {
        if (!filter) {
            filter = "my_subscribed"
        }

        if (filter == "my_subscribed") {
            isValid = true
            data.mySubscribed = 1
            data.customSearch = true
        } else if (filter == "my_rated" && req.appSettings["member_rating"]) {
            isValid = true
            data.myrated = 1
            data.customSearch = true
        } else if (filter == "my_recent") {
            isValid = true
            data.recentlyViewed = 1
            data.customSearch = true
        } else if (filter == "my_favourited" && req.appSettings["member_favourite"]) {
            isValid = true
            data.myfav = 1
            data.customSearch = true
        } else if (filter == "my_commented" && req.appSettings["member_comment"]) {
            isValid = true
            data.mycommented = 1
            data.customSearch = true
        } else if (filter == "my_liked" && req.appSettings["member_like"]) {
            isValid = true
            data.mylike = 1
            data.customSearch = true
        } else if (filter == "my_disliked" && req.appSettings["member_dislike"]) {
            isValid = true
            data.mydislike = 1
            data.customSearch = true
        } else if (filter == "subscribed") {
            isValid = true
            data.iSubscribed = 1
            data.customSearch = true
        }
        if (isValid) {
            data.limit = 13;
            await userModel.getMembers(req, data).then(result => {
                let pagging = false
                if (result.length > data.limit - 1) {
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                response = {
                    pagging: pagging,
                    results: result
                }
            })
        }
    } else if (type == "channels") {
        if(req.appSettings["enable_channel"] == 1){
            if (!filter) {
                filter = "my"
            }
            if (filter == "my") {
                isValid = true
                data.myContent = true
                req.query.canDelete = false
                req.query.canEdit = false
                await privacyModel.permission(req, 'channels', 'delete', user).then(result => {
                    req.query.canDelete = result
                })
                await privacyModel.permission(req, 'channels', 'edit', user).then(result => {
                    req.query.canEdit = result
                })
            } else if (filter == "my_recent") {
                isValid = true
                data.myCustom = 1
                data.recentlyViewed = 1
                data.customSearch = true
            } else if (filter == "my_rated" && req.appSettings["channel_rating"]) {
                isValid = true
                data.myCustom = 1
                data.myrated = 1
                data.customSearch = true
            } else if (filter == "my_favourited" && req.appSettings["channel_favourite"]) {
                isValid = true
                data.myCustom = 1
                data.myfav = 1
                data.customSearch = true
            } else if (filter == "my_commented" && req.appSettings["channel_comment"]) {
                isValid = true
                data.myCustom = 1
                data.mycommented = 1
                data.customSearch = true
            } else if (filter == "my_liked" && req.appSettings["channel_like"]) {
                isValid = true
                data.myCustom = 1
                data.mylike = 1
                data.customSearch = true
            } else if (filter == "my_disliked" && req.appSettings["channel_dislike"]) {
                isValid = true
                data.myCustom = 1
                data.mydislike = 1
                data.customSearch = true
            } else if (filter == "viewed") {
                isValid = true
                data.orderby = "channels.view_count DESC"
            } else if (filter == "my_subscribed") {
                isValid = true
                data.mySubscribed = 1
                data.customSearch = true
            } else if (filter == "favourited" && req.appSettings["channel_favourite"]) {
                isValid = true
                data.orderby = "channels.favourite_count DESC"
            } else if (filter == "liked" && req.appSettings["channel_like"]) {
                isValid = true
                data.orderby = "channels.like_count DESC"
            } else if (filter == "commented" && req.appSettings["channel_comment"]) {
                isValid = true
                data.orderby = "channels.comment_count DESC"
            } else if (filter == "disliked" && req.appSettings["channel_dislike"]) {
                isValid = true
                data.orderby = "channels.dislike_count DESC"
            } else if (filter == "rated" && req.appSettings["channel_rating"]) {
                isValid = true
                data.orderby = "channels.rating DESC"
            } else if (filter == "subscribed") {
                isValid = true
                data.iSubscribed = 1
                data.customSearch = true
            }
            if (isValid) {
                data.limit = 13;
                await channelModel.getChannels(req, data).then(result => {
                    let pagging = false
                    if (result.length > data.limit - 1) {
                        result = result.splice(0, data.limit - 1);
                        pagging = true
                    }
                    response = {
                        pagging: pagging,
                        results: result
                    }
                })
            }

        }

    } else if (type == "general" && user.canEdit) {
        isValid = true
        //get level ids
        if (req.user.level_id == 1) {
            await levelModel.findAll(req, { flagNotIn: "'public'" }).then(results => {
                if (results) {
                    if (results.length > 1) {
                        req.query.levels = results
                    }
                }
            }).catch(err => {
                //res.send(err)
            })
        }
    } else if (type == "profile" && user.canEdit) {
        isValid = true
    } else if (type == "password") {
        isValid = true
    } else if (type == "notifications") {
        await notificationSettings.findAll(req, { notification: true,owner_id:user.user_id }).then(results => {
            if (results) {
                req.query.notificationTypes = results
                isValid = true
            }
        }).catch(err => {

        })
    } else if (type == "emails") {
        await notificationSettings.findAll(req, { email: true,owner_id:user.user_id }).then(results => {
            if (results) {
                req.query.notificationTypes = results
                isValid = true
            }
        }).catch(err => {

        })
    } else if (type == "ads" && (req.appSettings['video_ffmpeg_path'] || req.user.level_id == 1) ) {
        if (req.session.adsPaymentStatus) {
            req.query.adsPaymentStatus = req.session.adsPaymentStatus
            req.session.adsPaymentStatus = null
        }
        let queryString = req.query
        let searchData = {}
        if (queryString.title) {
            data['title'] = queryString.title
            searchData.title = queryString.title
        }
        if (queryString.name) {
            data['name'] = queryString.name
            searchData.name = queryString.name
        }
        if (queryString.category_id) {
            data['category_id'] = queryString.category_id
            searchData.category_id = queryString.category_id
        }
        if (queryString.subcategory_id) {
            data['subcategory_id'] = queryString.subcategory_id
            searchData.subcategory_id = queryString.subcategory_id
        }
        if (queryString.subsubcategory_id) {
            data['subsubcategory_id'] = queryString.subsubcategory_id
            searchData.subsubcategory_id = queryString.subsubcategory_id
        }
        if (queryString.status) {
            data['status'] = queryString.status
            searchData.status = queryString.status
        }
        if (queryString.adult) {
            data['adult'] = queryString.adult
            searchData.adult = queryString.adult
        }
        if (queryString.approve) {
            data['approve'] = queryString.approve
            searchData.approve = queryString.approve
        }
        req.query.searchData = searchData
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
        req.query.categories = categories

        isValid = true
        req.query.canDelete = false
        req.query.canEdit = false
        await privacyModel.permission(req, 'member', 'deleteads', user).then(result => {
            req.query.canDelete = result
        })
        await privacyModel.permission(req, 'member', 'editads', user).then(result => {
            req.query.canEdit = result
        })

        if (isValid) {
            data.limit = 13
            let page = 1
            if (req.body.page == '') {
                page = 1;
            } else {
                //parse int Convert String to number 
                page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
            }

            data.offset = (page - 1) * (data.limit - 1)
            await adsModel.getads(req, data).then(result => {
                let pagging = false
                if (result.length > data.limit - 1) {
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                response = {
                    pagging: pagging,
                    ads: result
                }
            })
        }
    } else if (type == "verification" && user.verificationFunctionality) {
        isValid = true
        if (user.verified != 1) {
            await globalModel.custom(req, "SELECT request_id FROM verification_requests WHERE owner_id = ?", [owner_id]).then(result => {
                var resultData = JSON.parse(JSON.stringify(result))
                if (resultData && resultData.length > 0) {
                    user.verificationRequestSend = constant.member.VERIFICATIONREQUESTALREADYSEND
                }
            })
        } else {
            user.verificationRequestSend = constant.member.VERIFICATIONALREADYFDONE
        }
    }else if (type == "monetization" &  req.query.memberMonetization) {
        isValid = true
        if (user.monetization != 1) {
            if (user && user.monetization_request == 1) {
                user.monetizationRequestSend = constant.member.MONETIZATIONREQUESTALREADYSEND
            }
        }
    }else if ((type == "balance" || type == "withdraw") && req.query.userShowBalance) {
        isValid = true
        if (req.session.adsPaymentStatus) {
            req.query.adsPaymentStatus = req.session.adsPaymentStatus
            req.session.adsPaymentStatus = null
        }
        if(type == "withdraw"){
            let data = {}
            let queryString = req.query
            let searchData = {}
            if (queryString.status) {
                if(queryString.status > 2 && queryString.status < 0){
                    queryString.status = "";
                }
                data['status'] = queryString.status
                searchData.status = queryString.status
            }
            req.query.searchData = searchData
            let LimitNum = 13;
            let page = 1
            
            let offset = (page - 1) * (LimitNum - 1)
            
            data.limit = LimitNum
            data.offset = offset
            data.owner_id = owner_id
            const videoMonetizationModel = require("../models/videoMonetizations")
            await videoMonetizationModel.getWithdraw(req, data).then(result => {
                let pagging = false
                if (result) {
                    pagging = false
                    if (result.length > LimitNum - 1) {
                        result = result.splice(0, LimitNum - 1);
                        pagging = true
                    }
                    response = {
                        pagging: pagging,
                        results: result
                    }
                }
            })
        }

    } else if (type == "delete" && user.canDelete) {
        isValid = true
    }else if (type == "streamdata") {
        if(parseInt(req.appSettings['video_tip']) == 1){
            //get tip data
            await videoModel.getDefaultTips(req,{user_id:user.user_id,resource_type:"video"}).then(result => {
                if(result && result.length > 0)
                    req.query.tips = result
            })
        }



        //default streaming data
        await videoModel.getDefaultStreamingData(req,{user_id:user.user_id,resource_type:"video"}).then(result => {
            if(result && result.length > 0)
                req.query.editItem = result[0]
        })

        //categoriesVideos
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
            req.query.categoriesVideos = categories

        isValid = true
    }else if(type == "purchases"){
        isValid = true
        let LimitNum = 13;
        let page = 1
        delete data.owner_id
        let offset = (page - 1) * (LimitNum - 1)
        let dataPurchase = {}
        dataPurchase.limit = LimitNum
        dataPurchase.offset = offset
        data.purchaseVideo = true
        data.purchase_user_id = user.user_id
        //videos
        await videoModel.getVideos(req,data).then(result => {
            let pagging = false
            if (result) {
                pagging = false
                if (result.length > LimitNum - 1) {
                    result = result.splice(0, LimitNum - 1);
                    pagging = true
                }
                response = {
                    pagging: pagging,
                    results: result
                }
            }
        })
    }else if(type == "earning" && req.query.userShowBalance){
        isValid = true
        //video earning
        let data = {}
        const videoTransaction = require("../models/videoTransactions")
        await videoTransaction.getStats(req,{criteria:"today",user:user}).then(result => {
            if(result){
                data.videosEarning = result.spent
                data.xaxis = result.xaxis
                data.yaxis = result.yaxis
            }
        }).catch(err => {
            console.log(err)
        })

        //channel support earning
        const channelSupportTransaction = require("../models/channels")
        await channelSupportTransaction.getSupportStats(req,{criteria:"today",user:user}).then(result => {
            if(result){
                data.channelSupportEarning = result.spent
                data.xaxis = result.xaxis
                data.yaxis = result.yaxis
            }
        }).catch(err => {
            console.log(err)
        })

        //video tip earning
        await videoTransaction.getStats(req,{criteria:"today",user:user,type:"video_tip"}).then(result => {
            if(result){
                data.videosTipEarning = result.spent
                data.xaxis = result.xaxis
                data.yaxis = result.yaxis
            }
        }).catch(err => {
            console.log(err)
        })


        //ads earning
        const videoMonetizationModel = require("../models/videoMonetizations")
        await videoMonetizationModel.getStats(req,{criteria:"today",user:user}).then(result => {
            if(result){
                data.adsEarning = result.spent
                data.xaxis = result.xaxis
                data.yaxis = result.yaxis
            }
        }).catch(err => {
            console.log(err)
        })
        req.query.statsData = data
        const earningModel = require("../models/earning")
        let LimitNum = 21
        await earningModel.findAll(req,{user_id:user.user_id,limit:LimitNum}).then(result => {
            let pagging = false
            if (result) {
                pagging = false
                if (result.length > LimitNum - 1) {
                    result = result.splice(0, LimitNum - 1);
                    pagging = true
                }
                response = {
                    pagging: pagging,
                    results: result
                }
            }
        })


    }
    if (!isValid) {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    req.query.type = type
    req.query.filter = filter
    
    req.query.member = user
    req.query.items = response
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/dashboard', req.query);
}