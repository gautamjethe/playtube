const NodeCache = require("node-cache");
const myCache = new NodeCache();
const globalModel = require("../../models/globalModel")
const dateTime = require("node-datetime")
exports.index = async (req, res, next) => {
    const url = req.url
    let dataCounts = {}
    if (url == "/") {
        var cachedData = myCache.get("admin_dashboard_videos")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM videos WHERE  videos.completed = 1 AND custom_url != '' ", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.videos = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_videos', result[0].items ? result[0].items : 0, 300)
                }
            })
        } else {
            dataCounts.videos = cachedData
        }
         cachedData = myCache.get("admin_dashboard_channels")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM channels", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.channels = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_channels', result[0].items ? result[0].items : 0, 350)
                }
            })
        } else {
            dataCounts.channels = cachedData
        }

         cachedData = myCache.get("admin_dashboard_playlist")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM playlists", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.playlists = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_playlist', result[0].items ? result[0].items : 0, 400)
                }
            })
        } else {
            dataCounts.playlists = cachedData
        }

         cachedData = myCache.get("admin_dashboard_users")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM users", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.users = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_users', result[0].items ? result[0].items : 0, 300)
                }
            })
        } else {
            dataCounts.users = cachedData
        }

         cachedData = myCache.get("admin_dashboard_blogs")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM blogs", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.blogs = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_blogs', result[0].items ? result[0].items : 0, 400)
                }
            })
        } else {
            dataCounts.blogs = cachedData
        }

         cachedData = myCache.get("admin_dashboard_advertisements")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM advertisements_user", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.advertisements = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_advertisements', result[0].items ? result[0].items : 0, 500)
                }
            })
        } else {
            dataCounts.advertisements = cachedData
        }

         cachedData = myCache.get("admin_dashboard_reports")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM reports", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.reports = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_reports', result[0].items ? result[0].items : 0, 600)
                }
            })
        } else {
            dataCounts.reports = cachedData
        }

         cachedData = myCache.get("admin_dashboard_subscriptions")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM subscriptions WHERE gateway_profile_id IS NOT NULL", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.subscriptions = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_subscriptions', result[0].items ? result[0].items : 0, 400)
                }
            })
        } else {
            dataCounts.subscriptions = cachedData
        }

         cachedData = myCache.get("admin_dashboard_comments")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM comments", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.comments = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_comments', result[0].items ? result[0].items : 0, 300)
                }
            })
        } else {
            dataCounts.comments = cachedData
        }

         cachedData = myCache.get("admin_dashboard_likes")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM likes WHERE like_dislike = 'like'", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.likes = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_likes', result[0].items ? result[0].items : 0, 320)
                }
            })
        } else {
            dataCounts.likes = cachedData
        }

         cachedData = myCache.get("admin_dashboard_dislikes")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM likes WHERE like_dislike = 'dislike'", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.dislikes = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_dislikes', result[0].items ? result[0].items : 0, 320)
                }
            })
        } else {
            dataCounts.dislikes = cachedData
        }

         cachedData = myCache.get("admin_dashboard_favourites")
        if (!cachedData) {
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM favourites", []).then(results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    dataCounts.favourites = result[0].items ? result[0].items : 0
                    myCache.set('admin_dashboard_favourites', result[0].items ? result[0].items : 0, 320)
                }
            })
        } else {
            dataCounts.favourites = cachedData
        }
        let statsData = {}
        var cachedDataUser = myCache.get("admin_dashboard_statsusers")
        //get users stats this year
        let match = { "Jan": 0, "Feb": 0, "Mar": 0, "Apr": 0, "May": 0, "Jun": 0, "Jul": 0, "Aug": 0, "Sep": 0, "Oct": 0, "Nov": 0, "Dec": 0 }
        let condition = []
        var d = new Date();
        const start = d.getFullYear() + "-01-01 00:00:00"
        const end = d.getFullYear() + "-12-31 23:59:00"
        condition.push(start)
        condition.push(end)
        if (!cachedDataUser) {
            let sql = ""
            sql += "SELECT COUNT(*) as items,creation_date FROM users WHERE creation_date >= ? AND creation_date <= ?  "
            sql += " GROUP BY DATE_FORMAT(creation_date,'%m')"
            req.getConnection(function (err, connection) {
                connection.query(sql, condition, function (err, results, fields) {
                    if (results) {
                        const resultArray = {}
                        const finalArray = []
                        Object.keys(results).forEach(function (key) {
                            let result = JSON.parse(JSON.stringify(results[key]))
                            const H = dateTime.create(result.creation_date).format('n')
                            resultArray[H] = result.items
                        })
                        Object.keys(match).forEach(function (key) {
                            let monthArray = []
                            monthArray.push(key)
                            if (resultArray[key]) {
                                monthArray.push(resultArray[key])
                            } else {
                                monthArray.push(0)
                            }
                            finalArray.push(monthArray)
                        });
                         myCache.set("admin_dashboard_statsusers",finalArray,300)
                         statsData.users = finalArray
                    }
                })
            });
        }else{
            statsData.users = cachedDataUser
        }
        
        //get videos
        var cachedDataVideos = myCache.get("admin_dashboard_statsvideos")
        if (!cachedDataVideos) {
            let sql = ""
            sql += "SELECT COUNT(*) as items,creation_date FROM videos WHERE custom_url != ''  AND creation_date >= ? AND creation_date <= ?  "
            sql += " GROUP BY DATE_FORMAT(creation_date,'%m')"
            req.getConnection(function (err, connection) {
                connection.query(sql, condition, function (err, results, fields) {
                    if (results) {
                        const resultArray = {}
                        const finalArray = []
                        Object.keys(results).forEach(function (key) {
                            let result = JSON.parse(JSON.stringify(results[key]))
                            const H = dateTime.create(result.creation_date).format('n')
                            resultArray[H] = result.items
                        })
                        Object.keys(match).forEach(function (key) {
                            let monthArray = []
                            monthArray.push(key)
                            if (resultArray[key]) {
                                monthArray.push(resultArray[key])
                            } else {
                                monthArray.push(0)
                            }
                            finalArray.push(monthArray)
                        });
                         myCache.set("admin_dashboard_statsvideos",finalArray,300)
                         statsData.videos = finalArray
                    }
                })
            });
        }else{
            statsData.videos = cachedDataVideos
        }
        //get channels
        var cachedDataChannels= myCache.get("admin_dashboard_statschannels")
        if (!cachedDataChannels) {
            let sql = ""
            sql += "SELECT COUNT(*) as items,creation_date FROM channels WHERE creation_date >= ? AND creation_date <= ?  "
            sql += " GROUP BY DATE_FORMAT(creation_date,'%m')"
            req.getConnection(function (err, connection) {
                connection.query(sql, condition, function (err, results, fields) {
                    if (results) {
                        const resultArray = {}
                        const finalArray = []
                        Object.keys(results).forEach(function (key) {
                            let result = JSON.parse(JSON.stringify(results[key]))
                            const H = dateTime.create(result.creation_date).format('n')
                            resultArray[H] = result.items
                        })
                        Object.keys(match).forEach(function (key) {
                            let monthArray = []
                            monthArray.push(key)
                            if (resultArray[key]) {
                                monthArray.push(resultArray[key])
                            } else {
                                monthArray.push(0)
                            }
                            finalArray.push(monthArray)
                        });
                         myCache.set("admin_dashboard_statschannels",finalArray,300)
                         statsData.channels = finalArray
                    }
                })
            });
        }else{
            statsData.channels = cachedDataChannels
        }
        //get blogs
        var cachedDataBlogs = myCache.get("admin_dashboard_statsblogs")
        if (!cachedDataBlogs) {
            let sql = ""
            sql += "SELECT COUNT(*) as items,creation_date FROM blogs WHERE creation_date >= ? AND creation_date <= ?  "
            sql += " GROUP BY DATE_FORMAT(creation_date,'%m')"
            req.getConnection(function (err, connection) {
                connection.query(sql, condition, function (err, results, fields) {
                    if (results) {
                        const resultArray = {}
                        const finalArray = []
                        Object.keys(results).forEach(function (key) {
                            let result = JSON.parse(JSON.stringify(results[key]))
                            const H = dateTime.create(result.creation_date).format('n')
                            resultArray[H] = result.items
                        })
                        Object.keys(match).forEach(function (key) {
                            let monthArray = []
                            monthArray.push(key)
                            if (resultArray[key]) {
                                monthArray.push(resultArray[key])
                            } else {
                                monthArray.push(0)
                            }
                            finalArray.push(monthArray)
                        });
                         myCache.set("admin_dashboard_statsblogs",finalArray,300)
                         statsData.blogs = finalArray
                    }
                })
            });
        }else{
            statsData.blogs = cachedDataBlogs
        }
        

        let recentContents = {}

        //recent users
        var cachedDataUserRecent = myCache.get("admin_dashboard_recentusers")
        if (!cachedDataUserRecent) {
            await globalModel.custom(req, "SELECT *,IF(userdetails.avtar IS NULL OR userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id ORDER BY creation_date DESC LIMIT 5 ", []).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.users = result
                    myCache.set('admin_dashboard_recentusers', result , 300)
                }
            })
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM users WHERE approve = ?", [0]).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.unapprovedusers = result[0].items
                    myCache.set('admin_dashboard_unapprovedusers', result[0].items , 300)
                }
            })
        } else {
            recentContents.users = cachedDataUserRecent
            recentContents.unapprovedusers = myCache.get("admin_dashboard_unapprovedusers")
        }

        //recent channels
        var cachedDataChannelRecent = myCache.get("admin_dashboard_recentchannels")
        if (!cachedDataChannelRecent) {
            await globalModel.custom(req, "SELECT *,IF(channels.image IS NULL || channels.image = '','" + req.appSettings['channel_default_photo'] + "',channels.image) as image FROM channels ORDER BY creation_date DESC LIMIT 5 ", []).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.channels = result
                    myCache.set('admin_dashboard_recentchannels', result , 350)
                }
            })
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM channels WHERE approve = ?", [0]).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.unapprovedchannels = result[0].items
                    myCache.set('admin_dashboard_unapprovedchannels', result[0].items , 350)
                }
            })
        } else {
            recentContents.channels = cachedDataChannelRecent
            recentContents.unapprovedchannels = myCache.get("admin_dashboard_unapprovedchannels")
        }


        //recent blogs
        var cachedDataBlogRecent = myCache.get("admin_dashboard_recentblogs")
        if (!cachedDataBlogRecent) {
            await globalModel.custom(req, "SELECT *,IF(blogs.image IS NULL || blogs.image = '','" + req.appSettings['blog_default_photo'] + "',blogs.image) as image FROM blogs ORDER BY creation_date DESC LIMIT 5 ", []).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.blogs = result
                    myCache.set('admin_dashboard_recentblogs', result , 400)
                }
            })
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM blogs WHERE approve = ?", [0]).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.unapprovedblogs = result[0].items
                    myCache.set('admin_dashboard_unapprovedblogs', result[0].items , 400)
                }
            })
        } else {
            recentContents.blogs = cachedDataBlogRecent
            recentContents.unapprovedblogs = myCache.get("admin_dashboard_unapprovedblogs")
        }

        //recent playlists
        var cachedDataPlaylistRecent = myCache.get("admin_dashboard_recentplaylists")
        if (!cachedDataPlaylistRecent) {
            await globalModel.custom(req, "SELECT *,IF(playlists.image IS NULL || playlists.image = '','" + req.appSettings['playlist_default_photo'] + "',playlists.image) as image FROM playlists ORDER BY creation_date DESC LIMIT 5 ", []).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.playlists = result
                    myCache.set('admin_dashboard_recentplaylists', result , 400)
                }
            })
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM playlists  WHERE approve = ?", [0]).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.unapprovedplaylists = result[0].items
                    myCache.set('admin_dashboard_unapprovedplaylists', result[0].items , 400)
                }
            })
        } else {
            recentContents.playlists = cachedDataPlaylistRecent
            recentContents.unapprovedplaylists = myCache.get("admin_dashboard_unapprovedplaylists")
        }

        //recent reports
        var cachedDataReportRecent = myCache.get("admin_dashboard_recentreports")
        if (!cachedDataReportRecent) {
            await globalModel.custom(req, "SELECT *,reportmessages.description as message_desc FROM reports LEFT JOIN reportmessages ON reportmessages.reportmessage_id = reports.reportmessage_id ORDER BY creation_date DESC LIMIT 5 ", []).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.reports = result
                    myCache.set('admin_dashboard_recentreports', result , 500)
                }
            })
        } else {
            recentContents.reports = cachedDataReportRecent
        }

        //recent videos
        var cachedDataVideosRecent = myCache.get("admin_dashboard_recentvideos")
        if (!cachedDataVideosRecent) {
            await globalModel.custom(req, 'SELECT *,IF(videos.image IS NULL || videos.image = "","' + req.appSettings['video_default_photo'] + '",videos.image) as image  FROM videos WHERE videos.custom_url IS NOT NULL ORDER BY creation_date DESC LIMIT 5 ', []).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.videos = result
                    myCache.set('admin_dashboard_recentvideos', result , 300)
                }
            })
            await globalModel.custom(req, "SELECT COUNT(*) as items FROM videos WHERE videos.custom_url != ''  AND  approve = ?", [0]).then(async results => {
                const result = JSON.parse(JSON.stringify(results));
                if (result && result.length) {
                    recentContents.unapprovedvideos = result[0].items
                    myCache.set('admin_dashboard_unapprovedvideos', result[0].items , 300)
                }
            })
        } else {
            recentContents.videos = cachedDataVideosRecent
            recentContents.unapprovedvideos = myCache.get("admin_dashboard_unapprovedvideos")
        }
        var NumAbbr = require('number-abbreviate')
        var numAbbr = new NumAbbr()
        var timeago = require("node-time-ago")
        var striptags = require("striptags")
        res.render('admin/dashboard/dashboard', {striptags:striptags,timeago:timeago,admin_slug: process.env.ADMIN_SLUG,recentContents:recentContents,statsData:statsData, numAbbr: numAbbr, dataCounts: dataCounts, nav: url, title: "Dashboard" })
    } else {
        next();
    }
}