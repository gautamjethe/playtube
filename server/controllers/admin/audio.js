const forms = require('forms')
const formFunctions = require('../../functions/forms/file');
const settings = require("../../models/settings")
const levels = require("../../models/levels")
const pagging = require("../../functions/pagging")
const globalModel = require("../../models/globalModel")
const fileManager = require("../../models/fileManager")
const permission = require("../../models/levelPermissions")
const audioModel = require("../../models/audio")
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
        conditionalWhere += " AND LOWER(audio.title) LIKE CONCAT('%', ?,  '%')"
    }
    if (query.displayname) {
        condition.push(query.displayname.toLowerCase())
        conditionalWhere += " AND LOWER(userdetails.displayname) LIKE CONCAT('%', ?,  '%')"
    }
    if (query.email) {
        condition.push(query.email.toLowerCase())
        conditionalWhere += " AND LOWER(users.email) LIKE CONCAT('%', ?,  '%')"
    }
    
    
    if (typeof query.approve != "undefined" && query.approve.length) {
        condition.push(query.approve)
        conditionalWhere += " AND audio.approve = ?"
    }
    

    conditionalWhere += " AND users.user_id IS NOT NULL "

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM audio LEFT JOIN users on users.user_id = audio.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY audio.audio_id DESC limit ? offset ?"
        let sqlQuery = "SELECT audio.*,userdetails.username,userdetails.displayname FROM audio LEFT JOIN users on users.user_id = audio.owner_id LEFT JOIN userdetails on userdetails.user_id = audio.owner_id  WHERE 1 = 1 " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/audio/index', {loggedin_id: (req.user ? req.user.user_id : ""), loggedinLevel_id: (req.user ? req.user.level_id : ""), totalCount: totalCount, query: query, nav: url, results: results, title: "Manage Audio", paggingData: paggingData });
}
exports.approve = async (req,res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({error:1})
        return
    }
    await globalModel.custom(req,"SELECT * from audio where audio_id = ?",id).then(async result => {
        if(result && result.length){
            let item = result[0]
            await globalModel.update(req,{approve:!item.approve},"audio","audio_id",id).then(result => {
                if (item.owner_id != req.user.user_id && !item.approve) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "audio_admin_approved", subject_type: "users", subject_id: item.owner_id, object_type: "audio", object_id: item.audio_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }else if (item.owner_id != req.user.user_id && item.approve) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "audio_admin_disapproved", subject_type: "users", subject_id: item.owner_id, object_type: "audio", object_id: item.audio_id, insert: true }).then(result => {

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

exports.delete = async (req, res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/audio";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    await audioModel.delete(id,req).then(result => {
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
        deleteOptions["2"] = "Yes, allow to delete other users audio."
        viewOptions["2"] = "Yes, allow to view private audio of users."
        editOptions["2"] = "Yes, allow to edit everyones audio."
    }
    viewOptions["0"] = "No, do not allow to view audio."
    viewOptions["1"] = "Yes, allow to view audio."
    
    deleteOptions["1"] = "Yes, allow to delete own audio."
    deleteOptions["0"] = "No, do not allow to delete audio."

    editOptions["1"] = "Yes, allow to edit own audio."
    editOptions["0"] = "No, do not edit audio."
    
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
                choices: {"1" : "Yes, allow to create audio","0" : "No, do not allow to create audio"},
               widget: widgets.select({ "classes": ["select"] }),
                label:"Allow member to create audio",
                fieldsetClasses:"form_fieldset",
                cssClasses: {"field" : ["form-group"]},
                value:cacheContent["audio.create"] ? cacheContent["audio.create"].toString() : 1
            })
        }
        formFields = {...formFields,...formFieldsPublic}
    }

    let formFieldsView ={
        view: fields.string({
            choices: viewOptions,
           widget: widgets.select({ "classes": ["select"] }),
            label:"Allow member to view audio",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:cacheContent["audio.view"] ? cacheContent["audio.view"].toString() : 1
        }),
        
    }
    formFields = {...formFields,...formFieldsView}


    if(flag != "public"){
        let formFields1 = {
            edit: fields.string({
                choices: editOptions,
               widget: widgets.select({ "classes": ["select"] }),
                label:"Allow member to edit created audio",
                fieldsetClasses:"form_fieldset",
                cssClasses: {"field" : ["form-group"]},
                value:cacheContent["audio.edit"] ? cacheContent["audio.edit"].toString() : 1
            }),
            delete: fields.string({
                choices: deleteOptions,
               widget: widgets.select({ "classes": ["select"] }),
                label:"Allow member to delete created audio",
                fieldsetClasses:"form_fieldset",
                cssClasses: {"field" : ["form-group"]},
                value:cacheContent["audio.delete"] ? cacheContent["audio.delete"].toString() : 1
            }),
            quota: fields.string({
                label:"How many audio member can create? Enter 0 for unlimited",
                validators:[validators.integer('Enter integer value only.')],
                cssClasses: {"field" : ["form-group"]},
                widget: widgets.text({"classes":["form-control"]}),
                value:cacheContent["audio.quota"] ? cacheContent["audio.quota"].toString() : 0
            }),
            auto_approve: fields.string({
                choices: {"1" : "Yes, auto approve audio","0" : "No, do not auto approve audio"},
               widget: widgets.select({ "classes": ["select"] }),
                label:"Auto Approve audio",
                fieldsetClasses:"form_fieldset",
                cssClasses: {"field" : ["form-group"]},
                value:cacheContent["audio.auto_approve"] ? cacheContent["audio.auto_approve"].toString() : 1
            }),
            
        }
        formFields = {...formFields,...formFields1}
    }
    var reg_form = forms.create(formFields,{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {
            permission.insertUpdate(req,res,form.data,level_id,"audio").then(result => {
                res.send({success:1,message:"Operation performed successfully.",url:process.env.ADMIN_SLUG+"/audio/levels/"+level_id})
            })
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            res.send({errors:errors});
        },
        other: function (form) {
            res.render('admin/audio/levels',{nav:url,reg_form:reg_form,title: "Audio Member Role Settings"});
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
    // const files = {"":""}

    // await fileManager.findAll(req,{"column":"path","like":"image"}).then(result => {
    //     result.forEach(res => {
    //         let url = res.path.split(/(\\|\/)/g).pop().split("_")
    //         if(url.length > 1){
    //             url.splice(0, 2)
    //             url = url.join("_")
    //         }else{
    //             url = url[0]
    //         }
    //         files[res.path] = url
    //     });
    // })


    var reg_form = forms.create({
        enable_audio: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable audio feature on your website?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"enable_audio",'1').toString()
        }),
        audio_favourite: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable favourite feature on audio?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"audio_favourite",'1').toString()
        }),
        
        audio_like: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable like feature on audio?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"audio_like",'1').toString()
        }),
        audio_dislike: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable dislike feature on audio?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"audio_dislike",'1').toString()
        }),

        audio_comment: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable comment feature on audio?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"audio_comment",'1').toString()
        }),

        audio_comment_like: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable like feature on comment audio?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"audio_comment_like",'1').toString()
        }),

        audio_comment_dislike: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable dislike feature on comment audio?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"audio_comment_dislike",'1').toString()
        }),

        // audio_default_photo: fields.string({
        //     label: "Default audio Main Photo",
        //     choices: files,
        //     required:false,
        //     widget: widgets.select({"classes":["select"]}),
        //     cssClasses: {"field" : ["form-group"],label:['select']},
        //     value:settings.getSetting(req,"audio_default_photo","").toString()
        // }),

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
            res.render('admin/audio/settings',{nav:url,reg_form:reg_form,title:"Audio Settings"});
        }
    });
}