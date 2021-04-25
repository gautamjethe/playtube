const privacyModel = require("../models/privacy")
const dateTime = require("node-datetime")
const  socketio = require("../socket")
const commonFunction = require("../functions/commonFunctions");
const axios = require("axios")
module.exports = {
    getDefaultTips: function(req,data){
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {

                let condition = []
                let sql = "SELECT * "
                sql += "  FROM defaulttips WHERE 1=1 "
                condition.push(data.user_id)
                sql += " AND user_id = ?"
                if(data.resource_type){
                    condition.push(data.resource_type)
                    sql += " AND resource_type = ?"
                }
                sql += " ORDER BY CAST(amount AS DECIMAL(10,6)) ASC "
                connection.query(sql, condition, function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const result = JSON.parse(JSON.stringify(results));
                        resolve(result);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    getDefaultStreamingData: function(req,data){
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {

                let condition = []
                let sql = "SELECT * "
                sql += "  FROM defaultstreaming WHERE 1=1 "
                condition.push(data.user_id)
                sql += " AND user_id = ?"
                if(data.resource_type){
                    condition.push(data.resource_type)
                    sql += " AND resource_type = ?"
                }
                connection.query(sql, condition, function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const result = JSON.parse(JSON.stringify(results));
                        resolve(result);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    donorsOfTheMonth: function(data,req){
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {

                let condition = []

                let owner_id = 0
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }

                let sql = "SELECT SUM(tip_donors.price) as donatePrice,COUNT(tip_donors.owner_id) as donateCount,followers.follower_id,userdetails.*,likes.like_dislike,favourites.favourite_id,IF(userdetails.avtar IS NULL || userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = CASE WHEN userdetails.gender = 'male' THEN 'default_mainphoto' WHEN userdetails.gender = 'female'  THEN 'default_femalemainphoto' END  AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,IF(userdetails.cover IS NULL OR userdetails.cover = '',(SELECT value FROM `level_permissions` WHERE name = \"default_coverphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.cover) as cover FROM tip_donors LEFT JOIN videos ON videos.video_id = tip_donors.video_id LEFT JOIN users ON users.user_id = videos.owner_id LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN followers on followers.id = users.user_id AND followers.owner_id = " + owner_id + " AND followers.type = 'members' LEFT JOIN likes ON likes.id = users.user_id AND likes.type = 'members'  AND likes.owner_id =  " + owner_id + "  LEFT JOIN favourites ON (favourites.id = users.user_id AND favourites.type = 'members' AND favourites.owner_id = " + owner_id + ") "
                

                sql += " where 1 = 1  AND users.active = 1 AND users.approve = 1 "
                
                if(data.video_id){
                    condition.push(data.video_id)
                    sql += " AND tip_donors.video_id = ?"
                }

                if(data.offthemonth){
                    sql += " AND ( (mediaserver_stream_id IS NOT NULL && mediaserver_stream_id != '') || (channel_name IS NOT NULL && channel_name != '') ) "
                    let currentMonth = dateTime.create().format("m")
                    let currentYear = dateTime.create().format("Y")
                    condition.push(currentMonth)
                    condition.push(currentYear)
                    sql += " AND MONTH(tip_donors.creation_date) = ? AND YEAR(tip_donors.creation_date) = ? "
                }
                sql += " GROUP BY videos.owner_id "

                sql += " ORDER BY tip_donors.price DESC "
                
                if (data.limit) {
                    condition.push(data.limit)
                    sql += " LIMIT ?"
                }

                if (data.offset) {
                    condition.push(data.offset)
                    sql += " OFFSET ?"
                }
                connection.query(sql, condition, function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const result = JSON.parse(JSON.stringify(results));
                        resolve(result);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    donors: function(data,req){
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {

                let condition = []

                let owner_id = 0
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }

                let sql = "SELECT SUM(tip_donors.price) as donatePrice,COUNT(tip_donors.owner_id) as donateCount,followers.follower_id,userdetails.*,likes.like_dislike,favourites.favourite_id,IF(userdetails.avtar IS NULL || userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = CASE WHEN userdetails.gender = 'male' THEN 'default_mainphoto' WHEN userdetails.gender = 'female'  THEN 'default_femalemainphoto' END  AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,IF(userdetails.cover IS NULL OR userdetails.cover = '',(SELECT value FROM `level_permissions` WHERE name = \"default_coverphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.cover) as cover FROM tip_donors LEFT JOIN users ON users.user_id = tip_donors.owner_id LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN followers on followers.id = users.user_id AND followers.owner_id = " + owner_id + " AND followers.type = 'members' LEFT JOIN likes ON likes.id = users.user_id AND likes.type = 'members'  AND likes.owner_id =  " + owner_id + "  LEFT JOIN favourites ON (favourites.id = users.user_id AND favourites.type = 'members' AND favourites.owner_id = " + owner_id + ") "
                if(data.offthemonth){
                    sql += " LEFT JOIN videos ON videos.video_id = tip_donors.video_id "
                }

                sql += " where 1 = 1  AND users.active = 1 AND users.approve = 1 "
                
                if(data.video_id){
                    condition.push(data.video_id)
                    sql += " AND tip_donors.video_id = ?"
                }

                if(data.offthemonth){
                    sql += " AND ( (mediaserver_stream_id IS NOT NULL && mediaserver_stream_id != '') || (channel_name IS NOT NULL && channel_name != '') ) "
                    let currentMonth = dateTime.create().format("m")
                    let currentYear = dateTime.create().format("Y")
                    condition.push(currentMonth)
                    condition.push(currentYear)
                    sql += " AND MONTH(tip_donors.creation_date) = ? AND YEAR(tip_donors.creation_date) = ? "
                }
                sql += " GROUP BY tip_donors.owner_id "

                sql += " ORDER BY tip_donors.price DESC "
                
                if (data.limit) {
                    condition.push(data.limit)
                    sql += " LIMIT ?"
                }

                if (data.offset) {
                    condition.push(data.offset)
                    sql += " OFFSET ?"
                }
                connection.query(sql, condition, function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const result = JSON.parse(JSON.stringify(results));
                        resolve(result);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    getTips: function(req,data){
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {

                let condition = []

                let sql = "SELECT * "

                if(data.view){
                    sql += ', purchase_count as purchaseCount'
                }

                sql += "  FROM tips WHERE 1=1 "

                if(data.resource_type){
                    condition.push(data.resource_type)
                    sql += " AND resource_type = ?"
                }

                if(data.resource_id){
                    condition.push(data.resource_id)
                    sql += " AND resource_id = ?"
                }
                sql += " ORDER BY CAST(amount AS DECIMAL(10,6)) ASC "
                connection.query(sql, condition, function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const result = JSON.parse(JSON.stringify(results));
                        resolve(result);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    leaveLiveStreaming:function(connection,data){
        return new Promise(function (resolve, reject) {
            let customUrl = data.custom_url
            connection.query("UPDATE videos SET total_viewer = total_viewer - 1 WHERE custom_url = ?",[customUrl], function (err, results) {

            })
            socketio.getIO().emit('liveStreamingViewerDelete', {
                "custom_url": customUrl
            }); 
        })
    },
    deleteChatMessage:function(connection,data) {
        return new Promise(function (resolve, reject) {
            connection.query('DELETE from `livestreaming_chats` where chat_id = ?',data.chat_id, function (err, results) {
                if(!err){
                    resolve(true)
                }else{
                    console.log(err)
                    reject(err)
                }
            });
        })
    },
    updateHostLiveTime:function(connection,data){
        let date = dateTime.create().format("Y-m-d H:M:S")
        connection.query("UPDATE videos SET modified_date = ? WHERE custom_url = ?", [date,data.custom_url], function () { })
    },
    createChatMessage:function(connection,data) {
        return new Promise(function (resolve, reject) {
            let insertData = []
            insertData.push(data.message)
            insertData.push(data.user_id)
            insertData.push(data.room ? data.room : data.streamId)
            insertData.push(dateTime.create().format("Y-m-d H:M:S"))
            insertData.push(data.id)
            connection.query('INSERT INTO `livestreaming_chats`( `message`, `owner_id`, `channel`, `creation_date`,`id`) VALUES (?,?,?,?,?)',insertData, function (err, results) {
                if(!err){
                    data.chat_id = results.insertId
                    resolve(data)
                }else{
                    console.log(err)
                    reject(err)
                }
            });
        })
    },
    checkVideoPurchased: function (data, req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT state FROM transactions WHERE (state = "approved" || state = "completed") AND owner_id = ? AND id = ? AND type = "video_purchase"', [parseInt(data.owner_id),parseInt(data.id)], function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    liveStreamingUploadCount : function(req,res,user_id) {
        return new Promise(function (resolve) {
            req.getConnection(function (err, connection) {
                let owner_id = user_id
                if(!owner_id){
                    owner_id = req.user.user_id
                }
                connection.query('SELECT COUNT(*) as totalLiveStreaming FROM videos WHERE is_livestreaming = 1 AND owner_id = ?', [owner_id], function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    findById: function (id, req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM videos WHERE status = 1 AND approve = 1 AND completed = 1 AND video_id = ?', [id], function (err, results) {
                    if (err)
                        resolve(false)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    delete: function (id, req) {
        return new Promise(function (resolve) {
            req.getConnection(function (err, connection) {
                connection.query("SELECT * FROM videos WHERE video_id = ?", [id], function (err, results) {
                    const video = JSON.parse(JSON.stringify(results))[0];
                    connection.query("DELETE FROM videos WHERE video_id = ?", [id], function (err, results) {
                        if (err)
                            resolve(false)
                        if (results) {
                            commonFunction.deleteImage(req,'',"","",video);
                            connection.query("UPDATE channels SET total_videos = total_videos - 1 WHERE channel_id IN (SELECT channel_id FROM channelvideos WHERE video_id = ?)", [id], function () { })
                            connection.query("DELETE FROM channelvideos WHERE video_id = ?", [id], function () { })
                            connection.query("UPDATE playlists SET total_videos = total_videos - 1 WHERE playlist_id IN (SELECT playlist_id FROM playlistvideos WHERE video_id = ?)", [id], function () { })
                            connection.query("DELETE FROM playlistvideos WHERE video_id = ?", [id], function () { })
                            connection.query("DELETE FROM watchlaters WHERE id = ?", [id], function () { })
                            connection.query("DELETE FROM comments WHERE type = 'videos' && id = ?", [id], function () { })
                            connection.query("DELETE FROM favourites WHERE type = 'videos' && id = ?", [id], function () { })
                            connection.query("DELETE FROM likes WHERE type = 'videos' && id = ?", [id], function () { })
                            connection.query("DELETE FROM recently_viewed WHERE type = 'videos' && id = ?", [id], function () { })
                            connection.query("DELETE FROM ratings WHERE type = 'videos' && id = ?", [id], function () { })
                            connection.query("DELETE FROM notifications WHERE (object_type = 'videos' && object_id = ?) OR (subject_type = 'videos' && object_id = ?)", [id,id], function () { })
                            connection.query("DELETE FROM reports WHERE type = ? AND id = ?", ["videos", video.custom_url], function () {
                            })
                            if(video.mediaserver_stream_id){
                                let videos = []
                                if(video.agora_resource_id){
                                    videos = video.agora_resource_id.split(',')
                                }else{
                                    videos = [video.mediaserver_stream_id]
                                }
                                videos.forEach(item => {
                                    if(item){
                                        console.log(item)
                                        var config = { 
                                            method: 'delete',
                                            url: req.appSettings["antserver_media_url"].replace("https://","http://")+":5080/LiveApp/rest/v2/vods/"+item,
                                            headers: { 
                                                'Content-Type': 'application/json;charset=utf-8'
                                            },
                                            //httpsAgent: agent
                                        };
                                        axios(config)
                                        .then(function (response) {
                                        }).catch(function (error) {});
                                    }
                                })
                                
                            }
                            resolve(true)
                        } else {
                            resolve("");
                        }
                    })
                })
            })
        });
    },
    getVideos: async function (req, data) {
        return new Promise(function (resolve) {
            req.getConnection(async function (err, connection) {
                let condition = []
                let owner_id = 0
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }
                let customSelect = ""
                if (data.orderby == "random") {
                    customSelect = ' FLOOR(1 + RAND() * video_id) as randomSelect, '
                }
                let sql = 'SELECT videos.*,'+customSelect+'likes.like_dislike,users.level_id,userdetails.displayname,userdetails.username,users.paypal_email,userdetails.verified,videos.image as orgImage,IF(videos.image IS NULL || videos.image = "","' + req.appSettings['video_default_photo'] + '",videos.image) as image,IF(userdetails.avtar IS NULL || userdetails.avtar = "",(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,watchlaters.watchlater_id,favourites.favourite_id FROM videos '
                
                if (parseInt(data.channel_id)) {
                    condition.push(parseInt(data.channel_id))
                    if(!data.search){
                        sql += " INNER JOIN channelvideos ON channelvideos.video_id = videos.video_id AND channel_id = ?"
                    }else{
                        sql += " LEFT JOIN channelvideos ON channelvideos.video_id = videos.video_id AND channel_id = ?"
                    }
                }
                if (data.playlist_id) {
                    condition.push(data.playlist_id)
                    sql += " INNER JOIN playlistvideos ON playlistvideos.video_id = videos.video_id AND playlist_id = ?"
                }
                sql += ' INNER JOIN users on users.user_id = videos.owner_id  INNER JOIN userdetails on users.user_id = userdetails.user_id LEFT JOIN likes ON likes.id = videos.video_id AND likes.type = "videos"  AND likes.owner_id =  ' + owner_id + ' LEFT JOIN watchlaters ON watchlaters.id = videos.video_id AND watchlaters.owner_id = ' + owner_id + ' LEFT JOIN favourites ON (favourites.id = videos.video_id AND favourites.type = "videos" AND favourites.owner_id = ' + owner_id + ') '



                let orderbyField = false
                if (data.recentlyViewed) {
                    condition.push(parseInt(data.owner_id))
                    orderbyField = " recently_viewed.creation_date DESC "
                    sql += " INNER JOIN recently_viewed ON videos.video_id = recently_viewed.id AND recently_viewed.owner_id = ? AND recently_viewed.type='videos' "
                }
                if (data.myrated) {
                    orderbyField = " ratings.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN ratings ON videos.video_id = ratings.id AND ratings.owner_id = ? AND ratings.type='videos' "
                }
                if (data.myfav) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN favourites as f ON videos.video_id = f.id AND f.owner_id = ? AND f.type='videos' "
                }
                if (data.mylike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON videos.video_id = l.id AND l.owner_id = ? AND l.type='videos' AND l.like_dislike = 'like' "
                }
                if (data.mydislike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON videos.video_id = l.id AND l.owner_id = ? AND l.type='videos' AND l.like_dislike = 'dislike' "
                }
                if (data.mywatchlater) {
                    orderbyField = " wtl.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN watchlaters as wtl ON videos.video_id = wtl.id AND wtl.owner_id = ? "
                }

                if (data.mycommented) {
                    orderbyField = " comments.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN comments ON videos.video_id = comments.id AND comments.owner_id = ? AND comments.type='videos' "
                }

                if(data.purchaseVideo){
                    sql += " INNER JOIN transactions ON videos.video_id = transactions.id "
                }

                sql += ' WHERE 1=1 '
                sql += " AND users.active = 1 AND users.approve = 1 "

                if(data.pageType){
                    if(data.pageType == "trending"){
                        var d = new Date();
                        d.setDate(d.getDate() - 7);
                        condition.push(dateTime.create(d).format("Y-m-d H:M:S"))
                        condition.push(dateTime.create().format("Y-m-d H:M:S"))
                        sql += " AND videos.creation_date between ? AND ?"
                        data.orderby = "view_count DESC"
                    }else if(data.pageType == "top"){
                        data.orderby = "view_count DESC"
                    }
                }

                if(data.purchaseVideo){
                    condition.push(data.purchase_user_id)
                    sql+= " AND (transactions.state = 'completed' || transactions.state = 'approved') AND transactions.owner_id = ? AND transactions.type = 'video_purchase'"
                }
                if (!data.myContent) {

                    if(data.liveStreamingPage){
                        sql += " AND is_livestreaming = 1 "
                    }else{
                        let customDate = ""
                        if(typeof req.appSettings['live_streaming_type'] == "undefined" || req.appSettings['live_streaming_type'] != 0){ 
                            condition.push(dateTime.create().format("Y-m-d H:M:S"))
                            customDate = " AND DATE_ADD(videos.modified_date, INTERVAL 1 MINUTE) > ? "

                        }
                        sql += " AND ( ( is_livestreaming = 0 AND (code IS NOT NULL || videos.type = 3) ) ||  ( is_livestreaming = 1 "+customDate+"  )  )"
                        
                    }

                    if (data.videoview) {
                        if(!req.user || req.levelPermissions['video.view'] != 2)
                            sql += " AND videos.approve = 1 "
                    } else if(!data.purchaseVideo) {
                        if (!req.session.adult_allow && req.appSettings['video_adult'] == 1) {
                            //sql += " AND videos.adult = 0 "
                        }
                        sql += ' AND videos.status = 1  AND videos.completed = 1 AND videos.search = 1 AND videos.approve = 1 '
                    }else{
                        sql += " AND videos.approve = 1 "
                    }
                }
                if (parseInt(data.channel_id)) {
                    if(!data.search){
                        sql += " AND channelvideos.video_id IS NOT NULL "
                    }else{
                        sql += " AND channelvideos.video_id IS NULL "
                    }
                }
                if (data.playlist_id) {
                    sql += " AND playlistvideos.video_id IS NOT NULL "
                }
                if (data.video_id) {
                    condition.push(parseInt(data.video_id))
                    sql += " AND videos.video_id = ? "
                }
                if (data.not_video_id) {
                    condition.push(parseInt(data.not_video_id))
                    sql += " AND videos.video_id != ?"
                }
                if(data.not_videos_id && data.not_videos_id.length){
                    const video_ids = []
                    data.not_videos_id.forEach(item => {
                        video_ids.push(item.video_id)
                    })
                    sql += " AND videos.video_id NOT IN ("+video_ids.join(",")+")"
                }
                //

                if (data.title) {
                    condition.push(data.title.toLowerCase())
                    sql += " AND LOWER(videos.title) LIKE CONCAT('%', ?,  '%')"
                }
                if (data.artist_id) {
                    condition.push(data.artist_id)
                    sql += " AND FIND_IN_SET(?,videos.artists)"
                }
                if (parseInt(data.owner_id) && !data.myCustom) {
                    condition.push(parseInt(data.owner_id))
                    sql += " AND videos.owner_id = ?"
                }
                
                if (data.is_featured) {
                    condition.push(parseInt(data.is_featured))
                    sql += " AND videos.is_featured = ?"
                }
                if (data.is_not_hot) {
                    condition.push(1)
                    sql += " AND videos.is_hot != ?"
                }
                if (data.is_not_featured) {
                    condition.push(1)
                    sql += " AND videos.is_featured != ?"
                }
                if (data.is_not_sponsored) {
                    condition.push(1)
                    sql += " AND videos.is_sponsored != ?"
                }
                if (data.is_hot) {
                    condition.push(parseInt(data.is_hot))
                    sql += " AND videos.is_hot = ?"
                }
                if (data.is_sponsored) {
                    condition.push(parseInt(data.is_sponsored))
                    sql += " AND videos.is_sponsored = ?"
                }
                if (data.offtheday) {
                    condition.push(data.offtheday)
                    sql += " AND videos.offtheday = ?"
                }
                if (data.category_id) {
                    let customBraces = ""
                    if (data.tags && data.related) {
                        customBraces = " ( "
                    }
                    condition.push(parseInt(data.category_id))
                    sql += " AND " + customBraces + " videos.category_id = ?"
                }

                //related channels
                if (data.tags) {
                    if (data.related && data.category_id)
                        sql += " OR ( "
                    else {
                        sql += " AND ( "
                    }
                    const splitVal = data.tags.split(',')
                    let counter = 1
                    splitVal.forEach(tag => {
                        condition.push(tag)
                        sql += " CONCAT(',', tags, ',') like CONCAT('%,', ?,  ',%') "
                        if (counter != splitVal.length) {
                            sql += " OR "
                        }
                        counter = counter + 1
                    });
                    sql += " ) "
                    if (data.related && data.category_id) {
                        sql += "  ) "
                    }
                }
                if (data.subcategory_id) {
                    condition.push(parseInt(data.subcategory_id))
                    sql += " AND videos.subcategory_id = ?"
                }
                if (data.subsubcategory_id) {
                    condition.push(parseInt(data.subsubcategory_id))
                    sql += " AND videos.subsubcategory_id = ?"
                }
                if (data.rating) {
                    condition.push(data.rating)
                    sql += " AND videos.rating = ?"
                }

                if (data.custom_url) {
                    condition.push(data.custom_url)
                    sql += " AND videos.custom_url =?"
                }

                await privacyModel.checkSQL(req,'video','videos','video_id').then(result => {
                    if(result){
                        sql += " AND ( "+result+" )"
                    }
                })


                if (data.mycommented) {
                    sql += " GROUP BY videos.video_id "
                }
                if(data.purchaseVideo) {
                    sql += " ORDER BY transactions.creation_date DESC "
                }else if (data.orderby == "random") {
                    sql += " ORDER BY randomSelect DESC "
                } else if (data.orderby) {
                    sql += " ORDER BY " + data.orderby
                } else if (orderbyField) {
                    sql += " ORDER BY " + orderbyField
                } else if (parseInt(data.channel_id)) {
                    sql += " ORDER BY channelvideos.creation_date DESC "
                } else if (data.playlist_id) {
                    sql += " ORDER BY playlistvideos.creation_date DESC "
                } else {
                    sql += " ORDER BY videos.creation_date DESC "
                }

                if (data.limit) {
                    condition.push(data.limit)
                    sql += " LIMIT ?"
                }

                if (data.offset) {
                    condition.push(data.offset)
                    sql += " OFFSET ?"
                }
                connection.query(sql, condition, function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        const videos = []
                        if(level && level.length){
                            level.forEach(video => {
                                delete video.password
                                videos.push(video)
                            })
                            resolve(videos)
                        }else
                            resolve(level);
                    } else {
                        resolve(false);
                    }
                })
            })
        })
    },
    userVideoUploadCount: function (req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT COUNT(video_id) as totalVideos FROM videos WHERE (status = 1 || status = 2) && owner_id = ?', [parseInt(req.user.user_id)], function (err, results) {
                    if (err)
                        reject(err)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    findByCustomUrl: function (id, req, res, allowData = false) {
        return new Promise(function (resolve) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM videos WHERE custom_url = ?', [id], function (err, results) {
                    if (err)
                        resolve(false)

                    if (results) {
                        const videos = JSON.parse(JSON.stringify(results));
                        let video = videos[0]
                        if (!allowData && video) {
                            delete video['password']
                            delete video['purchase_count']
                            delete video['total_purchase_amount']
                        }
                        resolve(video);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
}
