const followModel = require("./followers");
const globalModel = require("./globalModel");

module.exports = {
    permission: function(req,type,permissionName,item){
        return new Promise(function(resolve, reject) {
            if(!type){
                resolve(false) 
            }
            let typeName = type.replace(/\s$/, '')
            if(typeName.charAt( typeName.length-1 ) == "s") {
                typeName = typeName.slice(0, -1)
            }
            if(req.levelPermissions && parseInt(req.levelPermissions[typeName+'.'+permissionName])){
                if(parseInt(req.levelPermissions[typeName+'.'+permissionName]) == 2){
                    resolve(true)
                }else if(parseInt(req.levelPermissions[typeName+'.'+permissionName]) == 1 && item && parseInt(req.user.user_id) == parseInt(item.user_id ? item.user_id : item.owner_id)){
                    resolve(true)
                }else{
                    //permission error
                    resolve(false)
                }
            }
            resolve(false)
        });
    },
    checkSQL: function(req,singularType,type,primary_id) {
        return new Promise(function(resolve, reject) {
            req.getConnection(async function(err,connection){
                if(req.user && ( req.levelPermissions[singularType+".view"] && req.levelPermissions[singularType+".view"].toString() == "2")){
                    resolve(false)
                    return
                }
                /* onlyme
                *  password
                *  follow
                *  whitelist domain
                */
                let owner_id = 0
                if(req.user){
                    owner_id = req.user.user_id
                }
                let sql = ' CASE  WHEN '+type+'.owner_id = '+owner_id+' THEN true WHEN view_privacy = "onlyme" THEN false WHEN view_privacy = "everyone" THEN true '
                if(req.isview)
                sql += ' WHEN view_privacy = "link" THEN  true'
                if(type == "videos"){
                    sql += ' WHEN view_privacy = "password" THEN  true'
                    if(req.appSettings['whitelist_domain'] == 1){
                            let sqlDomain = "SELECT sitename from referers where 1 = 1 "
                            let condition = []
                            if(req.user){
                                condition.push(req.user.user_id)
                                sqlDomain += " AND owner_id = ? AND type = 'video' AND creation_date >= NOW() - INTERVAL 1 DAY "
                            }else{
                                let userIP = typeof req.headers != "undefined" && req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : (req.connection && req.connection.remoteAddress ? req.connection.remoteAddress : "");
                                condition.push(userIP)
                                sqlDomain += " AND ip = ? AND type = 'video' AND creation_date >= NOW() - INTERVAL 1 DAY "
                            }
                            sqlDomain += " GROUP BY sitename "
                            await globalModel.custom(req,sqlDomain,condition).then(async result => {
                                if(result && result.length){
                                    result.forEach(item => {
                                        sql += " WHEN view_privacy = 'whitelist_domain' AND FIND_IN_SET('"+item.sitename+"',users.whitelist_domain) then true "
                                    });
                                }
                            })
                    }
                    
                    sql += ' WHEN view_privacy = "follow" THEN (SELECT id FROM followers WHERE type = "members" AND owner_id = videos.owner_id && id = '+owner_id+' )  '
                }else if(type == "channels"){
                    sql += ' WHEN view_privacy = "password" THEN  true'
                    sql += ' WHEN view_privacy = "follow" THEN (SELECT id FROM followers WHERE type = "members" AND owner_id = channels.owner_id && id = '+owner_id+' )  '
                }else if(type == "blogs"){
                    sql += ' WHEN view_privacy = "follow" THEN (SELECT id FROM followers WHERE type = "members" AND owner_id = blogs.owner_id && id = '+owner_id+' )  '
                }else if(type == "users"){
                    sql += ' WHEN view_privacy = "follow" THEN (SELECT id FROM followers WHERE type = "members" AND owner_id = users.user_id && id = '+owner_id+' )  '
                }else if(type == "audio"){
                    sql += ' WHEN view_privacy = "password" THEN  true'
                    if(req.appSettings['whitelist_domain'] == 1){
                        let sqlDomain = "SELECT sitename from referers where 1 = 1 "
                        let condition = []
                        if(req.user){
                            condition.push(req.user.user_id)
                            sqlDomain += " AND owner_id = ? AND type = 'audio' AND creation_date >= NOW() - INTERVAL 1 DAY "
                        }else{
                            let userIP = typeof req.headers != "undefined" && req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : (req.connection && req.connection.remoteAddress ? req.connection.remoteAddress : "");
                            condition.push(userIP)
                            sqlDomain += " AND ip = ? AND type = 'audio' AND creation_date >= NOW() - INTERVAL 1 DAY "
                        }
                        sqlDomain += " GROUP BY sitename "
                        await globalModel.custom(req,sqlDomain,condition).then(async result => {
                            if(result && result.length){
                                result.forEach(item => {
                                    sql += " WHEN view_privacy = 'whitelist_domain' AND FIND_IN_SET('"+item.sitename+"',users.whitelist_domain) then true "
                                });
                            }
                        })
                    }
                    sql += ' WHEN view_privacy = "follow" THEN (SELECT id FROM followers WHERE type = "members" AND owner_id = audio.owner_id && id = '+owner_id+' )  '
                }
                sql += " ELSE false END"
                resolve(sql)                
            })
        });
    },
    check:  function(req,obj,type){
        return new Promise(function(resolve, reject) {
            req.getConnection(async function(err,connection){
                let isAuthorized = true
                if(req.user && (req.user.user_id == obj.owner_id || (req.levelPermissions[type+".view"] && req.levelPermissions[type+".view"].toString() == "2"))){
                    resolve(isAuthorized)
                    return
                }
                /* onlyme
                *  password
                *  follow
                */
               
                if(obj.view_privacy == "onlyme"){
                    if(!req.user){
                        isAuthorized = false
                    }else if(req.user.user_id != obj.owner_id){
                        isAuthorized = false
                    }
                }else if(obj.view_privacy == "password"){
                   
                    if(obj.video_id){
                        if(req.session.password.indexOf(obj.video_id) > -1){
                            resolve(true)
                            return
                        }
                    }else if(obj.channel_id){
                        if(req.session.channel.indexOf(obj.channel_id) > -1){
                            resolve(true)
                            return
                        }
                    }else if(obj.audio_id){
                        if(req.session.audio.indexOf(obj.audio_id) > -1){
                            resolve(true)
                            return
                        }
                    }
                    req.query.password = 1
                }else if(obj.view_privacy == "follow"){
                    if(req.user){
                        if(obj.owner_id){
                            await followModel.isFollowed(req,'members',obj.owner_id,req.user.user_id).then(result => {
                                isAuthorized = result
                            })
                        }else{
                            await followModel.isFollowed(req,'channels',req.user.user_id,obj.owner_id).then(result => {
                                isAuthorized = result
                            })
                        }
                    }else{
                        isAuthorized = false
                    }
                }
                resolve(isAuthorized)                
            })
        });
    }
}
