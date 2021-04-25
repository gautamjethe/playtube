const { validationResult } = require('express-validator'),
    fieldErrors = require('../../functions/error'),
    errorCodes = require("../../functions/statusCodes"),
    constant = require("../../functions/constant"),
    globalModel = require("../../models/globalModel"),
    commonFunction = require("../../functions/commonFunctions"),
    permissionModel = require("../../models/levelPermissions"),
    ffmpeg = require("fluent-ffmpeg"),
    s3Upload = require('../../functions/upload').uploadtoS3,
    resize = require("../../functions/resize"),
    dateTime = require('node-datetime'),
    path = require('path'),
    uniqid = require('uniqid'),
    videoModel = require("../../models/videos"),
    socketio = require("../../socket"),
    notifications = require("../../models/notifications"),
    privacyModel = require("../../models/privacy"),
    categoryModel = require("../../models/categories"),
    notificationModel = require("../../models/notifications"),
    channelVideosModel = require("../../models/channelvideos"),
    artistModel = require("../../models/artists")
    axios = require("axios"),
    settingModel=require("../../models/settings")
    const async = require('async')
    const {RtcTokenBuilder, RtcRole} = require('agora-access-token');
    const getSymbolFromCurrency = require('currency-symbol-map');

exports.sendTip = async(req,res) => {
    let id = req.body.id

    let tipData = {}
    let videos = {}
    await globalModel.custom(req,"SELECT * FROM tips WHERE tip_id =?",id).then(result => {
        if(result && result.length){
            tipData = JSON.parse(JSON.stringify(result))[0]
        }
    })
    if(!Object.keys(tipData).length  ){
        return res.send({ error: true,message:constant.general.PARAMMISSING, status: errorCodes.invalid }).end();
    }

    await globalModel.custom(req,"SELECT * FROM videos WHERE video_id =?",tipData.resource_id).then(result => {
        if(result && result.length){
            videos = result[0]
        }
    })
    if(!Object.keys(videos).length  ){
        return res.send({ error: true,message:constant.general.PARAMMISSING, status: errorCodes.invalid }).end();
    }
    
    let amount = parseFloat(tipData.amount).toFixed(2)

    let commission_amount = 0
    let commissionType = parseFloat(req.appSettings['videotip_commission_type'])
    let commissionTypeValue = parseFloat(req.appSettings['videotip_commission_value'])
    //calculate admin commission
    if(commissionType == 2 && commissionTypeValue > 0){
        commission_amount = (amount * (commissionTypeValue/100)).toFixed(2);
    }else if(commissionType == 1 && commissionTypeValue > 0){
        commission_amount = commissionTypeValue;
    }
    let ownerAmount = amount
    if(commission_amount > parseFloat(amount).toFixed(2)){
        commission_amount = 0
    }else{
        ownerAmount = (ownerAmount - commission_amount).toFixed(2);
    }

    
    let balance = parseFloat(req.user.wallet)

    if(balance < parseFloat(tipData.amount)){
        return res.send({ error: fieldErrors.errors([{ message: "Your balance is low, please recharge your account." }], true), status: errorCodes.invalid }).end();
    }else{
        var userip;
        if (req.headers['x-forwarded-for']) {
            userip = req.headers['x-forwarded-for'].split(",")[0];
        } else if (req.connection && req.connection.remoteAddress) {
            userip = req.connection.remoteAddress;
        } else {
            userip = req.ip;
        }
        var dt = dateTime.create();
        var formatted = dt.format('Y-m-d H:M:S');
        //deduct balance from user account
        await globalModel.custom(req,"UPDATE users SET `wallet` = wallet - ? WHERE user_id = ?",[amount,req.user.user_id]).then(result => {})
        //insert balance in user account
        await globalModel.custom(req,"UPDATE users SET `balance` = balance + ?  WHERE user_id = ?",[ownerAmount,videos.owner_id]).then(result => {})
        await globalModel.custom(req,"UPDATE tips SET `purchase_count` = purchase_count + ?  WHERE tip_id = ?",[1,id]).then(result => {})
        //insert data in transaction
        await globalModel.create(req, {owner_id:req.user.user_id,video_id:videos.video_id,price:amount,ip:userip,creation_date:formatted}, "tip_donors").then(result => {})
        let insertObject = {}
        insertObject["gateway_id"] = "1"
        insertObject["gateway_transaction_id"] = ""
        insertObject["owner_id"] = videos.owner_id
        insertObject["state"] = "completed"
        insertObject["type"] = "video_tip"
        insertObject["id"] = videos.video_id
        insertObject["price"] = ownerAmount
        insertObject["currency"] = req.appSettings["payment_default_currency"]
        insertObject["admin_commission"] = commission_amount
        insertObject['sender_id'] = req.user.user_id
        insertObject['gateway_transaction_id'] = dt.getTime();
       
        
        insertObject["creation_date"] = formatted
        insertObject["modified_date"] = formatted

        await globalModel.create(req, insertObject, "transactions").then(result => {})
        if(videos.is_livestreaming){
            req.getConnection(function (err, connection) {
                let data = {}
                data['message'] = "Send you "+getSymbolFromCurrency(req.appSettings.payment_default_currency)+(amount)+" tip."
                data['user_id'] = req.user.user_id
                data['displayname'] = req.user.displayname
                data['image'] = req.user.avtar
                if(videos.channel_name){
                    data.room = videos.channel_name
                }else if(videos.mediaserver_stream_id){
                    data.streamId = videos.mediaserver_stream_id
                } 
                videoModel.createChatMessage(connection,data).then(result => {
                    socketio.getIO().to(data.room ? data.room : data.streamId).emit('userMessage', result);
                }).catch(err => {
                    console.log(err)
                    //silence
                });
            })
        }

    }


    return res.send({ message: "Tip send successfully.", status: errorCodes.created }).end();

}

exports.default = async (req,res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }
    
    // all set now
    let insertObject = {}
    let owner_id = req.body.owner_id
    if(!owner_id){
        return res.send({ error: true,message:constant.general.PARAMMISSING, status: errorCodes.invalid }).end();
    }
    let itemObject = {}
    if (owner_id) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM defaultstreaming WHERE user_id = ?", owner_id).then(async result => {
            if (result && result.length) {
                itemObject = JSON.parse(JSON.stringify(result))[0];
            }else{
                
            }
        }).catch(err => {

        })
    } 
    insertObject["user_id"] = owner_id
    if(typeof req.body.comments != "undefined"){
        insertObject['autoapprove_comments'] = parseInt(req.body.comments)
    }
    insertObject["title"] = req.body.title
    insertObject["resource_type"] = "video"
    insertObject["description"] = req.body.description ? req.body.description : ""
    insertObject["category_id"] = req.body.category_id ? req.body.category_id : 0
    insertObject["subcategory_id"] = req.body.subcategory_id ? req.body.subcategory_id : 0
    insertObject["subsubcategory_id"] = req.body.subsubcategory_id ? req.body.subsubcategory_id : 0
    insertObject["adult"] = req.body.adult ? req.body.adult : 0
    insertObject["view_privacy"] = req.body.privacy ? req.body.privacy : 'everyone'
    if (insertObject['view_privacy'] == "password" && req.body.password && req.body.password != "") {
        insertObject['password'] = req.body.password
        insertObject['is_locked'] = 1
    } else {
        if (insertObject["view_privacy"] == "password")
            insertObject["view_privacy"] = "everyone"
        insertObject['password'] = ""
        insertObject['is_locked'] = 0
    }

    

    let tags = req.body.tags
    if (tags && tags.length > 0)
        insertObject["tags"] = tags
    else {
        insertObject['tags'] = null
    }
    

    if(req.body.enable_chat){
        insertObject['enable_chat'] = req.body.enable_chat ? req.body.enable_chat : 1
    }

    if (Object.keys(itemObject).length > 0) {
        //update existing video
        await globalModel.update(req, insertObject, "defaultstreaming", 'defaultstreaming_id', itemObject.defaultstreaming_id).then(async result => {           
            //create tip data
            if(req.body.tips){
                let tips = JSON.parse(req.body.tips);
                await exports.createDefaultTips(req,tips,owner_id)
            }

            //delete tip data
            if(req.body.removeTips){
                let removeTips = JSON.parse(req.body.removeTips);
                await exports.deleteDefaultTip(req,removeTips,owner_id)
            }


            res.send({  message:  constant.general.GENERALSAVED });
            
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    } else {
        //create new video
        await globalModel.create(req, insertObject, "defaultstreaming").then(async result => {
            if (result) {                
                //create tip data
                if(req.body.tips){
                    let tips = JSON.parse(req.body.tips);
                    await exports.createDefaultTips(req,tips,owner_id)
                }
                res.send({  message:  constant.general.GENERALSAVED });
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }
}

exports.deleteDefaultTip = (req,deletes) => {
    return new Promise(async (resolve,reject) => {
        async.forEachOf(deletes, async function (deleteId, i, callback) {

            await globalModel.delete(req,"defaulttips","defaulttip_id",deleteId);

            if (i == deletes.length - 1) {
                resolve(true)
            }
        }, function (err) {
            resolve(true)
        })
    })
}
exports.createDefaultTips = (req,tips,owner_id) => {
    return new Promise(async (resolve,reject) => {
        async.forEachOf(tips, async function (tipData, i, callback) {
            let tip = tips[i]
            let price = parseFloat(tip.amount)
            if( price > 0){
                //insert into database
                let insertObject = {}
                insertObject['amount'] = tip.amount;
                if(!tip.defaulttip_id){
                    insertObject['user_id'] = owner_id;
                    insertObject['resource_type'] = "video";
                    await globalModel.create(req, insertObject, "defaulttips").then(result => {})
                }else{
                    //update
                  //  await globalModel.update(req, insertObject, "defaulttips", 'defaulttip_id', videoId).then(result => {});
                }
            }else if(tip.tip_id){
                //delete entry
                await globalModel.delete(req,"defaulttips","defaulttip_id",tip.defaulttip_id);
            }
            if (i == tips.length - 1) {
                resolve(true)
            }
        }, function (err) {
            resolve(true)
        })
        
    })
}

exports.streamingStatus = async(req,res) => {
    let action = req.body.action
    let id = req.body.id
    let streamName = req.body.streamName
    let vodId = req.body.vodId
    if(action == "liveStreamStarted"){
        socketio.getIO().emit('liveStreamStatus', {
            action: action,
            id:id,
            streamName:streamName
        });
        if(req.appSettings['antserver_media_singlekey'] == 1){
            //check stream created
            globalModel.custom(req,"SELECT mediaserver_stream_id from videos where mediaserver_stream_id = ? AND is_livestreaming = 1",[id]).then(async result => {
                if(result){
                    const results = JSON.parse(JSON.stringify(result));
                    if(results && results.length){

                    }else{
                        //get user with streaming key
                        
                        globalModel.custom(req,"SELECT * from users where streamkey = ?",[id]).then(async result => {
                            const results = JSON.parse(JSON.stringify(result));
                            if(results && results.length){
                                let user = results[0]
                                let permissions = {}
                                await permissionModel.findById(user.level_id,req,res).then(results => {
                                    permissions = results
                                })
                                //check quota
                                if(permissions["livestreaming.quota"] > 0){
                                    //get count of user uploaded livestreaming
                                    await videoModel.liveStreamingUploadCount(req,res,user.user_id).then(result => {
                                        if(result){
                                            if(result.totalLiveStreaming >= permissions["livestreaming.quota"]){
                                                req.quotaLimitError = true
                                            }
                                        }
                                    })
                                }
                                if(req.quotaLimitError){
                                    return
                                }

                                //default tip data
                                let tipdata = []
                                if(parseInt(req.appSettings['video_tip']) == 1){
                                    //get tip data
                                    await videoModel.getDefaultTips(req,{user_id:user.user_id,resource_type:"video"}).then(result => {
                                        if(result && result.length > 0)
                                            tipdata = result
                                    })
                                }


                                let defaultSettings = {}
                                //default streaming data
                                await videoModel.getDefaultStreamingData(req,{user_id:user.user_id,resource_type:"video"}).then(result => {
                                    if(result && result.length > 0)
                                        defaultSettings = result[0]
                                })

                                


                                let insertObject = {}
                                //create new live streaming
                                insertObject["title"] = defaultSettings.title ? defaultSettings.title : req.i18n.t("Live Streaming")
                                insertObject["description"] = defaultSettings.description ? defaultSettings.description : ""
                                insertObject["category_id"] = defaultSettings.category_id ? defaultSettings.category_id : 0
                                insertObject["subcategory_id"] =  defaultSettings.subcategory_id ? defaultSettings.subcategory_id : 0
                                insertObject["subsubcategory_id"] =  defaultSettings.subsubcategory_id ? defaultSettings.subsubcategory_id : 0
                                insertObject["adult"] =  defaultSettings.adult ? defaultSettings.adult : 0                            
                                insertObject["view_privacy"] =  defaultSettings.view_privacy ? defaultSettings.view_privacy : "everyone"
                                insertObject['is_locked'] = defaultSettings.is_locked ? defaultSettings.is_locked : 0
                                insertObject['password'] = defaultSettings.password ? defaultSettings.password : ""
                                insertObject['enable_chat'] = defaultSettings.enable_chat ? defaultSettings.enable_chat : 1
                                insertObject['autoapprove_comments'] = defaultSettings.autoapprove_comments ? defaultSettings.autoapprove_comments : 1
                                insertObject['tags'] = defaultSettings.tags ? defaultSettings.tags : null

                                insertObject["price"] =  0
                                insertObject["search"] =  1
                                insertObject['mediaserver_stream_id'] = id
                                insertObject['type'] = 11;
                                insertObject['owner_id'] = user.user_id
                                var dt = dateTime.create();
                                var formatted = dt.format('Y-m-d H:M:S');
                                
                                insertObject["custom_url"] = uniqid.process('v')
                                insertObject["is_sponsored"] = permissions['video.sponsored'] == "1" ? 1 : 0
                                insertObject["is_featured"] = permissions['video.featured'] == "1" ? 1 : 0
                                insertObject["is_hot"] = permissions['video.hot'] == "1" ? 1 : 0
                                insertObject['approve'] = 1;
                                insertObject["completed"] = 1
                                insertObject["creation_date"] = formatted
                                insertObject["modified_date"] = formatted                    
                                insertObject['is_livestreaming'] = 1;
                                
                                
                                await globalModel.create(req, insertObject, "videos").then(async result => {
                                    if (result) {

                                        if(tipdata.length > 0){
                                            await exports.createTips(req,tipdata,result.insertId,true)
                                        }

                                        //notify followers
                                        notificationModel.insertFollowNotifications(req,{subject_type:"users",subject_id:user.user_id,object_type:"videos",object_id:result.insertId,type:"live_video"}).then(result => {

                                        }).catch(err => {
                        
                                        })
                                    }

                                });
                                

                            }
                        })                    
                    }
                }
            })
         }
    }else if(action == "liveStreamEnded"){
        globalModel.custom(req, "UPDATE videos SET is_livestreaming = 0 WHERE mediaserver_stream_id = '"+id+"'").then(result => {

        }).catch(err => { 
            
        })
        socketio.getIO().emit('liveStreamStatus', {
            action: action,
            id:id,
            streamName:streamName
        });

    }else if(action == "vodReady"){

        globalModel.custom(req,"SELECT * from videos where mediaserver_stream_id = ? AND is_livestreaming = 0 ORDER BY video_id DESC LIMIT 1",[id]).then(async result => {
            if(result){
                const results = JSON.parse(JSON.stringify(result));
                if(results && results.length){
                    let videoObj = results[0];
                    let name = req.body.vodName
                    //check video type
                    let insertObject = {}
                    insertObject["agora_resource_id"] = videoObj.agora_resource_id ? videoObj.agora_resource_id+","+vodId : vodId
                    insertObject["code"] = videoObj.code ? videoObj.code+","+req.body.vodName+".mp4" : req.body.vodName+".mp4"
                    
                    var n = name.lastIndexOf('_');
                    var matchResolution = name.substring(n + 1);
                    if(!videoObj.image){
                        insertObject['image'] = "/LiveApp/previews/"+req.body.vodName+".png"
                        if(n > -1){
                            insertObject['image'] = insertObject['image'].replace("_"+matchResolution,'');
                        }
                    }
                    let valid = true

                    if(matchResolution == "240p"){
                        insertObject["240p"] = 1;
                        if(videoObj["240p"] == 1){
                            valid = false
                        }
                    }else if(matchResolution == "360p"){
                        insertObject["360p"] = 1;
                        if(videoObj['360p'] == 1){
                            valid = false
                        }
                    }else if(matchResolution == "480p"){
                        insertObject["480p"] = 1;
                        if(videoObj['480p'] == 1){
                            valid = false
                        }
                    }else if(matchResolution == "720p"){
                        insertObject["720p"] = 1;
                        if(videoObj['720p'] == 1){
                            valid = false
                        }
                    }else if(matchResolution == "1080p"){
                        insertObject["1080p"] = 1;
                        if(videoObj['1080p'] == 1){
                            valid = false
                        }
                    }else if(matchResolution == "2048p"){
                        insertObject["2048p"] = 1;
                        if(videoObj['2048p'] == 1){
                            valid = false
                        }
                    }else if(matchResolution == "4096p"){
                        insertObject["4096p"] = 1;
                        if(videoObj['4096p'] == 1){
                            valid = false
                        }
                    }else if(req.appSettings['antserver_media_hlssupported'] == 1){
                        valid = false
                    }
                    if(valid){
                        globalModel.update(req, insertObject, "videos", 'video_id', videoObj.video_id).then(async result => {

                        }).catch(err => { 
                            
                        })
                    }
                }
            }
        })

        

    }
    res.send({status:true})
}

exports.createKey = async(req,res) => {
    const https = require('https');
    const agent = new https.Agent({  
        rejectUnauthorized: false
      });
    let reqData = {listenerHookURL:process.env.PUBLIC_URL+"/api/live-streaming/status","streamId":req.body.streamingId,"type": "liveStream","name": req.user.user_id+" - "+req.user.displayname+" live streaming",rtmpURL:"rtmp://"+(req.appSettings['antserver_media_url'].replace("https://","").replace("http://",""))+"/LiveApp"}
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
            url: req.appSettings["antserver_media_url"].replace("https://","http://")+":5080/LiveApp/rest/v2/broadcasts/"+req.body.streamingId+"/token?expireDate="+(myDate.getTime() / 1000).toFixed(0)+"&type=publish",
            headers: { 
                'Content-Type': 'application/json;charset=utf-8'
            },
            //httpsAgent: agent
        };
        axios(config)
        .then(function (response) {
            if(response.data.tokenId){
                return res.send({ status: true,token:response.data.tokenId }).end(); 
            }else{
                return res.send({ error: true }).end(); 
            }
        })
       }else{
        return res.send({ error: true }).end(); 
       }        
    })
    .catch(function (error) {
        console.log(error)
        return res.send({ error: error,status:false }).end(); 
    });

}

exports.generateAccessToken = async (req, resp) => {
    // set response header
    resp.header('Acess-Control-Allow-Origin', '*');
    // get channel name
    const channelName = req.query.channelName;
    if (!channelName) {
        return resp.status(500).json({ 'error': 'channel is required' });
    }
    let settings = await settingModel.settingData(req);
    let APP_ID = settings["agora_app_id"];
    let APP_CERTIFICATE = settings["agora_app_certificate"];
    
    // get uid 
    let uid = 0
    
    // get role
    let role = RtcRole.SUBSCRIBER;
    if (req.query.role == 'publisher') {
        //for host
        role = RtcRole.PUBLISHER;
    }
    // get the expire time
    let expireTime = 3600*10;
    
    // calculate privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    // build the token
    const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
    // return the token
    return resp.json({ 'token': token });
}

exports.addViewer = async(req,res) => {
    res.send({})
    let customUrl = req.body.custom_url
    globalModel.custom(req,"UPDATE videos SET total_viewer = total_viewer + 1 WHERE custom_url = ?",[customUrl]).then(result => {

    })
    socketio.getIO().emit('liveStreamingViewerAdded', {
        "custom_url": customUrl
    });
}
exports.removeViewer = async(req,res) => {
    res.send({})
    let customUrl = req.body.custom_url
    globalModel.custom(req,"UPDATE videos SET total_viewer = total_viewer - 1 WHERE custom_url = ?",[customUrl]).then(result => {

    })
    socketio.getIO().emit('liveStreamingViewerDelete', {
        "custom_url": customUrl
    });    
} 
exports.finishStreaming = async (req,res) => {
    let streamID = req.body.streamID
    if(req.body.remove){
        exports.deleteStream(req,streamID)
        return;
    }
    let settings = await settingModel.settingData(req);
    
    
    globalModel.custom(req, "UPDATE videos SET is_livestreaming = 0 WHERE mediaserver_stream_id = '"+streamID+"'").then(result => {

    }).catch(err => { 
        
    })

    const https = require('https');
    const agent = new https.Agent({  
        rejectUnauthorized: false
      });
      
    var config = {
        method: 'post',
        url: req.appSettings["antserver_media_url"].replace("https://","http://")+":5080/LiveApp/rest/v2/broadcasts/"+streamID+"/stop",
        headers: { 
            'Content-Type': 'application/json;charset=utf-8'
        },
        //httpsAgent: agent
    };
    axios(config)
    .then(function (response) {

        exports.deleteStream(req,streamID)
        


       res.send({status:true})        
    })
    .catch(function (error) {
        res.send({status:false,error})
    });
}
exports.deleteStream = (req,streamID) => {
    //delete broadcast
    var config = {
        method: 'delete',
        url: req.appSettings["antserver_media_url"].replace("https://","http://")+":5080/LiveApp/rest/v2/broadcasts/"+streamID,
        headers: { 
            'Content-Type': 'application/json;charset=utf-8'
        },
        //httpsAgent: agent
    };
    axios(config)
    .then(function (response) {
    }).catch(function (error) {});
}
exports.mediaStreamRecord = async(req,res) => {
    let settings = await settingModel.settingData(req);
    let streamID = req.body.streamID
    if(settings['live_stream_save'] != 1){
        return res.send({})
     }

     const https = require('https');
    const agent = new https.Agent({  
        rejectUnauthorized: false
      });
    var config = {
        method: 'put',
        url: req.appSettings["antserver_media_url"].replace("https://","http://")+":5080/LiveApp/rest/v2/broadcasts/"+streamID+"/recording/true",
        headers: { 
            'Content-Type': 'application/json;charset=utf-8'
        },
        //httpsAgent: agent
    };
    axios(config)
    .then(function (response) {
       res.send({status:true})        
    })
    .catch(function (error) {
        res.send({status:false,error})
    });
}
exports.cloudRecrodingStart = async(req,res) => {
    let settings = await settingModel.settingData(req);
    let agora_app_id = settings["agora_app_id"];
    let AccessChannel = req.body.channel
    let RecordingUID = req.body.channel.split("_")[1]
    let videoCustomUrl = req.body.custom_url

    globalModel.custom(req, "UPDATE videos SET channel_name = '"+AccessChannel+"' WHERE custom_url = '"+videoCustomUrl+"'").then(result => {
        
    }).catch(err => {})

    if(!agora_app_id || settings['live_stream_save'] != 1 || !settings["agora_customer_id"] || !settings["agora_customer_certificate"] || !settings["agora_s3_bucket"]
    || !settings["agora_s3_access_key"] || !settings["agora_s3_secret_access_key"] || !settings["agora_s3_region"]){
       return res.send({})
    }


    let authorizationBasic = Buffer.from(settings["agora_customer_id"]+':'+settings["agora_customer_certificate"]).toString("base64")
    const https = require('https');
    const agent = new https.Agent({  
        rejectUnauthorized: false
      });
    let reqData = {"cname":AccessChannel,"uid":RecordingUID,"clientRequest":{}}
    var data = JSON.stringify(reqData)
    var config = {
        method: 'post',
        url: 'https://api.agora.io/v1/apps/'+agora_app_id+'/cloud_recording/acquire',
        headers: { 
            'Content-Type': 'application/json;charset=utf-8',
            "Authorization": "Basic " + authorizationBasic
        },
        data : data,
        //httpsAgent: agent 
    };   
   

    axios(config)
    .then(function (response) {
        let acquireData = response.data;
        let resourceId = acquireData.resourceId
         //start recording
         let regions = {
             'us-east-1': 0,
             'us-east-2' : 1,
             'us-west-1' : 2,
             'us-west-2' : 3,
             'eu-west-1' : 4,
             'eu-west-2' : 5,
             'eu-west-3' : 6,
             'eu-central-1' : 7,
             'ap-southeast-1' : 8,
             'ap-southeast-2' : 9,
             'ap-northeast-1' : 10,
             'ap-northeast-2' : 11,
             'sa-east-1' : 12,
             'ca-central-1' : 13,
             'ap-south-1' : 14,
             'cn-north-1' : 15,
             'us-gov-west-1' : 17
         };

            var dataStart = {
                "cname":AccessChannel,
                "uid":RecordingUID,
                "clientRequest":{
                    "recordingConfig":{
                        "channelType":1,
                        "streamTypes":2,
                        "audioProfile":1,
                        "videoStreamType":1,
                        "maxIdleTime":120,
                        "transcodingConfig":{
                            "width":480,
                            "height":720,
                            "fps":24,
                            "bitrate":800,
                            "maxResolutionUid":"1",
                            "mixedVideoLayout":1
                            }
                        },
                        "storageConfig":{
                            "vendor":1,
                            "region":regions[settings["agora_s3_region"]],
                            "bucket":settings["agora_s3_bucket"],
                            "accessKey":settings["agora_s3_access_key"],
                            "secretKey":settings["agora_s3_secret_access_key"],
                            "fileNamePrefix": [
                                "upload",
                                "livestreamings"
                            ]
                        } 
                }
            } 


            var configStart = {
                method: 'post',
                url: 'https://api.agora.io/v1/apps/'+agora_app_id+'/cloud_recording/resourceid/'+resourceId+'/mode/mix/start',
                headers: { 
                    'Content-Type': 'application/json;charset=utf-8',
                    "Authorization": "Basic " + authorizationBasic

                },
                data : JSON.stringify(dataStart),
                //httpsAgent: agent 
            };
            axios(configStart)
            .then(function (response) {
                let responseData = response.data
                //save agora resource and sid for recording stopping purpose
                globalModel.custom(req, "UPDATE videos SET agora_resource_id = '"+resourceId+"',agora_sid = '"+responseData.sid+"' WHERE custom_url = '"+videoCustomUrl+"'").then(result => {

                }).catch(err => { 
                })
                return res.send({ status: errorCodes.created }).end(); 
            })
            .catch(function (error) {
                return res.send({ error: fieldErrors.errors([{ msg: error.message }], true), status: errorCodes.invalid }).end(); 
            });
    })
    .catch(function (error) {
        return res.send({ error: fieldErrors.errors([{ msg: error.message }], true), status: errorCodes.invalid }).end(); 
    });
}

exports.cloudRecrodingStop = async(req,res) => {
    res.send({})
    let settings = await settingModel.settingData(req);
    let agora_app_id = settings["agora_app_id"];
    let AccessChannel = req.body.channel
    let RecordingUID = req.body.channel.split("_")[1]
    let videoCustomUrl = req.body.custom_url
    let videoObject = {}
    await globalModel.custom(req, "SELECT agora_resource_id,agora_sid FROM videos WHERE custom_url = ?", videoCustomUrl).then(async result => {
        if (result && result.length) {
            videoObject = JSON.parse(JSON.stringify(result))[0];
        }
    }).catch(err => {

    }) 

    if(!Object.keys(videoObject).length){
        return;
    }
    globalModel.custom(req, "UPDATE videos SET is_livestreaming = 0 WHERE custom_url = '"+videoCustomUrl+"'").then(result => {

    }).catch(err => { 
        
    })
    
    if(!agora_app_id || settings['live_stream_save'] != 1 || !settings["agora_customer_id"] || !settings["agora_customer_certificate"] || !settings["agora_s3_bucket"]
    || !settings["agora_s3_access_key"] || !settings["agora_s3_secret_access_key"] || !settings["agora_s3_region"]){
       return
    }
    const https = require('https');
    const agent = new https.Agent({  
        rejectUnauthorized: false
      });
    let authorizationBasic = Buffer.from(settings["agora_customer_id"]+':'+settings["agora_customer_certificate"]).toString("base64")
    let reqData = {"cname":AccessChannel,"uid":RecordingUID,"clientRequest":{}}
    var config = {
        method: 'post',
        url: 'https://api.agora.io/v1/apps/'+agora_app_id+'/cloud_recording/resourceid/'+videoObject.agora_resource_id+'/sid/'+videoObject.agora_sid+'/mode/mix/stop',
        headers: { 
            'Content-Type': 'application/json;charset=utf-8',
            "Authorization": "Basic " + authorizationBasic
        },
        data : JSON.stringify(reqData),
        //httpsAgent: agent
    };
    axios(config)
    .then(function (response) {
        let responseData = response.data
        let customData = ""
        if(responseData.serverResponse && responseData.serverResponse.fileList) {
            //responseData.serverResponse.fileList
             customData  = "code = '"+responseData.serverResponse.fileList+"'";
             globalModel.custom(req, "UPDATE videos SET "+customData+", is_livestreaming = 0 WHERE custom_url = '"+videoCustomUrl+"'").then(result => {

            }).catch(err => { 
                
            })
        }
        //return res.send({ status: errorCodes.created }).end(); 
    })
    .catch(function (error) {
        console.log(' error stop video')
        //return res.send({ error: fieldErrors.errors([{ msg: constant.video.LIVESTREAMINGSTOPPINGERROR }], true), status: errorCodes.invalid }).end(); 
    });
}
exports.artists = async(req,res) => {

    let videoId = req.body.video_id
    let video = {}
    if (videoId) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM videos WHERE video_id = ?", videoId).then(async result => {
            if (result && result.length) {
                video = JSON.parse(JSON.stringify(result))[0];
            }else{
                videoId = null
            }
        }).catch(err => {

        })
    } else {
        return res.send({})
    }
    if(!videoId || !Object.keys(video).length){
        return res.send({})
    }
    //fetch artists
    let LimitNumArtist = 17;
    let pageArtist = 1
    if (req.body.page == '') {
        pageArtist = 1;
    } else {
        //parse int Convert String to number 
        pageArtist = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    let offsetArtist = (pageArtist - 1) * LimitNumArtist
    if (video.artists && video.artist != "" && req.appSettings['video_artists'] == "1") {
        await artistModel.findByIds(video.artists, req, res, LimitNumArtist, offsetArtist).then(result => {
            let pagging = false
            if (result) {
                pagging = false
                if (result.length > LimitNumArtist - 1) {
                    result = result.splice(0, LimitNumArtist - 1);
                    pagging = true
                }
                res.send( {
                    'pagging': pagging,
                    artists: result
                })
            }
        }).catch(error => {
            console.log(error)
        })
    } else {
        res.send({
            'pagging': false,
            artists: []
        })
    }
}
exports.delete = async (req, res) => {
    if (!req.item) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.invalid }).end();
    }

    await videoModel.delete(req.item.video_id, req).then(result => {
        if (result) {
            commonFunction.deleteImage(req, res, "", "video", req.item)
            res.send({"message":constant.video.DELETED})
            socketio.getIO().emit('videoDeleted', {
                "video_id": req.item.video_id,
                "message": constant.video.DELETED,
            });
        }else{
            res.send({})
        }
    })

   

}
exports.category = async (req, res) => {
    req.query.categoryId = req.params.id
    req.query.type = "video"
    let category = {}
    let send = false
    let limit = 13;
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (limit - 1)
    await categoryModel.findByCustomUrl({ id: req.query.categoryId, type: req.query.type }, req, res).then(async result => {
        if (result) {
            category = result
            const data = { limit: limit, offset: offset }
            if (category.subcategory_id == 0 && category.subsubcategory_id == 0) {
                data['category_id'] = category.category_id
            } else if (category.subcategory_id > 0) {
                data['subcategory_id'] = category.category_id
            } else if (category.subsubcategory_id > 0) {
                data['subsubcategory_id'] = category.category_id
            }
            //get all blogs as per categories
            await videoModel.getVideos(req, data).then(result => {
                if (result) {
                    let pagging = false
                    let items = result
                    if (result.length > limit - 1) {
                        items = result.splice(0, limit - 1);
                        pagging = true
                    }
                    send = true
                    res.send({ pagging: pagging, items: items })
                }
            })
        }
    }).catch(error => {
        res.send({ pagging: false, items: [] })
        return
    })
    if (!send)
        res.send({ pagging: false, items: [] })
}
exports.browse = async (req, res) => {
    const queryString = req.query
    let limit = 13
    let page = 1
    if(parseInt(req.body.limit)){
        limit = parseInt(req.body.limit)
    }
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (limit - 1)
    const data = { limit: limit, offset: offset }
    data['type'] = queryString.type
    if (queryString.q && !queryString.tag) {
        data['title'] = queryString.q
    }

    data['pageType'] = req.body.pageType
    data['liveStreamingPage'] = req.body.liveStreamingPage
    if (queryString.type) {
        data['tags'] = queryString.tag
    }
    if (queryString.category_id) {
        data['category_id'] = queryString.category_id
    }
    if (queryString.subcategory_id) {
        data['subcategory_id'] = queryString.subcategory_id
    }
    if (queryString.subsubcategory_id) {
        data['subsubcategory_id'] = queryString.subsubcategory_id
    }
    if (queryString.sort == "latest") {
        data['orderby'] = "videos.video_id desc"
    } else if (queryString.sort == "favourite" && req.appSettings['video_favourite'] == 1) {
        data['orderby'] = "videos.favourite_count desc"
    } else if (queryString.sort == "view") {
        data['orderby'] = "videos.view_count desc"
    } else if (queryString.sort == "like" && req.appSettings['video_like'] == "1") {
        data['orderby'] = "videos.like_count desc"
    } else if (queryString.sort == "dislike" && req.appSettings['video_dislike'] == "1") {
        data['orderby'] = "videos.dislike_count desc"
    } else if (queryString.sort == "rated" && req.appSettings['video_rating'] == "1") {
        data['orderby'] = "videos.rating desc"
    } else if (queryString.sort == "commented" && req.appSettings['video_comment'] == "1") {
        data['orderby'] = "videos.comment_count desc"
    }

    if (queryString.type == "featured" && req.appSettings['video_featured'] == 1) {
        data['is_featured'] = 1
    } else if (queryString.type == "sponsored" && req.appSettings['video_sponsored'] == 1) {
        data['is_sponsored'] = 1
    } else if (queryString.type == "hot" && req.appSettings['video_hot'] == 1) {
        data['is_hot'] = 1
    }

    if(req.body.videoPurchased){
        data.purchaseVideo = true
        data.purchase_user_id = req.body.purchase_user_id
    }

    
    //get all videos as per categories
    await videoModel.getVideos(req, data).then(result => {
        if (result) {
            let pagging = false
            let items = result
            if (result.length > limit - 1) {
                items = result.splice(0, limit - 1);
                pagging = true
            }
            res.send({ videos: items, pagging: pagging })
        }
    }).catch(err => {
        res.send({})
    })

}
exports.getDonors = async(req,res) => {
    const video_id = req.body.video_id
    if (!video_id) {
        return res.send({})
    }
    let LimitNum = 13;
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    let videos = {}
    let offset = (page - 1) * (LimitNum - 1)

    //get donors
    await videoModel.donors({video_id:video_id, limit: LimitNum, offset:offset}, req).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            videos = {
                'pagging': pagging,
                members: result
            }
        }
    }).catch(error => {

    })
    res.send(videos)
}
exports.getVideos = async (req, res, next) => {
    const criteria = req.body.criteria
    const value = req.body.value

    let LimitNum = 13;
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (LimitNum - 1)

    const data = {}
    if (criteria == "search") {
        data.title = value
    } else if (criteria == "my") { 
        data.owner_id = req.user ? req.user.user_id : "0"
    } else if (criteria == "url") {
        var final = value.substr(value.lastIndexOf('/') + 1);
        data.custom_url = final
        offset = null
        page = 1
    }
    if (req.body.channel_id) {
        data.channel_id = req.body.channel_id
    }
    data.limit = LimitNum
    data.offset = offset
    data.search = true;
    let send = false
    await videoModel.getVideos(req, data).then(result => {
        if (result && result.length > 0) {
            send = true
            let pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            return res.send({ pagging: pagging, videos: result })
        }
    }).catch(error => {

    })
    if (!req.headersSent && !send)
        res.send({ pagging: false, videos: [] })

}
exports.importUrl = async (req, res, next) => {
    if (req.quotaLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.video.QUOTAREACHED }], true), status: errorCodes.invalid }).end();
    }
    const url = req.body["import-url"]
    if (req.appSettings["enable_iframely"] != "1" || req.appSettings["iframely_api_key"] == "") {
        await commonFunction.getUploadVideoInfo(url).then(async result => {
            if (!result.status) {
                let type = 0
                let channel = ""
                if (result.provider == "youtube") {
                    type = 1;
                } else if (result.provider == "vimeo") {
                    type = 2
                } else if (result.provider == "dailymotion") {
                    type = 4
                } else if (result.provider == "twitch" && result.mediaType == "video") {
                    type = 5
                } else if (result.provider == "twitch" && result.mediaType == "clip") {
                    type = 6
                    channel = result.channel+","+result.id
                }else if (result.provider == "twitch" && result.mediaType == "stream") {
                    type = 8
                    channel = result.channel
                } else if (result.provider == "facebook") {
                    type = 7
                }else if(result.provider == "mp4_mov"){
                    type = 9
                    let responseData = {}
                    responseData['type'] = type
                    responseData['code'] = result.id
                    return res.send(responseData)
                }
                const code = result.id
                await commonFunction.getVideoData(result.provider, result.id, req, result).then(result => {
                    if (result) {
                        let responseData = result
                        responseData['type'] = type
                        responseData['code'] = code
                        if (channel)
                            responseData['code'] = channel
                        return res.send(responseData)
                    } else {
                        return res.send({ error: fieldErrors.errors([{ msg: "Please provide valid url." }], true), status: errorCodes.invalid }).end();
                    }
                }).catch(error => {
                    
                    return res.send({ error: fieldErrors.errors([{ msg: "Please provide valid url." }], true), status: errorCodes.invalid }).end();
                })
            }
        }).catch(error => {
            console.log(error)
            return res.send({ error: fieldErrors.errors([{ msg: "Please provide valid url." }], true), status: errorCodes.invalid }).end();
        })
    } else {
        const key = req.appSettings["iframely_api_key"]
        const disallowDomain = req.appSettings["iframely_disallow_sources"] || ""

        await commonFunction.iframely(url, key, disallowDomain, req).then(async resultData => {
            if (!resultData) {
                return res.send({ error: fieldErrors.errors([{ msg: "Please provide valid url." }], true), status: errorCodes.invalid }).end();
            }
            await commonFunction.getUploadVideoInfo(url).then(async result => {
                let responseData = resultData
                let type = null
                let channel = null
                const code = result.id
                responseData['code'] = code
                if (result.provider == "youtube") {
                    type = 1;
                } else if (result.provider == "vimeo") {
                    type = 2
                } else if (result.provider == "dailymotion") {
                    type = 4
                } else if (result.provider == "twitch" && result.mediaType == "video") {
                    type = 5
                } else if (result.provider == "twitch" && result.mediaType == "clip") {
                    type = 6
                    channel = result.channel
                } else if (result.provider == "facebook") {
                    type = 7
                } else {
                    type = 20
                    responseData['code'] = resultData['html']
                }
                responseData['type'] = type
                if (type == 6)
                    responseData['channel'] = channel
                return res.send(responseData)
            }).catch(error => {
                return res.send({ error: fieldErrors.errors([{ msg: "Please provide valid url." }], true), status: errorCodes.invalid }).end();
            })

        }).catch(error => {
            return res.send({ error: fieldErrors.errors([{ msg: "Please provide valid url." }], true), status: errorCodes.invalid }).end();
        })

    }
}
exports.password = async (req, res) => {
    let password = req.body.password
    let id = req.params.id

    let video = {}

    await videoModel.findByCustomUrl(id, req, res, true).then(result => {
        if (result)
            video = result
    }).catch(error => {

    })
    
    if (video.password == password) {
        req.session.password.push(video.video_id)
        res.send({})
        return
    }
    return res.send({ error: fieldErrors.errors([{ msg: "Password you entered is not correct." }], true), status: errorCodes.invalid }).end();

}

exports.create = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, "", true);
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    if (req.quotaLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.video.liveStreaming }], true), status: errorCodes.invalid }).end();
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }
    if(req.body.price){
        if(parseFloat(req.body.price) < 0){
            return res.send({ error: fieldErrors.errors([{ msg: "Please provide valid price." }], true), status: errorCodes.invalid }).end();
        }
    }
    // all set now
    let insertObject = {}
    let videoId = req.body.videoId
    let videoObject = {}
    if (videoId) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM videos WHERE video_id = ?", videoId).then(async result => {
            if (result && result.length) {
                videoObject = JSON.parse(JSON.stringify(result))[0];
                if(!req.body.videoResolution){
                    await privacyModel.permission(req, 'video', 'edit', videoObject).then(result => {
                        if(!result && !req.body.videoResolution){
                            videoId = null
                            videoObject = null
                        }
                    }).catch(err => {
                        videoId = null
                    })
                }
            }else{
                videoId = null
            }
        }).catch(err => {

        })
    } else {
        insertObject["owner_id"] = req.user.user_id;
    }
    if(typeof req.body.comments != "undefined"){
        insertObject['autoapprove_comments'] = parseInt(req.body.comments)
    }
    insertObject["title"] = req.body.title
    insertObject["description"] = req.body.description ? req.body.description : ""
    insertObject["category_id"] = req.body.category_id ? req.body.category_id : 0
    insertObject["subcategory_id"] = req.body.subcategory_id ? req.body.subcategory_id : 0
    insertObject["subsubcategory_id"] = req.body.subsubcategory_id ? req.body.subsubcategory_id : 0
    insertObject["price"] = parseFloat(req.body.price) ? parseFloat(req.body.price) : 0
    insertObject["adult"] = req.body.adult ? req.body.adult : 0
    insertObject["search"] = req.body.search ? req.body.search : 1
    insertObject["view_privacy"] = req.body.privacy ? req.body.privacy : 'everyone'
    if (insertObject['view_privacy'] == "password" && req.body.password && req.body.password != "") {
        insertObject['password'] = req.body.password
        insertObject['is_locked'] = 1
    } else {
        if (insertObject["view_privacy"] == "password")
            insertObject["view_privacy"] = "everyone"
        insertObject['password'] = ""
        insertObject['is_locked'] = 0
    }

    if (req.body.duration && req.body.duration != "undefined")
        insertObject["duration"] = req.body.duration

    if (req.body.type && req.body.type != "undefined")
        insertObject["type"] = req.body.type
    if (req.body.code && req.body.code != "undefined") {
        if (req.body.type == 5) {
            req.body.code = req.body.code.substr(1)
        }
        insertObject["code"] = req.body.type != 6 ? req.body.code : req.body.code + "," + req.body.channel
    }
    if(req.liveStreaming){
        insertObject['type'] = 10;
    }
    
    if (req.body.videoImage) {
        if(req.body.videoImage.indexOf(process.env.PUBLIC_URL) < 0)
            insertObject['image'] = req.body.videoImage
    }else if (req.fileName) {
        if(req.liveStreaming){
            insertObject['image'] = "/upload/images/live-streaming/" + req.fileName;

        }else
            insertObject['image'] = "/upload/images/videos/video/" + req.fileName;
    }else{
        insertObject['image'] = "";
        if(Object.keys(videoObject).length && videoObject.image)
            commonFunction.deleteImage(req, res, videoObject.image, 'video/image');
    }

    if(req.body.streamingId){
        insertObject['mediaserver_stream_id'] = req.body.streamingId
        insertObject['type'] = 11;
    }

    if (Object.keys(videoObject).length && videoId) {
        if (!req.fileName && !req.body.fromEdit) { 
            const image = videoObject.image
            if (image) {
                const extension = path.extname(image)
                const file = path.basename(image, extension)
                const pathName = req.serverDirectoryPath + "/public"
                const newFileName = file + "_video" + extension
                req.imageResize = [
                    { width: req.widthResize, height: req.heightResize }
                ];
                var resizeObj = new resize(pathName, image, req)
                await resizeObj.save("/upload/images/videos/video/" + newFileName).then(async res => {
                    commonFunction.deleteImage(req, res, videoObject.image, 'video/image');
                    insertObject['image'] = "/upload/images/videos/video/" + newFileName;
                    if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                        await s3Upload(req, req.serverDirectoryPath + insertObject['image'], insertObject['image']).then(result => {
                            //remove local file
                            commonFunction.deleteImage(req, res, insertObject['image'], 'locale')
                        }).catch(err => {

                        })
                    }
                })
            }
        } else {
            if (req.fileName) {
                insertObject['image'] = "/upload/images/videos/video/" + req.fileName;
            }
            commonFunction.deleteImage(req, res, videoObject.image, 'video/image');
        }
        if(!req.body.fromEdit)
            insertObject['status'] = 2;
    }
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    if(req.body.videoResolution){
        insertObject['resolution'] = req.body.videoResolution
    }
    if (!Object.keys(videoObject).length || !videoObject.custom_url) {
        insertObject["custom_url"] = uniqid.process('v')
        insertObject["is_sponsored"] = req.levelPermissions['video.sponsored'] == "1" ? 1 : 0
        insertObject["is_featured"] = req.levelPermissions['video.featured'] == "1" ? 1 : 0
        insertObject["is_hot"] = req.levelPermissions['video.hot'] == "1" ? 1 : 0
        if(!req.liveStreaming){
            if (req.levelPermissions["video.auto_approve"] && req.levelPermissions["video.auto_approve"] == "1")
                insertObject["approve"] = 1
            else
                insertObject["approve"] = 0
        }else{
            insertObject['approve'] = 1;
        }
        if (!videoObject || videoObject.type != 3)
            insertObject["completed"] = 1
        if(req.liveStreaming)
            insertObject['completed'] = 1;
        insertObject["creation_date"] = formatted
    }
    insertObject["modified_date"] = formatted

    let tags = req.body.tags
    let artists = req.body.artists
    if (tags && tags.length > 0)
        insertObject["tags"] = tags
    else {
        insertObject['tags'] = null
    }
    if (artists && artists.length > 0)
        insertObject["artists"] = artists
    else {
        insertObject['artists'] = null
    }
    if(req.liveStreaming){
        insertObject['is_livestreaming'] = 1;
    }

    if(req.body.enable_chat){
        insertObject['enable_chat'] = req.body.enable_chat
    }

    if (videoId) {
        //update existing video
        await globalModel.update(req, insertObject, "videos", 'video_id', videoId).then(async result => {
            //update item count in categories if changed
            if (insertObject["category_id"] != videoObject.category_id) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + videoObject["category_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["subcategory_id"] != videoObject.subcategory_id || (insertObject["category_id"] == 0 && videoObject.subcategory_id)) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + videoObject["subcategory_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["subsubcategory_id"] != videoObject.subsubcategory_id || (insertObject["subcategory_id"] == 0 && videoObject.subsubcategory_id)) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + videoObject["subsubcategory_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["category_id"] != videoObject.category_id && insertObject["category_id"] > 0) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["category_id"]).then(result => {
                }).catch(err => { })
                if (insertObject["subcategory_id"] != videoObject.subcategory_id && insertObject["subcategory_id"] > 0) {
                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subcategory_id"]).then(result => {
                    }).catch(err => { })
                    if (insertObject["subsubcategory_id"] != videoObject.subsubcategory_id && insertObject["subsubcategory_id"] > 0) {
                        globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subsubcategory_id"]).then(result => {
                        }).catch(err => { })
                    }
                }
            }

            //create tip data
            if(req.body.tips){
                let tips = JSON.parse(req.body.tips);
                await exports.createTips(req,tips,videoId)
            }

            //delete tip data
            if(req.body.removeTips){
                let removeTips = JSON.parse(req.body.removeTips);
                await exports.deleteTip(req,removeTips,videoId)
            }

            if(req.body.channel_id){
                //add video to channel
                const channel_id = req.body.channel_id
                const video_ids = ""+videoId
                //insert videos
                if (video_ids) {
                    await exports.insertVideos(req, video_ids, channel_id).then(result => {
                        if (result) {
                            if(videoObject["type"] != 3){
                                notificationModel.insertFollowNotifications(req,{subject_type:"channels",subject_id:channel_id,object_type:"videos",object_id:video_ids.split(',')[0],type:"channels_followed"}).then(result => {

                                }).catch(err => {

                                })
                            }
                            socketio.getIO().emit('videoAdded', {
                                "channel_id": channel_id,
                                "message": videoObject["type"] == 3 ? constant.channel.VIDEONOTIFYEDADDED :  constant.channel.VIDEOADDED
                            });
                        }
                    })
                }
            }

            res.send({ videoId: videoId, message:videoObject['custom_url'] ?  constant.video.EDIT : constant.video.SUCCESS, custom_url: videoObject['custom_url'] ? videoObject['custom_url'] : insertObject['custom_url'] });
            if(req.body.fromEdit){
                videoId = null
                res.end()
                return
            }
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    } else {
        //create new video
        await globalModel.create(req, insertObject, "videos").then(async result => {
            if (result) {
                //update category counts
                if (insertObject["category_id"] != 0) {
                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["category_id"]).then(result => {
                        if (insertObject["subcategory_id"] != 0) {
                            globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subcategory_id"]).then(result => {
                                if (insertObject["subsubcategory_id"] != 0) {
                                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subsubcategory_id"]).then(result => {
                                    }).catch(err => { })
                                }
                            }).catch(err => { })
                        }
                    }).catch(err => { })
                }
                let imagevideo = ""
                if(insertObject['image']){
                    imagevideo = insertObject['image']
                }else{
                   // if(!req.liveStreaming)
                        imagevideo = req.appSettings['video_default_photo']
                   // else
                     //   imagevideo = req.appSettings['livestreaming_default_photo']
                }
                //create tip data
                if(req.body.tips){
                    let tips = JSON.parse(req.body.tips);
                    await exports.createTips(req,tips,result.insertId)
                }
                if(req.liveStreaming){
                    notificationModel.insertFollowNotifications(req,{subject_type:"users",subject_id:req.user.user_id,object_type:"videos",object_id:result.insertId,type:"live_video"}).then(result => {

                    }).catch(err => {
    
                    })
                }

                if(req.body.channel_id){
                    //add video to channel
                    const channel_id = req.body.channel_id
                    const video_ids = ""+result.insertId
                    //insert videos
                    if (video_ids) {
                        await exports.insertVideos(req, video_ids, channel_id).then(result => {
                            if (result) {
                                if(insertObject["type"] != 3){
                                    notificationModel.insertFollowNotifications(req,{subject_type:"channels",subject_id:channel_id,object_type:"videos",object_id:video_ids.split(',')[0],type:"channels_followed"}).then(result => {

                                    }).catch(err => {

                                    })
                                }
                                socketio.getIO().emit('videoAdded', {
                                    "channel_id": channel_id,
                                    "message": insertObject["type"] == 3 ? constant.channel.VIDEONOTIFYEDADDED :  constant.channel.VIDEOADDED
                                });
                            }
                        })
                    }
                }

                res.send({ videoId: result.insertId, message: constant.video.SUCCESS, custom_url: insertObject['custom_url'],title:insertObject['title'],image:imagevideo });
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            console.log(err)
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }
}
exports.insertVideos = async (req, video_ids, channel_id) => {
    return new Promise(function (resolve, reject) {
        const ids = video_ids.split(',')
        async.forEachOf(ids, async function (video_id, i, callback) {
            var dt = dateTime.create()
            var formatted = dt.format('Y-m-d H:M:S')
            const channelVideoObj = []
            channelVideoObj.push(video_id)
            channelVideoObj.push(channel_id)
            channelVideoObj.push(req.user.user_id)
            channelVideoObj.push(formatted)
            await channelVideosModel.insert(channelVideoObj, req, channel_id)
            if(i == ids.length - 1){
                resolve(true)
            }
        }, function (err) {
            if (!err)
                resolve(true)
            else
                resolve(false)
        })
    })
}
exports.deleteTip = (req,deletes,videoID) => {
    return new Promise(async (resolve,reject) => {
        async.forEachOf(deletes, async function (deleteId, i, callback) {

            await globalModel.delete(req,"tips","tip_id",deleteId);

            if (i == deletes.length - 1) {
                resolve(true)
            }
        }, function (err) {
            resolve(true)
        })
    })
}
exports.createTips = (req,tips,video_id,forceInsert = false) => {
    return new Promise(async (resolve,reject) => {
        var dt = dateTime.create();
         var formatted = dt.format('Y-m-d H:M:S');
        async.forEachOf(tips, async function (tipData, i, callback) {
            let tip = tips[i]
            let price = parseFloat(tip.amount).toFixed(2)
            if( price > 0){
                //insert into database
                let insertObject = {}
                insertObject['amount'] = price
                                
                if(!tip.tip_id || forceInsert){
                    insertObject['resource_id'] = video_id;
                    if(!forceInsert)
                    insertObject['user_id'] = req.user.user_id;
                    else
                    insertObject['user_id'] = tip.user_id;
                    insertObject['creation_date'] = formatted;
                    insertObject['resource_type'] = "video";
                    await globalModel.create(req, insertObject, "tips").then(result => {})
                }else{
                    //update
                    await globalModel.update(req, insertObject, "tips", 'tip_id', videoId).then(result => {});
                }
            }else if(tip.tip_id){
                //delete entry
                await globalModel.delete(req,"tips","tip_id",tip.tip_id);
            }
            if (i == tips.length - 1) {
                resolve(true)
            }
        }, function (err) {
            resolve(true)
        })
        
    })
}

exports.convertVideo = async(req,videoObject) => {
    return new Promise(async (resolve,reject) =>  {
        const res = {}
        const videoResolution = videoObject.resolution
        const videoLocation = videoObject.video_location
        const FFMPEGpath = req.appSettings.video_ffmpeg_path
        const videoId = videoObject.video_id
        //convert videos
        var orgPath = req.serverDirectoryPath + "/public" + videoLocation
        let command = ffmpeg(orgPath)
            //.audioCodec('libfaac')
            .videoCodec('libx264')
            .format('mp4');
        const videoName = uniqid.process('v')
        let watermarkImage = req.levelPermissions['video.watermark'] != "" ? req.serverDirectoryPath + "/public" + req.levelPermissions["video.watermark"] : "/public/upload/images/blank.png"
        const path_240 = "/public/upload/videos/video/" + videoName + "_240p.mp4"
        const path_640 = "/public/upload/videos/video/" + videoName + "_360p.mp4"
        const path_854 = "/public/upload/videos/video/" + videoName + "_480p.mp4"
        const path_1280 = "/public/upload/videos/video/" + videoName + "_720p.mp4"
        const path_1920 = "/public/upload/videos/video/" + videoName + "_1080p.mp4"
        const path_2048 = "/public/upload/videos/video/" + videoName + "_2048p.mp4"
        const path_3840 = "/public/upload/videos/video/" + videoName + "_4096p.mp4"
        let is_validVideo = false
        const sample = "/public/upload/videos/video/" + videoName + "_sample.mp4"
        await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_240, 240, orgPath, FFMPEGpath, watermarkImage, req).then(async result => {
            //upate video 240
            if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                await s3Upload(req, req.serverDirectoryPath + path_240, path_240.replace("/public",'')).then(result => {
                    //remove local file
                    commonFunction.deleteImage(req, res, path_240.replace("/public",''), 'locale')
                }).catch(err => {
                })
            }
            const updatedObject = {}
            updatedObject["240p"] = 1
            updatedObject["video_location"] = path_240.replace('/public', '')
            await globalModel.update(req, updatedObject, "videos", "video_id", videoId).then(result => {
            }).catch(error => {
            })
            is_validVideo = true
        }).catch(err => {
            console.log(err)
        })
        if(is_validVideo){
            const filePath = "/public" + "/upload/videos/video/" + videoName+"_sample_same"+path.extname(videoLocation)
            //create sample video
            await module.exports.createSample(orgPath,filePath,command,req,sample,FFMPEGpath,watermarkImage,res,videoId).then(result => {
                
            }).catch(err => {

            }) 
        }

        if ((videoResolution >= 640 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("360") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_640, 640, orgPath, FFMPEGpath, watermarkImage, req).then(async result => {
                //upate video 
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_640, path_640.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_640.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["360p"] = 1
                await globalModel.update(req, updatedObject, "videos", "video_id", videoId).then(async result => {
                }).catch(error => {

                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 854 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("480") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_854, 854, orgPath, FFMPEGpath, watermarkImage, req).then(async result => {
                //upate video
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_854, path_854.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_854.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["480p"] = 1
                await globalModel.update(req, updatedObject, "videos", "video_id", videoId).then(async result => {

                }).catch(error => {

                })
            }).catch(err => {
            })
        } 

        if ((videoResolution >= 1280 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("720") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_1280, 1280, orgPath, FFMPEGpath, watermarkImage, req).then(async result => {
                //upate video
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_1280, path_1280.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_1280.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["720p"] = 1
                await globalModel.update(req, updatedObject, "videos", "video_id", videoId).then(async result => {

                }).catch(error => {

                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 1920 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("1080") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_1920, 1920, orgPath, FFMPEGpath, watermarkImage, req).then(async result => {
                //upate video
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_1920, path_1920.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_1920.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["1080p"] = 1
                await globalModel.update(req, updatedObject, "videos", "video_id", videoId).then(async result => {

                }).catch(error => {

                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 2048 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("2048") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_2048, 2048, orgPath, FFMPEGpath, watermarkImage, req).then(async result => {
                //upate video
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_2048, path_2048.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_2048.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["2048p"] = 1
                await globalModel.update(req, updatedObject, "videos", "video_id", videoId).then(async result => {

                }).catch(error => {

                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 3840 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("4096") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_3840, 3840, orgPath, FFMPEGpath, watermarkImage, req).then(async result => {
                //upate video
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_3840, path_3840.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_3840.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["4096p"] = 1
                await globalModel.update(req, updatedObject, "videos", "video_id", videoId).then(async result => {

                }).catch(error => {

                })
            }).catch(err => {
            })
        }

        const updatedObject = {}
        if (is_validVideo)
            updatedObject["status"] = 1
        else
            updatedObject["status"] = 3
        updatedObject['completed'] = 1

        //unlink org file
        if (videoLocation)
            commonFunction.deleteImage(req, res, videoLocation.replace("/public",''), "video/video")

        await globalModel.update(req, updatedObject, "videos", "video_id", videoId).then(async result => {
            //send socket data

        }).catch(error => {

        })
        if (is_validVideo) {
            notifications.insert(req, {owner_id:videoObject.owner_id,insert:true, type: "videos_processed_complete", subject_type: "users", subject_id: videoObject.owner_id, object_type: "videos", object_id: videoId,forceInsert:true }).then(result => {

            }).catch(err => {

            })
            notificationModel.insertFollowNotifications(req, { subject_type: "users", subject_id: videoObject.owner_id, object_type: "videos", object_id: videoId, type: "members_followed" }).then(result => {

            }).catch(err => {

            })
        } else {
            notifications.insert(req, {owner_id:videoObject.owner_id,insert:true, type: "videos_processed_failed", subject_type: "users", subject_id: videoObject.owner_id, object_type: "videos", object_id: videoId,forceInsert:true }).then(result => {

            }).catch(err => {

            })
        }
        socketio.getIO().emit('videoCreated', {
            "videoId":  videoObject.custom_url,
            status: is_validVideo ? 1 : 0
        });
        resolve(true)
    })
}

exports.createSample = async (orgPath,filePath,command,req,sample,FFMPEGpath,watermarkImage,res,videoId) => {
    return new Promise((resolve,reject) => {
        ffmpeg()
                .input(orgPath)
                .setStartTime('00:00:00')
                .setDuration('03')
                .output(req.serverDirectoryPath +filePath)
                .on('start', function(commandLine) {
                    //console.log('Started: ' + commandLine);
                })
                .on('end', async function(err) {   
                    if(!err)
                    {
                        let commandNew = ffmpeg(req.serverDirectoryPath +filePath)
                        //.audioCodec('libfaac')
                        .videoCodec('libx264')
                        .format('mp4');
                        await module.exports.executeFFMPEG(commandNew, req.serverDirectoryPath + sample, 640, req.serverDirectoryPath +filePath, FFMPEGpath, watermarkImage, req).then(async result => {
                            //upate video 
                            if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                                await s3Upload(req, req.serverDirectoryPath + sample, sample.replace("/public",'')).then(result => {
                                    //remove local file
                                }).catch(err => {
            
                                })
                                commonFunction.deleteImage(req, res, sample.replace("/public",''), 'locale')
                            }
                            commonFunction.deleteImage(req, res, filePath.replace("/public",''), 'locale')
                            const updatedObject = {}
                            updatedObject["sample"] = 1
                            await globalModel.update(req, updatedObject, "videos", "video_id", videoId).then(async result => {
            
                            }).catch(error => {
            
                            })
                            resolve(true)
                        }).catch(err => {
                            reject(false)
                        })
                        
                    }                 
                })
                .on('error', function(err){
                    console.log('error: ', +err);
                    reject(false)
                }).run();
    })
}
exports.executeFFMPEG = async (command, filePath, resolution, orgPath, FFMPEGpath, watermarkImage, req) => {
    return new Promise((resolve, reject) => {
        //let commandString = FFMPEGpath+" -y -i "+orgPath+" -vcodec libx264 -preset slow -filter:v scale="+resolution+":-2 -crf 26 "+filePath+" 2>&1"
        command.clone()
            //.input(watermarkImage)
            // .outputOption([
            //     "-preset" , "slow",
            //     "-filter:v","scale="+resolution+":-2"
            // ])
            // .complexFilter([
            //     "-filter:v scale="+resolution+":-2 -crf 26"
            // ])
            
            .outputOption([
                "-preset", req.appSettings['video_conversion_type'] ? req.appSettings['video_conversion_type']  : "ultrafast",
                "-filter:v", "scale=" + resolution + ":-2"
            ])
            // .complexFilter([
            //     "[0:v]scale=640:-1[bg];[bg][1:v]overlay=W-w-10:H-h-10"
            // ])
            .on('start', function (commandLine) {
                //console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('progress', (progress) => {
                //console.log(`[ffmpeg] ${JSON.stringify(progress)}`);
            })
            .on('error', (err) => {
                reject(false);
            })
            .on('end', () => {
                resolve(true);
            }).save(filePath)
    })
}

exports.upload = async (req, res) => {
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    if (req.uploadLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.video.LIMITERRROR }], true), status: errorCodes.invalid }).end();
    }
    // validate upload limit
    // validate member role upload count limit
    if (req.quotaLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.video.QUOTAREACHED }], true), status: errorCodes.invalid }).end();
    }
    let basePath = req.serverDirectoryPath + "/public"
    const filePath = basePath + "/upload/videos/video/" + req.fileName
    let images = []
    let duration = 0
    let videoWidth = 0, videoHeight = 0, size = 0
    var command =
        ffmpeg.ffprobe(filePath, function (err, metadata) {
            
            duration = metadata.format.duration.toString()
            videoWidth = metadata.streams[0].width
            videoHeight = metadata.streams[0].height
            size = metadata.format.size
            ffmpeg(filePath)
                .on('filenames', function (filenames) {
                    images = filenames;
                }).on('end', function () {
                    //append base path in images
                    let uploadedImages = []
                    images.forEach(image => {
                        uploadedImages.push(req.APP_HOST + "/upload/images/videos/video/" + image)
                    })

                    //create item video in table
                    let videoObject = {}
                    videoObject["owner_id"] = req.user.user_id;
                    videoObject["completed"] = 0;
                    videoObject['image'] = "/upload/images/videos/video/" + images[0];
                    videoObject["video_location"] = "/upload/videos/video/" + req.fileName
                    videoObject['type'] = 3
                    videoObject['title'] = "Untitled"
                    videoObject['view_privacy'] = "everyone"
                    videoObject['custom_url'] = ""
                    videoObject['description'] = ""
                    var dt = dateTime.create();
                    var formatted = dt.format('Y-m-d H:M:S');
                    videoObject['creation_date'] = formatted
                    videoObject['modified_date'] = formatted
                    videoObject['status'] = 2
                    videoObject['size'] = size
                    var n = duration.indexOf('.');
                    duration = duration.substring(0, n != -1 ? n : duration.length)
                    let d = Number(duration);
                    var h = Math.floor(d / 3600).toString();
                    var m = Math.floor(d % 3600 / 60).toString();
                    var s = Math.floor(d % 3600 % 60).toString();

                    var hDisplay = h.length > 0 ? (h.length < 2 ? "0" + h : h) : "00"
                    var mDisplay = m.length > 0 ? ":" + (m.length < 2 ? "0" + m : m) : ":00"
                    var sDisplay = s.length > 0 ? ":" + (s.length < 2 ? "0" + s : s) : ":00"
                    const time = hDisplay + mDisplay + sDisplay
                    videoObject['duration'] = time

                    globalModel.create(req, videoObject, "videos").then(result => {
                        res.send({ videoWidth: videoWidth, videoHeight: videoHeight, videoId: result.insertId, images: uploadedImages, name: path.basename(metadata.format.filename, path.extname(metadata.format.filename)) })
                    })
                }).screenshots({
                    // Will take screens at 20%, 40%, 60% and 80% of the video
                    count: 1,
                    folder: basePath + "/upload/images/videos/video/",
                    filename: "%w_%h_%b_%i"
                });
        });

    // Kill ffmpeg after 5 minutes anyway
    setTimeout(function () {
        if (typeof command != "undefined") {
            command.on('error', function () {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.GENERAL }], true), status: errorCodes.serverError }).end();
            });
            command.kill();
        }
    }, 60 * 5 * 1000);

}
