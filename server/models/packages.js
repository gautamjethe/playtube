module.exports = { 
    enabledPackage: function(req,data,res = ""){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                if(!req.query.packagesExists){
                    resolve(false)
                    return
                }
                
                connection.query('SELECT subscriptions.*,packages.* FROM subscriptions LEFT JOIN packages ON packages.package_id = subscriptions.package_id WHERE packages.package_id IS NOT NULL AND `owner_id` = ?',[data.user_id ? data.user_id : (req.user ? req.user.user_id : 0)],function(err,results,fields)
                {
                    console.log(err)
                    if(err)
                        resolve(false)
                    if(results){
                        if(results.length){
                            const subscriptions = JSON.parse(JSON.stringify(results));
                            if(subscriptions.length){
                                let subscription = subscriptions[0]
                                if( subscription.status == 'active' || subscription.status == "completed" || subscription.status == "approved" || subscription.status == 'trial' ) {
                                    resolve(subscription)
                                }else{
                                    module.exports.default(req,res).then(result => {
                                        resolve(result)
                                    })
                                }
                            }
                            module.exports.default(req,res).then(result => {
                                resolve(result)
                            })
                            return
                        }else{
                            module.exports.default(req,res).then(result => {
                                resolve(result)
                            })
                        }
                    }else{
                        module.exports.default(req,res).then(result => {
                            resolve(result)
                        })
                    }
                })
            })
        });
    },
    check: function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                if(!req.query.packagesExists){
                    resolve(true)
                    return
                }
                connection.query('SELECT * FROM packages WHERE `price` <= ?',[0],function(err,results,fields)
                {
                    if(!results.length){
                        resolve(true);
                        return
                    }
                    connection.query('SELECT subscriptions.* FROM subscriptions LEFT JOIN packages ON packages.package_id = subscriptions.package_id WHERE packages.package_id IS NOT NULL AND `owner_id` = ?',[data.user ? data.user.user_id : (req.user ? req.user.user_id : 0)],function(err,results,fields)
                    {
                        if(err)
                            resolve(false)
                        if(results){
                            if(results.length){
                                const subscriptions = JSON.parse(JSON.stringify(results));
                                if(subscriptions.length){
                                    let subscription = subscriptions[0]
                                    if( subscription.status == 'active' || subscription.status == "completed" || subscription.status == "approved" || subscription.status == 'trial' ) {
                                        resolve(true)
                                        return
                                    }
                                }else{
                                    let user = data.user ? data.user : (req.user ? req.user : false)
                                    if(user){
                                        if(user.levelType == "admin" || user.levelType == "moderator"){
                                            resolve(true)
                                            return
                                        }
                                    }
                                }
                                resolve(false)
                                return
                            }else{
                                resolve(false)
                            }
                        }else{
                            resolve(false);
                        }
                    })
                })
            })
        });
    },
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []

                let sql = 'SELECT '+data['column']+',packages.type as packageType,packages.level_id as packageLevelId,dl.title as downgrade_level_title,ml.title as level_title FROM packages LEFT JOIN levels ml  ON ml.level_id = packages.level_id LEFT JOIN levels dl ON dl.level_id = packages.downgrade_level_id '+(data.leftJoin ? data.leftJoin :"")+' where 1 = 1'
                if(data.level_id){
                    condition.push(data['level_id'])
                    sql += " and packages.level_id = ?"
                }
                if(data.downgrade_level_id){
                    condition.push(data['downgrade_level_id'])
                    sql += " and packages.downgrade_level_id = ?"
                } 
                if(data.enabled){
                    if(data['enabled'] == 2)
                        condition.push(0)
                    else
                        condition.push(data['enabled'])
                    sql += " and packages.enabled = ?"
                }
                if(data.search){
                    condition.push(data['search'].toLowerCase()) 
                    sql += " and LOWER(packages.title) LIKE CONCAT('%', ?,  '%')"
                }
                if(data.not_default_plan){
                    condition.push(data.not_default_plan)
                    sql += " AND packages.default != ?"
                }
                if(data.groupBy){
                    sql += " "+data.groupBy
                }
                
                sql += " ORDER BY packages.package_id DESC" 

                if(data.limit){
                    condition.push(data['limit'])
                    sql += " LIMIT ?"
                }
                if(data.offset){
                    condition.push(data['offset'])
                    sql += " OFFSET ?"
                }
                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const packages = JSON.parse(JSON.stringify(results));
                        if(packages.length){
                            module.exports.getLevelPermissionForPackage(packages,resolve,req)
                        }else{
                            resolve(packages);
                        }
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    }, 
    getLevelPermissionForPackage(packages,resolve,req){
        const  async = require('async')
        const levelPermission = require("./levelPermissions")
        const recurringPlan = require("../functions/recurring-paypal")
        let packagesArray = []
        async.forEachOf(packages, async function (packageItem, i, callback) {
            await levelPermission.findById(packageItem.level_id, req,"",false,false).then(level => {
                packageItem["package_description"] = recurringPlan.getDescription(req,packageItem,true)
                packageItem["is_featured"] = level["member.is_featured"] ? parseInt(level["member.is_featured"]) : 0
                packageItem["is_hot"] = level["member.is_hot"] ? parseInt(level["member.is_hot"]) : 0
                packageItem["is_sponsored"] = level["member.is_sponsored"] ? parseInt(level["member.is_sponsored"]) : 0

                packageItem["create_livestreaming"] = level["livestreaming.create"] ? parseInt(level["livestreaming.create"]) : 0
                packageItem["livestreaming_create_limit"] = level["livestreaming.quota"] ? parseInt(level["livestreaming.quota"]) : 0

                let theme_design_mode =  typeof level['member.theme_design_mode'] != "undefined" ? level['member.theme_design_mode'] : 3;

                if(theme_design_mode == 3 || theme_design_mode == 4 ){
                    if(theme_design_mode == 3){
                        packageItem["themeMode"] = "Dark & Light Theme"
                    }else if(theme_design_mode == 4 && !req.session.siteMode){
                        packageItem["themeMode"] = "Dark & Light Theme"
                    }
                }else if(theme_design_mode == 2){
                    packageItem["themeMode"] = "Light Theme"
                }else{
                    packageItem["themeMode"] = "Dark Theme"
                }


                packageItem['video_upload'] = level['video.create'] ? parseInt(level["video.create"]) : 0
                packageItem["create_channel"] = level["channel.create"] ? parseInt(level["channel.create"]) : 0
                packageItem["channel_create_limit"] = level["channel.quota"] ? parseInt(level["channel.quota"]) : 0
                packageItem["video_create_limit"] = level["video.quota"]  ? parseInt(level["video.quota"])  : 0
                packageItem["upload_video_limit"] = level["video.storage"] ? parseInt(level["video.storage"]) : 0
                packageItem["create_playlist"] = level["playlist.create"] ? parseInt(level["playlist.create"]) : 0
                packageItem["playlist_create_limit"] = level["playlist.quota"] ? parseInt(level["playlist.quota"]) : 0
                packageItem["create_audio"] = level["audio.create"] ? parseInt(level["audio.create"]) : 0
                packageItem["audio_create_limit"] = level["audio.quota"] ? parseInt(level["audio.quota"]) : 0
                packageItem["create_blogs"] = level["blog.create"] ? parseInt(level["blog.create"]) : 0
                packageItem["blog_create_limit"] = level["blog.quota"] ? parseInt(level["blog.quota"]) : 0
                packageItem["sell_videos"] = level["video.sell_videos"] ? parseInt(level["video.sell_videos"]) : 0
                packageItem["get_donation"] = level["video.donation"] ? parseInt(level["video.donation"]) : 0
                packageItem["create_advertisement"] = level["member.ads"] ? parseInt(level["member.ads"]) : 0
                packageItem["ad_create_limit"] = level["member.adsquota"] ? parseInt(level["member.adsquota"]) : 0
                packageItem["monetization"] = level["member.monetization"] ? parseInt(level["member.monetization"]) : 0
                packagesArray.push(packageItem)
            })             
            if(i == packages.length - 1){ 
                resolve(packagesArray)
            }
        }, function (err) {
            if (!err)
                resolve(packagesArray)
            else
                resolve(false)
        });

        
    },
    findById: function(id,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM packages WHERE package_id = ?',[id],function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    default: function(req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM packages WHERE `default` = ?',[1],function(err,results,fields)
                {
                    if(err)
                        reject("")
                    if(results){
                        if(results.length){
                            const levels = JSON.parse(JSON.stringify(results));
                            resolve(levels[0]);
                        }else{
                            resolve(false)
                        }
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    }
}
