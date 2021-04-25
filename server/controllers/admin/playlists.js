const forms = require('forms')
const formFunctions = require('../../functions/forms/file');
const settings = require("../../models/settings")
const levels = require("../../models/levels")
const pagging = require("../../functions/pagging")
const globalModel = require("../../models/globalModel")
const fileManager = require("../../models/fileManager")
const permission = require("../../models/levelPermissions")
const playlistModel = require("../../models/playlists")
const notifications = require("../../models/notifications")

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
    if (query.title) {
        condition.push(query.title.toLowerCase())
        conditionalWhere += " AND LOWER(playlists.title) LIKE CONCAT('%', ?,  '%')"
    }
    if (query.displayname) {
        condition.push(query.displayname.toLowerCase())
        conditionalWhere += " AND LOWER(userdetails.displayname) LIKE CONCAT('%', ?,  '%')"
    }
    if (query.email) {
        condition.push(query.email.toLowerCase())
        conditionalWhere += " AND LOWER(users.email) LIKE CONCAT('%', ?,  '%')"
    }
    
    
    if (typeof query.adult != "undefined" && query.adult.length) {
        condition.push(query.adult)
        conditionalWhere += " AND playlists.adult = ?"
    }
    if (typeof query.approve != "undefined" && query.approve.length) {
        condition.push(query.approve)
        conditionalWhere += " AND playlists.approve = ?"
    }
    
    if (typeof query.featured != "undefined" && query.featured.length) {
        condition.push(query.featured)
        conditionalWhere += " AND playlists.is_featured = ?"
    }
    if (typeof query.sponsored != "undefined" && query.sponsored.length) {
        condition.push(query.sponsored)
        conditionalWhere += " AND playlists.is_sponsored = ?"
    }
    if (typeof query.hot != "undefined" && query.hot.length) {
        condition.push(query.hot)
        conditionalWhere += " AND playlists.is_hot = ?"
    }

    conditionalWhere += " AND users.user_id IS NOT NULL "

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM playlists LEFT JOIN users on users.user_id = playlists.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY playlists.playlist_id DESC limit ? offset ?"
        let sqlQuery = "SELECT playlists.*,userdetails.username,userdetails.displayname FROM playlists LEFT JOIN users on users.user_id = playlists.owner_id LEFT JOIN userdetails on userdetails.user_id = playlists.owner_id  WHERE 1 = 1 " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/playlists/index', {loggedin_id: (req.user ? req.user.user_id : ""), loggedinLevel_id: (req.user ? req.user.level_id : ""), totalCount: totalCount, query: query, nav: url, results: results, title: "Manage Playlists", paggingData: paggingData });
}
exports.approve = async (req,res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({error:1})
        return
    }
    await globalModel.custom(req,"SELECT * from playlists where playlist_id = ?",id).then(async result => {
        if(result && result.length){
            let item = result[0]
            await globalModel.update(req,{approve:!item.approve},"playlists","playlist_id",id).then(result => {
                if (item.owner_id != req.user.user_id && !item.approve) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "playlists_admin_approved", subject_type: "users", subject_id: item.owner_id, object_type: "playlists", object_id: item.playlist_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }else if (item.owner_id != req.user.user_id && item.approve) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "playlists_admin_disapproved", subject_type: "users", subject_id: item.owner_id, object_type: "playlists", object_id: item.playlist_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({status:!item.approve})
            })
        }else{
            res.send({error:1})
        }
    })  
}
exports.featured = async (req,res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({error:1})
        return
    }
    await globalModel.custom(req,"SELECT * from playlists where playlist_id = ?",id).then(async result => {
        if(result && result.length){
            let item = result[0]
            await globalModel.update(req,{is_featured:!item.is_featured},"playlists","playlist_id",id).then(result => {
                if (item.owner_id != req.user.user_id && !item.is_featured) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "playlists_featured", subject_type: "users", subject_id: item.owner_id, object_type: "playlists", object_id: item.playlist_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({status:!item.is_featured})
            })
        }else{
            res.send({error:1})
        }
    })  
}
exports.sponsored = async (req,res) => {
    const id = req.params.id
    if (!id || !req.user ) {
        res.send({error:1})
        return
    }
    await globalModel.custom(req,"SELECT * from playlists where playlist_id = ?",id).then(async result => {
        if(result && result.length){
            let item = result[0]
            await globalModel.update(req,{is_sponsored:!item.is_sponsored},"playlists","playlist_id",id).then(result => {
                if (item.owner_id != req.user.user_id && !item.is_sponsored) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "playlists_featured", subject_type: "users", subject_id: item.owner_id, object_type: "playlists", object_id: item.playlist_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({status:!item.is_sponsored})
            })
        }else{
            res.send({error:1})
        }
    })  
}
exports.hot = async (req,res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({error:1})
        return
    }
    await globalModel.custom(req,"SELECT * from playlists where playlist_id = ?",id).then(async result => {
        if(result && result.length){
            let item = result[0]
            await globalModel.update(req,{is_hot:!item.is_hot},"playlists","playlist_id",id).then(result => {
                if (item.owner_id != req.user.user_id && !item.is_hot) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "playlists_featured", subject_type: "users", subject_id: item.owner_id, object_type: "playlists", object_id: item.playlist_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({status:!item.is_hot})
            })
        }else{
            res.send({error:1})
        }
    })  
}
exports.delete = async (req, res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/playlists";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    await playlistModel.delete(id,req).then(result => {
        res.redirect(backURL)
        return
    })
}

exports.levels = async (req,res) => {
    let level_id = req.params.level_id
    
    let memberLevels = {}
    let flag = ""
    let type = "user"
    await  levels.findAll(req,req.query).then(result => {
         if(result){
             result.forEach(res => {
                 if((!level_id && res.flag == "default")){
                     level_id = res.level_id
                 }
                 if(res.level_id == level_id || (!level_id && res.flag == "default")){
                     flag = res.flag
                     type = res.type
                 }
                 memberLevels[res.level_id] = res.title
             });
         }
    })
    const cacheContent = await permission.getKeyValue(req,level_id)
    //get uploaded file by admin
    const files = {"":""}

    await fileManager.findAll(req,{"column":"path","like":"image"}).then(result => {
        result.forEach(res => {
            let url = res.path.split(/(\\|\/)/g).pop().split("_")
            if(url.length > 1){
                url.splice(0, 2)
                url = url.join("_")
            }else{
                url = url[0]
            }
            files[res.path] = url
        });
    })

    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    const cssClasses = {
        label :[""],
        field : ["form-group"],
        classes : ["form-control"]
    };
    
    const deleteOptions = {}
    const viewOptions = {}
    const editOptions = {}
    if(type == "admin" || type == "moderator"){
        deleteOptions["2"] = "Yes, allow to delete other users playlists."
        viewOptions["2"] = "Yes, allow to view private playlists of users."
        editOptions["2"] = "Yes, allow to edit everyones playlists."
    }
    viewOptions["0"] = "No, do not allow to view playlists."
    viewOptions["1"] = "Yes, allow to view playlists."
    
    deleteOptions["1"] = "Yes, allow to delete own playlists."
    deleteOptions["0"] = "No, do not allow to delete playlists."

    editOptions["1"] = "Yes, allow to edit own playlists."
    editOptions["0"] = "No, do not edit playlists."

    let formFields = {
        level_id: fields.string({
            label: "Member Role",
            choices: memberLevels,
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:level_id
        }),       
    }

    if(flag != "public"){
       let formFieldsPublic ={
            create: fields.string({
                choices: {"1" : "Yes, allow to create playlists","0" : "No, do not allow to create playlists"},
               widget: widgets.select({ "classes": ["select"] }),
                label:"Allow member to create playlists",
                fieldsetClasses:"form_fieldset",
                cssClasses: {"field" : ["form-group"]},
                value:cacheContent["playlist.create"] ? cacheContent["playlist.create"].toString() : 1
            })
        }
        formFields = {...formFields,...formFieldsPublic}
    }

    let formFieldsView ={
        view: fields.string({
            choices: viewOptions,
           widget: widgets.select({ "classes": ["select"] }),
            label:"Allow member to view playlists",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:cacheContent["playlist.view"] ? cacheContent["playlist.view"].toString() : 1
        }),
        
    }
    formFields = {...formFields,...formFieldsView}


    if(flag != "public"){
        let formFields1 = {
            edit: fields.string({
                choices: editOptions,
               widget: widgets.select({ "classes": ["select"] }),
                label:"Allow member to edit created playlists",
                fieldsetClasses:"form_fieldset",
                cssClasses: {"field" : ["form-group"]},
                value:cacheContent["playlist.edit"] ? cacheContent["playlist.edit"].toString() : 1
            }),
            delete: fields.string({
                choices: deleteOptions,
               widget: widgets.select({ "classes": ["select"] }),
                label:"Allow member to delete created playlists",
                fieldsetClasses:"form_fieldset",
                cssClasses: {"field" : ["form-group"]},
                value:cacheContent["playlist.delete"] ? cacheContent["playlist.delete"].toString() : 1
            }),
            quota: fields.string({
                label:"How many playlists member can create? Enter 0 for unlimited",
                validators:[validators.integer('Enter integer value only.')],
                cssClasses: {"field" : ["form-group"]},
                widget: widgets.text({"classes":["form-control"]}),
                value:cacheContent["playlist.quota"] ? cacheContent["playlist.quota"].toString() : 0
            }),
            auto_approve: fields.string({
                choices: {"1" : "Yes, auto approve playlists","0" : "No, do not auto approve playlists"},
               widget: widgets.select({ "classes": ["select"] }),
                label:"Auto Approve playlists",
                fieldsetClasses:"form_fieldset",
                cssClasses: {"field" : ["form-group"]},
                value:cacheContent["playlist.auto_approve"] ? cacheContent["playlist.auto_approve"].toString() : 1
            }),
            
        }
        formFields = {...formFields,...formFields1}
    }
    var reg_form = forms.create(formFields,{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {
            permission.insertUpdate(req,res,form.data,level_id,"playlist").then(result => {
                res.send({success:1,message:"Operation performed successfully.",url:process.env.ADMIN_SLUG+"/playlists/levels/"+level_id})
            })
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            res.send({errors:errors});
        },
        other: function (form) {
            res.render('admin/playlists/levels',{nav:url,reg_form:reg_form,title: "Playlist Member Role Settings"});
        }
    });
}

exports.settings = async (req,res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    var cssClasses = {
        field : ["form-group"],
        classes : ["form-control"]
    };
    
   
    //get uploaded file by admin
    const files = {"":""}

    await fileManager.findAll(req,{"column":"path","like":"image"}).then(result => {
        result.forEach(res => {
            let url = res.path.split(/(\\|\/)/g).pop().split("_")
            if(url.length > 1){
                url.splice(0, 2)
                url = url.join("_")
            }else{
                url = url[0]
            }
            files[res.path] = url
        });
    })


    var reg_form = forms.create({
        enable_playlist: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable playlist feature on your website?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"enable_playlist",'1').toString()
        }),
        playlist_favourite: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable favourite feature on playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_favourite",'1').toString()
        }),
        
        playlist_like: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable like feature on playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_like",'1').toString()
        }),
        playlist_dislike: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable dislike feature on playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_dislike",'1').toString()
        }),

        playlist_comment: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable comment feature on playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_comment",'1').toString()
        }),

        playlist_comment_like: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable like feature on comment playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_comment_like",'1').toString()
        }),

        playlist_comment_dislike: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable dislike feature on comment playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_comment_dislike",'1').toString()
        }),

        playlist_rating: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable rating feature on playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_rating",'1').toString()
        }),

        playlist_featured: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable featured label on playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_featured",'0').toString()
        }),

        playlist_sponsored: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable sponsored label on playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_sponsored",'0').toString()
        }),
        
        playlist_hot: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable hot label on playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_hot",'0').toString()
        }),

        playlist_adult: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable adult marking on playlists?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"playlist_adult",'1').toString()
        }),
        playlist_default_photo: fields.string({
            label: "Default playlist Main Photo",
            choices: files,
            required:false,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:settings.getSetting(req,"playlist_default_photo","").toString()
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
            res.render('admin/playlists/settings',{nav:url,reg_form:reg_form,title:"Playlists Settings"});
        }
    });
}