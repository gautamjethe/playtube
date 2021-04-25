const playlistModel = require("../../models/playlists")
const playlistVideoModel = require("../../models/playlistvideos"),
    dateTime = require('node-datetime'),
    fieldErrors = require('../../functions/error'),
    errorCodes = require("../../functions/statusCodes"),
    constant = require("../../functions/constant"),
    globalModel = require("../../models/globalModel"),
    uniqid = require('uniqid'),
    socketio = require("../../socket"),
    { validationResult } = require('express-validator'),
    commonFunction = require("../../functions/commonFunctions"),
    videoModel = require("../../models/videos"),
    privacyModel = require("../../models/privacy"),
    notificationModel = require("../../models/notifications")


exports.delete = async (req, res) => {
    if (!req.item) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.invalid }).end();
    }

    await playlistModel.delete(req.item.playlist_id, req).then(result => {
        if (result) {
            commonFunction.deleteImage(req, res, "", "playlist", req.item)
            socketio.getIO().emit('playlistDeleted', {
                "playlist_id": req.item.playlist_id,
                "message": constant.playlist.DELETED,
            });
        }
    })
    res.send({})
}
exports.view = async(req,res) => {
    let LimitNum = 13;
    let page = ""
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    let offset = (page - 1) * LimitNum
    let playlist = {}
     playlist = {
        pagging: false,
        items: []
    }
    await videoModel.getVideos(req,{playlist_id:req.body.playlist_id,limit:LimitNum,offset:offset}).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            res.send( {
                'pagging': pagging,
                items: result
            })
        }
    })
    res.send(playlist)
}
exports.browse = async (req, res) => {
    const queryString = req.query
    const limit = 17
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    req.query.search = {}
    let offset = (page - 1) * (limit - 1)
    const data = { limit: limit, offset: offset }
    data['type'] = queryString.type
    if (queryString.q && !queryString.tag) {
        data['title'] = queryString.q
    }
    if (queryString.sort == "latest") {
        data['orderby'] = "playlists.playlist_id desc"
    } else if (queryString.sort == "favourite" && req.appSettings['playlist_favourite'] == 1) {
        data['orderby'] = "playlists.favourite_count desc"
    } else if (queryString.sort == "view") {
        data['orderby'] = "playlists.view_count desc"
    } else if (queryString.sort == "like" && req.appSettings['playlist_like'] == "1") {
        data['orderby'] = "playlists.like_count desc"
    } else if (queryString.sort == "dislike" && req.appSettings['playlist_dislike'] == "1") {
        data['orderby'] = "playlists.dislike_count desc"
    } else if (queryString.sort == "rated" && req.appSettings['playlist_rating'] == "1") {
        data['orderby'] = "playlists.rating desc"
    } else if (queryString.sort == "commented" && req.appSettings['playlist_comment'] == "1") {
        data['orderby'] = "playlists.comment_count desc"
    }

    if (queryString.type == "featured" && req.appSettings['playlist_featured'] == 1) {
        data['is_featured'] = 1
    } else if (queryString.type == "sponsored" && req.appSettings['playlist_sponsored'] == 1) {
        data['is_sponsored'] = 1
    } else if (queryString.type == "hot" && req.appSettings['playlist_hot'] == 1) {
        data['is_hot'] = 1
    }

    //get all playlists
    await playlistModel.getPlaylists(req, data).then(result => {
        if (result) {
            let pagging = false
            let items = result
            if (result.length > limit - 1) {
                items = result.splice(0, limit - 1);
                pagging = true
            }
            res.send({ playlists: items, pagging: pagging })
        }
    }).catch(err => {
        res.send({})
    })

}
exports.getPlaylist = async (req, res, next) => {
    const video_id = req.body.video_id
    let send = false
    await playlistModel.getPlaylist(video_id, req, res).then(result => {
        if (result) {
            send = true
            return res.send({ playlists: result })
        }
    })
    if (!send)
        res.send({ playlists: [] })

}

exports.create = async (req, res) => {
    if (req.quotaLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.playlist.QUOTAREACHED }], true), status: errorCodes.invalid }).end();
    }
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    const video_id = req.body.video_id
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }
    // all set now
    let insertObject = {} 
    let playlistId = req.body.playlist_id
    let playlistObject = {}
    if (parseInt(playlistId) > 0) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM playlists WHERE playlist_id = ?", playlistId).then(async result => {
            if (result) {
                playlistObject = JSON.parse(JSON.stringify(result))[0];
                await privacyModel.permission(req, 'playlist', 'edit', playlistObject).then(result => {
                    if(!result){
                        playlistId = null
                        playlistObject = null
                    }
                }).catch(err => {
                    playlistId = null
                })
            }
        }).catch(err => {
            playlistId = null
        })
    } else {
        insertObject["owner_id"] = req.user.user_id;
        insertObject["custom_url"] = uniqid.process('b')
    } 
    insertObject["title"] = req.body.title
    insertObject["description"] = req.body.description ? req.body.description : ""
    insertObject["adult"] = req.body.adult ? req.body.adult : 0
    insertObject["search"] = req.body.search ? req.body.search : 1
    insertObject["private"] = req.body.private ? req.body.private : '0'
    if(typeof req.body.comments != "undefined"){
        insertObject['autoapprove_comments'] = parseInt(req.body.comments)
    }
    if (req.fileName) {
        insertObject['image'] = "/upload/images/playlists/" + req.fileName;
        if(Object.keys(playlistObject).length && playlistObject.image)
            commonFunction.deleteImage(req, res, playlistObject.image, 'playlist/image');
    }else if(!req.body.image){
        insertObject['image'] = "";
        if(Object.keys(playlistObject).length && playlistObject.image)
            commonFunction.deleteImage(req, res, playlistObject.image, 'playlist/image');
    }
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    if (!playlistId) {
        insertObject["is_sponsored"] = req.levelPermissions['playlist.sponsored'] == "1" ? 1 : 0
        insertObject["is_featured"] = req.levelPermissions['playlist.featured'] == "1" ? 1 : 0
        insertObject["is_hot"] = req.levelPermissions['playlist.hot'] == "1" ? 1 : 0
        if (req.levelPermissions["playlist.auto_approve"] && req.levelPermissions["playlist.auto_approve"] == "1")
            insertObject["approve"] = 1
        else
            insertObject["approve"] = 0
        insertObject["creation_date"] = formatted
    }
    insertObject["modified_date"] = formatted

    if (playlistId) {
        if (parseInt(video_id) > 0) {
            let insertVideoObject = {}
            insertVideoObject.video_id = video_id
            insertVideoObject.creation_date = formatted
            insertVideoObject.playlist_id = playlistId
            playlistVideoModel.insert(insertVideoObject, req, res).then(result => {
                //update video_count
                globalModel.custom(req, "UPDATE playlists SET total_videos = total_videos + 1 WHERE playlist_id = " + playlistId).then(result => {
                }).catch(err => { })
            }).catch(err => {

            })
            return res.send({ playlistId: playlistId, message: constant.playlist.VIDEOSUCCESS, custom_url: playlistObject['custom_url'] });
        }

        //update existing video
        await globalModel.update(req, insertObject, "playlists", 'playlist_id', playlistId).then(async result => {
            res.send({ playlistId: playlistId, message: constant.playlist.EDIT, custom_url: playlistObject.custom_url });
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    } else {
        //create new playlist

        await globalModel.create(req, insertObject, "playlists").then(async result => {
            if (result) {
                if (parseInt(video_id) > 0) {
                    let insertVideoObject = {}
                    insertVideoObject.video_id = video_id
                    insertVideoObject.creation_date = formatted
                    insertVideoObject.playlist_id = result.insertId
                    playlistVideoModel.insert(insertVideoObject, req, res).then(result1 => {
                        globalModel.custom(req, "UPDATE playlists SET total_videos = total_videos + 1 WHERE playlist_id = " + result.insertId).then(result => {
                        }).catch(err => { })
                    }).catch(err => {

                    })
                }
                notificationModel.insertFollowNotifications(req,{subject_type:"users",subject_id:req.user.user_id,object_type:"playlists",object_id:result.insertId,type:"members_followed"}).then(result => {

                }).catch(err => {

                })
                res.send({ playlistId: result.insertId, message: constant.playlist.SUCCESS, custom_url: insertObject['custom_url'] });
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }
}