const commonFunction = require("../../functions/commonFunctions")
const videoModel = require("../../models/videos")
const playlistModel = require("../../models/playlists")
const blogModel = require("../../models/blogs")
const userModel = require("../../models/users"),
fieldErrors = require('../../functions/error'),
bcrypt = require('bcryptjs'),
errorCodes = require("../../functions/statusCodes"),
constant = require("../../functions/constant"),
globalModel = require("../../models/globalModel"),
channelModel = require("../../models/channels"),
dateTime = require("node-datetime"),
videoMonetizationModel = require("../../models/videoMonetizations"),
{ validationResult } = require('express-validator'),
socketio = require("../../socket")
uniqid = require('uniqid'),
{readS3Image} = require('../../functions/upload')
exports.browse = async (req,res) => {
    const queryString = req.query

    const limit = 13
    const data = {}
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    let offset = (page - 1) * (limit - 1)
    data.limit = limit
    data.offset = offset
    if(queryString.type)
        data['type'] = queryString.type
    if (queryString.q && !queryString.tag) {
        data['title'] = queryString.q
    }

    if (queryString.sort == "latest") {
        data['orderby'] = "users.user_id desc"
    } else if (queryString.sort == "favourite" && req.appSettings['member_favourite'] == 1) {
        data['orderby'] = "userdetails.favourite_count desc"
    } else if (queryString.sort == "view") {
        data['orderby'] = "userdetails.view_count desc"
    } else if (queryString.sort == "like" && req.appSettings['member_like'] == "1") {
        data['orderby'] = "userdetails.like_count desc"
    } else if (queryString.sort == "dislike" && req.appSettings['member_dislike'] == "1") {
        data['orderby'] = "userdetails.dislike_count desc"
    } else if (queryString.sort == "rated" && req.appSettings['member_rating'] == "1") {
        data['orderby'] = "userdetails.rating desc"
    } else if (queryString.sort == "commented" && req.appSettings['member_comment'] == "1") {
        data['orderby'] = "userdetails.comment_count desc"
    }

    if (queryString.type == "featured" && req.appSettings['member_featured'] == 1) {
        data['is_featured'] = 1
    } else if (queryString.type == "sponsored" && req.appSettings['member_sponsored'] == 1) {
        data['is_sponsored'] = 1
    } else if (queryString.type == "hot" && req.appSettings['member_hot'] == 1) {
        data['is_hot'] = 1
    }
    let members = {}
    //get all members
    await userModel.getMembers(req, data).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > limit - 1) {
                result = result.splice(0, limit - 1);
                pagging = true
            }
            members = {
                pagging: pagging,
                members: result
            }
        }
    }).catch(err => {
        console.log(err)
    })
    res.send(members)
}

exports.language = async(req,res,next) => {
    let language = req.body.code;
    if(req.user){
        await globalModel.update(req, { language: language }, "userdetails", 'user_id', req.user.user_id).then(result => {
        });
    }
    res.send(true)
}

exports.adult = async(req,res,next) => {
    let adult = req.body.adult == 1 ? true : false;
    if(req.user){
        await globalModel.update(req, { adult: adult ? 1 : 0 }, "users", 'user_id', req.user.user_id).then(result => {
        });
    }
        req.session.adult_allow = adult
    res.send(true)
}
exports.mode = async(req,res) => {    
    req.session.siteMode = req.body.mode == 'dark' ? "dark" : "white";
    res.send(true)
}
exports.newsletter = async (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }
    userModel.newsletter({email:req.body.email},req).then(result => {
        if(result){
            return res.send({ message: constant.member.NEWSLETTERSUCCESS, status: errorCodes.ok }).end();
        }else{
            return res.send({ error: constant.general.DATABSE, status: errorCodes.invalid }).end();
        }
    })
}

exports.createWithdraw = async(req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }
    let user_id = parseInt(req.body.owner_id)
    let data = {}
    data.limit = 1
    data.owner_id = user_id
    data.status = "0"
    var isExists = false
    await videoMonetizationModel.getWithdraw(req, data).then(result => {
        if (result && result.length > 0) {
            isExists = true
        }
    })

    if(isExists){
        return res.send({ error: fieldErrors.errors([{ msg: constant.video.WITHDRAWREQPREVIOUSERROR }], true), status: errorCodes.invalid }).end();
    }
    let user = req.item
    let isValid = true
    let monetization_threshold_amount = req.levelPermissions['member.monetization_threshold_amount']
    if(req.user.user_id != user_id){
        const permissionModel = require("../models/levelPermissions")
        await permissionModel.findBykey(req,"member",'monetization',user.level_id).then(result => {
            if(result && result == 1){
                isValid = true
            }
        })
        await permissionModel.findBykey(req,"member",'monetization_threshold_amount',user.level_id).then(result => {
            monetization_threshold_amount = result
        })
    }else{
        if(req.levelPermissions["member.monetization"] == 1){
            isValid = true
        }
    }
    let balance = req.item.balance
    let amount = req.body.amount
    if(!isValid){
        //error
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.INVALIDREQUEST }], true), status: errorCodes.invalid }).end();
    }
    if(parseFloat(balance) < parseFloat(amount) || parseFloat(monetization_threshold_amount) > parseFloat(amount)){
        return res.send({ error: fieldErrors.errors([{ msg: constant.video.WITHDRAWREQERROR }], true), status: errorCodes.invalid }).end();
    }
    await globalModel.create(req, {owner_id:parseInt(req.body.owner_id),email:req.body.paypal_email,amount:amount,status:0, creation_date: dateTime.create().format("Y-m-d H:M:S") }, "video_monetizations_withdrawals").then(result => {
        if (result) {
            return res.send({ message: constant.member.VERIFICATIONREQUESTSEND, status: errorCodes.ok }).end();
        }
    }).catch(error => {
        return res.send({ error: constant.general.DATABSE, status: errorCodes.invalid }).end();
    });
}
exports.withdrawDelete = async(req,res) => {
    const owner_id = req.body.user_id
    globalModel.custom(req,"DELETE FROM video_monetizations_withdrawals WHERE withdraw_id = ? AND owner_id = ?",[req.body.withdraw_id,owner_id]).then(result => {
        if(result){
            return res.send({ message: constant.video.WITHDRAWREQDELETE, status: errorCodes.ok }).end();
        }else{
            return res.send({ error: constant.general.DATABSE, status: errorCodes.invalid }).end();
        }
    })

};
exports.withdraws = async(req,res) => {
    const owner_id = parseInt(req.body.owner_id)
    if (!owner_id) {
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
    let offset = (page - 1) * (LimitNum - 1)
    let video = {}
    let data = {}
    data.limit = LimitNum
    data.offset = offset
    data.owner_id = owner_id
    if (req.query.status) {
        if(req.query.status > 2 && req.query.status < 0){
            req.query.status = "";
        }
        data['status'] = req.query.status
    }
    await videoMonetizationModel.getWithdraw(req, data).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            video = {
                pagging: pagging,
                items: result
            }
        }
    })
    res.send(video)
}

exports.monetization = async(req,res) => {
    let monetization = req.body.monetization
    if(typeof monetization == "undefined"){
        monetization = 0
    }
    if(req.item){
        if(req.appSettings['autoapprove_monetization'] == 0  && req.item.monetization == 0){
            await globalModel.update(req, { monetization_request: 1 }, "users", 'user_id', req.item.user_id).then(result => {
                return res.send({ message: constant.member.MONETIZATIONREQUESTSEND,request:1, status: errorCodes.ok }).end();
            });
        }else{
            await globalModel.update(req, { monetization: monetization }, "users", 'user_id', req.item.user_id).then(result => {
                return res.send({ message: constant.member.MONETIZATIONREQUEST, status: errorCodes.ok }).end();
            });
        }
    }else{
        res.send({})
    }
}

exports.repositionCover = async (req, res) => {
    
    const user_id = req.body.user_id

    if (user_id) {
        userModel.findById(user_id, req, res).then(async member =>  {
            if (member) {
                if (member.cover) {
                    const path = require("path")
                    const imageName = "resize_"+uniqid.process('c')+path.basename(member.cover)
                    let image = member.cover;
                    if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                        //image = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com"+image;
                        const imageS = req.serverDirectoryPath
                        const newimage = imageS+"/public/upload/"+imageName
                        await readS3Image(req,member.cover,newimage).then(result => {
                            image = result
                        }).catch(err => {
                            
                        })
                    }else{
                        image = req.serverDirectoryPath+"/public"+member.cover
                    }
                    let data = {}
                    data['type'] = "members"
                    data['imageName'] = imageName
                    data['y'] = Math.abs(req.body.position)
                    data['path'] = "/upload/images/cover/members/"+data.imageName
                    data['screenWidth'] = req.body.screenWidth ? req.body.screenWidth : 1200 
                    const coverReposition = require("../../functions/coverCrop")
                     coverReposition.crop(req,data,image).then(result => {
                        if(result){ 
                            globalModel.update(req, { cover_crop: data['path'] }, "userdetails", 'user_id', user_id).then(result => {
                                if (member.cover_crop) {
                                    commonFunction.deleteImage(req, res, member.cover_crop, 'member/cover');
                                }                              
                                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                                    const fs = require("fs")
                                    fs.unlink(image, function (err) {
                                       
                                    });
                                }
                                socketio.getIO().emit('userCoverReposition', {
                                    "user_id": user_id,
                                    "message": constant.member.COVERREPOSITION,
                                    image: data['path']
                                });
                            });
                        }
                    }).catch(err => {
                        console.log(err,'Reposition image errror')
                    })
                }
            }
        })
    }
    res.send({})
}
exports.uploadCover = async (req, res) => {
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    const user_id = req.body.user_id
    if (user_id) {
        userModel.findById(user_id, req, res).then(member => {
            if (member) {
                if (req.fileName) {
                    let image = ""
                    let cover = ""
                    if (req.file && req.appSettings.upload_system != "s3"  || req.appSettings.upload_system == "wisabi") {
                         image = "/upload/images/cover/members/" + req.originalUrl;
                         cover_crop = "/upload/images/cover/members/" + req.fileName;
                    }else{
                         image = "/" + req.originalUrl;
                         cover_crop = "/" + req.fileName;
                    }
                    
                    globalModel.update(req, { cover: image,cover_crop:cover_crop }, "userdetails", 'user_id', user_id).then(result => {
                        if (member.cover_crop) {
                            commonFunction.deleteImage(req, res, member.cover_crop, 'member/covercrop');
                        }
                        if (member.usercover) {
                            commonFunction.deleteImage(req, res, member.cover, 'member/cover');
                        }
                        socketio.getIO().emit('userCoverUpdated', {
                            "user_id": user_id,
                            "message": constant.member.COVERUPLOADED,
                            image: image,
                            cover_crop:cover_crop
                        });
                    });

                }
            }
        })
    }
    res.send({})
}
exports.uploadMainPhoto = async (req, res) => {
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }

    const user_id = req.body.user_id

    if (user_id) {
        userModel.findById(user_id, req, res).then(member => {
            if (member) {
                if (req.fileName) {
                    let image = "/upload/images/members/" + req.fileName;
                    globalModel.update(req, { avtar: image }, "userdetails", 'user_id', user_id).then(result => {
                        if (member.userimage) {
                            commonFunction.deleteImage(req, res, member.avtar, 'member/image');
                        }
                        socketio.getIO().emit('userMainPhotoUpdated', {
                            "user_id": user_id,
                            "message": constant.member.MAINPHOTOUPLOADED,
                            image: image
                        });
                    });
                }
            }
        })
    }
    if(!req.headersSent)
    res.send({})
}
exports.verification = async (req, res) => {
   
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    if (!req.fileName) {
        return res.send({ error: constant.member.UPLOADVERIFICATIONIMAGE, status: errorCodes.invalid }).end();
    }
    const user_id = req.body.user_id

    if (user_id) {
        await userModel.findById(user_id, req, res).then(async member => {
            if (member) {
                if (req.fileName) {
                    let image = "/upload/images/members/verifications/" + req.fileName;

                    await globalModel.create(req, { name: member.displayname, media: image, description: req.body.description, owner_id: user_id, creation_date: dateTime.create().format("Y-m-d H:M:S") }, "verification_requests").then(result => {
                        if (result) {
                            return res.send({ message: constant.member.VERIFICATIONREQUESTSEND, status: errorCodes.invalid }).end();
                        }
                    }).catch(error => {
                        return res.send({ error: constant.general.DATABSE, status: errorCodes.invalid }).end();
                    });
                }
            }
        })
    }
    if(!req.headersSent)
    res.send({})
}
exports.password = async (req, res) => {
    const id = req.body.user_id
    if (!req.item) {
        res.send({})
    }

    const password = req.body.old_password
    const newpass = req.body.new_password

    bcrypt
        .compare(password, req.item.password)
        .then(doMatch => {
            if (doMatch) {
                bcrypt
                    .hash(newpass, 12)
                    .then(async hashedPassword => {
                        await globalModel.update(req, { password: hashedPassword }, "users", 'user_id', id).then(result => {
                            if (result) {
                                return res.send({ message: constant.member.PASSWORDCHANGED, status: errorCodes.ok }).end();
                            } else {
                                return res.send({ error: constant.general.DATABSE, status: errorCodes.invalid }).end();
                            }
                        });
                    })
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.member.PASSWORDNOTMATCH }], true), status: errorCodes.invalid }).end();
            }
        }).catch(error => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.member.PASSWORDNOTMATCH }], true), status: errorCodes.invalid }).end();
        });
    if(!req.headersSent)
        res.send({})
}
exports.delete = async (req, res) => {
    const id = req.body.user_id
    if (!req.item) {
        res.send({})
    }
    if (!req.item) {
        res.send({})
    }
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.auth.VALID_PASSWORD }], true), status: errorCodes.invalid }).end();
    }
    const password = req.body.password
    bcrypt
        .compare(password, req.item.password)
        .then(async doMatch => {
            if (doMatch) {
                await userModel.delete(req, id).then(result => {
                    if (result) {
                        if (req.item.cover_crop ) {
                            commonFunction.deleteImage(req, res, req.item.cover_crop, 'member/covercrop');
                        }
                        if (req.item.usercover) {
                            commonFunction.deleteImage(req, res, req.item.cover, 'member/cover');
                        }
                        if (req.item.userimage) {
                            commonFunction.deleteImage(req, res, req.item.avtar, 'member/avtar');
                        }
                        if (req.session.user && req.user.user_id == req.item.user_id) {
                            res.clearCookie('SESSIONUUID');
                        }
                        socketio.getIO().emit('userDeleted', {
                            "user_id": id,
                            "message": constant.member.DELETED,
                        });
                    }
                    return res.send({})
                })
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.member.PASSWORDINVALID }], true), status: errorCodes.invalid }).end();
            }
        }).catch(error => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.member.PASSWORDINVALID }], true), status: errorCodes.invalid }).end();
        });
}
exports.edit = async (req, res) => {
    const id = req.body.user_id
    if (!req.item) {
        res.send({})
    }

    const errors = validationResult(req);
    if(typeof req.body.first_name == "undefined"){
        if (!errors.isEmpty()) {
            return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
        }
    }
    if(req.body.profile == 1){
        if(!req.body.first_name && (req.body.first_name && !req.body.first_name.trim())){
            return res.send({ error: fieldErrors.errors([{ msg: "First Name should not be empty!" }], true), status: errorCodes.invalid }).end();
        }
    }

    let data = {}
    let userData = {}
    if (req.body.username) {
        data.username = req.body.username
    }
    if (req.body.email) {
        userData.email = req.body.email
    }

    if (req.body.gender) {
        data.gender = req.body.gender
    }
    
    if (typeof req.body.active != "undefined" && req.user.level_id == 1) {
        userData.active = req.body.active
    }
    if(typeof req.body.first_name == "undefined"){
        if(req.body.whitelist_domain){
            userData.whitelist_domain = req.body.whitelist_domain
        }else{
            userData.whitelist_domain = null;
        }
    }

    if (req.body.paypal_email) {
        userData.paypal_email = req.body.paypal_email
        const pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!pattern.test(userData.paypal_email)) {
            //invalid email
            return res.send({ error: constant.member.INVALIDPAYPALEMAIL, status: errorCodes.invalid }).end();
        }
    }

    if(req.body.email){
        userData.email = req.body.email
    }
    if (req.body.level_id && req.user.level_id == 1) {
        userData.level_id = req.body.level_id
    }

    if (typeof req.body.verified != "undefined" && req.user.level_id == 1) {
        data.verified = req.body.verified
    }

    if (typeof req.body.search != "undefined") {
        if (req.body.search)
            data.search = req.body.search
        else
            data.search = 0
    }
    if (req.body.age) {
        data.age = req.body.age
    }
    let userTitle = []
    userTitle['first_name'] = req.item.first_name
    userTitle['last_name'] = req.item.last_name ? req.item.last_name : ""
    
    if (req.body.first_name) {
        data.first_name = req.body.first_name
        userTitle['first_name'] = req.body.first_name
    }
    if (req.body.last_name) {
        data.last_name = req.body.last_name
        userTitle['last_name'] = req.body.last_name
    }else if(req.body.profile == 1){
        if(!req.body.last_name){
            data.last_name = ""
            userTitle['last_name'] = ""
        }
    }
    

    data.displayname = userTitle['first_name']+" "+userTitle['last_name']
    if(req.body.profile == 1){
        if (req.body.about) {
            data.about = req.body.about
        }else{
            data.about = ""
        }
        if (req.body.facebook) {
            data.facebook = req.body.facebook
        }else{
            data.facebook = ""
        }
        if (req.body.instagram) {
            data.instagram = req.body.instagram
        }else{
            data.instagram = ""
        }
        if (req.body.pinterest) {
            data.pinterest = req.body.pinterest
        }else{
            data.pinterest = ""
        }
        if (req.body.twitter) {
            data.twitter = req.body.twitter
        }else{
            data.twitter = ""
        }
    }else{
        if(req.body.timezone)
            userData.timezone = req.body.timezone
    }
    if(typeof req.body.comments != "undefined"){
        data['autoapprove_comments'] = parseInt(req.body.comments)
    }
    if(Object.keys(userData).length){
        await globalModel.update(req, userData, "users", 'user_id', id).then(result => {
            if (!result) {
                return res.send({ error: constant.general.DATABSE, status: errorCodes.invalid }).end();
            } else {
                
            }
        });
    }
    await globalModel.update(req, data, "userdetails", 'user_id', id).then(result => {
        if (result) {
            return res.send({ message: constant.member.PROFILEUPDATED, status: errorCodes.ok }).end();
        } else {
            return res.send({ error: constant.general.DATABSE, status: errorCodes.invalid }).end();
        }
    });
    if(!res.headersSent)
        res.send({})
}
exports.getVideos = async (req, res) => {
    const owner_id = parseInt(req.body.owner_id)
    if (!owner_id) {
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
    let offset = (page - 1) * (LimitNum - 1)
    let video = {}
    let data = {}
    data.limit = LimitNum
    data.offset = offset
    data.owner_id = owner_id
    await videoModel.getVideos(req, data).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            video = {
                pagging: pagging,
                videos: result
            }
        }
    })
    res.send(video)

}

exports.getChannels = async (req, res) => {
    const owner_id = parseInt(req.body.owner_id)
    if (!owner_id) {
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
    let offset = (page - 1) * (LimitNum - 1)
    let channel = {}
    let data = {}
    data.limit = LimitNum
    data.offset = offset
    data.owner_id = owner_id
    await channelModel.getChannels(req, data).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            channel = {
                pagging: pagging,
                channels: result
            }
        }
    })
    res.send(channel)

}

exports.getPlaylists = async (req, res) => {
    const owner_id = parseInt(req.body.owner_id)
    if (!owner_id) {
        return res.send({})
    }
    let LimitNum = 17;
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    let offset = (page - 1) * (LimitNum - 1)
    let playlist = {}
    let data = {}
    data.limit = LimitNum
    data.offset = offset
    data.owner_id = owner_id
    await playlistModel.getPlaylists(req, data).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            playlist = {
                pagging: pagging,
                playlists: result
            }
        }
    })
    res.send(playlist)
}

exports.getBlogs = async (req, res) => {
    const owner_id = parseInt(req.body.owner_id)
    if (!owner_id) {
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
    let offset = (page - 1) * (LimitNum - 1)
    let blog = {}
    let data = {}
    data.limit = LimitNum
    data.offset = offset
    data.owner_id = owner_id
    await blogModel.getBlogs(req, data).then(result => {
        let pagging = false
        if (result) {
            pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            blog = {
                pagging: pagging,
                blogs: result
            }
        }
    })
    res.send(blog)

} 