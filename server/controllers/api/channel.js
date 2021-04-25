const { validationResult } = require('express-validator'),
    fieldErrors = require('../../functions/error'),
    errorCodes = require("../../functions/statusCodes"),
    constant = require("../../functions/constant"),
    globalModel = require("../../models/globalModel"),
    commonFunction = require("../../functions/commonFunctions"),
    dateTime = require('node-datetime'),
    uniqid = require('uniqid'),
    channelModel = require("../../models/channels"),
    socketio = require("../../socket"),
    channelVideosModel = require("../../models/channelvideos"),
    channelPLaylistModel = require("../../models/channelPlaylists"),
    artistModel = require("../../models/artists"),
    async = require('async'),
    playlists = require("../../models/playlists"),
    privacyModel = require("../../models/privacy"),
    notificationModel = require("../../models/notifications"),
    categoryModel = require("../../models/categories"),
    {readS3Image} = require('../../functions/upload');

exports.delete = async (req, res) => {
    if (!req.item) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.invalid }).end();
    }
    
    await channelModel.delete(req.item.channel_id, req).then(result => {
        if (result) {
            commonFunction.deleteImage(req, res, "", "channel", req.item)
            socketio.getIO().emit('channelDeleted', {
                "channel_id": req.item.channel_id,
                "message": constant.channel.DELETED,
            });
        }
    })

    res.send({})

}
exports.deletePost = async(req,res) => {
    if (!req.item) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.invalid }).end();
    }
    let post = {}
    await channelModel.findAllCommunity(0, req, res,1,0,req.body.id).then(result => {
        if (result && result.length > 0)
            post = result[0]
    }).catch(error => {
        
    })
    await channelModel.deletePost(post.post_id, req).then(result => {
        if (result) {
            commonFunction.deleteImage(req, res, "", "post", post)
            socketio.getIO().emit('communityDeleted', {
                "post_id": post.post_id,
                "message": constant.channel.POSTDELETED,
            });
        }
    })

    res.send({})
}
exports.category = async (req, res) => {
    req.query.categoryId = req.params.id
    req.query.type = "channel"
    let category = {}
    let send = false
    let limit = 13;
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (limit - 1)
    await categoryModel.findByCustomUrl({ id: req.query.categoryId, type: req.query.type }, req, res).then(async result => {
        if (result) {
            category = result
            const data = { limit: limit, offset: offset }
            if (category.subcategory_id == 0 && category.subsubcategory_id == 0) {
                data['category_id'] = category.category_id
            } else if (category.subcategory_id > 0) {
                data['subcategory_id'] = category.category_id
            } else if (category.subsubcategory_id > 0) {
                data['subsubcategory_id'] = category.category_id
            }
            //get all blogs as per categories
            await channelModel.getChannels(req, data).then(result => {
                if (result) {
                    let pagging = false
                    let items = result
                    if (result.length > limit - 1) {
                        items = result.splice(0, limit - 1);
                        pagging = true
                    }
                    send = true
                    res.send({ pagging: pagging, items: items })
                }
            })
        }
    }).catch(error => {
        res.send({ pagging: false, items: [] })
        return
    })
    if (!send)
        res.send({ pagging: false, items: [] })
}

exports.createpost = async (req, res) => {
    
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    const channel_id = req.body.channel_id
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }
    // all set now
    let insertObject = {} 
    let postID = req.body.post_id
    let postObject = {}
    if (parseInt(postID) > 0) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM channel_posts WHERE post_id = ?", postID).then(async result => {
            if (result) {
                postObject = JSON.parse(JSON.stringify(result))[0];
                await privacyModel.permission(req, 'channel', 'edit', {owner_id:postObject.owner_id}).then(result => {
                    if(!result){
                        postID = null
                        postObject = null
                    }
                }).catch(err => {
                    postID = null
                })
            }
        }).catch(err => {
            postID = null
        })
    } else {
        insertObject["channel_id"] = channel_id
        insertObject["owner_id"] = req.user.user_id;
    } 
    insertObject["title"] = req.body.title
    
    if (req.fileName) {
        insertObject['image'] = "/upload/images/posts/" + req.fileName;
        if(Object.keys(postObject).length && postObject.image)
            commonFunction.deleteImage(req, res, postObject.image, 'post/image');
    }else if(!req.body.image){
        insertObject['image'] = "";
        if(Object.keys(postObject).length && postObject.image)
            commonFunction.deleteImage(req, res, postObject.image, 'post/image');
    }
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    if (!postID) {
        insertObject["creation_date"] = formatted
    }

    if (postID) {
        //update existing post
        await globalModel.update(req, insertObject, "channel_posts", 'post_id', postID).then(async result => {
            let postData = {}
            await channelModel.findAllCommunity(0, req, res,1,0,postID).then(result => {
                if (result && result.length > 0)
                    postData = result[0]
            }).catch(error => {
                
            })
            socketio.getIO().emit('communityEdited', {
                "post_id": postID,
                postData: postData
            });
            res.send({  message: constant.channel.POSTEDITED});
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    } else {
        //create new post
        await globalModel.create(req, insertObject, "channel_posts").then(async result => {
            if (result) {
                let postData = {}
                await channelModel.findAllCommunity(0, req, res,1,0,result.insertId).then(result => {
                    if (result && result.length > 0)
                        postData = result[0]
                }).catch(error => {
                    
                })
                socketio.getIO().emit('communityAdded', {
                    "channel_id":channel_id,
                    postData: postData
                });
                res.send({  message: constant.channel.POSTCREATED,postData:postData });
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }
}
exports.posts = async(req,res) => {
    
    let LimitNum = 11;
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (LimitNum - 1)
    let channel_id = req.body.channel_id
    let send = false
    await channelModel.findAllCommunity(channel_id, req, res, LimitNum, offset).then(result => {
        if (result && result.length > 0) {
            send = true
            let pagging = false
            if (result.length > 10) {
                result = result.splice(0, 10);
                pagging = true
            }
            return res.send({ pagging: pagging, posts: result })
        }
    }).catch(error => {

    })
    if (!send)
        res.send({ pagging: false, posts: [] })
}

exports.browse = async (req, res) => {
    const queryString = req.query
    const limit = 13
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (limit - 1)
    const data = { limit: limit, offset: offset }
    data['type'] = queryString.type
    if (queryString.q && !queryString.tag) {
        data['title'] = queryString.q
    }
    if (queryString.type) {
        data['tags'] = queryString.tag
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
    if (queryString.sort == "latest") {
        data['orderby'] = "channels.channel_id desc"
    } else if (queryString.sort == "favourite" && req.appSettings['channel_favourite'] == 1) {
        data['orderby'] = "channels.favourite_count desc"
    } else if (queryString.sort == "view") {
        data['orderby'] = "channels.view_count desc"
    } else if (queryString.sort == "like" && req.appSettings['channel_like'] == "1") {
        data['orderby'] = "channels.like_count desc"
    } else if (queryString.sort == "dislike" && req.appSettings['channel_dislike'] == "1") {
        data['orderby'] = "channels.dislike_count desc"
    } else if (queryString.sort == "rated" && req.appSettings['channel_rating'] == "1") {
        data['orderby'] = "channels.rating desc"
    } else if (queryString.sort == "commented" && req.appSettings['channel_comment'] == "1") {
        data['orderby'] = "channels.comment_count desc"
    }

    if (queryString.type == "featured" && req.appSettings['channel_featured'] == 1) {
        data['is_featured'] = 1
    } else if (queryString.type == "sponsored" && req.appSettings['channel_sponsored'] == 1) {
        data['is_sponsored'] = 1
    } else if (queryString.type == "hot" && req.appSettings['channel_hot'] == 1) {
        data['is_hot'] = 1
    }
    //get all channels as per categories
    await channelModel.getChannels(req, data).then(result => {
        if (result) {
            let pagging = false
            let items = result
            if (result.length > limit - 1) {
                items = result.splice(0, limit - 1);
                pagging = true
            }
            res.send({ channels: items, pagging: pagging })
        }
    }).catch(err => {
        res.send({})
    })
}
exports.repositionCover = async (req, res) => {
    const channel_id = req.body.channel_id
    if (channel_id) {
        channelModel.findById(channel_id, req, res).then(async channel => {
            if (channel) {
                if (channel.cover) {
                    const path = require("path")
                    const imageName = "resize_"+uniqid.process('c')+path.basename(channel.cover)
                    let image = channel.cover;
                    if (req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi") {
                        //image = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com"+image;
                        const imageS = req.serverDirectoryPath
                        const newimage = imageS+"/public/upload/"+imageName
                        await readS3Image(req,channel.cover,newimage).then(result => {
                            image = result
                        }).catch(err => {
                            
                        })
                    }else{
                        image = req.serverDirectoryPath+"/public"+channel.cover
                    }
                    let data = {}
                    data['type'] = "channels"
                    data['imageName'] = imageName
                    data['y'] = Math.abs(req.body.position)
                    data['path'] = "/upload/images/cover/channels/"+data.imageName
                    data['screenWidth'] = req.body.screenWidth ? req.body.screenWidth : 1200
                    const coverReposition = require("../../functions/coverCrop")
                     coverReposition.crop(req,data,image).then(result => {
                        if(result){
                            globalModel.update(req, { cover_crop: data['path'] }, "channels", 'channel_id', channel_id).then(result => {
                                if (channel.cover_crop) {
                                    commonFunction.deleteImage(req, res, channel.cover_crop, 'channel/cover');
                                }                              
                                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                                    const fs = require("fs")
                                    fs.unlink(image, function (err) {
                                       
                                    });
                                }
                                socketio.getIO().emit('channelCoverReposition', {
                                    "channel_id": channel_id,
                                    "message": constant.channel.COVERREPOSITION,
                                    image: data['path']
                                });
                            });
                        }
                    }).catch(err => {
                        console.log(err,'Reposition image errror')
                    })
                }
            }
        })
    }
    res.send({})
}
exports.uploadCover = async (req, res) => {
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }

    const channel_id = req.body.channel_id

    if (channel_id) {
        channelModel.findById(channel_id, req, res).then(channel => {
            if (channel) {
                if (req.fileName) {
                    let image = ""
                    let cover = ""
                    if (req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi") {
                        image = "/upload/images/cover/channels/" + req.originalUrl;
                        cover_crop = "/upload/images/cover/channels/" + req.fileName;
                   }else{
                        image = "/" + req.originalUrl;
                        cover_crop = "/" + req.fileName;
                   }
                    globalModel.update(req, { cover: image,cover_crop:cover_crop }, "channels", 'channel_id', channel_id).then(result => {
                        if (channel.channelcover) {
                            commonFunction.deleteImage(req, res, channel.cover, 'channel/cover');
                        }
                        if (channel.cover_crop) {
                            commonFunction.deleteImage(req, res, channel.cover_crop, 'channel/covercrop');
                        }
                        socketio.getIO().emit('channelCoverUpdated', {
                            "channel_id": channel_id,
                            "message": constant.channel.COVERUPLOADED,
                            cover_crop:cover_crop,
                            image: image
                        });
                    });

                }
            }
        })
    }
    res.send({})
}
exports.uploadMainPhoto = async (req, res) => {
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }

    const channel_id = req.body.channel_id

    if (channel_id) {
        channelModel.findById(channel_id, req, res).then(channel => {
            if (channel) {
                if (req.fileName) {
                    let image = "/upload/images/channels/" + req.fileName;

                    globalModel.update(req, { image: image }, "channels", 'channel_id', channel_id).then(result => {
                        if (channel.channelimage) {
                            commonFunction.deleteImage(req, res, channel.image, 'channel/image');
                        }
                        socketio.getIO().emit('channelMainPhotoUpdated', {
                            "channel_id": channel_id,
                            "message": constant.channel.MAINPHOTOUPLOADED,
                            image: image
                        });
                    });

                }
            }
        })
    }
    res.send({})
}
exports.deletePlaylist = async (req, res) => {
    const channel_id = req.body.channel_id
    const playlist_id = req.body.playlist_id
    if (channel_id || playlist_id) {
        await channelModel.findById(channel_id, req, res).then(async result => {
            if (result) {
                privacyModel.permission(req, 'channel', 'delete', result).then(result => {
                    if (result) {
                        globalModel.custom(req, "DELETE FROM channelplaylists WHERE channel_id = ? AND playlist_id = ?", [channel_id, playlist_id]).then(result => {
                            socketio.getIO().emit('channelPlaylistDeleted', {
                                "channel_id": channel_id,
                                "playlist_id": playlist_id,
                                "message": constant.channel.PLAYLISTDELETED,
                            });
                        })
                    }
                })
            }
        })
    }

    res.send({})
}
exports.deleteVideo = async (req, res) => {
    const channel_id = req.body.channel_id
    const video_id = req.body.video_id
    if (channel_id || video_id) {
        await channelModel.findById(channel_id, req, res).then(async result => {
            if (result) {
                privacyModel.permission(req, 'channel', 'delete', result).then(result => {
                    if (result) {
                        globalModel.custom(req, "DELETE FROM channelvideos WHERE channel_id = ? AND video_id = ?", [channel_id, video_id]).then(result => {
                            globalModel.custom(req,"UPDATE channels SET total_videos = total_videos - 1  WHERE channel_id = "+channel_id).then(result => {
                                
                            })
                            socketio.getIO().emit('channelVideoDeleted', {
                                "channel_id": channel_id,
                                "video_id": video_id,
                                "message": constant.channel.VIDEODELETED,
                            });
                        })
                    }
                })
            }
        })
    }

    res.send({})
}

exports.getPopupPlaylist = async (req, res) => {
    const criteria = req.body.criteria
    const value = req.body.value

    let LimitNum = 13;
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (LimitNum - 1)

    const data = {}
    if (criteria == "search") {
        data.title = value
    } else if (criteria == "my") {
        data.owner_id = req.user.user_id
    } else if (criteria == "url") {
        var final = value.substr(value.lastIndexOf('/') + 1);
        data.custom_url = final
    }
    if (req.body.channel_id) {
        data.channel_id = req.body.channel_id
    }
    data.limit = LimitNum
    data.offset = offset
    let send = false
    await playlists.getPlaylists(req, data).then(result => {
        if (result && result.length > 0) {
            send = true
            let pagging = false
            if (result.length > 10) {
                result = result.splice(0, 10);
                pagging = true
            }
            return res.send({ pagging: pagging, playlists: result })
        }
    }).catch(error => {

    })
    if (!send)
        res.send({ pagging: false, playlists: [] })
}
exports.addPlaylists = async (req, res) => {
    const channel_id = req.body.channel_id
    const playlists_ids = req.body.selectedPlaylists
    //insert videos
    if (playlists_ids) {
        await exports.insertPlaylists(req, playlists_ids, channel_id).then(result => {
            if (result) {
                notificationModel.insertFollowNotifications(req,{subject_type:"channels",subject_id:channel_id,object_type:"playlists",object_id:playlists_ids.split(',')[0],type:"channels_followed"}).then(result => {

                }).catch(err => {

                })
                socketio.getIO().emit('playlistAdded', {
                    "channel_id": channel_id,
                    "message": constant.channel.PLAYLISTADDED
                });
            }
        })
    }
    res.send({})
}
exports.insertPlaylists = async (req, playlists_ids, channel_id) => {
    return new Promise(function (resolve, reject) {
        const ids = playlists_ids.split(',')
        async.forEachOf(ids, async function (playlist_id, i, callback) {
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            const channelPlaylistObj = []
            channelPlaylistObj.push(playlist_id)
            channelPlaylistObj.push(channel_id)
            channelPlaylistObj.push(req.user.user_id)
            channelPlaylistObj.push(formatted)
            await channelPLaylistModel.insert(channelPlaylistObj, req, channel_id)
            if(i == ids.length - 1){
                resolve(true)
            }
        }, function (err) {
            if (!err)
                resolve(true)
            else
                resolve(false)
        });
    })
}
exports.insertVideos = async (req, video_ids, channel_id) => {
    return new Promise(function (resolve, reject) {
        const ids = video_ids.split(',')
        async.forEachOf(ids, async function (video_id, i, callback) {
            var dt = dateTime.create()
            var formatted = dt.format('Y-m-d H:M:S')
            const channelVideoObj = []
            channelVideoObj.push(video_id)
            channelVideoObj.push(channel_id)
            channelVideoObj.push(req.user.user_id)
            channelVideoObj.push(formatted)
            await channelVideosModel.insert(channelVideoObj, req, channel_id)
            if(i == ids.length - 1){
                resolve(true)
            }
        }, function (err) {
            if (!err)
                resolve(true)
            else
                resolve(false)
        })
    })
}
exports.addVideos = async (req, res) => {
    const channel_id = req.body.channel_id
    const video_ids = req.body.selectedVideos
    //insert videos
    if (video_ids) {
        await exports.insertVideos(req, video_ids, channel_id).then(result => {
            if (result) {
                notificationModel.insertFollowNotifications(req,{subject_type:"channels",subject_id:channel_id,object_type:"videos",object_id:video_ids.split(',')[0],type:"channels_followed"}).then(result => {

                }).catch(err => {

                })
                socketio.getIO().emit('videoAdded', {
                    "channel_id": channel_id,
                    "message": constant.channel.VIDEOADDED
                });
            }
        })
    }
    res.send({})
}
exports.getArtists = async (req, res) => {
    const channel_id = req.body.channel_id
    if (!channel_id) {
        return res.send({})
    }
    let channel = {}

    await channelModel.findById(req.body.channel_id, req, res).then(result => {
        if (result)
            channel = result
    }).catch(error => {
        return res.send({})
    })
    let LimitNumArtist = 17;
    let pageArtist = 1
    if (req.params.page == '') {
        pageArtist = 1;
    } else {
        //parse int Convert String to number 
        pageArtist = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    let channelData = {}
    let offsetArtist = (pageArtist - 1) * LimitNumArtist
    if (req.appSettings['channel_artists'] == "1") {
        await artistModel.findByIds(channel.artists, req, res, LimitNumArtist, offsetArtist).then(result => {
            let pagging = false
            if (result) {
                pagging = false
                if (result.length > LimitNumArtist - 1) {
                    result = result.splice(0, LimitNumArtist - 1);
                    pagging = true
                }
                channelData = {
                    'pagging': pagging,
                    artists: result
                }
            }
        }).catch(error => {

        })
    } else {
        res.send({})
    }
    res.send(channelData)
}
exports.getSupporters = async(req,res) => {
    const channel_id = req.body.channel_id
    if (!channel_id) {
        return res.send({})
    }

    let LimitNum = 13;
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    let channel = {}
    let offsetArtist = (page - 1) * (LimitNum - 1)
    await channelModel.getChannelSupporters(req,{channel_id:channel_id, limit: LimitNum, offset:offsetArtist}).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            channel = {
                'pagging': pagging,
                members: result
            }
        }
    }).catch(error => {
        console.log(error)
    })

    res.send(channel)

}
exports.getPlaylists = async (req, res) => {
    const channel_id = req.body.channel_id
    if (!channel_id) {
        return res.send({})
    }
    let LimitNum = 13;
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    let offset = (page - 1) * (LimitNum - 1)
    let channel = {}
    await channelPLaylistModel.findAll(channel_id, req, res, LimitNum, offset).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            channel = {
                pagging: pagging,
                playlists: result
            }
        }
    })
    res.send(channel)
}

exports.getVideos = async (req, res) => {
    const channel_id = req.body.channel_id
    if (!channel_id) {
        return res.send({})
    }
    let LimitNum = 13;
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    let offset = (page - 1) * (LimitNum - 1)
    let channel = {}
    await channelVideosModel.findAll(channel_id, req, res, LimitNum, offset).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            channel = {
                pagging: pagging,
                videos: result
            }
        }
    })
    res.send(channel)
}

exports.password = async (req, res) => {
    let password = req.body.password
    let id = req.params.id

    let channel = {}

    await channelModel.findByCustomUrl(id, req, res, true).then(result => {
        if (result)
            channel = result
    }).catch(error => {

    })

    if (channel.password == password) {
        req.session.channel.push(channel.channel_id)
        res.redirect('/channel/' + id + "?data=1")
        return
    }
    return res.send({ error: fieldErrors.errors([{ msg: "Password you entered is not correct." }], true), status: errorCodes.invalid }).end();

}
exports.create = async (req, res) => {
    if (req.quotaLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.channel.QUOTAREACHED }], true), status: errorCodes.invalid }).end();
    }
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    if (req.imageCoverError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageCoverError }], true), status: errorCodes.invalid }).end();
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }
   
    // all set now
    let insertObject = {}

    const channelId = req.body.channelId
    let channelObject = {}
    if (channelId) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM channels WHERE channel_id = ?", channelId).then(async result => {
            if (result && result.length>0) {
                channelObject = JSON.parse(JSON.stringify(result))[0];
                await privacyModel.permission(req, 'channel', 'edit', channelObject).then(result => {
                    if(!result){
                        channelId = null
                        channelObject = null
                    }
                }).catch(err => {
                    channelId = null
                })
            }else{
                channelId = null
            }
        }).catch(err => {

        })
    } else {
        insertObject["owner_id"] = req.user.user_id;
        insertObject["custom_url"] = uniqid.process('c')
    }
    insertObject["title"] = req.body.title
    insertObject["description"] = req.body.description ? req.body.description : ""
    insertObject["category_id"] = req.body.category_id ? req.body.category_id : 0
    insertObject["subcategory_id"] = req.body.subcategory_id ? req.body.subcategory_id : 0
    insertObject["subsubcategory_id"] = req.body.subsubcategory_id ? req.body.subsubcategory_id : 0

    insertObject["adult"] = req.body.adult ? req.body.adult : 0
    insertObject["search"] = req.body.search ? req.body.search : 1
    insertObject["view_privacy"] = req.body.privacy ? req.body.privacy : 'everyone'
    if (insertObject['view_privacy'] == "password" && req.body.password && req.body.password != "") {
        insertObject['password'] = req.body.password
        insertObject['is_locked'] = 1
    } else {
        if (insertObject["view_privacy"] == "password")
            insertObject["view_privacy"] = "everyone"
        insertObject['password'] = ""
        insertObject['is_locked'] = 0
    }

    if(typeof req.body.comments != "undefined"){
        insertObject['autoapprove_comments'] = parseInt(req.body.comments)
    }
    if (req.fileName) {
        insertObject['image'] = "/upload/images/channels/" + req.fileName;
        if(Object.keys(channelObject).length && channelObject.image)
            commonFunction.deleteImage(req, res, channelObject.image, 'channel/image');
    }else if(!req.body.image){
        insertObject['image'] = "";
        if(Object.keys(channelObject).length && channelObject.image)
            commonFunction.deleteImage(req, res, channelObject.image, 'channel/image');
    }
    if (req.fileCoverName) {
        insertObject['cover'] = "/upload/images/channels/cover/" + req.fileCoverName;
    }
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    if (!channelId) {
        insertObject["is_sponsored"] = req.levelPermissions['channel.sponsored'] == "1" ? 1 : 0
        insertObject["is_featured"] = req.levelPermissions['channel.featured'] == "1" ? 1 : 0
        insertObject["is_hot"] = req.levelPermissions['channel.hot'] == "1" ? 1 : 0
        insertObject["verified"] = req.levelPermissions['channel.verified'] == "1" ? 1 : 0
        if (req.levelPermissions["channel.auto_approve"] && req.levelPermissions["channel.auto_approve"] == "1")
            insertObject["approve"] = 1
        else
            insertObject["approve"] = 0

        insertObject["creation_date"] = formatted
    }
    insertObject["modified_date"] = formatted
    let tags = req.body.tags
    let artists = req.body.artists
    if (tags && tags.length > 0)
        insertObject["tags"] = tags
    else {
        insertObject['tags'] = null
    }
    if (artists && artists.length > 0)
        insertObject["artists"] = artists
    else {
        insertObject['artists'] = null
    }
    if(req.body.channel_subscription_amount && parseFloat(req.body.channel_subscription_amount) > 0){
        insertObject['channel_subscription_amount'] = parseFloat(req.body.channel_subscription_amount).toFixed(2)
    }else{
        insertObject['channel_subscription_amount'] = 0;
    }
    if (channelId) {
        //update existing video
        await globalModel.update(req, insertObject, "channels", 'channel_id', channelId).then(async result => {
            
            if (req.body.videos) {
                //insert videos
                req.body.videos.split(',').forEach(async video_id => {
                    const channelVideoObj = []
                    channelVideoObj.push(video_id)
                    channelVideoObj.push(channelId)
                    channelVideoObj.push(req.user.user_id)
                    channelVideoObj.push(formatted)
                    await channelVideosModel.insert(channelVideoObj, req, channelId)
                });
            }
            //update item count in categories if changed
            if (insertObject["category_id"] != channelObject.category_id) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + channelObject["category_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["subcategory_id"] != channelObject.subcategory_id || (insertObject["category_id"] == 0 && channelObject.subcategory_id)) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + channelObject["subcategory_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["subsubcategory_id"] != channelObject.subsubcategory_id || (insertObject["subcategory_id"] == 0 && channelObject.subsubcategory_id)) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + channelObject["subsubcategory_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["category_id"] != channelObject.category_id && insertObject["category_id"] > 0) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["category_id"]).then(result => {
                }).catch(err => { })
                if (insertObject["subcategory_id"] != channelObject.subcategory_id && insertObject["subcategory_id"] > 0) {
                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subcategory_id"]).then(result => {
                    }).catch(err => { })
                    if (insertObject["subsubcategory_id"] != channelObject.subsubcategory_id && insertObject["subsubcategory_id"] > 0) {
                        globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subsubcategory_id"]).then(result => {
                        }).catch(err => { })
                    }
                }
            }
            res.send({ channelId: channelId, message: constant.channel.EDIT, custom_url: channelObject.custom_url });
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    } else {
        //create new video
        await globalModel.create(req, insertObject, "channels").then(async result => {
            if (result) {
                if (req.body.videos) {
                    //insert videos
                    req.body.videos.split(',').forEach(async video_id => {
                        const channelVideoObj = []
                        channelVideoObj.push(video_id)
                        channelVideoObj.push(result.insertId)
                        channelVideoObj.push(req.user.user_id)
                        channelVideoObj.push(formatted)
                        await channelVideosModel.insert(channelVideoObj, req, result.insertId)
                    });
                }
                notificationModel.insertFollowNotifications(req,{subject_type:"users",subject_id:req.user.user_id,object_type:"channels",object_id:result.insertId,type:"members_followed"}).then(result => {

                }).catch(err => {

                })
                if (insertObject["category_id"] != 0) {
                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["category_id"]).then(result => {
                        if (insertObject["subcategory_id"] != 0) {
                            globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subcategory_id"]).then(result => {
                                if (insertObject["subsubcategory_id"] != 0) {
                                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subsubcategory_id"]).then(result => {
                                    }).catch(err => { })
                                }
                            }).catch(err => { })
                        }
                    }).catch(err => { })
                }

                res.send({ channelId: result.insertId, message: constant.channel.SUCCESS, custom_url: insertObject['custom_url'] });
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }
}