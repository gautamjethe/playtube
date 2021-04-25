const flatCache = require("flat-cache")
const path = require('path');
module.exports = {
    getSettings: function(req,res){
        return new Promise(function(resolve, reject) {
            let cache = flatCache.load("apiSettings", path.resolve(req.cacheDir));
            let key = "__express__apiSettings"
            let cacheContent = cache.getKey(key)
            if(cacheContent && cacheContent != "{}"){
                req.appSettings = cacheContent  
                resolve(cacheContent)
            }else{
                req.getConnection(function(err,connection){
                    connection.query('SELECT name,value FROM settings',function(err,results,fields)
                    {
                        if(err)
                            reject("")
                        if(results){
                            const settingsArray = {}
                            Object.keys(results).forEach(function(key) {
                                let result = JSON.parse(JSON.stringify(results[key]))
                                settingsArray[result.name] = result.value
                            })
                            cache.setKey(key,settingsArray)
                            cache.save()
                            req.appSettings = settingsArray
                            resolve(settingsArray) 
                        }else{
                            resolve("")
                        }
                    })
                })
            }
        })
    },
    settingData: function(req){
        return new Promise(function(resolve, reject) {
            let cache = flatCache.load("apiSettings", path.resolve(req.cacheDir));
            let key = "__express__apiSettings"
            let cacheContent = cache.getKey(key)
            if(cacheContent && cacheContent != "{}"){
                resolve(cacheContent)
            }else{
                req.getConnection(function(err,connection){
                    connection.query('SELECT name,value FROM settings',function(err,results,fields)
                    {
                        if(err)
                            reject("")
                        if(results){
                            const settingsArray = {}
                            Object.keys(results).forEach(function(key) {
                                let result = JSON.parse(JSON.stringify(results[key]))
                                settingsArray[result.name] = result.value
                            })
                            resolve(settingsArray) 
                        }else{
                            resolve("")
                        }
                    })
                })
            }
        })
    },
    getSetting: function(req,key,defaultValue){
        if(typeof req.appSettings[key] != "undefined"){
            var value = req.appSettings[key]
            return value;
        }else{
            return defaultValue;
        }
    },
    setSetting:function(req,key,value){
        req.getConnection(function(err,connection){
            connection.query('INSERT INTO `settings` (`name`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE value = ?',[key,value,value],function(err,results,fields)
            {
                return true;
            })
        })
    },
    setSettings: function(req,values){
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                this.setSetting(req,key,values[key])
            }
        }
        let cache = flatCache.load("apiSettings", path.resolve(req.cacheDir));
        let keyCache = "__express__apiSettings"
        cache.setKey(keyCache, JSON.stringify({}))
        cache.save()
    }
}
