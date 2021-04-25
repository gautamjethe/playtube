const commonFunction = require("../functions/commonFunctions")
const slideshow = require("../models/slideshow")
const globalModel = require("../models/globalModel")

const videoModel = require("../models/videos")
const channelModel = require("../models/channels")
const videoCategoryModel = require("../models/categories")
const blogModel = require("../models/blogs")
const playlistModel = require("../models/playlists")
const audioModel = require("../models/audio")
const async = require('async')
const notificationModel = require("../models/notifications")
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const socketio = require("../socket")
const emailFunction = require("../functions/emails")
const dateTime = require("node-datetime")
const videoController = require("./api/video")
exports.pages = async (req, res, next) => {

    var id = req.params.id
    let pageData = {}
    await globalModel.custom(req,"SELECT * from pages WHERE url = ?",[id]).then(results => {
        if(results){
            const data = JSON.parse(JSON.stringify(results));
            if(data.length){
                pageData = data[0]
            }
        }
    })
    if(!Object.keys(pageData).length){
        next()
        return
    }
    await commonFunction.getGeneralInfo(req, res, pageData.type)
    req.query.pageContent = pageData.content
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/pages', req.query);
}

exports.privacy = async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, 'privacy')
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/privacy', req.query);
}
exports.terms = async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, 'terms')
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/terms', req.query);
}

exports.contact = async (req, res, next) => {
    await commonFunction.getGeneralInfo(req, res, 'contact_us')
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/contact', req.query);
}
exports.index = async (req, res, next) => {

    const lang = req.params.lng
    const data = req.params.data
    if (lang) {
        if (req.i18n.languages.indexOf(lang) < 0) {
            next()
            return
        }
    }

    await commonFunction.getGeneralInfo(req, res, 'landing_page')
    if (data) {
        next()
        return
    }
    //slideshow data
    await slideshow.findAll(req, {enabled:1}).then(result => {
        if (result && result.length > 0)
            req.query.slideshow = result
    })
    if(req.session.logout){
        req.query.logout = true
        req.session.logout = false
    }
    //get live streamer
    if(req.appSettings['video_tip'] == 1){
        var cachedData = myCache.get("video_tip")
        if (!cachedData) {
            await videoModel.donorsOfTheMonth( { limit: 10,offthemonth:true},req).then(result => {
                if (result && result.length > 0) {
                    req.query.livestreamers = result
                    myCache.set('video_tip', result, req.ttlTime)
                }
            })
        } else {
            req.query.livestreamers = cachedData
        }
    }
    //get featured, sponsored, hot and latest videos
    req.query.videos = {}
    if (req.appSettings["video_featured"] == 1) {
        var cachedData = myCache.get("home_video_featured")
        if (!cachedData) {
            await videoModel.getVideos(req, { is_featured: 1, limit: 8, orderby: "random" }).then(result => {
                if (result && result.length > 0) {
                    req.query.videos['featured'] = result
                    myCache.set('home_video_featured', result, req.ttlTime)
                }
            })

        } else {
            req.query.videos['featured'] = cachedData
        }
    }
    if (req.appSettings["video_sponsored"] == 1) {
        var cachedData = myCache.get("home_video_sponsored")
        if (!cachedData) {
            await videoModel.getVideos(req, { is_sponsored: 1, limit: 8, orderby: "random" }).then(result => {
                if (result && result.length > 0) {
                    req.query.videos['sponsored'] = result
                    myCache.set('home_video_sponsored', result, req.ttlTime)
                }
            })

        } else {
            req.query.videos['sponsored'] = cachedData
        }
    }
    if (req.appSettings["video_hot"] == 1) {
        var cachedData = myCache.get("home_video_hot")
        if (!cachedData) {
            await videoModel.getVideos(req, { is_hot: 1, limit: 8, orderby: "random" }).then(result => {
                if (result && result.length > 0) {
                    req.query.videos['hot'] = result
                    myCache.set('home_video_hot', result, req.ttlTime)
                }
            })

        } else {
            req.query.videos['hot'] = cachedData
        }
    }

    var cachedData = myCache.get("home_video_recent")
    if (!cachedData) {
        await videoModel.getVideos(req, { is_not_hot: 1, is_not_sponsored: 1, is_not_featured: 1, limit: 8 }).then(result => {
            if (result && result.length > 0) {
                req.query.videos['recent_videos'] = result
                myCache.set('home_video_recent', result, req.ttlTime)
            }
        })

    } else {
        req.query.videos['recent_videos'] = cachedData
    }

    if (req.appSettings["enable_audio"] == 1) {
        req.query.audio = {}
        var cachedData = myCache.get("home_audio_recent")
        if (!cachedData) {
            await audioModel.getAudios(req, { limit: 10, orderby: "random" }).then(result => {
                if (result && result.length > 0) {
                    req.query.audio = result
                    myCache.set('home_audio_recent', result, req.ttlTime)
                }
            })

        } else {
            req.query.audio = cachedData
        }
    }
    if (req.appSettings["enable_channel"] == 1) {
        //get featured, sponsored, hot channels and latest channels
        req.query.channels = {}
        if (req.appSettings["channel_featured"] == 1) {
            var cachedData = myCache.get("home_channel_featured")
            if (!cachedData) {
                await channelModel.getChannels(req, { is_featured: 1, limit: 4, orderby: "random" }).then(result => {
                    if (result && result.length > 0) {
                        req.query.channels['featured'] = result
                        myCache.set('home_channel_featured', result, req.ttlTime)
                    }
                })

            } else {
                req.query.channels['featured'] = cachedData
            }
        }
        if (req.appSettings["channel_sponsored"] == 1) {
            var cachedData = myCache.get("home_channel_sponsored")
            if (!cachedData) {
                await channelModel.getChannels(req, { is_sponsored: 1, limit: 4, orderby: "random" }).then(result => {
                    if (result && result.length > 0) {
                        req.query.channels['sponsored'] = result
                        myCache.set('home_channel_sponsored', result, req.ttlTime)
                    }
                })

            } else {
                req.query.channels['sponsored'] = cachedData
            }
        }

        await channelModel.findAllCommunity(0,req,res,4,0,0).then(result => {
            if (result && result.length > 0) {
                req.query.channels['posts'] = result
            }
        })
        if (req.appSettings["channel_hot"] == 1) {
            var cachedData = myCache.get("home_channel_hot")
            if (!cachedData) {
                await channelModel.getChannels(req, { is_hot: 1, limit: 4, orderby: "random" }).then(result => {
                    if (result && result.length > 0) {
                        req.query.channels['hot'] = result
                        myCache.set('home_channel_hot', result, req.ttlTime)
                    }
                })

            } else {
                req.query.channels['hot'] = cachedData
            }
        }
        var cachedRecentChannel = myCache.get("home_channel_recent")
        if (!cachedRecentChannel) {
            await channelModel.getChannels(req, { is_not_hot: 1, is_not_sponsored: 1, is_not_featured: 1, limit: 4 }).then(result => {
                if (result && result.length > 0) {
                    req.query.channels['recent_channels'] = result
                    myCache.set('home_channel_recent', result, req.ttlTime)
                }
            })

        } else {
            req.query.channels['recent_channels'] = cachedRecentChannel
        }
       
    }
    var cachedVideoCategories = myCache.get("home_video_categories")
    if (!cachedVideoCategories) {
        //fetch top 5 categories data and rest categories will come from page load
        await videoCategoryModel.findAll(req, { type: 'video', onlyCategories: 1, item_count: 1,limit:20 }).then(async results => {
            if (results && results.length > 0) { 
                req.query.videoCategories = results
                myCache.set('home_video_categories', results, req.ttlTime)
            }
        })
    } else {
        req.query.videoCategories = cachedVideoCategories
    }
    if (req.query.videoCategories && req.query.videoCategories.length > 0) {
        var cachedCategoriesVideos = myCache.get("home_categories_videos")
        if (!cachedCategoriesVideos) {
            await exports.categories(req, req.query.videoCategories).then(res => { })
            myCache.set('home_categories_videos', req.query.categoryVideos, req.ttlTime)
        } else {
            req.query.categoryVideos = cachedCategoriesVideos
        }
    }
    
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/index', req.query);
}

exports.categories = async (req, results) => {
    const categoriesVideos = []
    return new Promise(function (resolve, reject) {
        async.forEachOf(results, async function (category, i, callback) {
            const data = {}
            data.category_id = category.category_id
            data.limit = 4
            if(category.show_home == 1){
                await videoModel.getVideos(req, data).then(async videos => {
                    if (videos && videos.length > 0) {
                        const dataCategory = {}
                        dataCategory["category"] = category
                        dataCategory['videos'] = videos
                        categoriesVideos.push(dataCategory)
                    }
                })
            }
            if (i == req.query.videoCategories.length - 1) {
                req.query.categoryVideos = categoriesVideos
                resolve("")
            }
        }, function (err) {
            if (categoriesVideos.length > 0) {
                req.query.categoryVideos = categoriesVideos
            }
        });
    })
}

exports.notFound = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, 'page_not_found')
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/page-not-found', req.query);
}
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
exports.cronFunction = async(req,res) => {
    return new Promise(function(resolve, reject) { 
        req.getConnection(function(err,connection){
            connection.query("SELECT * from tasks WHERE started = 0 AND (start_time IS NULL || DATE_ADD(start_time, INTERVAL `timeout` second) <= ? ) ORDER BY priority ASC", [dateTime.create().format("Y-m-d H:M:S")], async function (err, results, fields) {
                if (!err) {
                await asyncForEach(results, async (notification, i) => {
                    let taskResult = JSON.parse(JSON.stringify(results[i]))
                    if (taskResult.type == "notifications") {
                        await notificationModel.findAll(req, { limit: 200, notification_send: 2 }).then(async result => {
                            
                            //set cron started
                            connection.query("UPDATE tasks SET started = 1,start_time = ? WHERE type = ?", [dateTime.create().format("Y-m-d H:M:S"),taskResult.type], async function (err, results, fields) {
                                
                            })
                            if (result && result.length > 0) {
                                await asyncForEach(result, async (data, i) => {
                                    await notificationModel.getNotification(req, data).then(async result => {
                                        
                                        if (result) {
                                            globalModel.custom(req, "UPDATE notifications SET notification_send = 1 WHERE notification_id = ?", [result.notification_id]).then(result => { }).catch(err => { })
                                            socketio.getIO().emit('notifications', {
                                                owner_id: result.owner_id,
                                                notification: result
                                            });
                                            let column = "video_id"
                                            if (result.object_type == "channels") {
                                                column = "channel_id"
                                            } else if (result.object_type == "blogs") {
                                                column = "blog_id"
                                            } else if (result.object_type == "members") {
                                                column = "user_id"
                                            } else if (result.object_type == "artists") {
                                                column = "artist_id"
                                            } else if (result.object_type == "playlists") {
                                                column = "playlist_id"
                                            } else if (result.object_type == "comments") {
                                                column = "comment_id"
                                            }
                                            //email notifications
                                            await globalModel.custom(req, 'SELECT ' + result.object_type + '.' + (column == "user_id" ? "user_id" : "owner_id") + ',emailsettings.type FROM ' + result.object_type + ' LEFT JOIN emailsettings ON emailsettings.owner_id = ' + result.object_type + '.' + (column == "user_id" ? "user_id" : "owner_id") + ' AND emailsettings.type = "' + result.type + '" AND emailsettings.email = 0 WHERE ' + column + " = ? ", [result.object_id]).then(async results => {
                                                let emailNotificationEnable = true
                                                if (results) {
                                                    const item = JSON.parse(JSON.stringify(results));
                                                    if (item.length > 0) {
                                                        if (item[0].type) {
                                                            emailNotificationEnable = false
                                                        }
                                                    }
                                                }
                                                if (emailNotificationEnable) {
                                                    await globalModel.custom(req, "SELECT * FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id WHERE users.user_id = ?", [result.owner_id]).then(async ownerData => {
                                                        if (ownerData) {
                                                            await globalModel.custom(req, "SELECT vars,type FROM emailtemplates WHERE type = ?", [result.type]).then(async resultsType => {
                                                                if (resultsType) {
                                                                    const typeData = JSON.parse(JSON.stringify(resultsType))[0];
                                                                    result.vars = typeData.vars
                                                                    result.type = typeData.type
                                                                    result.ownerEmail = ownerData[0]
                                                                    result.toName = ownerData[0].displayname
                                                                    result.toEmail = ownerData[0].email
                                                                    const i18n = require('i18next');
                                                                    i18n.changeLanguage( ownerData[0].language)
                                                                    req.i18n = i18n
                                                                    await emailFunction.sendMessage(req, result,false).then(emailData => {
                                                                        //email send
                                                                    }).catch(err => {
                                                                        
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                })
                            }
                            connection.query("UPDATE tasks SET started = 0 WHERE type = ?", [taskResult.type], async function (err, results, fields) {
                                
                            })
                        })
                    }
                    if (taskResult.type == "videoEncode") {
                        //find videos
                        connection.query("UPDATE tasks SET started = 1,start_time = ? WHERE type = ?", [dateTime.create().format("Y-m-d H:M:S"),taskResult.type], async function (err, results, fields) {
                            
                        })
                        connection.query("SELECT * from videos WHERE completed = 0 AND type = 3 AND custom_url != '' LIMIT 1", [], async function (err, results, fields) {
                            if (!err) {
                                let videos = JSON.parse(JSON.stringify(results))
                                if(videos.length){
                                   // await asyncForEach(videos, async (data, i) => {
                                        await videoController.convertVideo(req,videos[0]).then(result => {})
                                    //});
                                }
                            }
                            connection.query("UPDATE tasks SET started = 0 WHERE type = ?", [taskResult.type], async function (err, results, fields) {
                                
                            })
                        })
                    }
                    if(taskResult.type == "userDowngrade") {
                        connection.query("UPDATE tasks SET started = 1,start_time = ? WHERE type = ?", [dateTime.create().format("Y-m-d H:M:S"),taskResult.type], async function (err, results, fields) {
                            
                        })
                        let currenttime = dateTime.create().format("Y-m-d H:M:S")
                        let sql = "SELECT `subscriptions`.*, `packages`.* FROM `subscriptions` INNER JOIN `users` ON users.user_id =subscriptions.id AND subscriptions.type = 'member_subscription' INNER JOIN `packages` ON packages.package_id = subscriptions.package_id INNER JOIN `userdetails` ON userdetails.user_id =users.user_id WHERE (CASE WHEN expiration_date IS NULL THEN false WHEN expiration_date IS NOT NULL THEN DATE_ADD(expiration_date,INTERVAL 5 HOUR) < '"+currenttime+"' ELSE DATE_ADD(subscriptions.creation_date,INTERVAL 5 HOUR) < '"+currenttime+"' END ) AND (subscriptions.status = 'active' || subscriptions.status = 'completed' || subscriptions.status = 'approved') AND subscriptions.is_level_change = 0 AND subscriptions.type = 'member_subscription' AND (packages.downgrade_level_id != users.level_id) AND (users.user_id IS NOT NULL) AND (packages.package_id IS NOT NULL) AND subscriptions.type = 'member_subscription' ORDER BY `subscriptions`.`expiration_date` ASC LIMIT 100";
                        await globalModel.custom(req,sql).then(async results => {
                            let subscriptions = JSON.parse(JSON.stringify(results))
                            if(subscriptions.length){
                                await asyncForEach(subscriptions, async (subscription, i) => {
                                    //update user level
                                    globalModel.custom(req,"UPDATE `users` SET `level_id` = ? WHERE `user_id` = ?",[subscription.downgrade_level_id,subscription.id]).then(res=>{}).catch(err => {
                                        console.log("ERROR IN LEVEL CHAGE CRON ",err)
                                    })
                                    //update subscription status
                                    globalModel.custom(req,"UPDATE `subscriptions` SET `status` = ? , `is_level_change` = 1 WHERE subscription_id = ?",['expired',subscription.subscription_id]).then(res=>{}).catch(err => {
                                        console.log("ERROR IN LEVEL CHAGE CRON ",err)
                                    })

                                });
                            } 
                        })
                        connection.query("UPDATE tasks SET started = 0 WHERE type = ?", [taskResult.type], async function (err, results, fields) {
                                
                        })
                    }
                    if(taskResult.type == "userExpiryNotifications") {
                        connection.query("UPDATE tasks SET started = 1,start_time = ? WHERE type = ?", [dateTime.create().format("Y-m-d H:M:S"),taskResult.type], async function (err, results, fields) {
                            
                        })
                        let currenttime = dateTime.create().format("Y-m-d H:M:S")
                        let sql = "SELECT `subscriptions`.*,packages.*,userdetails.*,users.email FROM `subscriptions`  JOIN `users` ON users.user_id =subscriptions.owner_id JOIN `userdetails` ON users.user_id =userdetails.user_id  LEFT JOIN `packages` ON packages.package_id = subscriptions.package_id WHERE (CASE WHEN expiration_date IS NULL then false WHEN expiration_date IS NOT NULL AND packages.alert_type = 'minutes' THEN DATE_SUB(expiration_date,INTERVAL `alert_number` MINUTE) <= '"+currenttime+"' WHEN expiration_date IS NOT NULL AND packages.alert_type = 'hours' THEN DATE_SUB(expiration_date,INTERVAL `alert_number` HOUR) <= '"+currenttime+"' WHEN expiration_date IS NOT NULL AND packages.alert_type = 'days' THEN DATE_SUB(expiration_date,INTERVAL `alert_number` DAY) <= '"+currenttime+"' WHEN expiration_date IS NOT NULL AND packages.alert_type = 'weeks' THEN DATE_SUB(expiration_date,INTERVAL `alert_number` WEEK) <= '"+currenttime+"' WHEN expiration_date IS NULL AND packages.`alert_type` = 'minutes' THEN DATE_SUB(subscriptions.creation_date,INTERVAL `alert_number` MINUTE) <= '"+currenttime+"' WHEN expiration_date IS NULL AND packages.`alert_type` = 'hours' THEN DATE_SUB(subscriptions.creation_date,INTERVAL `alert_number` HOUR) <= '"+currenttime+"' WHEN expiration_date IS NULL AND packages.`alert_type` = 'days' THEN DATE_SUB(subscriptions.creation_date,INTERVAL `alert_number` DAY) <= '"+currenttime+"' ELSE DATE_SUB(subscriptions.creation_date,INTERVAL `alert_number` WEEK) <= '"+currenttime+"' END ) AND is_notification_send = 0 AND (subscriptions.status = 'active' || subscriptions.status = 'completed' || subscriptions.status = 'approved') AND (users.user_id IS NOT NULL) AND subscriptions.type = 'member_subscription'  ORDER BY `subscriptions`.`expiration_date` ASC LIMIT 100";
                        await globalModel.custom(req,sql).then(async results => {
                            let subscriptions = JSON.parse(JSON.stringify(results))
                            if(subscriptions.length){
                                await asyncForEach(subscriptions, async (subscription, i) => {
                                    
                                    //send notification and email as per setting in package
                                    //email_notification
                                    //level_member_expiry_email
                                    if(subscription.email_notification == 1){
                                        connection.query("SELECT vars,type FROM emailtemplates WHERE type = ?", ['level_member_expiry'], function (err, resultsType, fields) {
                                            if (!err) {
                                                const typeData = JSON.parse(JSON.stringify(resultsType))[0];
                                                let result = {}
                                                result.vars = typeData.vars
                                                result.type = "level_member_expiry"
                                                result.ownerEmail = subscription
                                                result.toName = subscription.displayname
                                                result.toEmail = subscription.email
                                                result['planName'] = {}
                                                result['planName']["title"] = subscription.title
                                                result['planName']['type'] = "text"
                                                result['period'] = {}
                                                result['period']["title"] = subscription.alert_number+" "+subscription.alert_type
                                                result['period']['type'] = "text"
                                                emailFunction.sendMessage(req, result)
                                            }
                                        })
                                    }
                                    //site_notification
                                    if(subscription.site_notification == 1){
                                        let params = {}
                                        globalModel.custom
                                        params['planName'] = subscription.title
                                        params['period'] = subscription.alert_number+" "+subscription.alert_type
                                        let notificationData= {owner_id:subscription.id, type: 'level_member_expiry', subject_type: "website", subject_id: 0, object_type: 'package', object_id: 0,creation_date:dateTime.create().format("Y-m-d H:M:S"),notification_send:1,params:JSON.stringify(params) }
                                        connection.query('INSERT INTO notifications SET ? ', [notificationData], function (err, results, fields) {
                                            notificationData.notification_id = results.insertId
                                            notificationModel.getNotification(req, notificationData).then(async result => {
                                                socketio.getIO().emit('notifications', {
                                                    owner_id: result.owner_id,
                                                    notification: result
                                                });
                                            });
                                            
                                        })
                                    }
                                    //update subscription notification send flag
                                    globalModel.custom(req,"UPDATE `subscriptions` SET `is_notification_send` = 1 WHERE subscription_id = ?",[subscription.subscription_id]).then(res=>{}).catch(err => {
                                        console.log("ERROR IN LEVEL CHAGE CRON ",err)
                                    })

                                });
                            }
                        })
                        connection.query("UPDATE tasks SET started = 0 WHERE type = ?", [taskResult.type], async function (err, results, fields) {
                                
                        })


                        //remove unuploaded videos
                        var d = new Date();
                        d.setHours(d.getHours() - 4);
                        let dateTimePrevious = dateTime.create(d).format("Y-m-d H:M:S")
                        await connection.query("SELECT * from videos WHERE (custom_url IS NULL || custom_url = '') AND type = 3 AND creation_date < ? LIMIT 20", [dateTimePrevious], async function (err, results, fields) {
                            if (!err) {
                                let videos = JSON.parse(JSON.stringify(results))
                                if(videos.length){
                                   videos.forEach(function (item, index) {
                                        //remove videos and image
                                        videoModel.delete(item.video_id, req).then(result => {
                                        })
                                   })
                                }
                            }
                            connection.query("UPDATE tasks SET started = 0 WHERE type = ?", [taskResult.type], async function (err, results, fields) {
                                
                            })
                        })

                    }
                })
                    res.send(true)
                    resolve(true)
                } else {
                    res.send(false)
                    resolve(true)
                    console.log(err, 'ERROR IN CRON FUNCTION')
                }
            })
        })

    })
}

exports.manifest = async(req,res) => {
    //manifest.json
    let data = {}
    data["name"] = req.appSettings["pwa_app_name"];
    data["short_name"] = req.appSettings["pwa_short_name"];
    data["desciption"] = req.appSettings["pwa_app_description"];
    data["theme_color"] = req.appSettings["pwa_app_theme_color"];
    data["background_color"] = req.appSettings["pwa_app_bg_color"];
    data["display"] = "standalone";
    data["orientation"] = "any";
    data["app_icon"] = req.appSettings['imageSuffix'] + req.appSettings["pwa_icon_sizes_512"];
    data["start_url"] = process.env.PUBLIC_URL;

    let icons = []
    icons.push({"src":req.appSettings['imageSuffix'] + req.appSettings["pwa_icon_sizes_72"],sizes:"72x72",type:"image/png"})
    icons.push({"src":req.appSettings['imageSuffix'] + req.appSettings["pwa_icon_sizes_96"],sizes:"96x96",type:"image/png"})
    icons.push({"src":req.appSettings['imageSuffix'] + req.appSettings["pwa_icon_sizes_128"],sizes:"128x128",type:"image/png"})
    icons.push({"src":req.appSettings['imageSuffix'] + req.appSettings["pwa_icon_sizes_144"],sizes:"144x144",type:"image/png"})
    icons.push({"src":req.appSettings['imageSuffix'] + req.appSettings["pwa_icon_sizes_152"],sizes:"152x152",type:"image/png"})
    icons.push({"src":req.appSettings['imageSuffix'] + req.appSettings["pwa_icon_sizes_192"],sizes:"192x192",type:"image/png"})
    icons.push({"src":req.appSettings['imageSuffix'] + req.appSettings["pwa_icon_sizes_384"],sizes:"384x384",type:"image/png"})
    icons.push({"src":req.appSettings['imageSuffix'] + req.appSettings["pwa_icon_sizes_512"],sizes:"512x512",type:"image/png"})
    data.icons = icons;

    res.send(data)
    
}

exports.sitemap = async (req,res) => {
    //Return an XML content type
  	res.set('Content-Type', 'text/xml')

    let itemResults = []
    itemResults.push({custom_url:'', priority:'1.0',frequency:'daily'});
    await new Promise(function (resolve, reject) {
        req.getConnection(function (err, connection) {
            connection.query("SELECT username as custom_url,displayname as title,'users' as item,users.modified_date from users LEFT JOIN userdetails on users.user_id = userdetails.user_id WHERE active = 1 AND approve = 1 AND userdetails.search = 1", [], function (err, results, fields) {
                if (err)
                    resolve()
                if (results) {
                    let users = JSON.parse(JSON.stringify(results));
                    //itemResults.concat(users)
                    itemResults = [...itemResults,...users]
                    console.log(itemResults,users)
                    resolve();
                } else {
                    resolve();
                }
            })
        })
    })
    //get videos
    await new Promise(function (resolve, reject) {
        req.getConnection(function (err, connection) {
            connection.query("SELECT custom_url,title,'videos' as item,modified_date from videos WHERE approve = 1 AND completed = 1 AND ( is_livestreaming = 0 AND (code IS NOT NULL || videos.type = 3) )  AND is_locked = 0  AND search = 1 AND (view_privacy= 'everyone' || view_privacy IS NULL) ", [], function (err, results, fields) {
                if (err)
                    resolve()
                if (results) {
                    let videos = JSON.parse(JSON.stringify(results));
                    itemResults = [...itemResults,...videos]
                    resolve();
                } else {
                    resolve();
                }
            })
        })
    })

    if(req.appSettings["enable_blog"] == 1){
        //get blogs
        await new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query("SELECT custom_url,title,'blogs' as item,modified_date from blogs WHERE approve = 1 AND draft = 1 AND search = 1 AND (view_privacy= 'everyone' || view_privacy IS NULL) ", [], function (err, results, fields) {
                    if (err)
                        resolve()
                    if (results) {
                        let blogs = JSON.parse(JSON.stringify(results));
                        itemResults = [...itemResults,...blogs]
                        resolve();
                    } else {
                        resolve();
                    }
                })
            })
        })
    }

    if(req.appSettings["enable_channel"] == 1){
        //get channels
        await new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query("SELECT custom_url,title,'channels' as item,modified_date from channels WHERE approve = 1 AND search = 1 AND (view_privacy= 'everyone' || view_privacy IS NULL) AND is_locked = 0 ", [], function (err, results, fields) {
                    if (err)
                        resolve()
                    if (results) {
                        let channels = JSON.parse(JSON.stringify(results));
                        itemResults = [...itemResults,...channels]
                        resolve();
                    } else {
                        resolve();
                    }
                })
            })
        })
    }
    if(req.appSettings["enable_playlist"] == 1){
        itemResults.push({custom_url:'playlists', priority:'0.1',frequency:'daily'});
    }
    itemResults.push({custom_url:'privacy', priority:'0.1',frequency:'weekly'});
    itemResults.push({custom_url:'contact', priority:'0.1',frequency:'weekly'});
    itemResults.push({custom_url:'terms', priority:'0.1',frequency:'weekly'});

    res.render('home/sitemap', {
        //whatever data you need to show in the sitemap
        itemResults: itemResults,
        rootPath:process.env.PUBLIC_URL
    })

}