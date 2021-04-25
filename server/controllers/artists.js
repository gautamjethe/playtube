const commonFunction = require("../functions/commonFunctions")
const artistModel = require("../models/artists")
const likeModel = require("../models/likes")
const favouriteModel = require("../models/favourites")
const videoModel = require("../models/videos")
const channelModel = require("../models/channels")

exports.browse = async(req,res) => {
    
    const artistType = req.params.type
    const queryString = req.query
    await commonFunction.getGeneralInfo(req,res,artistType+'_artist_browse')
    
    if(artistType == "video" && req.appSettings["video_artists"] == 1){
        
    }else if(artistType == "channel" && req.appSettings["channel_artists"] == 1 && req.appSettings['enable_channel'] == 1){

    }else{
        if (req.query.data) {
            res.send({data: req.query,pagenotfound:1});
            return
        }
        req.app.render(req, res,  '/page-not-found', req.query);
        return
    }
    req.query.artistType = artistType
    const limit = 17
    const data = {}
    data["artistType"] = artistType
    req.query.search = {}
    data['type'] = queryString.type
    if(queryString.q && !queryString.tag){
        req.query.search.q = queryString.q
        data['title'] = queryString.q
    }
    
    if(queryString.sort == "latest"){
        req.query.search.sort = queryString.sort
        data['orderby'] = "artists.artist_id desc"
    }else if(queryString.sort == "favourite" && req.appSettings[artistType+'_artist_favourite'] == 1){
        req.query.search.sort = queryString.sort
        data['orderby'] = "artists.favourite_count desc"
    }else if(queryString.sort == "view"){
        req.query.search.sort = queryString.sort
        data['orderby'] = "artists.view_count desc"
    }else if(queryString.sort == "like" && req.appSettings[artistType+'_artist_like'] == "1"){
        req.query.search.sort = queryString.sort
        data['orderby'] = "artists.like_count desc"
    }else if(queryString.sort == "dislike" && req.appSettings[artistType+'_artist_dislike'] == "1"){
        req.query.search.sort = queryString.sort
        data['orderby'] = "artists.dislike_count desc"
    }else if(queryString.sort == "rated" && req.appSettings[artistType+'_artist_rating'] == "1"){
        req.query.search.sort = queryString.sort
        data['orderby'] = "artists.rating desc"
    }else if(queryString.sort == "commented" && req.appSettings[artistType+'_artist_comment'] == "1"){
        req.query.search.sort = queryString.sort
        data['orderby'] = "artists.comment_count desc"
    }
    
    if(queryString.type == "featured" && req.appSettings[artistType+'_artist_featured'] == 1){
        req.query.search.type = queryString.type
        data['is_featured'] = 1
    }else if(queryString.type == "sponsored" && req.appSettings[artistType+'_artist_sponsored'] == 1){
        req.query.search.type = queryString.type
        data['is_sponsored'] = 1
    }else if(queryString.type == "hot" && req.appSettings[artistType+'_artist_hot'] == 1){
        req.query.search.type = queryString.type
        data['is_hot'] = 1
    }
    
    //get all channels as per categories
    await artistModel.findByIds(false,req,res,limit,false,data).then(result => {
        let items = []
        if(result){
            req.query.pagging = false
             items = result
            if(result.length > limit - 1){
                items = result.splice(0, limit - 1);
                req.query.pagging = true
            }
        }
        req.query.artists = items
    }).catch(() => {

    })
    
    if(req.query.data){
        res.send({data:req.query})
        return
    }
    
    req.app.render(req, res,  '/artists', req.query);
}

exports.view = async (req,res) => {
    const custom_url = req.params.id
    let artist = {}

    await artistModel.findByCustomUrl(custom_url,req,res).then(result => {
        if(result)
            artist = result
        else{
            if (req.query.data) {
                res.send({data: req.query,pagenotfound:1});
                return
            }
            req.app.render(req, res,  '/page-not-found', req.query);
            return
        }
    }).catch(() => {
        if (req.query.data) {
            res.send({data: req.query,pagenotfound:1});
            return 
        }
        req.app.render(req, res,  '/page-not-found', req.query);
        return
    })
    await commonFunction.getGeneralInfo(req,res,artist.type+'_artist_view')
    await commonFunction.updateMetaData(req,{title:artist.title,description:artist.description,image:artist.image})
    
    let artists = {}
    
     let LimitNum = 13;
     let page = 1
     artists = {
         pagging:false,
         result:[]
     }
     let data = {}
     data.limit = LimitNum
     data.artist_id = artist.artist_id

     if(artist.type == "video"){
        await videoModel.getVideos(req,data).then(result => {
            let pagging = false
            if(result){
                pagging = false
                if(result.length > LimitNum - 1){
                    result = result.splice(0, LimitNum - 1);
                    pagging = true
                }
                artists = {
                    'pagging':pagging,
                    results:result
                }
            }
        })
     }else{
        await channelModel.getChannels(req,data).then(result => {
            let pagging = false
            if(result){
                pagging = false
                if(result.length > LimitNum - 1){
                    result = result.splice(0, LimitNum - 1);
                    pagging = true
                }
                artists = {
                    'pagging':pagging,
                    results:result
                }
            }
        })
     }
    
     //get artists
     await artistModel.getPhotos(req,data).then(result => {
        let pagging = false
        if(result){
            pagging = false
            if(result.length > LimitNum - 1){
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            req.query.photos = {
                'pagging':pagging,
                results:result
            }
        }
    })

    if(req.user){
        await likeModel.isLiked(artist.artist_id,'artists',req,res).then(result => {
            if(result){
                artist.like_dislike = result.like_dislike
            }
        })
        
        //favourite
        await favouriteModel.isFavourite(artist.artist_id,'artists',req,res).then(result => {
            if(result){
                artist['favourite_id'] = result.favourite_id
            }
        })
    }
   
    req.query.items = artists
    req.query.artist = artist
    req.query.artistId = artist.custom_url
    
    
    if(req.query.data){
        res.send({data:req.query})
        return
    }
    req.app.render(req, res,  '/artist', req.query);
}
