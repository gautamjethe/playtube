const dateTime = require("node-datetime")
const socketio = require("../socket")
const emailFunction = require("../functions/emails")
module.exports = {
    getNotification: function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                if (data.type.indexOf("_reply_") > -1) {

                    connection.query("SELECT 'reply' as commentType, message as title,image,type,comment_id as id,parent_id FROM comments WHERE comment_id = ?", [data.object_id], function (err, results, fields) {
                        if (!err && results) {
                            const replyData = JSON.parse(JSON.stringify(results));
                            const reply = replyData[0]
                            data.reply = reply
                            connection.query("SELECT 'comments' as commentType, message as title,image,type,comment_id as id,id as content_id FROM comments WHERE comment_id = ?", [reply.parent_id], function (err, results, fields) {
                                if (!err && results) {
                                    const commentData = JSON.parse(JSON.stringify(results));
                                    const comment = commentData[0]
                                    data.comment = comment
                                    let customUrl = "custom_url"
                                    let column = "video_id"
                                    let urlParam = "custom_url"
                                    let leftJOIN = ""
                                    if (reply.type == "channels") {
                                        column = "channel_id"
                                    } else if (reply.type == "blogs") {
                                        column = "blog_id"
                                    } else if (reply.type == "members") {
                                        column = "user_id"
                                        customUrl = "user_id"
                                        urlParam = "username as custom_url"
                                        leftJOIN = " LEFT JOIN userdetails ON users.user_id = userdetails.user_id "
                                    } else if (reply.type == "artists") {
                                        column = "artist_id"
                                    } else if (reply.type == "playlists") {
                                        column = "playlist_id"
                                    }else if (reply.type == "channel_posts") {
                                        column = "post_id"
                                        urlParam = "post_id as custom_url"
                                        customUrl = "post_id"
                                    }else if (reply.type == "audio") {
                                        column = "audio_id"
                                    }
                                    let typeName = comment.type.replace(/\s$/, '')
                                    if (typeName.charAt(typeName.length - 1) == "s") {
                                        typeName = typeName.slice(0, -1)
                                    }
                                    connection.query("SELECT '" + reply.type + "' as type," + (comment.type == "members" ? "displayname as title" : "title") + "," + (comment.type == "members" ? "avtar as image" : "image") + "," + column + " as id," + urlParam + " FROM " + (reply.type == "members" ? "users" : reply.type) +leftJOIN+ " WHERE " + customUrl + " = ?", [comment.content_id], function (err, results, fields) {
                                        if (!err && results) {
                                            const itemData = JSON.parse(JSON.stringify(results));
                                            const item = itemData[0]
                                            data[reply.type] = item
                                            let column = "users.user_id"
                                            let urlParam = "username as custom_url"
                                            leftJOIN = " LEFT JOIN userdetails ON users.user_id = userdetails.user_id "

                                            if (data.subject_type == "channels") {
                                                column = "channel_id"
                                                urlParam = "custom_url"
                                                leftJOIN = ""
                                            }
                                            let typeName = data.subject_type.replace(/\s$/, '')
                                            if (typeName.charAt(typeName.length - 1) == "s") {
                                                typeName = typeName.slice(0, -1)
                                            }
                                            connection.query("SELECT '" + data.subject_type + "' as type," + (data.subject_type != "channels" ? "displayname as title" : "title") + "," + (data.subject_type == "users" ? "IF(userdetails.avtar IS NULL OR userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as image" : "IF(" + data.subject_type + ".image IS NULL || " + data.subject_type + ".image = '','" + req.appSettings[typeName + '_default_photo'] + "'," + data.subject_type + ".image) as image") + "," + (data.subject_type == "users" ? "avtar as image" : "image") + "," + column + " as id, " + urlParam + " FROM " + data.subject_type +leftJOIN+ " WHERE " + column + " = ?", [data.subject_id], function (err, results, fields) {
                                                if (!err && results) {
                                                    const subjectData = JSON.parse(JSON.stringify(results));
                                                    const subject = subjectData[0]
                                                    data["subject"] = subject
                                                    resolve(data)
                                                } else {
                                                    resolve(false)
                                                }
                                            })
                                        } else {
                                            resolve(false)
                                        }
                                    })
                                } else {
                                    resolve(false)
                                }
                            })

                        } else {
                            resolve(false)
                        }
                    })
                } else if (data.type.indexOf('_comments_') > -1) {
                    connection.query("SELECT 'comments' as commentType, message as title,image,type,comment_id as id,id as content_id  FROM comments WHERE comment_id = ?", [data.object_id], function (err, results, fields) {
                        if (!err && results) {
                            let commentData = JSON.parse(JSON.stringify(results));
                            let comment = commentData[0]
                            let customUrl = "custom_url"
                            data.comment = comment
                            let urlParam = "custom_url"
                            let column = "video_id"
                            let leftJOIN = ""
                            if (comment.type == "channels") {
                                column = "channel_id"
                            } else if (comment.type == "blogs") {
                                column = "blog_id"
                            } else if (comment.type == "members") {
                                column = "user_id"
                                urlParam = "username as custom_url"
                                customUrl = "user_id"
                                leftJOIN = " LEFT JOIN userdetails ON users.user_id = userdetails.user_id "
                            } else if (comment.type == "artists") {
                                column = "artist_id"
                            } else if (comment.type == "playlists") {
                                column = "playlist_id"
                            } else if (comment.type == "channel_posts") {
                                column = "post_id"
                                urlParam = "post_id as custom_url"
                                customUrl = "post_id"
                            }else if (comment.type == "audio") {
                                column = "audio_id"
                            } 
                            let typeName = comment.type.replace(/\s$/, '')
                            if (typeName.charAt(typeName.length - 1) == "s") {
                                typeName = typeName.slice(0, -1)
                            }
                            connection.query("SELECT '" + comment.type + "' as type," + (comment.type == "members" ? "displayname as title" : "title") + "," + (comment.type == "members" ? "IF(userdetails.avtar IS NULL OR userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as image" : "IF(" + comment.type + ".image IS NULL || " + comment.type + ".image = '','" + req.appSettings[typeName + '_default_photo'] + "'," + comment.type + ".image) as image") + "," + column + " as id, " + urlParam + " FROM " + (comment.type == "members" ? "users" : comment.type) +leftJOIN+ " WHERE " + customUrl + " = ?", [comment.content_id], function (err, results, fields) {
                                if (!err && results) {
                                    const itemData = JSON.parse(JSON.stringify(results));
                                    const item = itemData[0]
                                    data[comment.type] = item

                                    let column = "users.user_id"
                                    let urlParam = "username as custom_url"
                                    leftJOIN = " LEFT JOIN userdetails ON users.user_id = userdetails.user_id "
                                    if (data.subject_type == "channels") {
                                        column = "channel_id"
                                        urlParam = "custom_url"
                                        leftJOIN = ""
                                    }
                                    let typeName = data.subject_type.replace(/\s$/, '')
                                    if (typeName.charAt(typeName.length - 1) == "s") {
                                        typeName = typeName.slice(0, -1)
                                    }
                                    connection.query("SELECT '" + data.subject_type + "' as type," + (data.subject_type == "users" ? "displayname as title" : "title") + "," + (data.subject_type == "users" ? "IF(userdetails.avtar IS NULL OR userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as image" : "IF(" + data.subject_type + ".image IS NULL || " + data.subject_type + ".image = '','" + req.appSettings[typeName + '_default_photo'] + "'," + data.subject_type + ".image) as image") + "," + column + " as id, " + urlParam + " FROM " + data.subject_type +leftJOIN+ " WHERE " + column + " = ?", [data.subject_id], function (err, results, fields) {
                                        if (!err && results) {
                                            const subjectData = JSON.parse(JSON.stringify(results));
                                            const subject = subjectData[0]
                                            data["subject"] = subject
                                            resolve(data)
                                        } else {
                                            resolve(false)
                                        }
                                    })
                                } else {
                                    resolve(false)
                                }
                            })
                        } else {
                            resolve(false)
                        }
                    })
                } else {
                    let leftJOIN = ""
                    let urlParam = "custom_url"
                    let column = "video_id"
                    if (data.object_type == "channels") {
                        column = "channel_id"
                    } else if (data.object_type == "blogs") {
                        column = "blog_id"
                    } else if (data.object_type == "members") {
                        column = "users.user_id"
                        urlParam = "username as custom_url"
                        leftJOIN = " LEFT JOIN userdetails ON users.user_id = userdetails.user_id "

                    } else if (data.object_type == "artists") {
                        column = "artist_id"
                    } else if (data.object_type == "playlists") {
                        column = "playlist_id"
                    }else if (data.object_type == "audio") {
                        column = "audio_id"
                    }else if (data.object_type == "channel_posts") {
                        column = "post_id"
                        urlParam = "post_id as custom_url"
                    }else if(data.object_type == "package"){
                        if(data.params){
                            let dataParams = JSON.parse(data.params);
                            for (var key in dataParams) {
                                var obj = dataParams[key];
                                data[key] = {}
                                data[key]['title'] = obj
                                data[key]['type'] = "custom"
                            }
                            data.vars = data.params
                        }
                        
                        data['subject'] = {}
                        if(!data['image'])
                            data['subject']['image'] = req.appSettings['default_notification_image']
                        data['subject']['type'] = data.object_type
                        resolve(data)
                        return
                    }
                    let typeName = data.object_type.replace(/\s$/, '')
                    if (typeName.charAt(typeName.length - 1) == "s") {
                        typeName = typeName.slice(0, -1)
                    }
                    connection.query("SELECT '" + data.object_type + "' as type," + (data.object_type == "members" ? "displayname as title" : "title") + "," + (data.object_type == "members" ? "IF(userdetails.avtar IS NULL OR userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as image," : "IF(" + data.object_type + ".image IS NULL || " + data.object_type + ".image = '','" + req.appSettings[typeName + '_default_photo'] + "'," + data.object_type + ".image) as image,") + column + " as id, " + urlParam + " FROM " + (data.object_type == "members" ? "users" : data.object_type) +leftJOIN+ " WHERE " + column + " = ?", [data.object_id], function (err, results, fields) {
                        if (!err && results) {
                            const itemData = JSON.parse(JSON.stringify(results));
                            const item = itemData[0]
                            data[data.object_type] = item
                            let column = "users.user_id"
                            let urlParam = "username as custom_url"
                            leftJOIN = " LEFT JOIN userdetails ON users.user_id = userdetails.user_id "
                            if (data.subject_type == "channels") {
                                column = "channel_id"
                                urlParam = "custom_url"
                                leftJOIN = ""
                            }
                            let typeName = data.subject_type.replace(/\s$/, '')
                            if (typeName.charAt(typeName.length - 1) == "s") {
                                typeName = typeName.slice(0, -1)
                            }
                            connection.query("SELECT '" + data.subject_type + "' as type," + (data.subject_type != "channels" ? "IF(userdetails.avtar IS NULL OR userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as image" : "IF(" + data.subject_type + ".image IS NULL || " + data.subject_type + ".image = '','" + req.appSettings[typeName + '_default_photo'] + "'," + data.subject_type + ".image) as image") + "," + column + " as id, " + urlParam + " FROM " + data.subject_type +leftJOIN+ " WHERE " + column + " = ?", [data.subject_type], function (err, results, fields) {
                                if (!err && results) {
                                    const subjectData = JSON.parse(JSON.stringify(results));
                                    const subject = subjectData[0]
                                    data["subject"] = subject
                                    let column = "users.user_id"
                                    let urlParam = "username as custom_url"
                                    leftJOIN = " LEFT JOIN userdetails ON users.user_id = userdetails.user_id "

                                    if (data.subject_type == "channels") {
                                        column = "channel_id"
                                        urlParam = "custom_url"
                                        leftJOIN = ""
                                    }
                                    let typeName = data.subject_type.replace(/\s$/, '')
                                    if (typeName.charAt(typeName.length - 1) == "s") {
                                        typeName = typeName.slice(0, -1)
                                    }
                                    connection.query("SELECT '" + data.subject_type + "' as type," + (data.subject_type == "users" ? "displayname as title" : "title") + "," + (data.subject_type == "users" ? "IF(userdetails.avtar IS NULL OR userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as image," : "IF(" + data.subject_type + ".image IS NULL || " + data.subject_type + ".image = '','" + req.appSettings[typeName + '_default_photo'] + "'," + data.subject_type + ".image) as image,") + column + " as id, " + urlParam + " FROM " + data.subject_type +leftJOIN+ " WHERE " + column + " = ?", [data.subject_id], function (err, results, fields) {
                                        if (!err && results) {
                                            const subjectData = JSON.parse(JSON.stringify(results));
                                            const subject = subjectData[0]
                                            data["subject"] = subject
                                            resolve(data)
                                        } else {
                                            resolve(false)
                                        }
                                    })
                                } else {
                                    resolve(false)
                                }
                            })
                        } else {
                            resolve(false)
                        }
                    })
                }
            })
        })
    },
    findAll: function (req, data) {
        return new Promise(function (resolve, reject) {
            if (!req.user && !data.notification_send) {
                resolve(false)
                return false
            }
            req.getConnection(function (err, connection) {
                let owner_id = 0
                if (!data.notification_send && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }

                let condition = []
                let modulesIn = "'members','videos'"

                if(req.query && req.query.packagesExists){
                    modulesIn = modulesIn+",'default'";
                }

                if (req.appSettings["enable_blog"] == 1) {
                    modulesIn = modulesIn + ",'blogs'"
                }
                if (req.appSettings["enable_playlist"] == 1) {
                    modulesIn = modulesIn + ",'playlists'"
                }
                if (req.appSettings["enable_audio"] == 1) {
                    modulesIn = modulesIn + ",'audio'"
                }
                if (req.appSettings["enable_channel"] == 1) {
                    modulesIn = modulesIn + ",'channels'"
                }
                if (req.appSettings["live_stream_start"] == 1) {
                    modulesIn = modulesIn + ",'livestreaming'"
                }
                let sql = "SELECT notifications.*,notificationtypes.body,notificationtypes.vars From notifications LEFT JOIN notificationtypes on notificationtypes.type = notifications.type WHERE notificationtypes.content_type IN (" + modulesIn + ") "

                if (owner_id > 0) {
                    sql += " AND notifications.owner_id = " + owner_id
                }
                if (data.notification_send > 0) {
                    sql += " AND notifications.notification_send = " + (data.notification_send == 2 ? 0 : 1)
                }
                if (data.minid) {
                    condition.push(parseInt(data.minid))
                    sql += " AND notifications.notification_id < ?"
                }
                sql += " ORDER By notification_id DESC "
                if (data.limit) {
                    condition.push(data.limit)
                    sql += " LIMIT ?"
                }
                connection.query(sql, condition, function (err, results, fields) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const notifications = JSON.parse(JSON.stringify(results));
                        resolve(notifications);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    insert: function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                if (!data.owner_id) {
                    resolve(true)
                    return;
                }
                
                connection.query('SELECT notification_id FROM notifications WHERE owner_id = ? AND subject_type = ? AND subject_id = ? AND object_type = ? AND object_id = ? AND type = ?', [data.owner_id, data.subject_type, data.subject_id, data.object_type, data.object_id, data.type], function (err, results, fields) {
                    connection.query('DELETE FROM notifications WHERE owner_id = ? AND subject_type = ? AND subject_id = ? AND object_type = ? AND object_id = ? AND type = ?', [data.owner_id, data.subject_type, data.subject_id, data.object_type, data.object_id, data.type], function (err, data, fields) {
                    });
                    if (data.insert) {
                        let leftJOIN = ""
                        const date = dateTime.create().format("Y-m-d H:M:S")
                        let column = "video_id"
                        if (data.object_type == "channels") {
                            column = "channel_id"
                        } else if (data.object_type == "blogs") {
                            column = "blog_id"
                        } else if (data.object_type == "members") {
                            column = "users.user_id"
                            leftJOIN = " LEFT JOIN userdetails ON users.user_id = userdetails.user_id "

                        } else if (data.object_type == "artists") {
                            column = "artist_id"
                        } else if (data.object_type == "playlists") {
                            column = "playlist_id"
                        } else if (data.object_type == "comments") {
                            column = "comment_id"
                        } else if (data.object_type == "channel_posts") {
                            column = "post_id"
                        }else if (data.object_type == "audio") {
                            column = "audio_id"
                        }
                        //site notifications
                        connection.query('SELECT ' + (data.object_type == "members" ? "users" : data.object_type) + '.' + (data.object_type == "members" ? "user_id" : "owner_id") + ',notificationsettings.type FROM ' + (data.object_type == "members" ? "users" : data.object_type) + leftJOIN+ ' LEFT JOIN notificationsettings ON notificationsettings.owner_id = ' + (data.object_type == "members" ? "users" : data.object_type) + '.' + (data.object_type == "members" ? "user_id" : "owner_id") + ' AND notificationsettings.type = "' + data.type + '" WHERE ' + column + " = ? ", [data.object_id], function (err, results, fields) {
                          
                            if (err)
                                resolve(false)

                            

                            let ownerSame = false
                            let notificationEnable = true
                            if (results && !data.forceInsert) {
                                const item = JSON.parse(JSON.stringify(results));
                                if (item.length > 0) {
                                    if (item[0][data.object_type == "members" ? "user_id" : "owner_id"] == req.user.user_id) {
                                        ownerSame = true
                                    }
                                    if (item[0].type) {
                                        notificationEnable = false
                                    }
                                }
                            }
                            if (!ownerSame && notificationEnable) {
                                let notificationData = { owner_id: data.owner_id, subject_type: data.subject_type, subject_id: data.subject_id, object_type: data.object_type, object_id: data.object_id, type: data.type, creation_date: date, read: 0, is_read: 0 }
                                connection.query('INSERT INTO notifications SET ? ', [notificationData], function (err, results, fields) {
                                    if (err)
                                        resolve(false)
                                    if (results) {
                                        //send notification to user
                                        connection.query("SELECT vars,body FROM notificationtypes WHERE type = ?", [data.type], function (err, resultsType, fields) {
                                            if (!err) {
                                                const typeData = JSON.parse(JSON.stringify(resultsType))[0];
                                                module.exports.getNotification(req, notificationData).then(result => {
                                                    if (result) {
                                                        result.notification_id = results.insertId
                                                        result.vars = typeData.vars
                                                        result.body = typeData.body
                                                        socketio.getIO().emit('notifications', {
                                                            owner_id: data.owner_id,
                                                            notification: result
                                                        });
                                                    }

                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })

                        //email notifications
                        connection.query('SELECT ' + (data.object_type == "members" ? "users" : data.object_type) + '.' + (data.object_type == "members" ? "user_id" : "owner_id") + ',emailsettings.type FROM ' + (data.object_type == "members" ? "users" : data.object_type) + leftJOIN+ ' LEFT JOIN emailsettings ON emailsettings.owner_id = ' + (data.object_type == "members" ? "users" : data.object_type) + '.' + (data.object_type == "members" ? "user_id" : "owner_id") + ' AND emailsettings.type = "' + data.type + '" AND emailsettings.email = 0 WHERE ' + column + " = ? ", [data.object_id], function (err, results, fields) {
                            if (err)
                                resolve(false)
                            let ownerSame = false
                            let notificationEnable = true
                            if (results && !data.forceInsert) {
                                const item = JSON.parse(JSON.stringify(results));
                                if (item.length > 0) {
                                    if (item[0][data.object_type == "members" ? "user_id" : "owner_id"] == req.user.user_id) {
                                        ownerSame = true
                                    }
                                    if (item[0].type) {
                                        notificationEnable = false
                                    }
                                }
                            }
                            if (!ownerSame && notificationEnable) {
                                let notificationData = { owner_id: data.owner_id, subject_type: data.subject_type, subject_id: data.subject_id, object_type: data.object_type, object_id: data.object_id, type: data.type, creation_date: date, read: 0, is_read: 0 }
                                connection.query("SELECT * FROM users left join userdetails ON userdetails.user_id = users.user_id WHERE users.user_id = ?", [notificationData.owner_id], function (err, ownerData, fields) {
                                    if (!err) {
                                        //send notification to user
                                        connection.query("SELECT vars,type FROM emailtemplates WHERE type = ?", [data.type], function (err, resultsType, fields) {
                                            if (!err) {
                                                const typeData = JSON.parse(JSON.stringify(resultsType))[0];
                                                module.exports.getNotification(req, notificationData).then(result => {
                                                    if (result) {
                                                        result.vars = typeData.vars
                                                        result.type = typeData['type']
                                                        result.ownerEmail = ownerData[0]
                                                        result.toName = ownerData[0].displayname
                                                        result.toEmail = ownerData[0].email
                                                        emailFunction.sendMessage(req, result)
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })

                    }else{
                        if(results){
                            const id = JSON.parse(JSON.stringify(results));
                            if(id && id.length){
                            //delete notifications
                                socketio.getIO().emit('deleteNotifications', {
                                    owner_id: data.owner_id,
                                    notification_id: id[0].notification_id
                                });
                            }
                        }
                    }
                })
            })
            resolve(true)
        })

    },
    insertFollowNotifications: function (req, data) {
        return new Promise(function (resolve) {
            req.getConnection(function (_, connection) {
                const date = dateTime.create().format("Y-m-d H:M:S")
                connection.query("INSERT INTO notifications (`owner_id`,`subject_type`,`subject_id`,`object_type`,`object_id`,`type`,`notification_send`,`creation_date`) SELECT owner_id,?,?,?,?,?,0,? FROM `followers` WHERE id = ? AND type = ? ", [data.subject_type, data.subject_id, data.object_type, data.object_id, data.type, date, data.subject_id, data.subject_type == "users" ? "members" : data.subject_type], function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
            })
        })
    }
}
