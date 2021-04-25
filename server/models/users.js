const levelModel = require("../models/levels"),
    packagesModel = require("../models/packages"),
    globalModel = require("../models/globalModel"),
    s3Upload = require('../functions/upload').uploadtoS3,
    constant = require("../functions/constant"),
    download = require('image-downloader'),
    dateTime = require("node-datetime"),
    request = require("request"),
    uniqid = require('uniqid')



module.exports = {
    updateIP:function(req,ip,id){
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query("UPDATE users SET ip_address = ? WHERE user_id = ?", [ip,id], function (err, results, fields) {
                    console.log(err)
                    resolve(true)
                })
            })
        })
    },
    newsletter:function (data,req) {
        return new Promise(function (resolve, reject) {
            if(data.email && req.appSettings["enable_newsletter"] && req.appSettings['mailchimp_apikey'] && req.appSettings['mailchimp_listId']){

                //get instance
                let id = req.appSettings['mailchimp_apikey']
                let instanceId = id.split("-")

                var mailchimpInstance   = instanceId[instanceId.length-1],
                listUniqueId        = req.appSettings['mailchimp_listId'],
                mailchimpApiKey     = req.appSettings['mailchimp_apikey'];

                var options = {
                    url: 'https://' + mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + listUniqueId + '/members/',
                    method: 'POST',
                    json: true,
                    headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Authorization': 'Basic ' + new Buffer('any:' + mailchimpApiKey ).toString('base64')
                    },
                    body:{
                            'email_address': data.email,
                            'status': 'subscribed',
                            'merge_fields': {
                            'FNAME': data.first_name ? data.first_name : "",
                            'LNAME': data.last_name ? data.last_name : ""
                        }
                    }
                };
                request.post(options,function(error, response, body){
                    resolve(body)
                })
            }else{
                resolve(false)
            }
        })
    },
    findById: function (id, req, res,isUsers = false) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {

                let owner_id = 0

                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }
                let users = ""
                if(isUsers){
                    users = " users.*, "
                }

                let approveSql  = " AND users.active = 1 AND users.approve = 1 "

                if(req.allowAll){
                    approveSql = ""
                }

                connection.query('SELECT followers.follower_id,'+users+'users.creation_date,userdetails.*,userdetails.cover as usercover,userdetails.avtar as userimage,users.level_id,IF(userdetails.avtar IS NULL OR userdetails.avtar = "",(SELECT value FROM `level_permissions` WHERE name = CASE WHEN userdetails.gender = "male" THEN "default_mainphoto" WHEN userdetails.gender = "female" THEN "default_femalemainphoto" END AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,IF(userdetails.cover IS NULL OR userdetails.cover = "",(SELECT value FROM `level_permissions` WHERE name = \"default_coverphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.cover) as cover,(SELECT value FROM `level_permissions` WHERE name = \"coverphoto_upload\" AND type = \"member\" AND level_id = users.level_id) as canUploadCover,levels.type as levelType,levels.flag as levelFlag FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN levels ON levels.level_id = users.level_id LEFT JOIN followers on followers.id = users.user_id AND followers.owner_id = ' + owner_id + ' AND followers.type = "members" WHERE users.user_id = ? '+approveSql, [id], function (err, results, fields) {
                    if (err)
                        reject("")
                    if (results) {
                        const user = JSON.parse(JSON.stringify(results));
                        let userObj = user[0]
                        if (!req.passwordGet && userObj) {
                            delete userObj.password;
                        }
                        resolve(userObj);
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    findByEmail: function (email, req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                let owner_id = 0

                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }
                let userFields = ""
                if(req.userFields){
                    userFields = " , users.active,users.approve "
                }

                let sql = "LOWER(email) = ?"

                if(email.indexOf("@") < 0){
                    sql = " LOWER(username) = ?"
                }
                connection.query('SELECT followers.follower_id,userdetails.*,userdetails.cover as usercover'+userFields+',users.email,users.password,IF(userdetails.avtar IS NULL OR userdetails.avtar = "",(SELECT value FROM `level_permissions` WHERE name = CASE WHEN userdetails.gender = "male" THEN "default_mainphoto" WHEN userdetails.gender = "female"  THEN "default_femalemainphoto" END AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,IF(userdetails.cover IS NULL OR userdetails.cover = "",(SELECT value FROM `level_permissions` WHERE name = \"default_coverphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.cover) as cover FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN followers on followers.id = users.user_id AND followers.owner_id = ' + owner_id + ' AND followers.type = "members" WHERE '+sql, [email.toLowerCase()], function (err, results, fields) {
                    
                    if (err)
                        reject(false)
                    if (results && results.length > 0) {
                        const user = JSON.parse(JSON.stringify(results));
                        let userObj = user[0]
                        if (!req.passwordGet) {
                            delete userObj.password;
                        }
                        resolve(userObj);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    findByUsername: function (username, req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                let owner_id = 0
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }
                connection.query('SELECT followers.follower_id,users.creation_date,userdetails.*,userdetails.cover as usercover,IF(userdetails.avtar IS NULL OR userdetails.avtar = "",(SELECT value FROM `level_permissions` WHERE name = CASE WHEN userdetails.gender = "male" THEN "default_mainphoto" WHEN userdetails.gender = "female"  THEN "default_femalemainphoto" END AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,IF(userdetails.cover IS NULL OR userdetails.cover = "",(SELECT value FROM `level_permissions` WHERE name = \"default_coverphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.cover) as cover ,(SELECT value FROM `level_permissions` WHERE name = \"coverphoto_upload\" AND type = \"member\" AND level_id = users.level_id) as canUploadCover FROM users LEFT JOIN userdetails ON  userdetails.user_id = users.user_id LEFT JOIN followers on followers.id = users.user_id AND followers.owner_id = ' + owner_id + ' AND followers.type = "members" WHERE LOWER(username) = ? AND users.active = 1 AND users.approve = 1 ', [username.toLowerCase()], function (err, results, fields) {
                    if (err)
                        reject(false)
                    if (results && results.length > 0) {
                        const user = JSON.parse(JSON.stringify(results));
                        let userObj = user[0]
                        delete userObj.password;
                        resolve(userObj);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    delete: function (req, id) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query("DELETE FROM users WHERE user_id = ?", [id], function (err, results, fields) {
                    connection.query("DELETE FROM userdetails where user_id = ?",[id],function(err,results,fields) {
                        
                    })
                    if (err)
                        resolve(false)
                    if (results) {
                        connection.query("UPDATE channels SET total_videos = total_videos - 1 WHERE channel_id IN (SELECT channel_id FROM channelvideos WHERE owner_id = ?)", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, '1')
                            }
                        })
                        connection.query("DELETE FROM channelvideos WHERE channel_id IN (SELECT channel_id FROM channels WHERE owner_id = ?) OR owner_id = ?", [id, id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 2)
                            }
                        })
                        connection.query("UPDATE channels SET total_playlists = total_playlists - 1 WHERE channel_id IN (SELECT channel_id FROM channelplaylists WHERE owner_id = ?)", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 3)
                            }
                        })
                        connection.query("DELETE FROM channelplaylists WHERE channel_id IN (SELECT channel_id FROM channels WHERE owner_id = ?) OR owner_id = ?", [id, id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 4)
                            }
                        })
                        connection.query("DELETE FROM channels WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 5)
                            }
                        })

                        connection.query("DELETE FROM ratings WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 6)
                            }
                        })
 
                        connection.query("UPDATE playlists SET total_videos = total_videos - 1 WHERE playlist_id IN (SELECT playlist_id FROM playlistvideos WHERE owner_id = ?)", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 7)
                            }
                        })
                        connection.query("DELETE FROM playlistvideos WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 8)
                            }
                        })
                        connection.query("UPDATE playlists SET total_videos = total_videos - 1 WHERE playlist_id IN (SELECT playlist_id FROM playlistvideos LEFT JOIN videos ON videos.video_id = playlistvideos.video_id WHERE videos.owner_id = ?)", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 9)
                            }
                        })
                        
                        connection.query("DELETE FROM videos WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 10)
                            }
                        })

                        connection.query("UPDATE userdetails SET follow_count = follow_count - 1 WHERE user_id IN (SELECT id FROM followers WHERE owner_id = ? AND type = 'members')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 11)
                            }
                        })
                        connection.query("DELETE FROM followers WHERE type = 'members' && (owner_id = ? OR id = ?)", [id, id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 12)
                            }
                        })

                        
                        connection.query("DELETE FROM verification_requests WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 14)
                            }
                        })
                        connection.query("DELETE FROM video_monetizations WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 15)
                            }
                        })
                        connection.query("DELETE FROM orders WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 16)
                            }
                        })

                        connection.query("DELETE FROM subscriptions WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 17)
                            }
                        })
                        connection.query("DELETE FROM transactions WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 18)
                            }
                        })
                        connection.query("DELETE FROM reports WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 45)
                            }
                        })

                        connection.query("DELETE FROM watchlaters WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 46)
                            }
                        })


                        connection.query("UPDATE comments SET reply_count = reply_count - 1 WHERE comment_id IN (SELECT c.parent_id FROM (select * from comments) as c WHERE c.owner_id = ? AND c.parent_id != 0)", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 19)
                            }
                        })
                        connection.query("DELETE FROM comments WHERE  owner_id = ? AND parent_id != 0", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 20)
                            }
                        })

                        connection.query("UPDATE channels SET comment_count = comment_count - 1 WHERE channel_id IN (SELECT c.id FROM (select * from comments) as c WHERE c.owner_id = ? AND c.type = 'channels')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 21)
                            }
                        })
                        connection.query("UPDATE videos SET comment_count = comment_count - 1 WHERE video_id IN (SELECT c.id FROM (select * from comments) as c WHERE c.owner_id = ? AND c.type = 'videos')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 22)
                            }
                        })
                        connection.query("UPDATE playlists SET comment_count = comment_count - 1 WHERE playlist_id IN (SELECT c.id FROM (select * from comments) as c WHERE c.owner_id = ? AND c.type = 'playlists')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 23)
                            }
                        })
                        connection.query("UPDATE blogs SET comment_count = comment_count - 1 WHERE blog_id IN (SELECT c.id FROM (select * from comments) as c WHERE c.owner_id = ? AND c.type = 'blogs')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 24)
                            }
                        })
                        connection.query("UPDATE userdetails SET comment_count = comment_count - 1 WHERE user_id IN (SELECT c.id FROM (select * from comments) as c WHERE c.owner_id = ? AND c.type = 'members')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 25)
                            }
                        })
                        connection.query("DELETE FROM comments WHERE  owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 26)
                            }
                        })

                        connection.query("UPDATE channels SET favourite_count = favourite_count - 1 WHERE channel_id IN (SELECT id FROM favourites WHERE owner_id = ? AND type = 'channels')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 27)
                            }
                        })
                        connection.query("UPDATE videos SET favourite_count = favourite_count - 1 WHERE video_id IN (SELECT id FROM favourites WHERE owner_id = ? AND type = 'videos')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 28)
                            }
                        })
                        connection.query("UPDATE playlists SET favourite_count = favourite_count - 1 WHERE playlist_id IN (SELECT id FROM favourites WHERE owner_id = ? AND type = 'playlists')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 29)
                            }
                        })
                        connection.query("UPDATE blogs SET favourite_count = favourite_count - 1 WHERE blog_id IN (SELECT id FROM favourites WHERE owner_id = ? AND type = 'blogs')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 30)
                            }
                        })
                        connection.query("UPDATE userdetails SET favourite_count = favourite_count - 1 WHERE user_id IN (SELECT id FROM favourites WHERE owner_id = ? AND type = 'members')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 31)
                            }
                        })
                        connection.query("DELETE FROM favourites WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 32)
                            }
                        })

                        connection.query("UPDATE channels SET like_count = like_count - 1 WHERE channel_id IN (SELECT id FROM likes WHERE owner_id = ? AND type = 'channels' AND like_dislike = 'like')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 33)
                            }
                        })
                        connection.query("UPDATE videos SET like_count = like_count - 1 WHERE video_id IN (SELECT id FROM likes WHERE owner_id = ? AND type = 'videos' AND like_dislike = 'like')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 34)
                            }
                        })
                        connection.query("UPDATE playlists SET like_count = like_count - 1 WHERE playlist_id IN (SELECT id FROM likes WHERE owner_id = ? AND type = 'playlists' AND like_dislike = 'like')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 35)
                            }
                        })
                        connection.query("UPDATE blogs SET like_count = like_count - 1 WHERE blog_id IN (SELECT id FROM likes WHERE owner_id = ? AND type = 'blogs' AND like_dislike = 'like')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 36)
                            }
                        })
                        connection.query("UPDATE userdetails SET like_count = like_count - 1 WHERE user_id IN (SELECT id FROM likes WHERE owner_id = ? AND type = 'members' AND like_dislike = 'like')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 37)
                            }
                        })

                        connection.query("UPDATE channels SET dislike_count = dislike_count - 1 WHERE channel_id IN (SELECT id FROM likes WHERE owner_id = ? AND type = 'channels' AND like_dislike = 'dislike')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 38)
                            }
                        })
                        connection.query("UPDATE videos SET dislike_count = dislike_count - 1 WHERE video_id IN (SELECT id FROM likes WHERE owner_id = ? AND type = 'videos' AND like_dislike = 'dislike')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 39)
                            }
                        })
                        connection.query("UPDATE playlists SET dislike_count = dislike_count - 1 WHERE playlist_id IN (SELECT id FROM likes WHERE owner_id = ? AND type = 'playlists' AND like_dislike = 'dislike')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 40)
                            }
                        })
                        connection.query("UPDATE blogs SET dislike_count = dislike_count - 1 WHERE blog_id IN (SELECT id FROM likes WHERE owner_id = ? AND type = 'blogs' AND like_dislike = 'dislike')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 41)
                            }
                        })
                        connection.query("UPDATE userdetails SET dislike_count = dislike_count - 1 WHERE user_id IN (SELECT id FROM likes WHERE owner_id = ? AND type = 'members' AND like_dislike = 'dislike')", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 42)
                            }
                        })
                        connection.query("DELETE FROM likes WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 43)
                            } 
                        })
                        connection.query("DELETE FROM recently_viewed WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 44)
                            }
                        })
                        connection.query("DELETE FROM user_facebook WHERE user_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 45)
                            }
                        })
                        connection.query("DELETE FROM user_forgot WHERE user_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 45)
                            }
                        })
                        connection.query("DELETE FROM user_google WHERE user_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 45)
                            }
                        })
                        connection.query("DELETE FROM user_twitter WHERE user_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 45)
                            }
                        })
                        connection.query("DELETE FROM reports WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 45)
                            }
                        })
                        connection.query("DELETE FROM playlists WHERE owner_id = ?", [id], function (err, results, fields) {
                            if (err) {
                                console.log(err, 10)
                            }
                        })
                        connection.query("DELETE FROM notifications WHERE ((object_type = 'users' OR object_type = 'members' OR object_type = 'users') && object_id = ?) OR ((subject_type = 'users' || subject_type = 'members') && subject_id = ?)", [id,id], function (err, results, fields) { })
                        connection.query("DELETE FROM notificationsettings WHERE owner_id = ?", [id], function (err, results, fields) { })
                        connection.query("DELETE FROM emailsettings WHERE owner_id = ?", [id], function (err, results, fields) { })
                        resolve(true)
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    getMembers: function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                let owner_id = 0
                let condition = []
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }
                let customSelect = ""
                if (data.orderby == "random") {
                    customSelect = ' FLOOR(1 + RAND() * users.user_id) as randomSelect, '
                }
                let sql = "SELECT followers.follower_id,userdetails.*,"+customSelect+"likes.like_dislike,favourites.favourite_id,IF(userdetails.avtar IS NULL || userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = CASE WHEN userdetails.gender = 'male' THEN 'default_mainphoto' WHEN userdetails.gender = 'female'  THEN 'default_femalemainphoto' END  AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,IF(userdetails.cover IS NULL OR userdetails.cover = '',(SELECT value FROM `level_permissions` WHERE name = \"default_coverphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.cover) as cover FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN followers on followers.id = users.user_id AND followers.owner_id = " + owner_id + " AND followers.type = 'members' LEFT JOIN likes ON likes.id = users.user_id AND likes.type = 'members'  AND likes.owner_id =  " + owner_id + "  LEFT JOIN favourites ON (favourites.id = users.user_id AND favourites.type = 'members' AND favourites.owner_id = " + owner_id + ") "

                let orderbyField = false
                if (data.recentlyViewed) {
                    condition.push(parseInt(data.owner_id))
                    orderbyField = " recently_viewed.creation_date DESC "
                    sql += " INNER JOIN recently_viewed ON users.user_id AND recently_viewed.id AND recently_viewed.owner_id = ? AND recently_viewed.type='members' "
                }
                if (data.myrated) {
                    orderbyField = " ratings.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN ratings ON users.user_id = ratings.id AND ratings.owner_id = ? AND ratings.type='members' "
                }
                if (data.myfav) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN favourites as f ON users.user_id = f.id AND f.owner_id = ? AND f.type='members' "
                }
                if (data.mylike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON users.user_id = l.id AND l.owner_id = ? AND l.type='members' AND l.like_dislike = 'like' "
                }
                if (data.mydislike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON users.user_id = l.id AND l.owner_id = ? AND l.type='members' AND l.like_dislike = 'dislike' "
                }

                if (data.mycommented) {
                    orderbyField = " comments.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN comments ON users.user_id = comments.id AND comments.owner_id = ? AND comments.type='members' "
                }

                if (data.mySubscribed) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN followers as f ON users.user_id = f.owner_id AND f.id = ? AND f.type='members' "
                }
                if (data.iSubscribed) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN followers as f ON users.user_id = f.id AND f.owner_id = ? AND f.type='members' "
                }
                sql += ' WHERE userdetails.search = 1 '

                if (data.title) {
                    condition.push(data.title.toLowerCase())
                    sql += " AND LOWER(userdetails.displayname) LIKE CONCAT('%', ?,  '%')"
                }

                sql += " AND users.active = 1 AND users.approve = 1 "

                if (data.is_featured) {
                    condition.push(parseInt(data.is_featured))
                    sql += " AND userdetails.is_featured = ?"
                }
                if (data.is_not_hot) {
                    condition.push(1)
                    sql += " AND userdetails.is_hot != ?"
                }
                if (data.is_popular) {
                    condition.push(1)
                    sql += " AND userdetails.is_popular = ?"
                }
                if (data.is_not_featured) {
                    condition.push(1)
                    sql += " AND userdetails.is_featured != ?"
                }
                if (data.is_not_sponsored) {
                    condition.push(1)
                    sql += " AND userdetails.is_sponsored != ?"
                }
                if (data.is_hot) {
                    condition.push(parseInt(data.is_hot))
                    sql += " AND userdetails.is_hot = ?"
                }
                if (data.is_sponsored) {
                    condition.push(parseInt(data.is_sponsored))
                    sql += " AND userdetails.is_sponsored = ?"
                }
                if (data.not_user_id) {
                    condition.push(parseInt(data.not_user_id))
                    sql += " AND userdetails.user_id != ?"
                }

                if (data.rating) {
                    condition.push(data.rating)
                    sql += " AND userdetails.rating = ?"
                }
                if (data.verified) {
                    sql += " AND userdetails.verified = 1"
                }
                if (data.username) {
                    condition.push(data.username)
                    sql += " AND userdetails.username =?"
                }
                if (data.mycommented || data.recentlyViewed) {
                    sql += " GROUP BY users.user_id "
                }
                if (data.orderby == "random") {
                    sql += " ORDER BY randomSelect DESC "
                }else if (data.orderby) {
                    sql += " ORDER BY  " + data.orderby
                } else if (orderbyField) {
                    sql += " ORDER BY " + orderbyField
                } else {
                    sql += " ORDER BY userdetails.verified DESC, userdetails.view_count DESC"
                }
                if (data.limit)
                    sql += " limit " + data.limit
                if (data.offset)
                    sql += " offset " + data.offset
                                
                connection.query(sql, condition, function (err, results, fields) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const users = JSON.parse(JSON.stringify(results));
                        resolve(users);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    upsertTwitterUser: async function (req, token, tokenSecret, profile, cb) {
        await globalModel.custom(req, "SELECT users.* from users LEFT JOIN user_twitter ON users.user_id = user_twitter.user_id WHERE twitter_uid = ? OR users.email = ?", [profile.id, profile.emails[0].value]).then(async user => {
            // no user was found, lets create a new one
            const userData = JSON.parse(JSON.stringify(user));
            if (!userData || !userData.length) {
                let imageURL = profile.photos ? profile.photos[0].value : '';
                let data = {}
                data.displayname = profile.displayName
                data['first_name'] = profile.name.givenName
                data['last_name'] = profile.name.familyName
                if(!profile.name.givenName){
                    let displayNames = data.displayname.split(" ");
                    if(displayNames[0]){
                        data.first_name = displayNames[0]
                    }
                    if(typeof displayNames[1] != "undefined"){
                        displayNames.shift()
                        data.last_name = displayNames.join(" ")
                    }
                }
                if(imageURL.indexOf('default_profile_normal.png') > -1){
                    imageURL = ""
                }
                data['email'] = profile.emails[0].value
                if (imageURL) {
                    const imageName = Date.now() + '_' + Math.random().toString(36).substring(7) + '.jpg';
                    let image_path = req.serverDirectoryPath + '/public/upload/images/members/' + imageName;
                    let options = {
                        url: imageURL,
                        dest: image_path
                    } 
                    download.image(options)
                        .then(async ({ filename, image }) => {
                            if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                                await s3Upload(req,  image_path, image_path.replace(req.serverDirectoryPath + '/public', '')).then(result => {
                                    //remove local file
                                    const commonFunction = require("../functions/commonFunctions")
                                    commonFunction.deleteImage(req, "", image_path, 'user/twitter')
                                }).catch(err => {
                                })
                            }
                            data["image"] = image_path.replace(req.serverDirectoryPath + '/public', '')
                            await module.exports.createUser(req, data).then(result => {
                                if (result) {
                                    globalModel.update(req, { username: result.insertId.toString().length >= 4 ? result.insertId : result.insertId+"sl" }, "userdetails", "user_id", result.insertId).then(result => {

                                    }).catch(err => {

                                    })
                                    globalModel.create(req, { user_id: result.insertId, twitter_uid: profile.id }, 'user_twitter').then(result => {

                                    });
                                    return cb(null, { status: true });
                                } else {
                                    return cb(null, { error: constant.general.DATABSE });
                                }
                            })
                        }).catch((err) => {
                            return cb(err, { error: constant.general.DATABSE });
                        })
                } else {
                    await module.exports.createUser(req, data).then(result => {
                        if (result) {
                            globalModel.create(req, { user_id: result.insertId, twitter_uid: profile.id }, 'user_twitter').then(result => {
                                globalModel.update(req, { username: result.insertId.toString().length >= 4 ? result.insertId : result.insertId+"sl" }, "userdetails", "user_id", result.insertId).then(result => {

                                }).catch(err => {

                                })
                                globalModel.create(req, { user_id: result.insertId, twitter_uid: profile.id }, 'user_twitter').then(result => {

                                });
                            });
                            return cb(null, { status: true });
                        } else {
                            return cb(null, { error: constant.general.DATABSE });
                        }
                    })
                }
            } else {
                
                let userObj = userData[0]
                if (userObj.active == 0) {
                    return cb(null, { error: constant.auth.EMAILVERIFY });
                } else if (userObj.approve == 0) {
                    return cb(null, { error: constant.auth.ADMINAPPROVAL });
                } else {
                    req.session.user = userObj.user_id
                    return cb(null, { status: true });
                }
            }
        });
    },
    createUser: async function (req, data) {
        return new Promise(async function (resolve, reject) {

            let is_hot, is_featured, is_sponsored, level_id;
            await levelModel.getByType('default', req, {}).then(result => {
                level_id = result.level_id
            }).catch(error => {
                resolve(false)
            })
            //fetch subscription packages
            await packagesModel.default(req, {}).then(result => {
                if (result) {
                    level_id = result.level_id
                    is_hot = result.is_hot
                    is_sponsored = result.is_sponsored
                    is_featured = result.is_featured
                }
            }).catch(error => {
                resolve(false)
            })
            let fieldValues = {}
            let fieldValueDetails = {}
            fieldValues['password'] = ""
            fieldValueDetails['avtar'] = data.image ? data.image : ""
            fieldValueDetails['displayname'] = data.displayname
            fieldValueDetails['language'] = "en"
            fieldValueDetails["username"] = uniqid.process('v')+"un"
            fieldValueDetails['first_name'] = data.first_name
            fieldValueDetails['last_name'] = data.last_name
            fieldValues['level_id'] = level_id
            fieldValues["email"] = data.email
            fieldValues['active'] = 1
            fieldValueDetails['verified'] = 0
            fieldValueDetails['search'] = 1
            fieldValueDetails['is_sponsored'] = is_sponsored ? is_sponsored : 0
            fieldValueDetails['is_featured'] = is_featured ? is_featured : 0
            fieldValueDetails['is_hot'] = is_hot ? is_hot : 0
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            fieldValues['creation_date'] = formatted
            fieldValues['modified_date'] = formatted
            fieldValues["phone_number"] = ""
            fieldValues["approve"] = 1
            globalModel.create(req, fieldValues, 'users').then(result => {
                fieldValueDetails["user_id"] = result.insertId
                fieldValueDetails['gender'] = "male"
                globalModel.create(req, fieldValueDetails, 'userdetails').then(result => {

                })
                req.session.user = result.insertId
                resolve(result)
            }).catch(error => {
                resolve(false)
            })
        })
    },
    upsertFbUser: async function (req, accessToken, refreshToken, profile, cb) {
        await globalModel.custom(req, "SELECT users.* from users LEFT JOIN user_facebook ON users.user_id = user_facebook.user_id WHERE facebook_uid = ? OR users.email = ?", [profile.id, profile.emails[0].value]).then(async user => {
            // no user was found, lets create a new one
            const userData = JSON.parse(JSON.stringify(user));
            if (!userData || !userData.length) {
                let imageURL = profile.photos ? profile.photos[0].value : '';
                let data = {}
                data.displayname = profile.displayName
                data['first_name'] = profile.name.givenName
                data['last_name'] = profile.name.middleName + " " + profile.name.familyName
                data['email'] = profile.emails[0].value
                if (imageURL) {
                    imageURL = "https://graph.facebook.com/"+profile.id+"/picture?width=500&heigth=500"
                    request.get({
                        uri:imageURL,
                        followAllRedirects: true
                    }, function (err, res, body) {
                        let finalUrl = res.request._redirect.redirects[0].redirectUri
                        const imageName = Date.now() + '_' + Math.random().toString(36).substring(7) + '.jpg';
                        let image_path = req.serverDirectoryPath + '/public/upload/images/members/' + imageName;
                        let options = {
                            url: finalUrl,
                            dest: image_path,
                            followRedirect:true
                        }
                        download.image(options)
                            .then(async ({ filename, image }) => {
                                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                                    await s3Upload(req, image_path, image_path.replace(req.serverDirectoryPath + '/public', '')).then(result => {
                                        //remove local file
                                        const commonFunction = require("../functions/commonFunctions")
                                        commonFunction.deleteImage(req, "", image_path, 'user/facebook')
                                    }).catch(err => {
                                    })
                                }
                                data["image"] = image_path.replace(req.serverDirectoryPath + '/public', '')
                                await module.exports.createUser(req, data).then(result => {
                                    if (result) {
                                        globalModel.update(req, { username: result.insertId.toString().length >= 4 ? result.insertId : result.insertId+"sl" }, "userdetails", "user_id", result.insertId).then(result => {

                                        }).catch(err => {

                                        })
                                        globalModel.create(req, { user_id: result.insertId, facebook_uid: profile.id }, 'user_facebook').then(result => {

                                        });
                                        return cb(null, { status: true });
                                    } else {
                                        return cb(null, { error: constant.general.DATABSE });
                                    }
                                })
                            }).catch((err) => {
                                return cb(err, { error: constant.general.DATABSE });
                            })

                        });
                    
                } else {
                    await module.exports.createUser(req, data).then(result => {
                        if (result) {
                            globalModel.create(req, { user_id: result.insertId, facebook_uid: profile.id }, 'user_facebook').then(result => {
                                globalModel.update(req, { username: result.insertId.toString().length >= 4 ? result.insertId : result.insertId+"sl" }, "userdetails", "user_id", result.insertId).then(result => {

                                }).catch(err => {

                                })
                                globalModel.create(req, { user_id: result.insertId, facebook_uid: profile.id }, 'user_facebook').then(result => {

                                });
                            });
                            return cb(null, { status: true });
                        } else {
                            return cb(null, { error: constant.general.DATABSE });
                        }
                    })
                }
            } else {
                
                let userObj = userData[0]
                if (userObj.active == 0) {
                    return cb(null, { error: constant.auth.EMAILVERIFY });
                } else if (userObj.approve == 0) {
                    return cb(null, { error: constant.auth.ADMINAPPROVAL });
                } else {
                    req.session.user = userObj.user_id
                    return cb(null, { status: true });
                }
            }
        });
    },
    upsertAppleUser: async function(req, accessToken, refreshToken, profile, cb){
        await globalModel.custom(req, "SELECT users.* from users LEFT JOIN user_apple ON users.user_id = user_apple.user_id WHERE apple_uid = ? OR users.email = ?", [profile.id, profile.email]).then(async user => {
            // no user was found, lets create a new one
            const userData = JSON.parse(JSON.stringify(user));
            if (!userData || !userData.length) {
                
                let data = {}
                data.displayname = profile.name ? profile.name.firstName + profile.name.lastName : ""
                data['first_name'] = profile.name ? profile.name.firstName  : ""
                data['last_name'] = profile.name ? profile.name.lastName : ""
                data['email'] = profile.email
                
                await module.exports.createUser(req, data).then(result => {
                    if (result) {
                        globalModel.create(req, { user_id: result.insertId, apple_uid: profile.id }, 'user_apple').then(result => {
                            globalModel.update(req, { username: result.insertId.toString().length >= 4 ? result.insertId : result.insertId+"ap" }, "userdetails", "user_id", result.insertId).then(result => {

                            }).catch(err => {

                            })
                        });
                        return cb(null, { status: true });
                    } else {
                        return cb(null, { error: constant.general.DATABSE });
                    }
                })
            } else {
                
                let userObj = userData[0]
                if (userObj.active == 0) {
                    return cb(null, { error: constant.auth.EMAILVERIFY });
                } else if (userObj.approve == 0) {
                    return cb(null, { error: constant.auth.ADMINAPPROVAL });
                } else {
                    req.session.user = userObj.user_id
                    return cb(null, { status: true });
                }
            }
        });
    },
    upsertGoogleUser: async function (req, accessToken, refreshToken, profile, cb) {
        await globalModel.custom(req, "SELECT users.* from users LEFT JOIN user_google ON users.user_id = user_google.user_id WHERE google_uid = ? OR users.email = ?", [profile.id, profile.emails[0].value]).then(async user => {
            // no user was found, lets create a new one
            const userData = JSON.parse(JSON.stringify(user));
            if (!userData || userData.length == 0) {
                const _json = profile._json;
                const imageURL = _json.picture ? _json.picture : '';
                let data = {}
                data.displayname = profile.displayName
                data['first_name'] = profile.name.givenName
                data['last_name'] = profile.name.familyName
                data['email'] = profile.emails[0].value
                if (imageURL) {
                    const imageName = Date.now() + '_' + Math.random().toString(36).substring(7) + '.jpg';
                    let image_path = req.serverDirectoryPath + '/public/upload/images/members/' + imageName;
                    let options = {
                        url: imageURL,
                        dest: image_path
                    }
                    download.image(options)
                        .then(async ({ filename, image }) => {
                            if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                                await s3Upload(req, image_path, image_path.replace(req.serverDirectoryPath + '/public', '')).then(result => {
                                    //remove local file
                                    const commonFunction = require("../functions/commonFunctions")
                                    commonFunction.deleteImage(req, "", image_path, 'user/google')
                                }).catch(err => {
                                })
                            }
                            data["image"] = image_path.replace(req.serverDirectoryPath + '/public', '')
                            await module.exports.createUser(req, data).then(result => {
                                if (result) {
                                    globalModel.update(req, { username: result.insertId.toString().length >= 4 ? result.insertId : result.insertId+"sl" }, "userdetails", "user_id", result.insertId).then(result => {

                                    }).catch(err => {

                                    })
                                    globalModel.create(req, { user_id: result.insertId, google_uid: profile.id }, 'user_google').then(result => {

                                    });
                                    return cb(null, { status: true });
                                } else {
                                    return cb(null, { error: constant.general.DATABSE });
                                }
                            })
                        }).catch((err) => {
                            return cb(err, { error: constant.general.DATABSE });
                        })
                } else {
                    await module.exports.createUser(req, data).then(result => {
                        if (result) {
                            globalModel.create(req, { user_id: result.insertId, google_uid: profile.id }, 'user_google').then(result => {
                                globalModel.update(req, { username: result.insertId.toString().length >= 4 ? result.insertId : result.insertId+"sl" }, "userdetails", "user_id", result.insertId).then(result => {

                                }).catch(err => {

                                })
                            });
                            return cb(null, { status: true });
                        } else {
                            return cb(null, { error: constant.general.DATABSE });
                        }
                    })
                }
            } else {
                let userObj = userData[0]
                if (userObj.active == 0) {
                    return cb(null, { error: constant.auth.EMAILVERIFY });
                } else if (userObj.approve == 0) {
                    return cb(null, { error: constant.auth.ADMINAPPROVAL });
                } else {
                    req.session.user = userObj.user_id
                    return cb(null, { status: true });
                }
            }
        });
    }

}
