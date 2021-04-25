const pageModel = require("../models/pages");
const menus = require("../models/menus")
const packagesModel = require("../models/packages")
const subscriptionModel = require("../models/subscriptions")
const languages = require("../models/languages")
const designModel = require("../models/designs")
const videoCategoryModel = require("../models/categories")
const userModel = require("../models/users")
const channelModel = require("../models/channels")
const settingModel = require("../models/settings")
const aws = require("aws-sdk")
const fs = require("fs")
const striptags = require("striptags")
const sizeOf = require('image-size');
const url = require('url');
const http = require('http');
const https = require('https');
const Filter = require('bad-words');

exports.censorWords = (req,text) => {
    if(!text){
        return text
    }
    if(req.appSettings['censored_words']){
        var customFilter = new Filter(); 
        var newBadWords = req.appSettings['censored_words'].split(",");
        customFilter.addWords(...newBadWords);
        return customFilter.clean(text)
    }
        return text
}

exports.truncate = (text = "", maxLength = 200) => {
    //trim the string to the maximum length
    if (text.indexOf(" ") < 0) {
        return text;
    }
    var trimmedString = text.substr(0, maxLength);
    //re-trim if we are in the middle of a word
    trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")))
    return trimmedString
}
exports.updateMetaData = async (req,data) => {
    return new Promise(async (resolve, reject) => {

        if(!data.title && req.appSettings['page_default_title']){
            data.title = req.appSettings['page_default_title']
        }
        if(!data.description && req.appSettings['page_default_description']){
            data.description = req.appSettings['page_default_description']
        }
        if(!data.keywords && req.appSettings['page_default_keywords']){
            data.keywords = req.appSettings['page_default_keywords']
        }
        if((!data.image || data.image == 0)  && req.appSettings['page_default_image']){
            data.image = req.appSettings['page_default_image']
        }
        let title = ' | '+ req.appSettings.site_title
        if(req.query.pageInfo){
            let titleLength = title.length
            let dataTitle = striptags(data['title'])
            if(dataTitle){
                let dataLength = (dataTitle ? dataTitle : "").length
                if(dataLength > (160 - titleLength)  ){
                    dataTitle = exports.truncate(dataTitle,(60 - titleLength - 4))+" ..."
                }
                req.query.pageInfo.title =  dataTitle + title
            }
            let dataDescription = striptags(data['description'])
            if(dataDescription){
                let dataDescriptionLength = (dataDescription ? dataDescription : "").length
                if(dataDescriptionLength > 320  ){
                    dataDescription = exports.truncate(dataDescription,(320 - 4))+" ..."
                }
                req.query.pageInfo.description =  dataDescription
            }
            if(data['keywords'])
                req.query.pageInfo.keywords = data['keywords']
            if(data['image'])
                req.query.pageInfo.image = data['image']

            if(data['banner'])
                req.query.pageInfo.banner = data['banner']
        }
        
        var ip = req.headers['x-forwarded-for'] || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);
        if(req.query.pageInfo && req.query.pageInfo.image && ip != "::1"){
            let isOutSide = false;
            let image = req.query.pageInfo.image
            let imgUrl = req.query.pageInfo.image;
            if (image.toString().indexOf("https://") === 0 || image.toString().indexOf("http://") === 0) {
                isOutSide = true
            }
            if(req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi" && !isOutSide){
                try{
                const dimensions = await sizeOf(req.query.pageInfo.image);
                req.query.pageInfo.imageHeight = dimensions.height
                req.query.pageInfo.imageWidth = dimensions.width 
                }catch(e){
                    //silence
                }
            }else{
                var options = url.parse(isOutSide ? imgUrl : req.query.imageSuffix+req.query.pageInfo.image);
                await exports.getImageSize(req,options,isOutSide ? imgUrl : req.query.imageSuffix+req.query.pageInfo.image).then(dimensions => {
                    if(dimensions){
                        req.query.pageInfo.imageHeight = dimensions.height
                        req.query.pageInfo.imageWidth = dimensions.width 
                    }
                }).catch(err => {
                    console.log(err)
                })
            }
        }

        resolve(true)
    })
}
exports.getImageSize = async(req,options,image) => {
    return new Promise((resolve, reject) => {
        (image.toString().indexOf("https://") === 0 ? https : http).get(options, function (response) {
            var chunks = [];
            response.on('data', function (chunk) {
                chunks.push(chunk);
            }).on('end', function() {
                try{
                    var buffer = Buffer.concat(chunks);
                    if(buffer)
                        resolve(sizeOf(buffer));
                    else
                        reject(false)
                }catch(err){
                    resolve(false)
                }
            });
        });
    })
}
exports.getGeneralInfo = async (req, res, type, fromNode = false) => {
    if (req.appSettings.upload_system == "s3") {
        req.query.imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if( req.appSettings.upload_system == "wisabi"){
        req.query.imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    } else {
        req.query.imageSuffix = req.APP_HOST
    }

    //live streaming url
    let settings = await settingModel.settingData(req);
    let agora_app_id = settings["agora_app_id"];
    let type_livestreaming = settings["live_streaming_type"];
    if(!type_livestreaming){
        type_livestreaming = 1
    }
    req.query.siteURL = process.env.PUBLIC_URL
    req.query.livestreamingtype = type_livestreaming;
    if(agora_app_id && settings["agora_s3_bucket"]){
        req.query.liveStreamingURL = "https://" + settings["agora_s3_bucket"] + ".s3.amazonaws.com";
    }

    if(settings["antserver_media_url"]){
       req.query.liveStreamingServerURL = settings["antserver_media_url"];
    }
    
    if( ( (type_livestreaming == 1 && agora_app_id) || (type_livestreaming == 0 && settings["antserver_media_url"]) ) &&  parseInt(settings['live_stream_start'],10) == 1){
        req.query.liveStreamingEnable = true
    }
    
    await pageModel.findByType(type, req, res).then(async result => {
        if(result.type == "privacy" || result.type == "terms"){
            req.query.pagecontent = result.content
            delete result.content
            delete result.type
        }
        if(!result.custom_tags  && req.appSettings['page_default_custom_tags']){
            result.custom_tags = req.appSettings['page_default_custom_tags']
        }
        req.query.pageInfo = result
        await exports.updateMetaData(req,req.query.pageInfo)
    })
    //check IE browser
    if(req.headers['user-agent'] && (req.headers['user-agent'].indexOf("MSIE") >= 0 || req.headers['user-agent'].indexOf("Trident") >= 0)) {
        req.query.IEBrowser = true
    }

    var ip = req.headers['x-forwarded-for'] || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);
    if(req.query.pageInfo && req.query.pageInfo.image && ip != "::1"){
        let isOutSide = false;
        let image = req.query.pageInfo.image
        let imgUrl = req.query.pageInfo.image;
        if (image.toString().indexOf("https://") === 0 || image.toString().indexOf("http://") === 0) {
            isOutSide = true
        }
        if(req.appSettings.upload_system != "s3" && req.appSettings.upload_system != "wisabi" && !isOutSide){
            try{
                const dimensions = await sizeOf(req.serverDirectoryPath+ "/public"+req.query.pageInfo.image);
                req.query.pageInfo.imageHeight = dimensions.height
                req.query.pageInfo.imageWidth = dimensions.width 
            }catch(e){
                console.log(e)
                //silence
            }
        }else{
            var options = url.parse(isOutSide ? imgUrl : req.query.imageSuffix+req.query.pageInfo.image);
            await exports.getImageSize(req,options,isOutSide ? imgUrl : req.query.imageSuffix+req.query.pageInfo.image).then(dimensions => {
                if(dimensions){
                    req.query.pageInfo.imageHeight = dimensions.height
                    req.query.pageInfo.imageWidth = dimensions.width 
                }
            }).catch(err => {
                console.log(err)
            })
        }
    }

    req.query.CDN_URL_FOR_STATIC_RESOURCES = process.env.CDN_URL_FOR_STATIC_RESOURCES ? process.env.CDN_URL_FOR_STATIC_RESOURCES : ""
    req.query.audioPassword = req.session && req.session.audio ? req.session.audio : []
    
    if(req.appSettings['fixed_header'] == 1){
        //get video categories for sidebar
        await videoCategoryModel.findAll(req, { type: 'video', onlyCategories: 1, limit:20 }).then(results => {
            if (results && results.length > 0) { 
                req.query.categoriesVideo = results
            }
        })
        if(req.user){
            //get loggedin user channel subscription
            channelModel.getFollowedChannels(req,{limit:5}).then(result => {
                if(result){
                    req.query.channelSubscriptions = result
                }
            }).catch(err => {
                //silence
            })
        }
        await userModel.getMembers(req,{ limit:16,orderby: "random",is_popular:true }).then(results => {
            if (results && results.length > 0) { 
                req.query.popularMembers = results
            }
        }).catch(err => {
            console.log(err)
        })
    }

    if(req.user){
        req.query.adultAllowed =  req.user.adult == 1 ? true : false
    }else{
        req.query.adultAllowed = req.session.adult_allow ? true : false
    }
    await designModel.findAll(req,{}).then(result => {
        if(result){
            req.query.cssValues = result
        }
    }).catch(err => {
        console.log(err)
    })
    if (!fromNode) {
        //delete security settings
        delete req.appSettings.google_translateapi_key
        delete req.appSettings.email_smtp_host
        delete req.appSettings.email_smtp_password
        delete req.appSettings.email_smtp_password
        delete req.appSettings.email_smtp_port
        delete req.appSettings.contact_email_from
        delete req.appSettings.email_smtp_type
        delete req.appSettings.email_smtp_username
        delete req.appSettings.maintanance_code
        delete req.appSettings.payment_client_secret
        delete req.appSettings.payment_paypal_sanbox
        delete req.appSettings.payment_client_id
        delete req.appSettings.s3_access_key
        delete req.appSettings.s3_bucket
        delete req.appSettings.s3_region
        delete req.appSettings.s3_secret_access_key
        delete req.appSettings.restrict_ips

        delete req.appSettings.email_type
        delete req.appSettings.iframely_api_key
        delete req.appSettings.enable_iframely
        delete req.appSettings.enable_twitch_import
        delete req.appSettings.enable_youtube_import
        delete req.appSettings.facebook_client_id
        delete req.appSettings.facebook_client_secret
        delete req.appSettings.iframely_disallow_sources
        delete req.appSettings.mailchimp_apikey
        delete req.appSettings.mailchimp_listId

        req.appSettings.fid = req.appSettings.social_login_fb_apiid

        delete req.appSettings.social_login_fb_apiid
        delete req.appSettings.social_login_fb_apikey

        req.appSettings.gid = req.appSettings.social_login_google_apiid
        delete req.appSettings.social_login_google_apiid
        delete req.appSettings.social_login_google_apikey
        delete req.appSettings.social_login_twitter_apiid
        delete req.appSettings.social_login_twitter_apikey

        req.appSettings.aid = req.appSettings.social_login_apple_clientid
        delete req.appSettings.social_login_apple_clientid
        delete req.appSettings.social_login_apple_teamid
        delete req.appSettings.social_login_apple_keyid
        delete req.appSettings.social_login_apple_p8
        
        delete req.appSettings.gmail_xauth_clientid
        delete req.appSettings.gmail_xauth_clientsecret
        delete req.appSettings.gmail_xauth_email
        delete req.appSettings.gmail_xauth_refreshtoken
        
        if(req.fromBlog)
            req.query.tinymceKey = req.appSettings.tinymceKey
        delete req.appSettings.tinymceKey
        delete req.appSettings.twitch_api_key
        delete req.appSettings.youtube_api_key
        
        delete req.appSettings.agora_app_id
        delete req.appSettings.agora_app_certificate
        delete req.appSettings.agora_customer_certificate
        delete req.appSettings.agora_customer_id
        delete req.appSettings.agora_s3_access_key
        delete req.appSettings.agora_s3_bucket
        delete req.appSettings.agora_s3_region
        delete req.appSettings.agora_s3_secret_access_key

        if (req.appSettings.video_ffmpeg_path && req.appSettings.video_upload == "1") {
            req.appSettings.uploadVideo = "1"
        }
        let ffmpegpath = req.appSettings.video_ffmpeg_path
        delete req.appSettings.video_ffmpeg_path
        if(ffmpegpath){
            req.appSettings.video_ffmpeg_path = true
        }
        
    }
     
    //languages
    await languages.findAll(req, { enabled: 1 }).then(result => {
            req.query.languages = result
    }).catch(err => { })
    
    if(req.query.languages){
        req.query.languages.forEach(lan => {
            if(lan.code == req.i18n.languages[0]){
                req.query.isRTL = lan.is_rtl
            }
        });
    }

    req.query.defaultTimezone = req.user ? req.user.timezone : req.appSettings["member_default_timezone"]

    req.query.initialLanguage = req.i18n.languages[0]
    let theme = req.session.siteMode == "dark" ? "dark" : "white"
    req.query.themeMode = theme

    let enable_theme_design_mode = req.levelPermissions && typeof req.levelPermissions['member.enable_theme_design_mode'] != "undefined" ? req.levelPermissions['member.enable_theme_design_mode'] : 1;
    let theme_design_mode = req.levelPermissions && typeof req.levelPermissions['member.theme_design_mode'] != "undefined" ? req.levelPermissions['member.theme_design_mode'] : 3;

    if(theme_design_mode == 3 || theme_design_mode == 4 ){
        if(enable_theme_design_mode == 1)
            req.query.toogleMode = true
        if(theme_design_mode == 3 && !req.session.siteMode){
            req.query.themeMode = "white"
        }else if(theme_design_mode == 4 && !req.session.siteMode){
            req.query.themeMode = "dark"
        }
    }else if(theme_design_mode == 2){
        req.query.themeMode = "white"
    }else{
        req.query.themeMode = "dark"
    }
    
    if (req.user && req.user.level_id == 1) {
        req.query.admin_url = process.env.ADMIN_SLUG
    }
    if(process.env.NODE_ENV != "production"){
        req.query.environment = "dev"
    }
    //menus data
    await menus.getFetchedMenus(req).then(result => {
        req.query.menus = result
    })
    if (req.query.h)
        req.query.searchTitleText = req.query.h
    
    if (req.user) {
        req.query.loggedInUserDetails = req.user
    }
    if((!req.user || req.user.levelFlag != "superadmin" ) &&  (typeof process.env.ALLOWALLUSERINADMIN != "undefined" || process.env.ALLOWALLUSERINADMIN)){
        req.query.ALLOWALLUSERINADMIN = true
        req.query.admin_url = process.env.ADMIN_SLUG
    }
    req.query.appSettings = req.appSettings
    
    //settings
    if (req.user) {
        req.query.packagesExists = false
        await packagesModel.findAll(req, { column: "packages.*", enabled: 1, not_default_plan: 1 }).then(async (result) => {
            if (result && result.length) {
                req.query.packagesExists = true
                if (req.getPackages) {
                    req.query.packages = result
                }
                await packagesModel.default(req, res).then(async (result) => {
                    if (result) {
                        //package enable
                        //get logged in user subscription package
                        await subscriptionModel.userActivePackage(req, res).then(async (result) => {
                            if (result) {
                                packageEnable = true
                                if (req.getPackages) {
                                    req.query.userActivePackage = result
                                }
                            } else {
                                //default plan
                                await packagesModel.default(req, res).then(result => {
                                    if (result) {
                                        packageEnable = true
                                        if (req.getPackages) {
                                            req.query.userActivePackage = result
                                        }
                                    }
                                }).catch(error => {
                                    //silence
                                })
                            }
                        }).catch(error => {
                            //silence
                        })
                    }
                }).catch(error => {
                    //silence
                })
            }
        })
    }
    req.query.levelPermissions = req.levelPermissions
    return
}
exports.deleteUploadedContent = async (req, res, image,type) => {
    const upload_system = req.appSettings.upload_system
    if ((upload_system == "s3" || upload_system == "wisabi" ) && type != "locale") {
        let wisabiStorage = {}
        if(upload_system == "s3"){
            aws.config.update({
                secretAccessKey: req.appSettings.s3_secret_access_key,
                accessKeyId: req.appSettings.s3_access_key,
                region: req.appSettings.s3_region
            });
        }else{
            const accessKeyId = req.appSettings.s3_access_key;
            const secretAccessKey = req.appSettings.s3_secret_access_key;    
            const wasabiEndpoint = new aws.Endpoint(`s3.${req.appSettings.s3_region}.wasabisys.com`);
             wisabiStorage = {
              endpoint: wasabiEndpoint,
              region: req.appSettings.s3_region,
              accessKeyId,
              secretAccessKey
            };
        }
        const s3 = new aws.S3(wisabiStorage)
        let trimImage = image
        if (image.charAt(0) == "/") trimImage = image.substr(1);
        const params = {
            Bucket: req.appSettings.s3_bucket,
            Key: trimImage //if any sub folder-> path/of/the/folder.ext
        }
        try {
            s3.deleteObject(params, function (err, data) {
                if (err)
                    console.log(err, err.stack); // error
                
            });
        } catch (err) {
            console.log("ERROR in file Deleting : " + JSON.stringify(err))
        }
    }
    let trimMainImage = image
    if (image.charAt(0) == "/") trimMainImage = image.substr(1);
    fs.unlink(req.serverDirectoryPath + "/public/"+trimMainImage, function (err) {
        // if (err) {
        //     console.error(err);
        // } 
    });
    
}
exports.deleteImage = async (req, res, image, type, obj) => {
    if (obj) {
        if (obj.video_id) {
            if (obj.image && obj.image.indexOf("://") < 0) {
                exports.deleteUploadedContent(req, res, obj.image)
            } 
            if (obj.type == 3) {
                let path = "/upload/videos/video/"
                if(obj.video_location){
                    let splitName = obj.video_location.split('/')
                    let fullName = splitName[splitName.length - 1]
                    let videoName = fullName.split('_')[0]
                    if (obj['4096p'] == 1) {
                        exports.deleteUploadedContent(req,res,path + videoName + "_4096p.mp4")
                    }
                    if (obj['2048p'] == 1) {
                        exports.deleteUploadedContent(req,res,path + videoName + "_2048p.mp4")
                    }
                    if (obj['1080p'] == 1) {
                        exports.deleteUploadedContent(req,res,path + videoName + "_1080p.mp4")
                    }
                    if (obj['720p'] == 1) {
                        exports.deleteUploadedContent(req,res,path + videoName + "_720p.mp4")
                    }
                    if (obj['480p'] == 1) {
                        exports.deleteUploadedContent(req,res,path + videoName + "_480p.mp4")
                    }
                    if (obj['360p'] == 1) {
                        exports.deleteUploadedContent(req,res,path + videoName + "_360p.mp4")
                    }
                    if (obj['240p'] == 1) {
                        exports.deleteUploadedContent(req,res,path + videoName + "_240p.mp4")
                    }
                    if (obj['sample'] == 1) {
                        exports.deleteUploadedContent(req,res,path + videoName + "_sample.mp4")
                    }
                }
            }
        } else if (obj.post_id) {
            if (obj.image ) {
                exports.deleteUploadedContent(req, res, obj.image)
            }
        } else if (obj.channel_id) {
            if (obj.channelimage ) {
                exports.deleteUploadedContent(req, res, obj.image)
            }
            if (obj.channelcover ) {
                exports.deleteUploadedContent(req, res, obj.cover)
            }
            if (obj.cover_crop ) {
                exports.deleteUploadedContent(req, res, obj.cover_crop)
            }
        } else if (obj.playlist_id) {
            if (obj.image ) {
                exports.deleteUploadedContent(req, res, obj.image)
            }
        } else if (obj.blog_id) {
            if (obj.image ) {
                exports.deleteUploadedContent(req, res, obj.image)
            }
        }else if (obj.audio_id) {
            if (obj.image ) {
                exports.deleteUploadedContent(req, res, obj.image)
            }
        }
    } else {
        if(image)
        exports.deleteUploadedContent(req, res, image,type)
    }
}

exports.getUploadVideoInfo = async (url) => {
    const urlParser = require("js-video-url-parser")
    const videoUrlObject = await urlParser.parse(url)
    let responseObject = {}
    if (videoUrlObject && videoUrlObject.provider == "youtube" && videoUrlObject.mediaType == "video") {
        responseObject = videoUrlObject
    } else if (videoUrlObject && videoUrlObject.provider == "vimeo" && videoUrlObject.mediaType == "video") {
        responseObject = videoUrlObject
    } else if (videoUrlObject && videoUrlObject.provider == "dailymotion" && videoUrlObject.mediaType == "video") {
        responseObject = videoUrlObject
    } else if (videoUrlObject && videoUrlObject.provider == "twitch" && (videoUrlObject.mediaType == "stream" || videoUrlObject.mediaType == "clip"  || videoUrlObject.mediaType == "video")) {
        responseObject = videoUrlObject
    } else if (/(^http(?:s?):\/\/(?:www\.|web\.|m\.)?facebook\.com\/([A-z0-9\.]+)\/videos(?:\/[0-9A-z].+)?\/(\d+)(?:.+)?$)/.test(url)) {
        responseObject["provider"] = "facebook"
        responseObject['id'] = url
    }else if(/^(http[s]?:\/\/)?([^:\/\s]+)(:([^\/]*))?(\/\w+\.)*([^#?\s]+)(\?([^#]*))?(\.mp4|\.m3u8)$/gm.test(url)){
        responseObject["provider"] = "mp4_mov"
        responseObject['id'] = url
    } else {
        responseObject = { status: false }
    }
    return responseObject
}

exports.getScript = async (url) => {
    return new Promise((resolve, reject) => {
        const http = require('http'),
            https = require('https');

        let client = http;

        if (url.toString().indexOf("https") === 0) {
            client = https;
        }

        client.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(data);
            });

        }).on("error", (err) => {
            reject(false);
        });
    });
};

exports.convertTime = async (duration) => {
    return new Promise((resolve, reject) => {
        var n = duration.indexOf('.');
        duration = duration.substring(0, n != -1 ? n : duration.length)
        d = Number(duration);
        var h = Math.floor(d / 3600).toString();
        var m = Math.floor(d % 3600 / 60).toString();
        var s = Math.floor(d % 3600 % 60).toString();

        var hDisplay = h.length > 0 ? (h.length < 2 ? "0" + h : h) : "00"
        var mDisplay = m.length > 0 ? ":" + (m.length < 2 ? "0" + m : m) : ":00"
        var sDisplay = s.length > 0 ? ":" + (s.length < 2 ? "0" + s : s) : ":00"
        resolve(hDisplay + mDisplay + sDisplay)
    })
}
exports.convert_time = (duration) => {
    var a = duration.match(/\d+/g);

    if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
        a = [0, a[0], 0];
    }

    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
        a = [a[0], 0, a[1]];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
        a = [a[0], 0, 0];
    }

    duration = 0;

    if (a.length == 3) {
        duration = duration + parseInt(a[0]) * 3600;
        duration = duration + parseInt(a[1]) * 60;
        duration = duration + parseInt(a[2]);
    }

    if (a.length == 2) {
        duration = duration + parseInt(a[0]) * 60;
        duration = duration + parseInt(a[1]);
    }

    if (a.length == 1) {
        duration = duration + parseInt(a[0]);
    }
    return duration
}
exports.twitch = (params) => {
    const twitchApi = {}
    let apiUrl = "https://api.twitch.tv/kraken/"
    twitchApi["stream"] = apiUrl+"streams/"
    twitchApi["clip"] = apiUrl+"clips/"
    twitchApi["video"] = apiUrl+"videos/"
    return twitchApi[params]
}
exports.getTwitchData = (params,callback) => {
    const request = require('request');
    let clientID = params.clientID;
    if(!clientID || clientID === '') return callback('No client id specified');
    
    let options = {
        url: params.url,
        method: "GET",
        headers: {
            'Client-ID': clientID,
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Content-Type': 'application/json',
            'Authorization': params.auth || ''
        }
    };

    // Headers for v4 API (clips and video upload)
    options.headers.Accept = 'application/vnd.twitchtv.v5+json';
    if(params['content-length']) {
        options.encoding = null;
        options.headers['content-length'] = params['content-length'];
    }

    if(options.headers.Authorization != '' && options.headers.Authorization.indexOf('OAuth') === -1) {
        options.headers.Authorization = 'OAuth ' + params.auth;
    }

    request(options, (err, res, body) => {
        if(err) return callback(err);
        try {
            if(body.length === 0) return callback({ statusCode: res.statusCode });
            callback(null, JSON.parse(body));
        }
        catch(err) {
            err.statusCode = res.statusCode;
            callback(err);
        }
    });
}
exports.getVideoData = async (type, code, req, resObject) => {
    return new Promise(async (resolve, reject) => {
        const responseData = {}
        let url;
        switch (type) {
            case "youtube":
                if (req.appSettings["enable_youtube_import"] == "1" && req.appSettings["youtube_api_key"] != "") {
                    url = "https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=" + code + "&key=" + req.appSettings["youtube_api_key"]
                    exports.getScript(url).then(async result => {
                        if (result) {
                            const parseResponse = JSON.parse(result)
                            const data = parseResponse["items"][0]
                            responseData["title"] = data["snippet"]['title']
                            responseData["description"] = data['snippet']['description'];
                            await exports.convertTime(exports.convert_time(data['contentDetails']['duration']).toString()).then(result => {
                                responseData["duration"] = result
                            })
                            responseData["tags"] = data['snippet']['tags'];
                            if (data['snippet']['thumbnails']['maxres'] && data['snippet']['thumbnails']['maxres']['url']) {
                                responseData['image'] = data['snippet']['thumbnails']['maxres']['url'];
                            } else if (data['snippet']['thumbnails']['maxres'] && data['snippet']['thumbnails']['maxres']['url']) {
                                responseData['image'] = data['snippet']['thumbnails']['maxres']['url']
                            }  else if (data['snippet']['thumbnails']['medium'] && data['snippet']['thumbnails']['medium']['url']) {
                                responseData['image'] = data['snippet']['thumbnails']['medium']['url']
                            } else
                                responseData['image'] = "https://i.ytimg.com/vi/" + code + "/sddefault.jpg"
                            responseData['image'] = responseData['image'].replace("http://",'https://')
                            
                            resolve(responseData)
                        }
                    }).catch(error => {
                        resolve(false)
                    })
                } else {
                    resolve(false)
                }
                break;
            case "vimeo":
                url = "http://vimeo.com/api/v2/video/" + code + ".xml"
                exports.getScript(url).then(async data => {
                    if (data) {
                        const parser = require('fast-xml-parser')
                        var result = parser.validate(data);
                        if (result !== true) {
                            resolve(false)
                            return
                        }
                        var jsonData = parser.parse(data);
                        const jsonObj = jsonData['videos']['video']
                        responseData["title"] = jsonObj['title']
                        responseData["description"] = jsonObj['description']
                        await exports.convertTime(jsonObj['duration'].toString()).then(result => {
                            responseData["duration"] = result
                        })
                        responseData['image'] = jsonObj['thumbnail_large']
                        responseData['image'] = responseData['image'].replace("http://",'https://')
                        if (jsonObj['tags'])
                            responseData['tags'] = jsonObj['tags'].split(',')
                        resolve(responseData)
                    }
                }).catch(error => {
                    console.log(error)
                    resolve(false)
                })
                break;
            case "dailymotion":
                url = "https://api.dailymotion.com/video/" + code + "?fields=allow_embed,description,duration,thumbnail_url,title,tags"
                exports.getScript(url).then(async result => {
                    if (result) {
                        const parseResponse = JSON.parse(result)
                        responseData["title"] = parseResponse['title']
                        responseData["description"] = parseResponse['description'];
                        await exports.convertTime(parseResponse["duration"].toString()).then(result => {
                            responseData['duration'] = result
                        })
                        responseData['image'] = parseResponse['thumbnail_url']
                        responseData['image'] = responseData['image'].replace("http://",'https://')
                        responseData['tags'] = parseResponse['tags']
                        resolve(responseData)
                    }
                }).catch(error => {
                    resolve(false)
                })
                break;
            case "twitch":
                if (req.appSettings["enable_twitch_import"] == "1" && req.appSettings["twitch_api_key"] != "") {
                    var api = require('twitch-api-v5');
                    let clientID = req.appSettings["twitch_api_key"];
                    api.debug = false
                    //get twitch url
                    if (resObject.mediaType == "video") {
                        const url = await exports.twitch(resObject.mediaType)+resObject.id
                        await exports.getTwitchData({ clientID: clientID,url:url }, async (err, res) => {
                            try{
                                if (err) {
                                    resolve(false)
                                } else {
                                    responseData['title'] = res['title']
                                    responseData['description'] = res['description']
                                    responseData['image'] = res['thumbnails']['large'][0]['url']
                                    responseData['image'] = responseData['image'].replace("http://",'https://')
                                    await exports.convertTime(res["length"].toString()).then(result => {
                                        responseData['duration'] = result
                                    })
                                    resolve(responseData)
                                }
                            }catch(err){
                                resolve(false)
                            }
                        });
                    } else if (resObject.mediaType == "clip") {
                        const url = await exports.twitch(resObject.mediaType)+resObject.id
                        await exports.getTwitchData({ clientID: clientID,url:url }, async (err, res) => {
                            try{
                                if (err) {
                                    resolve(false)
                                } else {
                                    responseData['title'] = res['title'];
                                    await exports.convertTime(res["duration"].toString()).then(result => {
                                        responseData['duration'] = result
                                    })
                                    responseData['image'] = res['thumbnails']['medium']
                                    responseData['image'] = responseData['image'].replace("http://",'https://')
                                    responseData['embedCode'] = res['embed_url']
                                    resolve(responseData)
                                }
                            }catch(err){
                                resolve(false)
                            }
                        });
                    } else {
                        let userId = ""
                        await exports.getTwitchData({clientID: clientID, url:"https://api.twitch.tv/kraken/users?login="+resObject.channel }, async (err, res) => {
                            try{
                                if(err) {
                                    resolve(false)
                                } else {
                                    userId = res.users[0]._id
                                    const url = await exports.twitch(resObject.mediaType)+userId
                                    await exports.getTwitchData({ clientID: clientID,url:url }, (err, res) => {
                                        try{
                                            if(err) {
                                                resolve(false)
                                            } else {
                                                responseData['title'] = res.stream.channel.display_name;
                                                responseData['image'] = res.stream.preview.large
                                                responseData['image'] = responseData['image'].replace("http://",'https://')
                                                responseData['description'] = res.stream.channel.status
                                                resolve(responseData)
                                            }
                                        }catch(err) {
                                            resolve(false)
                                        }
                                    });
                                }
                            }catch(err) {
                                resolve(false)
                            }
                        });
                                            
                    }
                } else {
                    resolve(false)
                }
                break;
            case "facebook":
                if (req.appSettings["enable_facebook_import"] == "1" && req.appSettings["facebook_client_id"] != "" && req.appSettings["facebook_client_secret"] != "") {
                    const token_url = `https://graph.facebook.com/oauth/access_token?client_id=${req.appSettings["facebook_client_id"]}&client_secret=${req.appSettings["facebook_client_secret"]}&grant_type=client_credentials`
                    await exports.getScript(token_url).then(async result => {
                        if (result) {
                            const token = JSON.parse(result)
                            if (token["access_token"]) {
                                const videoId = code.match(/(\d+)\/?$/)[1]
                                await exports.getScript(`https://graph.facebook.com/${videoId}?access_token=${token["access_token"]}&fields=format,source,description,length,title,tags`).then(async results => {
                                    if (results) {
                                        const res = JSON.parse(results)
                                        if (res.error) {
                                            resolve(false)
                                            return
                                        }
                                        if (res['title'])
                                            responseData['title'] = res['title']
                                        if (res['description'])
                                            responseData['description'] = res['description']

                                        await exports.convertTime(res["length"].toString()).then(result => {
                                            responseData['duration'] = result
                                        })
                                        for (var key in res.format) {
                                            var obj = res.format[key];
                                            if (obj.filter == "native") {
                                                responseData['image'] = obj.picture
                                            }
                                        }
                                        if (res['tags'])
                                            responseData['tags'] = res.tags
                                        resolve(responseData)
                                    } else {
                                        resolve(false)
                                    }
                                }).catch(error => {
                                    resolve(false)
                                })
                            }
                        } else {
                            resolve(false)
                        }
                    }).catch(error => {
                        resolve(false)
                    })

                } else {
                    resolve(false)
                }
                break
            default:
                resolve(false)
                break;
        }

    })
}

exports.iframely = async (url, key, disallow, req) => {
    return new Promise(async (resolve, reject) => {
        const parseURL = require('url')
        const iurl = "http://iframe.ly/api/iframely?url=" + url + "&api_key=" + key
        const hostURL = parseURL.parse(url).hostname

        if (disallow && disallow != "") {
            const array = disallow.split(',')
            if (array.indexOf(hostURL) > -1) {
                resolve(false)
                return
            }
        }
        let responseData = {}
        await exports.getScript(iurl).then(async result => {
            if (result) {
                const parseResponse = JSON.parse(result)
                if (parseResponse.links) {
                    if (parseResponse.links.player) {
                        if (parseResponse.meta['title'])
                            responseData["title"] = parseResponse.meta['title']
                        if (parseResponse.meta['description'])
                            responseData["description"] = parseResponse.meta['description'];
                        if (parseResponse.meta["duration"])
                            await exports.convertTime(parseResponse.meta["duration"].toString()).then(result => {
                                responseData['duration'] = result
                            })
                        responseData['image'] = parseResponse.links.thumbnail[0]['href']
                        if (parseResponse.meta['tags'])
                            responseData['tags'] = parseResponse.meta['tags']
                        responseData['html'] = parseResponse.html
                        resolve(responseData)
                        return
                    }
                }
            }
            resolve(false)
        }).catch(error => {
            resolve(false)
        })
    })
}