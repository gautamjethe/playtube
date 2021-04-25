const commonFunction = require("../functions/commonFunctions")
const categoryModel = require("../models/categories")
const settingModel = require("../models/settings")
const md5 = require("md5")
const globalModel = require("../models/globalModel")

exports.create = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, "live_streaming_create")
    
    if(!req.user){
        if (req.query.data) {
            res.send({data: req.query,user_login:1});
            return
        }
        req.app.render(req, res, '/login', req.query);
        return
    }
    
    let settings = await settingModel.settingData(req);
    if(!settings["live_streaming_type"]){
        settings["live_streaming_type"] = 1;
    }
    if(parseInt(settings["live_stream_start"]) != 1 || ( (parseInt(settings['live_streaming_type']) == 1 && !settings["agora_app_id"]) && (parseInt(settings['live_streaming_type']) == 1 && !settings["antserver_media_url"]  ) )){
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    //get categories
    const categories = []
    await categoryModel.findAll(req, { type: "video" }).then(result => {
        result.forEach(function (doc, index) {
            if (doc.subcategory_id == 0 && doc.subsubcategory_id == 0) {
                const docObject = doc
                //2nd level
                let sub = []
                result.forEach(function (subcat, index) {
                    if (subcat.subcategory_id == doc.category_id) {
                        let subsub = []
                        result.forEach(function (subsubcat, index) {
                            if (subsubcat.subsubcategory_id == subcat.category_id) {
                                subsub.push(subsubcat)
                            }
                        });
                        if (subsub.length > 0) {
                            subcat["subsubcategories"] = subsub;
                        }
                        sub.push(subcat)
                    }
                });
                if (sub.length > 0) {
                    docObject["subcategories"] = sub;
                }
                categories.push(docObject);
            }
        })
    })
    if (categories.length > 0)
        req.query.videoCategories = categories
    
    if(settings['live_streaming_type'] == 1 || !settings['live_streaming_type']){
        req.query.agora_app_id = settings["agora_app_id"];
    }else{
        req.query.media_url = settings["antserver_media_url"];
    }

    if(req.appSettings['livestreamingtype'] && req.appSettings['livestreamingtype'] == 0 && (typeof req.appSettings['antserver_media_token'] == "undefined" || req.appSettings['antserver_media_token'] == 1)){
        let maximum = 15000
        let minimum = 12987
        let date = new Date()
        let time = date.getTime()
        let number = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
        let streamingId = "" + number + time
        if(req.appSettings['antserver_media_singlekey'] == 1){
            streamingId =  md5(""+req.user.user_id+(process.env.SECRETKEY ? process.env.SECRETKEY : ""));
        }
        await exports.createKey(req,streamingId).then(response => {
            req.query.tokenStream = response.token
        }).catch(err => {
            console.log(err)
        });
        req.query.streamingId = streamingId
    }else if(req.appSettings['antserver_media_singlekey'] == 1){
        req.query.streamingId =  md5(""+req.user.user_id+(process.env.SECRETKEY ? process.env.SECRETKEY : ""));
    }

    await globalModel.custom(req,"UPDATE users set streamkey = MD5(CONCAT(user_id,'"+(process.env.SECRETKEY ? process.env.SECRETKEY : '') +"')) WHERE streamkey IS NULL AND user_id = ?",[req.user.user_id]).then(result => {}).catch(err => {});
    
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    
    req.app.render(req, res, '/create-livestreaming', req.query);

}
exports.createKey = (req,streamingId) => {
    return new Promise(async (resolve,reject) => {
        const https = require('https');
        const agent = new https.Agent({  
            rejectUnauthorized: false
        });
        let reqData = {listenerHookURL:process.env.PUBLIC_URL+"/api/live-streaming/status","streamId":streamingId,"type": "liveStream","name": req.user.user_id+" - "+req.user.displayname+" live streaming",rtmpURL:"rtmp://"+(req.appSettings['antserver_media_url'].replace("https://","").replace("http://",""))+"/LiveApp"}
        var config = {
            method: 'post',
            url: req.appSettings["antserver_media_url"].replace("https://","http://")+":5080/LiveApp/rest/v2/broadcasts/create",
            headers: { 
                'Content-Type': 'application/json;charset=utf-8'
            },
            data : JSON.stringify(reqData),
            //httpsAgent: agent
        };
        axios(config)
        .then(function (response) {
        if(response.data.status == "created"){
            var myDate = new Date();
            myDate.setHours(myDate.getHours()+24);
            var config = {
                method: 'get',
                url: req.appSettings["antserver_media_url"].replace("https://","http://")+":5080/LiveApp/rest/v2/broadcasts/"+streamingId+"/token?expireDate="+(myDate.getTime() / 1000).toFixed(0)+"&type=publish",
                headers: { 
                    'Content-Type': 'application/json;charset=utf-8'
                },
                //httpsAgent: agent
            };
            axios(config)
            .then(function (response) {
                if(response.data.tokenId){
                    resolve({ token:response.data.tokenId });
                }else{
                    reject(response.error)
                }
            })
        }else{
            console.log(response.data);
            reject(false);
        }        
        })
        .catch(function (error) {
            console.log(error)
            reject(error);
        });
    });
}