const flatCache = require("flat-cache")
const path = require('path');
var self = module.exports = {
    findBykey: function(req,type,permission,id){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT value FROM level_permissions WHERE level_id = ? AND name = ? AND type = ?',[id,permission,type],function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        let result = JSON.parse(JSON.stringify(results))
                        if(result && result.length){
                            resolve(result[0].value)
                        }else{ 
                            resolve(false)
                        }
                    }else{
                        resolve(false)
                    }
                })
            })
        })
    },
    findById: function(id,req,res,reset = false,setData = true){
        return new Promise(function(resolve, reject) {
            let cache = flatCache.load("levelPermissions"+id, path.resolve(req.cacheDir));
            let key = "__express__levelPermissions"
            let cacheContent = cache.getKey(key)
            if(cacheContent && cacheContent != "{}" && reset == false){
                if(setData)
                req.levelPermissions = cacheContent  
                resolve(cacheContent)
            }else{
                req.getConnection(function(err,connection){
                    connection.query('SELECT * FROM level_permissions WHERE level_id = ?',[id],function(err,results,fields)
                    {
                        if(err)
                            reject("")
                        if(results){
                            const permissionsArray = {}
                            Object.keys(results).forEach(function(key) {
                                let result = JSON.parse(JSON.stringify(results[key]))
                                permissionsArray[result.type+"."+result.name] = result.value
                            })
                            cache.setKey(key, (permissionsArray))
                            cache.save()
                            if(setData)
                                req.levelPermissions = permissionsArray
                            resolve(permissionsArray) 
                        }else{
                            resolve("")
                        }
                    })
                })
            }
        })
    },
    getKeyValue:function(req,level_id,getKeyName){
        let cache = flatCache.load("levelPermissions"+level_id, path.resolve(req.cacheDir));
        let key = "__express__levelPermissions"
        let cacheContent = cache.getKey(key)
        if(!cacheContent)
            return {}
        return cacheContent
    },
    insertUpdate:function(req,res,data,level_id,type){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                Object.keys(data).forEach(function(key) {
                    let result = JSON.parse(JSON.stringify(data[key]))
                    connection.query('INSERT INTO level_permissions SET ? ON DUPLICATE KEY UPDATE value = ?',[{name:key,value:result,level_id:level_id,type:type},result],function(err,results,fields)
                    {
                        
                    })
                })
                self.findById(level_id,req,res,true).then(results => {})
                resolve("")
            })
        })
    }
}
