const channelModel = require("../../models/channels")
const blogModel = require("../../models/blogs")
const videoModel = require("../../models/videos")
const playlistModel = require("../../models/playlists")
const privacyModel = require("../../models/privacy")
const userModel = require("../../models/users")
const likeModel = require("../../models/likes")
const favouriteModel = require("../../models/favourites")
const followModel = require("../../models/followers")

const globalModel = require("../../models/globalModel")
const adsModel = require("../../models/userAds")
const audioModel = require("../../models/audio")

exports.stats = async(req,res) => { 
    let data = {}
    await likeModel.getStats(req,{criteria:req.body.criteria,type:req.body.type,id:req.body.id}).then(result => {
        if(result){
            data.likes = result.result
            data.xaxis = result.xaxis
            data.yaxis = result.yaxis
        }
    }).catch(err => {
        console.log(err)
    })

    await likeModel.getStats(req,{criteria:req.body.criteria,type:req.body.type,id:req.body.id,subType:"dislike"}).then(result => {
        if(result){
            data.dislike = result.result
            data.xaxis = result.xaxis
            data.yaxis = result.yaxis
        }
    }).catch(err => {
        console.log(err)
    })
    await favouriteModel.getStats(req,{criteria:req.body.criteria,type:req.body.type,id:req.body.id}).then(result => {
        if(result){
            data.favourite = result.result
            data.xaxis = result.xaxis
            data.yaxis = result.yaxis
        }
    }).catch(err => {
        console.log(err)
    })
    if(req.body.type == "channels" || req.body.type == "members"){
        await followModel.getStats(req,{criteria:req.body.criteria,type:req.body.type,id:req.body.id}).then(result => {
            if(result){
                data.follow = result.result
                data.xaxis = result.xaxis
                data.yaxis = result.yaxis
            }
        }).catch(err => {
            console.log(err)
        })
    }
    res.send(data)

}

exports.notifications = async(req,res) => {
    const type = req.body.types
    const user_id = req.body.user_id
    globalModel.custom(req,"DELETE FROM notificationsettings WHERE owner_id = ?",[user_id]).then(result => {
        type.split(',').forEach(result => {
            //insert new
            globalModel.custom(req,"INSERT INTO notificationsettings (`owner_id`,`type`,`notification`) VALUES (?,?,1)",[user_id,result])
        });
    }).catch(err => {

    })
    res.send({"message":"Notifications Alert updated successfully."})
}
exports.emails = async(req,res) => {
    const type = req.body.types
    const user_id = req.body.user_id
    globalModel.custom(req,"DELETE FROM emailsettings WHERE owner_id = ?",[user_id]).then(result => {
        type.split(',').forEach(result => {
            //insert new
            globalModel.custom(req,"INSERT INTO emailsettings (`owner_id`,`type`,`email`) VALUES (?,?,1)",[user_id,result])
        });
    }).catch(err => {

    })
    res.send({"message":"Emails Alert updated successfully."})

}


exports.index = async(req,res) => {
    if(!req.user){
        res.send({})
        return
    }
    let type = req.params.type
    if(!type){
        type = "general"
    }
    
    let user =  req.user
    let filter = req.params.filter ? req.params.filter : ''
    
    if(req.query.user){
        await userModel.findByUsername(req.query.user,req,res).then(result => {
            if(result)
                user = result
            else{
                res.send({})
            }
        }).catch(error => {
            res.send({})
        })
    }
    
    
    let owner_id = user.user_id
    
    let isValid = false
    let data = {}
    data.owner_id = owner_id
    let response = {
        pagging:false,
        results:[]
    }
    
    if(type == "videos"){
        data.limit = 13;
        let page = 1
        if(req.body.page == ''){
                page = 1;
        }else{
            //parse int Convert String to number 
                page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
        }
        
        data.offset = (page - 1)*(data.limit - 1)
        if(!filter){
            filter = "my"
        }
        if(filter == "my"){
            isValid = true
            data.myContent = true
            
        }else if(filter == "my_recent"){
            isValid = true
            data.recentlyViewed = 1
            data.customSearch = true
            data.myCustom = 1
        }else if(filter == "my_rated" && req.appSettings["video_rating"]){
            isValid = true
            data.myrated = 1
            data.myCustom = 1
            data.customSearch = true
        }else if(filter == "my_favourited" && req.appSettings["video_favourite"]){
            isValid = true
            data.myfav = 1
            data.myCustom = 1
            data.customSearch = true
        }else if(filter == "my_commented" && req.appSettings["video_comment"]){
            isValid = true
            data.myCustom = 1
            data.mycommented = 1
            data.customSearch = true
        }else if(filter == "my_liked" && req.appSettings["video_like"]){
            isValid = true
            data.myCustom = 1
            data.mylike = 1
            data.customSearch = true
        }else if(filter == "my_disliked" && req.appSettings["video_dislike"]){
            isValid = true
            data.myCustom = 1
            data.mydislike = 1
            data.customSearch = true
        }else if(filter == "viewed"){
            isValid = true
            data.orderby = "view_count DESC"
        }else if(filter == "watchlater"){
            isValid = true
            data.mywatchlater = 1
            data.customSearch = true
        }else if(filter == "favourited" && req.appSettings["video_favourite"]){
            isValid = true
            data.orderby = "favourite_count DESC"
        }else if(filter == "liked" && req.appSettings["video_like"]){
            isValid = true
            data.orderby = "like_count DESC"
        }else if(filter == "commented" && req.appSettings["video_comment"]){
            isValid = true
            data.orderby = "comment_count DESC"
        }else if(filter == "disliked" && req.appSettings["video_dislike"]){
            isValid = true
            data.orderby = "dislike_count DESC"
        }else if(filter == "rated" && req.appSettings["video_rating"]){
            isValid = true
            data.orderby = "rating DESC"
        }
        if(isValid){
            
            await videoModel.getVideos(req,data).then(result => {
                let pagging = false
                if(result.length > data.limit - 1){
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                res.send({
                    pagging:pagging,
                    videos:result
                })
            })
        }
    }else if(type == "blogs"){
        if( req.appSettings["enable_blog"] == 1){
        if(!filter){
            filter = "my"
        }
        if(filter == "my"){
            isValid = true
            data.myContent = true
            req.query.canDelete = false
            req.query.canEdit = false
            await privacyModel.permission(req,'blogs','delete',user).then(result => {
                req.query.canDelete = result
            })
            await privacyModel.permission(req,'blogs','edit',user).then(result => {
                req.query.canEdit = result
            })
        }else if(filter == "my_recent"){
            isValid = true
            data.recentlyViewed = 1
            data.myCustom = 1
            data.customSearch = true
        }else if(filter == "my_rated"  && req.appSettings["blog_rating"]){
            isValid = true
            data.myCustom = 1
            data.customSearch = true
            data.myrated = 1
            data.myCustom = 1
        }else if(filter == "my_favourited" && req.appSettings["blog_favourite"]){
            isValid = true
            data.myfav = 1
            data.myCustom = 1
            data.customSearch = true
        }else if(filter == "my_commented" && req.appSettings["blog_comment"]){
            isValid = true
            data.myCustom = 1
            data.mycommented = 1
            data.customSearch = true
        }else if(filter == "my_liked" && req.appSettings["blog_like"]){
            isValid = true
            data.myCustom = 1
            data.mylike = 1
            data.customSearch = true
        }else if(filter == "my_disliked" && req.appSettings["blog_dislike"]){
            isValid = true
            data.myCustom = 1
            data.mydislike = 1
            data.customSearch = true
        }else if(filter == "viewed"){
            isValid = true
            data.orderby = "view_count DESC"
        }else if(filter == "favourited" && req.appSettings["blog_favourite"]){
            isValid = true
            data.orderby = "favourite_count DESC"
        }else if(filter == "commented" && req.appSettings["blog_comment"]){
            isValid = true
            data.orderby = "comment_count DESC"
        }else if(filter == "liked" && req.appSettings["blog_like"]){
            isValid = true
            data.orderby = "like_count DESC"
        }else if(filter == "disliked" && req.appSettings["blog_dislike"]){
            isValid = true
            data.orderby = "dislike_count DESC"
        }else if(filter == "rated" && req.appSettings["blog_rating"]){
            isValid = true
            data.orderby = "rating DESC"
        }
        if(isValid){
            data.limit = 13
            let page = 1
            if(req.body.page == ''){
                    page = 1;
            }else{
                //parse int Convert String to number 
                    page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
            }
            
            data.offset = (page - 1)*(data.limit - 1)
            await blogModel.getBlogs(req,data).then(result => {
                let pagging = false
                if(result.length > data.limit - 1){
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                response = {
                    pagging:pagging,
                    blogs:result
                }
                res.send(response)
            })
        }
    }
    }else if(type == "playlists"){
        if(req.appSettings["enable_playlist"] == 1){
        if(!filter){
            filter = "my"
        }
        if(filter == "my"){
            isValid = true
            req.query.canDelete = false
            req.query.canEdit = false
            await privacyModel.permission(req,'playlists','delete',user).then(result => {
                req.query.canDelete = result
            })
            await privacyModel.permission(req,'playlists','edit',user).then(result => {
                req.query.canEdit = result
            })
            data.myContent = true
        }else if(filter == "my_recent"){
            isValid = true
            data.recentlyViewed = 1
            data.myCustom = 1
            data.customSearch = true
        }else if(filter == "my_rated" && req.appSettings["playlist_rating"]){
            isValid = true
            data.myCustom = 1
            data.myrated = 1
            data.customSearch = true
        }else if(filter == "my_favourited" && req.appSettings["playlist_favourite"]){
            isValid = true
            data.myCustom = 1
            data.myfav = 1
            data.customSearch = true
        }else if(filter == "my_commented" && req.appSettings["playlist_comment"]){
            isValid = true
            data.myCustom = 1
            data.mycommented = 1
            data.customSearch = true
        }else if(filter == "my_liked" && req.appSettings["playlist_like"]){
            isValid = true
            data.myCustom = 1
            data.mylike = 1
            data.customSearch = true
        }else if(filter == "my_disliked" && req.appSettings["playlist_dislike"]){
            isValid = true
            data.myCustom = 1
            data.mydislike = 1
            data.customSearch = true
        }else if(filter == "viewed"){
            isValid = true
            data.orderby = "view_count DESC"
        }else if(filter == "favourited" && req.appSettings["playlist_favourite"]){
            isValid = true
            data.orderby = "favourite_count DESC"
        }else if(filter == "liked" && req.appSettings["playlist_like"]){
            isValid = true
            data.orderby = "like_count DESC"
        }else if(filter == "commented" && req.appSettings["playlist_comment"]){
            isValid = true
            data.orderby = "comment_count DESC"
        }else if(filter == "disliked" && req.appSettings["playlist_dislike"]){
            isValid = true
            data.orderby = "dislike_count DESC"
        }else if(filter == "rated" && req.appSettings["playlist_rating"]){
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
            await playlistModel.getPlaylists(req,data).then(result => {
                let pagging = false
                if(result.length > data.limit - 1){
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                response = {
                    pagging:pagging,
                    playlists:result
                }
                res.send(response)
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
                    audios:result
                }
                res.send(response)
            })
        }
    }
    }else if(type == "members"){
        if(!filter){
            filter = "my_subscribed"
        }
        
        if(filter == "my_subscribed"){
            isValid = true
            data.mySubscribed = 1
            data.customSearch = true
        }else if(filter == "my_rated" && req.appSettings["member_rating"]){
            isValid = true
            data.customSearch = true
            data.myrated = 1
        }else if(filter == "my_recent"){
            isValid = true
            data.recentlyViewed = 1
            data.customSearch = true
        }else if(filter == "my_favourited" && req.appSettings["member_favourite"]){
            isValid = true
            data.myfav = 1
            data.customSearch = true
        }else if(filter == "my_commented" && req.appSettings["member_comment"]){
            isValid = true
            data.mycommented = 1
            data.customSearch = true
        }else if(filter == "my_liked" && req.appSettings["member_like"]){
            isValid = true
            data.mylike = 1
            data.customSearch = true
        }else if(filter == "my_disliked" && req.appSettings["member_like"]){
            isValid = true
            data.mydislike = 1
            data.customSearch = true
        }else if(filter == "subscribed"){
            isValid = true
            data.iSubscribed = 1
            data.customSearch = true
        }
        if(isValid){
            data.limit = 13
            let page = 1
            if(req.body.page == ''){
                    page = 1;
            }else{
                //parse int Convert String to number 
                    page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
            }
            
            data.offset = (page - 1)*(data.limit - 1)
            await userModel.getMembers(req,data).then(result => {
                let pagging = false
                if(result.length > data.limit - 1){
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                response = {
                    pagging:pagging,
                    members:result
                }
                res.send(response)
            })
        }
    }else if(type == "channels"){
        if(req.appSettings["enable_channel"] == 1){
        if(!filter){
            filter = "my"
        }
        if(filter == "my"){
            data.myContent = true
            isValid = true
            req.query.canDelete = false
            req.query.canEdit = false
            await privacyModel.permission(req,'channels','delete',user).then(result => {
                req.query.canDelete = result
            })
            await privacyModel.permission(req,'channels','edit',user).then(result => {
                req.query.canEdit = result
            })
        }else if(filter == "my_recent"){
            isValid = true
            data.recentlyViewed = 1
            data.customSearch = true
            data.myCustom = 1
        }else if(filter == "my_rated" && req.appSettings["channel_rating"]){
            isValid = true
            data.myCustom = 1
            data.myrated = 1
            data.customSearch = true
        }else if(filter == "my_favourited" && req.appSettings["channel_favourite"]){
            isValid = true
            data.myCustom = 1
            data.myfav = 1
            data.customSearch = true
        }else if(filter == "my_commented" && req.appSettings["channel_comment"]){
            isValid = true
            data.myCustom = 1
            data.mycommented = 1
            data.customSearch = true
        }else if(filter == "my_liked" && req.appSettings["channel_like"]){
            isValid = true
            data.myCustom = 1
            data.mylike = 1
            data.customSearch = true
        }else if(filter == "my_disliked" && req.appSettings["channel_dislike"]){
            isValid = true
            data.myCustom = 1
            data.mydislike = 1
            data.customSearch = true
        }else if(filter == "viewed"){
            isValid = true
            data.orderby = "view_count DESC"
        }else if(filter == "my_subscribed"){
            isValid = true
            data.customSearch = true
            data.mySubscribed = 1
        }else if(filter == "favourited" && req.appSettings["channel_favourite"]){
            isValid = true
            data.orderby = "favourite_count DESC"
        }else if(filter == "liked" && req.appSettings["channel_like"]){
            isValid = true
            data.orderby = "like_count DESC"
        }else if(filter == "disliked" && req.appSettings["channel_dislike"]){
            isValid = true
            data.orderby = "dislike_count DESC"
        }else if(filter == "rated" && req.appSettings["channel_rating"]){
            isValid = true
            data.orderby = "rating DESC"
        }else if(filter == "subscribed"){
            data.customSearch = true
            isValid = true
            data.iSubscribed = 1
        }
        if(isValid){
            data.limit = 13
            let page = 1
            if(req.body.page == ''){
                    page = 1;
            }else{
                //parse int Convert String to number 
                    page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
            }
            
            data.offset = (page - 1)*(data.limit - 1)
            await channelModel.getChannels(req,data).then(result => {
                let pagging = false
                if(result.length > data.limit - 1){
                    result = result.splice(0, data.limit - 1);
                    pagging = true
                }
                response = {
                    pagging:pagging,
                    channels:result
                }
                res.send(response)
            })
        }
    }
    }else if(type == "ads"){
        isValid = true
        let queryString = req.query
        let searchData = {}
        if (queryString.title) {
            data['title'] = queryString.title
        }
        if (queryString.name) {
            data['name'] = queryString.name
        }
        if (queryString.category_id) {
            data['category_id'] = queryString.category_id
        }
        if (queryString.subcategory_id) {
            data['subcategory_id'] = queryString.subcategory_id
        }
        if (queryString.subsubcategory_id) {
            data['subsubcategory_id'] = queryString.subsubcategory_id
        }
        if (queryString.status) {
            data['status'] = queryString.status
        }
        if (queryString.adult) {
            data['adult'] = queryString.adult
        }
        if (queryString.approve) {
            data['approve'] = queryString.approve
        }
        
        
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
                res.send( {
                    pagging: pagging,
                    ads: result
                })

            })
        }

    }else if(type == "purchases"){
        isValid = true
        let LimitNum = 13;
        let page = 1
        if (req.body.page == '') {
            page = 1;
        } else {
            //parse int Convert String to number 
            page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
        }
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
                res.send({
                    pagging: pagging,
                    results: result
                })
            }
        })
    }else if(type == "earning"){
        const commonFunction = require("../../functions/commonFunctions")
        await commonFunction.getGeneralInfo(req, res, 'dashboard')
        const privacyLevelModel = require("../../models/levelPermissions")
        
        let canSell = false
        //check package enable
            await privacyLevelModel.findBykey(req,"video",'sell_videos',user.level_id).then(result => {
                if(result == 1){
                    canSell = result
                }
            })
        
        if(canSell){
            if(req.body.type){
                //video earning
                let data = {}
                const videoTransaction = require("../../models/videoTransactions")
                await videoTransaction.getStats(req,{criteria:req.body.type,user:user}).then(result => {
                    if(result){
                        data.videosEarning = result.spent
                        data.xaxis = result.xaxis
                        data.yaxis = result.yaxis
                    }
                }).catch(err => {
                    console.log(err)
                })

                //channel support earning
                const channelSupportTransaction = require("../../models/channels")
                await channelSupportTransaction.getSupportStats(req,{criteria:req.body.type,user:user}).then(result => {
                    if(result){
                        data.channelSupportEarning = result.spent
                        data.xaxis = result.xaxis
                        data.yaxis = result.yaxis
                    }
                }).catch(err => {
                    console.log(err)
                })

                //video tip earning
                await videoTransaction.getStats(req,{criteria:req.body.type,user:user,type:"video_tip"}).then(result => {
                    if(result){
                        data.videosTipEarning = result.spent
                        data.xaxis = result.xaxis
                        data.yaxis = result.yaxis
                    }
                }).catch(err => {
                    console.log(err)
                })

                //ads earning
                const videoMonetizationModel = require("../../models/videoMonetizations")
                await videoMonetizationModel.getStats(req,{criteria:req.body.type,user:user}).then(result => {
                    if(result){
                        data.adsEarning = result.spent
                        data.xaxis = result.xaxis
                        data.yaxis = result.yaxis
                    }
                }).catch(err => {
                    console.log(err)
                })
                return res.send(
                    {
                        stats:data
                    }
                )
            }

            isValid = true   
            let LimitNum = 21;
            let page = 1
            if (req.body.page == '') {
                page = 1;
            } else {
                //parse int Convert String to number 
                page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
            }
            let offset = (page - 1) * (LimitNum - 1)         
            const earningModel = require("../../models/earning")
            await earningModel.findAll(req,{user_id:user.user_id,limit:LimitNum,offset:offset}).then(result => {
                let pagging = false
                if (result) {
                    pagging = false
                    if (result.length > LimitNum - 1) {
                        result = result.splice(0, LimitNum - 1);
                        pagging = true
                    }
                    res.send({
                        pagging: pagging,
                        items: result
                    })
                }
            })
        }

    }

    if(!isValid){
        res.send({})
    }
    
    
}