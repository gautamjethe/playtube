const privacyModel = require("../models/privacy")
const commonFunction = require("../functions/commonFunctions");
module.exports = {
    getChannelSupporters:function(req,data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {

                let owner_id = 0
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }

                const condition = []
                let sql = "SELECT followers.follower_id,userdetails.*,likes.like_dislike,favourites.favourite_id,IF(userdetails.avtar IS NULL || userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = CASE WHEN userdetails.gender = 'male' THEN 'default_mainphoto' WHEN userdetails.gender = 'female'  THEN 'default_femalemainphoto' END  AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,IF(userdetails.cover IS NULL OR userdetails.cover = '',(SELECT value FROM `level_permissions` WHERE name = \"default_coverphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.cover) as cover FROM subscriptions LEFT JOIN users ON users.user_id = subscriptions.owner_id LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN followers on followers.id = users.user_id AND followers.owner_id = " + owner_id + " AND followers.type = 'members' LEFT JOIN likes ON likes.id = users.user_id AND likes.type = 'members'  AND likes.owner_id =  " + owner_id + "  LEFT JOIN favourites ON (favourites.id = users.user_id AND favourites.type = 'members' AND favourites.owner_id = " + owner_id + ") where 1 = 1 "

                sql += " AND users.active = 1 AND users.approve = 1 "
                condition.push("channel_support")
                sql += " AND subscriptions.type = ?"
                condition.push(data.channel_id)
                sql += " AND subscriptions.id = ?"
                var dt = dateTime.create();
                var formatted = dt.format('Y-m-d H:M:S');
                condition.push(formatted)
                sql += " AND (subscriptions.expiration_date IS NULL || subscriptions.expiration_date >= ?)"
                sql += " AND (subscriptions.status = 'completed' || subscriptions.status = 'approved' || subscriptions.status = 'active') "
                
                if (data.limit) {
                    condition.push(data.limit)
                    sql += " LIMIT ?"
                }

                if (data.offset) {
                    condition.push(data.offset)
                    sql += " OFFSET ?"
                } 
                connection.query(sql, condition, function (err, results, fields) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const supporters = JSON.parse(JSON.stringify(results));
                        resolve(supporters);
                    } else {
                        resolve(false);
                    }
                })

            })
        })

    },
    getSupportStats: function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                let condition = []
                let sql = ""

                if (data.criteria == "today") {
                    let match = { "00 AM": 0, "01 AM": 0, "02 AM": 0, "03 AM": 0, "04 AM": 0, "05 AM": 0, "06 AM": 0, "07 AM": 0, "08 AM": 0, "09 AM": 0, "10 AM": 0, "11 AM": 0, "12 PM": 0, "01 PM": 0, "02 PM": 0, "03 PM": 0, "04 PM": 0, "05 PM": 0, "06 PM": 0, "07 PM": 0, "08 PM": 0, "09 PM": 0, "10 PM": 0, "11 PM": 0 }
                    var dt = dateTime.create();
                    var currentDay = dt.format('Y-m-d') + ' 00:00:00';
                    var d = new Date();
                    let dd = dateTime.create(d)
                    let nextDate = dd.format('Y-m-d') + " 23:59:00"
                    
                    condition.push(currentDay)
                    condition.push(nextDate)

                    sql += "SELECT COUNT(*) as count,SUM(price) as amount,creation_date FROM transactions WHERE  creation_date >= ? AND creation_date <= ? AND (state = 'approved' || state = 'completed') AND type = 'channel_support' "
                    if(data.video_id){
                        condition.push(data.video_id)
                        sql += " AND id = ?"
                    }
                    if(data.user){
                        condition.push(data.user.user_id)
                        sql += " AND owner_id = ?"
                    }
                    sql += " GROUP BY DATE_FORMAT(creation_date,'%Y-%m-%d %h')"

                    req.getConnection(function (err, connection) {
                        connection.query(sql, condition, function (err, results, fields) {
                            
                            if (err)
                                resolve(false)
                            const resultArray = {}
                            const spentArray = {}
                            if (results) {

                                let spent = []
                                let result = []

                                Object.keys(results).forEach(function (key) {
                                    let result = JSON.parse(JSON.stringify(results[key]))
                                    const H = dateTime.create(result.creation_date).format('I p')
                                    resultArray[H] = result.count
                                    spentArray[H] = result.amount
                                })

                                Object.keys(match).forEach(function (key) {
                                    if (resultArray[key]) {
                                        result.push(resultArray[key])
                                        spent.push(spentArray[key])
                                        //match[key.toString()] = resultArray[key]
                                    } else {
                                        result.push(0)
                                        spent.push(0)
                                    }
                                });
                                resolve({ spent: spent, result: result, xaxis: Object.keys(match),yaxis:dateTime.create(new Date()).format('W')})
                            } else {
                                resolve(false);
                            }
                        })
                    });
                } else if (data.criteria == "this_month") {
                    var dt = dateTime.create();
                    var currentYear = dt.format('Y');
                    var currentMonth = dt.format('m');
                    let daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

                    var date = new Date();
                    var firstDay = dateTime.create(new Date(date.getFullYear(), date.getMonth(), 1)).format("Y-m-d") + " 00:00:00";
                    var lastDay = dateTime.create(new Date(date.getFullYear(), date.getMonth() + 1, 0)).format("Y-m-d") + " 23:59:00";

                    let match = ""
                    if (daysInMonth == 31) {
                        match = { "01 ": 0, "02 ": 0, "03 ": 0, "04 ": 0, "05 ": 0, "06 ": 0, "07 ": 0, "08 ": 0, "09 ": 0, "10 ": 0, "11 ": 0, "12 ": 0, "13 ": 0, "14 ": 0, "15 ": 0, "16 ": 0, "17 ": 0, "18 ": 0, "19 ": 0, "20 ": 0, "21 ": 0, "22 ": 0, "23 ": 0, "24 ": 0, "25 ": 0, "26 ": 0, "27 ": 0, "28 ": 0, "29 ": 0, "30 ": 0, "31 ": 0 }
                    } else if (daysInMonth == 30) {
                        match = { "01 ": 0, "02 ": 0, "03 ": 0, "04 ": 0, "05 ": 0, "06 ": 0, "07 ": 0, "08 ": 0, "09 ": 0, "10 ": 0, "11 ": 0, "12 ": 0, "13 ": 0, "14 ": 0, "15 ": 0, "16 ": 0, "17 ": 0, "18 ": 0, "19 ": 0, "20 ": 0, "21 ": 0, "22 ": 0, "23 ": 0, "24 ": 0, "25 ": 0, "26 ": 0, "27 ": 0, "28 ": 0, "29 ": 0, "30 ": 0 }
                    } else if (daysInMonth == 29) {
                        match = { "01 ": 0, "02 ": 0, "03 ": 0, "04 ": 0, "05 ": 0, "06 ": 0, "07 ": 0, "08 ": 0, "09 ": 0, "10 ": 0, "11 ": 0, "12 ": 0, "13 ": 0, "14 ": 0, "15 ": 0, "16 ": 0, "17 ": 0, "18 ": 0, "19 ": 0, "20 ": 0, "21 ": 0, "22 ": 0, "23 ": 0, "24 ": 0, "25 ": 0, "26 ": 0, "27 ": 0, "28 ": 0, "29 ": 0}
                    } else if (daysInMonth == 28) {
                        match = { "01 ": 0, "02 ": 0, "03 ": 0, "04 ": 0, "05 ": 0, "06 ": 0, "07 ": 0, "08 ": 0, "09 ": 0, "10 ": 0, "11 ": 0, "12 ": 0, "13 ": 0, "14 ": 0, "15 ": 0, "16 ": 0, "17 ": 0, "18 ": 0, "19 ": 0, "20 ": 0, "21 ": 0, "22 ": 0, "23 ": 0, "24 ": 0, "25 ": 0, "26 ": 0, "27 ": 0, "28 ": 0}
                    }

                    condition.push(firstDay)
                    condition.push(lastDay)

                    sql += "SELECT COUNT(*) as count,SUM(price) as amount,creation_date FROM transactions WHERE  creation_date >= ? AND creation_date <= ? AND (state = 'approved' || state = 'completed') AND type = 'channel_support' "
                    if(data.video_id){
                        condition.push(data.video_id)
                        sql += " AND id = ?"
                    }
                    if(data.user){
                        condition.push(data.user.user_id)
                        sql += " AND owner_id = ?"
                    }
                    sql += " GROUP BY DATE_FORMAT(creation_date,'%Y-%m-%d')"

                    req.getConnection(function (err, connection) {
                        connection.query(sql, condition, function (err, results, fields) {
                            if (err)
                                resolve(false)
                            if (results) {
                                let spent = []
                                let result = []
                                const resultArray = {}
                                const spentArray = {}
                                Object.keys(results).forEach(function (key) {
                                    let result = JSON.parse(JSON.stringify(results[key]))
                                    const H = dateTime.create(result.creation_date).format('d')
                                    resultArray[H+" "] = result.count
                                    spentArray[H+" "] = result.amount
                                })
                                Object.keys(match).forEach(function (key) {
                                    if (resultArray[key]) {
                                        result.push(resultArray[key])
                                        spent.push(spentArray[key])
                                    }else{
                                        result.push(0)
                                        spent.push(0)
                                    }
                                });
                                resolve({ spent: spent, result: result, xaxis: Object.keys(match),yaxis:dateTime.create(new Date()).format('f') })
                            } else {
                                resolve(false);
                            }
                        })
                    });

                } else if (data.criteria == "this_week") {
                    let match = { "Saturday": 0, "Sunday": 0, "Monday": 0, "Tuesday": 0, "Wednesday": 0, "Thursday": 0, "Friday": 0 }
                    var dt = dateTime.create();
                    var currentDay = dt.format('W');
                    var weekStart = ""
                    var weekEnd = ""

                    if (currentDay != "Saturday") {
                        var d = new Date();
                        // set to Monday of this week
                        d.setDate(d.getDate() - (d.getDay() + 6) % 7);
                        // set to previous Saturday
                        d.setDate(d.getDate() - 2);
                        weekStart = d
                    } else {
                        weekStart = new Date()
                    }

                    if (currentDay == "Friday") {
                        weekEnd = new Date()
                    } else {
                        var d = new Date();
                        var resultDate = new Date(d.getTime());
                        resultDate.setDate(d.getDate() + (7 + 5 - d.getDay()) % 7);
                        weekEnd = resultDate
                    }
                    var weekStartObj = dateTime.create(weekStart);
                    var weekObj = weekStartObj.format('Y-m-d');
                    var weekEndObj = dateTime.create(weekEnd);
                    var weekendObj = weekEndObj.format('Y-m-d');
                    match = { "Saturday": 0, "Sunday": 0, "Monday": 0, "Tuesday": 0, "Wednesday": 0, "Thursday": 0, "Friday": 0 }
                    condition.push(weekObj)
                    condition.push(weekendObj)

                    sql += "SELECT COUNT(*) as count,SUM(price) as amount,creation_date FROM transactions WHERE  creation_date >= ? AND creation_date <= ? AND (state = 'approved' || state = 'completed') AND type = 'channel_support' "
                    if(data.video_id){
                        condition.push(data.video_id)
                        sql += " AND id = ?"
                    }
                    if(data.user){
                        condition.push(data.user.user_id)
                        sql += " AND owner_id = ?"
                    }
                    sql += " GROUP BY DATE_FORMAT(creation_date,'%d')"
                    req.getConnection(function (err, connection) {
                        connection.query(sql, condition, function (err, results, fields) {
                            if (err)
                                resolve(false)
                            if (results) {
                                let spent = []
                                let result = []
                                const resultArray = {}
                                const spentArray = {}

                                Object.keys(results).forEach(function (key) {
                                    let result = JSON.parse(JSON.stringify(results[key]))
                                    const H = dateTime.create(result.creation_date).format('W')
                                    resultArray[H] = result.count
                                    spentArray[H] = result.amount
                                })
                                Object.keys(match).forEach(function (key) {
                                    if (resultArray[key]) {
                                        result.push(resultArray[key])
                                        spent.push(spentArray[key])
                                    }else{
                                        result.push(0)
                                        spent.push(0)
                                    }
                                });
                                resolve({ spent: spent, result: result, xaxis: Object.keys(match),yaxis:weekObj +" - "+weekendObj })
                            } else {
                                resolve(false);
                            }
                        })
                    });
                } else if (data.criteria == "this_year") {
                    let match = { "Jan": 0, "Feb": 0, "Mar": 0, "Apr": 0, "May": 0, "Jun": 0, "Jul": 0, "Aug": 0, "Sep": 0, "Oct": 0, "Nov": 0, "Dec": 0 }
                    var d = new Date();
                    const start = d.getFullYear() + "-01-01 00:00:00"
                    const end = d.getFullYear() + "-12-31 23:59:00"
                    condition.push(start)
                    condition.push(end)

                    sql += "SELECT COUNT(*) as count,SUM(price) as amount,creation_date FROM transactions WHERE  creation_date >= ? AND creation_date <= ? AND (state = 'approved' || state = 'completed') AND type = 'channel_support' "
                    if(data.video_id){
                        condition.push(data.video_id)
                        sql += " AND id = ?"
                    }
                    if(data.user){
                        condition.push(data.user.user_id)
                        sql += " AND owner_id = ?"
                    }
                    sql += " GROUP BY DATE_FORMAT(creation_date,'%m')"
                    req.getConnection(function (err, connection) {
                        connection.query(sql, condition, function (err, results, fields) {
                            if (err)
                                reject(err)
                            if (results) {
                                let spent = []
                                let result = []
                                const resultArray = {}
                                const spentArray = {}
                                Object.keys(results).forEach(function (key) {
                                    let result = JSON.parse(JSON.stringify(results[key]))
                                    const H = dateTime.create(result.creation_date).format('n')
                                    resultArray[H] = result.count
                                    spentArray[H] = result.amount
                                })
                                Object.keys(match).forEach(function (key) {
                                    if (resultArray[key]) {
                                        result.push(resultArray[key])
                                        spent.push(spentArray[key])
                                    }else{
                                        result.push(0)
                                        spent.push(0)
                                    }
                                });
                                resolve({ spent: spent, result: result, xaxis: Object.keys(match),yaxis:dateTime.create(new Date()).format('Y') })
                            } else {
                                resolve("");
                            }
                        })
                    });
                }
            })
        });
    },
    findById: function (id, req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT *,channels.cover as channelcover,channels.image as channelimage, IF(channels.image IS NULL || channels.image = "","' + req.appSettings['channel_default_photo'] + '",channels.image) as image,IF(channels.cover IS NULL || channels.cover = "","' + req.appSettings['channel_default_cover_photo'] + '",channels.cover) as cover FROM channels WHERE channel_id = ?', [parseInt(id)], function (err, results) {
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
    deletePost:function(id,req){
        return new Promise(function (resolve) {
            req.getConnection(function (err, connection) {
                connection.query("SELECT * FROM channel_posts WHERE post_id = ?", [parseInt(id)], function (err, results) {
                    const post = JSON.parse(JSON.stringify(results))[0];
                    connection.query("DELETE FROM channel_posts WHERE post_id = ?", [id], function (err, results) {
                        if (err)
                            resolve(false)
                        if (results) {
                            commonFunction.deleteImage(req,'',"","",post);
                            resolve(true)
                        } else {
                            resolve("");
                        }
                    })
                })
            })
        });
    },
    userChannelUploadCount: function (req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT COUNT(channel_id) as totalChannels FROM channels WHERE  owner_id = ?', [parseInt(req.user.user_id)], function (err, results) {
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
    delete: function (id, req) {
        return new Promise(function (resolve) {
            req.getConnection(function (err, connection) {
                connection.query("SELECT * FROM channels WHERE channel_id = ?", [parseInt(id)], function (err, results) {
                    const channel = JSON.parse(JSON.stringify(results))[0];
                    connection.query("DELETE FROM channels WHERE channel_id = ?", [id], function (err, results) {
                        if (err)
                            resolve(false)
                        if (results) {
                            commonFunction.deleteImage(req,'',"","",channel);
                            connection.query("DELETE FROM channel_posts WHERE channel_id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM channelplaylists WHERE channel_id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM channelvideos WHERE channel_id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM comments WHERE type = 'channels' && id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM favourites WHERE type = 'channels' && id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM likes WHERE type = 'channels' && id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM recently_viewed WHERE type = 'channels' && id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM ratings WHERE type = 'channels' && id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM notifications WHERE (object_type = 'channels' && object_id = ?) OR (subject_type = 'channels' && object_id = ?)", [parseInt(id),parseInt(id)], function () { })
                            connection.query("DELETE FROM reports WHERE type = ? AND id = ?", ["channels", channel.custom_url], function () {
                            })
                            resolve(true)
                        } else {
                            resolve("");
                        }
                    })
                })
            })
        });
    },
    getFollowedChannels: async function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(async function (err, connection) {
                let condition = []
                condition.push(req.user.user_id)
                let sql = "SELECT channel_id,image,title,custom_url FROM followers INNER JOIN channels ON channels.channel_id = followers.id WHERE followers.type = 'channels' AND followers.owner_id = ? ORDER BY followers.creation_date DESC"
                
                if(data.limit){
                    sql += " LIMIT "+data.limit
                }
                connection.query(sql, condition, function (err, results) {
                    if (err)
                        reject(err)
                    if (results) {
                        const channels = JSON.parse(JSON.stringify(results));
                        resolve(channels);
                    } else {
                        resolve(false);
                    }
                })
            })
        })
    },
    getChannels: async function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(async function (err, connection) {
                let condition = []
                let owner_id = 0
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }
                let customSelect = ""
                if (data.orderby == "random") {
                    customSelect = ' FLOOR(1 + RAND() * channel_id) as randomSelect, '
                }
                let sql = 'SELECT followers.follower_id,channels.*,channels.cover as channelcover,channels.image as channelimage,'+customSelect+'likes.like_dislike,userdetails.displayname,userdetails.username,userdetails.verified,channels.verified as channelverified,IF(channels.image IS NULL || channels.image = "","' + req.appSettings['channel_default_photo'] + '",channels.image) as image,IF(channels.cover IS NULL || channels.cover = "","' + req.appSettings['channel_default_cover_photo'] + '",channels.cover) as cover,IF(userdetails.avtar IS NULL || userdetails.avtar = "",(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,watchlaters.watchlater_id,favourites.favourite_id FROM channels '
               
                
                sql += ' LEFT JOIN users on users.user_id = channels.owner_id LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN likes ON likes.id = channels.channel_id AND likes.type = "channels"  AND likes.owner_id =  ' + owner_id + ' LEFT JOIN watchlaters ON watchlaters.id = channels.channel_id AND watchlaters.owner_id = ' + owner_id + ' LEFT JOIN favourites ON (favourites.id = channels.channel_id AND favourites.type = "channels" AND favourites.owner_id = ' + owner_id + ') LEFT JOIN followers ON (followers.id = channels.channel_id AND followers.type = "channels" AND followers.owner_id = ' + owner_id + ')  '

                let orderbyField = false
                if (data.recentlyViewed) {
                    condition.push(parseInt(data.owner_id))
                    orderbyField = " recently_viewed.creation_date DESC "
                    sql += " INNER JOIN recently_viewed ON channels.channel_id = recently_viewed.id AND recently_viewed.owner_id = ? AND recently_viewed.type='channels' "
                }
                if (data.myrated) {
                    orderbyField = " ratings.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN ratings ON channels.channel_id = ratings.id AND ratings.owner_id = ? AND ratings.type='channels' "
                }
                if (data.myfav) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN favourites as f ON channels.channel_id = f.id AND f.owner_id = ? AND f.type='channels' "
                }
                if (data.mylike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON channels.channel_id = l.id AND l.owner_id = ? AND l.type='channels' AND l.like_dislike = 'like' "
                }
                if (data.mydislike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON channels.channel_id = l.id AND l.owner_id = ? AND l.type='channels' AND l.like_dislike = 'dislike' "
                }

                if (data.mycommented) {
                    orderbyField = " comments.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN comments ON channels.custom_url = comments.id AND comments.owner_id = ? AND comments.type='channels' "
                }

                if (data.mySubscribed) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN followers as f ON channels.channel_id = f.owner_id AND f.id = ? AND f.type='channels' "
                }
                if (data.iSubscribed) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN followers as f ON channels.channel_id = f.id AND f.owner_id = ? AND f.type='channels' "
                }

                sql += ' WHERE 1=1 '
                sql += " AND users.active = 1 AND users.approve = 1 "

                if (!data.myContent) {
                    sql += ' AND channels.approve = 1 AND channels.search = 1 '
                    if (!req.session.adult_allow && req.appSettings['channel_adult'] == 1) {
                       // sql += " AND channels.adult = 0 "
                    }
                }
                await privacyModel.checkSQL(req,'channel','channels','channel_id').then(result => {
                    if(result){
                        sql += " AND ( "+result+" )"
                    }
                })
                if (data.title) {
                    condition.push(data.title.toLowerCase())
                    sql += " AND LOWER(channels.title) LIKE CONCAT('%', ?,  '%')"
                }
                if (data.artist_id) {
                    condition.push(data.artist_id)
                    sql += " AND FIND_IN_SET(?,channels.artists)"
                }
                if (data.owner_id && !data.customSearch && !data.myCustom) {
                    condition.push(parseInt(data.owner_id))
                    sql += " AND channels.owner_id = ?"
                }
                
                if (data.verified) {
                    sql += " AND channels.verified = 1"
                }

                if (data.is_featured) {
                    condition.push(parseInt(data.is_featured))
                    sql += " AND channels.is_featured = ?"
                }
                if (data.is_not_hot) {
                    condition.push(1)
                    sql += " AND channels.is_hot != ?"
                }
                if (data.is_not_featured) {
                    condition.push(1)
                    sql += " AND channels.is_featured != ?"
                }
                if (data.is_not_sponsored) {
                    condition.push(1)
                    sql += " AND channels.is_sponsored != ?"
                }
                if (data.is_hot) {
                    condition.push(parseInt(data.is_hot))
                    sql += " AND channels.is_hot = ?"
                }
                if (data.is_sponsored) {
                    condition.push(parseInt(data.is_sponsored))
                    sql += " AND channels.is_sponsored = ?"
                }
                if (data.offtheday) {
                    condition.push(data.offtheday)
                    sql += " AND channels.offtheday = ?"
                }
                if (data.not_channel_id) {
                    condition.push(parseInt(data.not_channel_id))
                    sql += " AND channels.channel_id != ?"
                }
                if (data.category_id) {
                    let customBraces = ""
                    if (data.tags && data.related) {
                        customBraces = " ( "
                    }
                    condition.push(parseInt(data.category_id))
                    sql += " AND " + customBraces + " channels.category_id = ?"
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
                    sql += " AND channels.subcategory_id = ?"
                }
                if (data.subsubcategory_id) {
                    condition.push(parseInt(data.subsubcategory_id))
                    sql += " AND channels.subsubcategory_id = ?"
                }
                if (data.rating) {
                    condition.push(data.rating)
                    sql += " AND channels.rating = ?"
                }

                if (data.custom_url) {
                    condition.push(data.custom_url)
                    sql += " AND channels.custom_url =?"
                }
                if (data.mycommented) {
                    sql += " GROUP BY channels.channel_id "
                }
                if (data.orderby == "random") {
                    sql += " ORDER BY randomSelect DESC "
                } else if (orderbyField) {
                    sql += " ORDER BY " + orderbyField
                } else if (data.orderby) {
                    sql += " ORDER BY " + data.orderby
                } else {
                    sql += " ORDER BY channels.channel_id desc "
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
                        reject(err)
                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        const channels = []
                        if(level && level.length){
                            level.forEach(channel => {
                                delete channel.password
                                channels.push(channel)
                            })
                            resolve(channels)
                        }else
                            resolve(level);
                    } else {
                        resolve("");
                    }
                })
            })
        })
    },
    findByCustomUrl: function (id, req, res, allowData = false) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT *,channels.cover as channelcover,channels.image as channelimage,IF(channels.image IS NULL || channels.image = "","' + req.appSettings['channel_default_photo'] + '",channels.image) as image,IF(channels.cover IS NULL || channels.cover = "","' + req.appSettings['channel_default_cover_photo'] + '",channels.cover) as cover FROM channels WHERE custom_url = ?', [id], function (err, results) {
                    if (err)
                        reject(false)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        let channel = level[0]
                        if (!allowData && channel) {
                            delete channel['password']
                        }
                        if (channel) {
                            //remove disabled settings
                            if (req.appSettings['channel_favourite'] != 1) {
                                delete channel['favourite_count']
                            }
                            if (req.appSettings['channel_rating'] != 1) {
                                delete channel['rating']
                            }
                            if (req.appSettings['channel_featured'] != 1) {
                                delete channel['is_featured']
                            }
                            if (req.appSettings['channel_comment'] != 1) {
                                delete channel['comment_count']
                            }
                            if (req.appSettings['channel_like'] != 1) {
                                delete channel['like_count']
                            }
                            if (req.appSettings['channel_dislike'] != 1) {
                                delete channel['dislike_count']
                            }
                            if (req.appSettings['channel_sponsored'] != 1) {
                                delete channel['is_sponsored']
                            }
                            if (req.appSettings['channel_hot'] != 1) {
                                delete channel['is_hot']
                            }
                            if (req.appSettings['channel_adult'] != 1) {
                                delete channel['adult']
                            }
                            if (req.appSettings['channel_verified'] != 1) {
                                delete channel['verified']
                            }
                        }
                        resolve(channel);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    findAllCommunity:function(chanel_id,req,res,limit,offset,post_id){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){

                let owner_id = 0
                if(req.user && req.user.user_id){
                    owner_id = parseInt(req.user.user_id)
                }
                let sql = 'SELECT channel_posts.*,likes.like_dislike,channels.custom_url as channel_custom_url,channels.title as channel_name,IF(channels.image IS NULL || channels.image = "","' + req.appSettings['channel_default_photo'] + '",channels.image) as avtar FROM channel_posts '
                
                sql += " INNER JOIN users on users.user_id = channel_posts.owner_id INNER JOIN channels ON channels.channel_id = channel_posts.channel_id LEFT JOIN likes ON likes.id = channel_posts.post_id AND likes.type = 'channel_posts'  AND likes.owner_id =  "+owner_id+"    "+ ( post_id == 0 && chanel_id == 0 ? "" :  ( post_id ? " WHERE channel_posts.post_id = ? " : " WHERE channel_posts.channel_id = ? "))
                sql += " ORDER BY channel_posts.creation_date DESC "
                sql += "limit "+limit +" offset "+offset
                connection.query(sql ,[post_id ? post_id : chanel_id],function(err,results,fields)
                {
                    if(err)
                    resolve(false)
                    if(results){
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    insertCommunityPost: function(data,req){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('INSERT IGNORE INTO channel_posts ( `channel_id`, `body`, `image`, `creation_date`,`owner_id`) VALUES (?,?,?,?,?)',data,function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
}
