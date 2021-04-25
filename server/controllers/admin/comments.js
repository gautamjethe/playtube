const forms = require('forms')
const formFunctions = require('../../functions/forms/file');
const settings = require("../../models/settings")
const pagging = require("../../functions/pagging")
const globalModel = require("../../models/globalModel")
const commentModel = require("../../models/comments")
const commonFunction = require("../../functions/commonFunctions")
const socketio = require("../../socket")

exports.index = async (req, res) => {
    let LimitNum = 10;
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.params.page) ? parseInt(req.params.page) : 1;
    }
    const query = { ...req.query }
    let conditionalWhere = ""
    let condition = []
    if (query.type) {
        condition.push(query.type.toLowerCase())
        conditionalWhere += " AND LOWER(comments.type) LIKE CONCAT('%', ?,  '%')"
    }

    if (query.displayname) {
        condition.push(query.displayname.toLowerCase())
        conditionalWhere += " AND LOWER(userdetails.displayname) LIKE CONCAT('%', ?,  '%')"
    }

    if (query.email) {
        condition.push(query.email.toLowerCase())
        conditionalWhere += " AND LOWER(users.email) LIKE CONCAT('%', ?,  '%')"
    }

    conditionalWhere += " AND users.user_id IS NOT NULL AND parent_id = 0"

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM comments LEFT JOIN users on users.user_id = comments.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id  WHERE 1 = 1  " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY comments.comment_id DESC limit ? offset ?"
        let sqlQuery = "SELECT comments.*,userdetails.username,userdetails.displayname FROM comments LEFT JOIN users on users.user_id = comments.owner_id LEFT JOIN userdetails on userdetails.user_id = comments.owner_id   WHERE 1 = 1 " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3") {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi") {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    req.session.previousURl = req.originalUrl
    res.render('admin/comments/index', { admin_slug: process.env.ADMIN_SLUG, imageSuffix: imageSuffix, loggedin_id: (req.user ? req.user.user_id : ""), loggedinLevel_id: (req.user ? req.user.level_id : ""), totalCount: totalCount, query: query, nav: url, results: results, title: "Manage Comments", paggingData: paggingData });
}

exports.replies = async (req, res, next) => {
    let LimitNum = 10;
    const id = req.params.id
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.params.page) ? parseInt(req.params.page) : 1;
    }

    const query = { ...req.query }
    let conditionalWhere = ""
    let condition = []
    if (query.type) {
        condition.push(query.type.toLowerCase())
        conditionalWhere += " AND LOWER(comments.type) LIKE CONCAT('%', ?,  '%')"
    }
    condition.push(id)
    conditionalWhere += " AND parent_id = ?"
    if (query.displayname) {
        condition.push(query.displayname.toLowerCase())
        conditionalWhere += " AND LOWER(userdetails.displayname) LIKE CONCAT('%', ?,  '%')"
    }

    if (query.email) {
        condition.push(query.email.toLowerCase())
        conditionalWhere += " AND LOWER(users.email) LIKE CONCAT('%', ?,  '%')"
    }

    conditionalWhere += " AND users.user_id IS NOT NULL "

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM comments LEFT JOIN users on users.user_id = comments.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id  WHERE 1 = 1  " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY comments.comment_id DESC limit ? offset ?"
        let sqlQuery = "SELECT comments.*,userdetails.username,userdetails.displayname FROM comments LEFT JOIN users on users.user_id = comments.owner_id LEFT JOIN userdetails on userdetails.user_id = comments.owner_id   WHERE 1 = 1 " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3") {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi") {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/comments/replies', { previousURl: req.session.previousURl, admin_slug: process.env.ADMIN_SLUG, imageSuffix: imageSuffix, loggedin_id: (req.user ? req.user.user_id : ""), loggedinLevel_id: (req.user ? req.user.level_id : ""), totalCount: totalCount, query: query, nav: url, results: results, title: "Manage Comment Replies", paggingData: paggingData });
}
exports.settings = async (req,res,next) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    var cssClasses = {
        field : ["form-group"],
        classes : ["form-control"]
    };


    var reg_form = forms.create({
        enable_comment_approve: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Allow Content Owner to choose enable approve Comments before display?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"enable_comment_approve",'0').toString()
        }),
        autoapproveverified_user_comment: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Auto approve comments of Verified Users?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"autoapproveverified_user_comment",'1').toString()
        }),
        

    },{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {
            settings.setSettings(req,form.data)
            res.send({success:1,message:"Setting Saved Successfully."})
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            res.send({errors:errors});
        },
        other: function (form) {
            res.render('admin/comments/settings',{nav:url,reg_form:reg_form,title:"Comments Settings"});
        }
    });
}
exports.delete = async (req, res, next) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/blogs";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    let comment = {}
    await globalModel.custom(req, "SELECT * FROM comments WHERE comment_id = ?", [id]).then(results => {
        if (results) {
            const result = JSON.parse(JSON.stringify(results));
            comment = result[0]
        }
    })
    await globalModel.custom(req, 'DELETE FROM comments WHERE comment_id = ?', [id]).then(async result => {
        if (result) {
            if (comment.image) {
                commonFunction.deleteImage(req, res, comment.image)
            }
            let column = "video_id"
            if (comment.type == "channels") {
                column = "channel_id"
            } else if (comment.type == "blogs") {
                column = "blog_id"
            } else if (comment.type == "members") {
                column = "user_id"
            }
            if (req.query.reply) {
                await globalModel.custom(req,"UPDATE comments SET reply_count = reply_count - 1 WHERE comment_id = ?",[comment.parent_id]).then(result => {
                    socketio.getIO().emit('deleteReply', {
                        "commentId": comment.parent_id,
                        "replyId" : comment.comment_id,
                        "id":comment.id,
                        "type":comment.type,
                    });
                }).catch(err => {                        
                });
            } else {
                globalModel.custom(req, "UPDATE " + (comment.type == "members" ? "users" : comment.type) + " SET comment_count = comment_count - 1 WHERE " + column + " = ? ", [id], function (err, results, fields) {
                    socketio.getIO().emit('deleteComment', {
                        "commentId": comment.comment_id,
                        "id":comment.id,
                        "type":comment.type,
                    });
                }).catch(err => {
                });
            }
        }
        res.redirect(backURL)
        return
    })
}