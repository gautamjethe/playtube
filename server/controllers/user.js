const commonFunction = require("../functions/commonFunctions")
const privacyModel = require("../models/privacy")
const userModel = require("../models/users")
const likeModel = require("../models/likes")
const favouriteModel = require("../models/favourites")
const videoModel = require("../models/videos")
const channelModel = require("../models/channels")
const playlistModel = require("../models/playlists")
const blogModel = require("../models/blogs")
const audioModel = require("../models/audio")
const recentlyViewed = require("../models/recentlyViewed")
const dateTime = require("node-datetime")


exports.browse = async (req, res) => {

    const queryString = req.query
    await commonFunction.getGeneralInfo(req, res, 'member_browse')

    const limit = 13
    const data = {}
    req.query.search = {}
    data['type'] = queryString.type
    if (queryString.q && !queryString.tag) {
        req.query.search.q = queryString.q
        data['title'] = queryString.q
    }

    if (queryString.sort == "latest") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "users.user_id desc"
    } else if (queryString.sort == "favourite" && req.appSettings['member_favourite'] == 1) {
        req.query.search.sort = queryString.sort
        data['orderby'] = "userdetails.favourite_count desc"
    } else if (queryString.sort == "view") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "userdetails.view_count desc"
    } else if (queryString.sort == "like" && req.appSettings['member_like'] == "1") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "userdetails.like_count desc"
    } else if (queryString.sort == "dislike" && req.appSettings['member_dislike'] == "1") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "userdetails.dislike_count desc"
    } else if (queryString.sort == "rated" && req.appSettings['member_rating'] == "1") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "userdetails.rating desc"
    } else if (queryString.sort == "commented" && req.appSettings['member_comment'] == "1") {
        req.query.search.sort = queryString.sort
        data['orderby'] = "userdetails.comment_count desc"
    }

    if (queryString.type == "featured" && req.appSettings['member_featured'] == 1) {
        req.query.search.type = queryString.type
        data['is_featured'] = 1
    } else if (queryString.type == "sponsored" && req.appSettings['member_sponsored'] == 1) {
        req.query.search.type = queryString.type
        data['is_sponsored'] = 1
    } else if (queryString.type == "hot" && req.appSettings['member_hot'] == 1) {
        req.query.search.type = queryString.type
        data['is_hot'] = 1
    }
    //get all members
    await userModel.getMembers(req, data).then(result => {
        let members = []
        if (result) {
            req.query.pagging = false
            members = result
            if (result.length > limit - 1) {
                members = result.splice(0, limit - 1);
                req.query.pagging = true
            }
        }
        req.query.members = members
    }).catch(err => {
        console.log(err)
    })

    if (req.query.data) {
        res.send({ data: req.query })
        return
    }

    req.app.render(req, res, '/members', req.query);
}

exports.view = async (req, res, next) => {
    const custom_url = req.params.id
    
    let member = {}
    await userModel.findByUsername(custom_url, req, res).then(result => {
        if (result)
            member = result
    }).catch(error => {
        if (req.query.data) {
            res.send({data: req.query,pagenotfound:1});
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    })
    if (Object.keys(member).length) {
        await commonFunction.getGeneralInfo(req, res, 'member_view')
        await commonFunction.updateMetaData(req,{title:member.displayname,description:member.about,image:member.avtar})
        let LimitNum = 13;
        let members = {
            pagging: false,
            result: []
        }
        let data = {}
        data.limit = LimitNum
        data.owner_id = member.user_id
        //get videos
        await videoModel.getVideos(req, data).then(result => {
            let pagging = false
            if (result) {
                pagging = false
                if (result.length > LimitNum - 1) {
                    result = result.splice(0, LimitNum - 1);
                    pagging = true
                }
                req.query.videos = {
                    'pagging': pagging,
                    results: result
                }
            }
        })
        if (req.appSettings["enable_channel"] == 1) {
            //get channels
            await channelModel.getChannels(req, data).then(result => {
                let pagging = false
                if (result) {
                    pagging = false
                    if (result.length > LimitNum - 1) {
                        result = result.splice(0, LimitNum - 1);
                        pagging = true
                    }
                    req.query.channels = {
                        'pagging': pagging,
                        results: result
                    }
                }
            })
        }
        if (req.appSettings["enable_playlist"] == 1) {
            //get playlists
            let dataPlaylist = data
            dataPlaylist['limit'] = 17
            await playlistModel.getPlaylists(req, dataPlaylist).then(result => {
                let pagging = false
                if (result) {
                    pagging = false
                    if (result.length > dataPlaylist['limit'] - 1) {
                        result = result.splice(0, dataPlaylist['limit'] - 1);
                        pagging = true
                    }
                    req.query.playlists = {
                        'pagging': pagging,
                        results: result
                    }
                }
            })
        }
        if (req.appSettings["enable_blog"] == 1) {
            //get blogs
            LimitNum = 17
            await blogModel.getBlogs(req, { limit: LimitNum, owner_id: member.user_id }).then(result => {
                let pagging = false
                if (result) {
                    pagging = false
                    if (result.length > LimitNum - 1) {
                        result = result.splice(0, LimitNum - 1);
                        pagging = true
                    }
                    req.query.blogs = {
                        'pagging': pagging,
                        results: result
                    }
                }
            })
        }
        if (req.appSettings["enable_audio"] == 1) {
            //get audio
            await audioModel.getAudios(req, { limit: LimitNum, owner_id: member.user_id }).then(result => {
                let pagging = false
                if (result) {
                    pagging = false
                    if (result.length > LimitNum - 1) {
                        result = result.splice(0, LimitNum - 1);
                        pagging = true
                    }
                    req.query.audio = {
                        'pagging': pagging,
                        results: result
                    }
                }
            })
        }
        
        if (req.user) {
            await likeModel.isLiked(member.user_id, 'members', req, res).then(result => {
                if (result) {
                    member.like_dislike = result.like_dislike
                }
            })

            //favourite
            await favouriteModel.isFavourite(member.user_id, 'members', req, res).then(result => {
                if (result) {
                    member['favourite_id'] = result.favourite_id
                }
            })
        }
        await privacyModel.permission(req, 'member', 'delete', member).then(result => {
            member.canDelete = result
        })
        await privacyModel.permission(req, 'member', 'edit', member).then(result => {
            member.canEdit = result
        })
        req.query.member = member
        recentlyViewed.insert(req, { id: member.user_id, owner_id: member.user_id, type: 'members', creation_date: dateTime.create().format("Y-m-d H:M:S") })
        req.query.memberId = custom_url
        if (req.query.data) {
            res.send({ data: req.query })
            return
        }
        req.app.render(req, res, '/member', req.query);
    } else {
        next()
    }
}
