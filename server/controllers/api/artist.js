const artistModel = require("../../models/artists")
const channelModel = require("../../models/channels")
const videoModel = require("../../models/videos")

exports.photos = async(req,res) =>{
    let LimitNum = 13;
    let page = 1
    if(req.body.page == ''){
         page = 1;
    }else{
        //parse int Convert String to number 
         page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
     photos = {
         pagging:false,
         result:[]
     }
     let data = {}
     data.limit = LimitNum
     let offset = (page - 1)*(LimitNum - 1)
     data.offset = offset
     data.artist_id = req.body.artist_id
    //get artists
    await artistModel.getPhotos(req,data).then(result => {
        let pagging = false
        if(result){
            pagging = false
            if(result.length > LimitNum - 1){
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            photos = {
                'pagging':pagging,
                results:result
            }
        }
    })
    res.send(photos)
}

exports.view = async(req,res) => {
    const custom_url = req.body.id
    let artist = {}
    await artistModel.findByCustomUrl(custom_url,req,res).then(result => {
        if(result)
            artist = result
        else{
            res.send({})
            return
        }
    }).catch(error => {
        res.send({})
        return
    })
        
    let limit = 13;
    let page = 1
    if(req.body.page == ''){
         page = 1;
    }else{
        //parse int Convert String to number 
         page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    
    let offset = (page - 1)*(limit - 1)
     
     let data = {}
     data.limit = limit
     data.offset = offset
     data.artist_id = artist.artist_id

     if(artist.type == "video"){
        await videoModel.getVideos(req,data).then(result => {
            let pagging = false
            if(result){
                let items = result
                if(result.length > limit - 1){
                    items = result.splice(0, limit - 1);
                    pagging = true
                }
                res.send({pagging:pagging,items:items})
                return
            }
        })
     }else{
        await channelModel.getChannels(req,data).then(result => {
            let pagging = false
            if(result){
                let items = result
                if(result.length > limit - 1){
                    items = result.splice(0, limit - 1);
                    pagging = true
                }
                res.send({pagging:pagging,items:items})
                return
            }
        })
     }
     if(!res.headersSent)
        res.send({})
}

exports.browse = async(req,res) => {
    const artistType = req.body.type
    const queryString = req.query    
    
    
    const limit = 17
    let page = 1
    if(req.body.page == ''){
        page = 1;
    }else{
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1)*(limit-1)
    const data = {}
    data.artistType = artistType
    data['type'] = queryString.type
    if(queryString.q && !queryString.tag){
        data['title'] = queryString.q
    }
    
    if(queryString.sort == "latest"){
        data['orderby'] = "artists.artist_id desc"
    }else if(queryString.sort == "favourite"){
        data['orderby'] = "artists.favourite_count desc"
    }else if(queryString.sort == "view"){
        data['orderby'] = "artists.view_count desc"
    }else if(queryString.sort == "like" ){
        data['orderby'] = "artists.like_count desc"
    }else if(queryString.sort == "dislike" ){
        data['orderby'] = "artists.dislike_count desc"
    }else if(queryString.sort == "rated"){
        data['orderby'] = "artists.rating desc"
    }else if(queryString.sort == "commented" ){
        data['orderby'] = "artists.comment_count desc"
    }
    
    if(queryString.type == "featured" ){
        data['is_featured'] = 1
    }else if(queryString.type == "sponsored" ){
        data['is_sponsored'] = 1
    }else if(queryString.type == "hot"){
        data['is_hot'] = 1
    }
    
    //get all channels as per categories
    await artistModel.findByIds(false,req,res,limit,offset,data).then(result => {
        let items = []
        let pagging = false
        if(result){
             items = result
            if(result.length > limit - 1){
                items = result.splice(0, limit - 1);
                pagging = true
            }
        }
        res.send({artists: items,pagging:pagging})
    }).catch(err => {
        
    })
    if(!res.headersSent)
    res.send({})
}

