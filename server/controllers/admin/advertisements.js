const forms = require('forms')
const formFunctions = require('../../functions/forms/file');
const pagging = require("../../functions/pagging")
const globalModel = require("../../models/globalModel")
const fileManager = require("../../models/fileManager")
const categoryModel = require("../../models/categories")
const dateTime = require("node-datetime")
const getSymbolFromCurrency = require('currency-symbol-map')
var settings = require("../../models/settings")

exports.settings = async(req,res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    var cssClasses = {
        label :[""],
        field : ["form-group"],
        classes : ["form-control"]
    };

    var reg_form = forms.create({
        
        enable_ads: fields.string({
            choices: {"1":"Yes, Users can create ads",'0':"No, Users can not create ads"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Create Ads",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"enable_ads",'1')
        }),
        advertisement_upload_limit: fields.string({
            label: "Maximum Upload Limit of Advertisement video. Enter value in MB (Enter 0 for unlimited.)",
            validators: [validators.integer('Enter integer value only.')],
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: settings.getSetting(req, "advertisement_upload_limit", '50')
        }),
        enable_monetization: fields.string({
            choices: {"1":"Yes, Enable Ads Monetization",'0':"No, Disable Ads Monetization"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Ads Monetization",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"enable_monetization",'1')
        }),
        autoapprove_monetization: fields.string({
            choices: {"1":"Yes, Auto approve monetization",'0':"No, Don't auto approve monetization"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Auto Approve Monetization Request",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"autoapprove_monetization",'1')
        }),
        ads_cost_perview: fields.string({
            required: validators.required('%s is required'),
            label : "Cost ad by per view" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:settings.getSetting(req,"ads_cost_perview","0")
        }),
        ads_cost_perclick: fields.string({
            required: validators.required('%s is required'),
            label : "Cost ad by per click" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:settings.getSetting(req,"ads_cost_perclick","0")
        }),
        ads_cost_publisher: fields.string({
            required: validators.required('%s is required'),
            label : "Ads publisher price" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:settings.getSetting(req,"ads_cost_publisher","0")
        }),
        
    },{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {
            if(!form.data.maintanance_code){
                form.data.maintanance_code = Math.random().toString(36).slice(-5);
            }
            settings.setSettings(req,form.data)
            res.send({success:1,message:"Setting Saved Successfully."})
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            
            res.send({errors:errors});
        },
        other: function (form) {
            res.render('admin/advertisements/settings',{nav:url,reg_form:reg_form,title:"Manage Advertisement Settings"});
        }
    });
}
exports.websiteads = async(req,res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    var cssClasses = {
        label :[""],
        field : ["form-group"],
        classes : ["form-control"]
    };

    var reg_form = forms.create({
        advertisement_type: fields.string({
            choices: { "1": "Static Advertisement", "2": "Google Advertisement" },
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            label: "Advertisement Type",
            value: settings.getSetting(req,"advertisement_type","1")
        }),
        below_header: fields.string({ 
            label : "Below Header (Appears on all pages right under the navigation bar)" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"below_header","")
        }),
        above_footer: fields.string({ 
            label : "Above Footer (Appears on all pages right before the footer)" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"above_footer","")
        }),
        above_comment: fields.string({ 
            label : "Above Comment (Appears on all appropriate pages right before the comment starts)" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"above_comment","")
        }),
        below_comment: fields.string({ 
            label : "Below Comment (Appears on all appropriate pages right after the comment ends)" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"below_comment","")
        }),

        below_cover: fields.string({ 
            label : "Below Cover (Appears on member and channel view pages)" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"below_cover","")
        }),
        below_searchform: fields.string({ 
            label : "Below Search Form (Appears on all appropriate pages right after the search form)" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"below_searchform","")
        }),
        sidebar_video: fields.string({ 
            label : "Video View Page Sidebar (Appears on video view page above the related videos section)" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"sidebar_video","")
        }),
        
        homepage_label: fields.string({
            widget: formFunctions.makeClickable({ content: '<h2 style="text-align: center;margin: 40px;text-decoration: underline;">Home Page Advertisements</h2>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        //video
        featuredvideo_ads: fields.string({ 
            label : "Show Advertisement Below Featured Videos" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"featuredvideo_ads","")
        }),
        sponsoredvideo_ads: fields.string({ 
            label : "Show Advertisement Below Sponsored Videos" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"sponsoredvideo_ads","")
        }),
        hotvideo_ads: fields.string({ 
            label : "Show Advertisement Below Hot Videos" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"hotvideo_ads","")
        }),
        recentvideo_ads: fields.string({ 
            label : "Show Advertisement Below Recent Videos" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"recentvideo_ads","")
        }),
        
        categoryvideo_ads: fields.string({ 
            label : "Show Advertisement Below Categories Videos" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"categoryvideo_ads","")
        }),
        //channel
        featuredchannel_ads: fields.string({ 
            label : "Show Advertisement Below Featured Channels" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"featuredchannel_ads","")
        }),
        sponsoredchannel_ads: fields.string({ 
            label : "Show Advertisement Below Sponsored Channels" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"sponsoredchannel_ads","")
        }),
        hotchannel_ads: fields.string({ 
            label : "Show Advertisement Below Hot Channels" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:settings.getSetting(req,"hotchannel_ads","")
        }),        
        
    },{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {
            delete form.data['homepage_label']
            settings.setSettings(req,form.data)
            res.send({success:1,message:"Setting Saved Successfully."})
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            
            res.send({errors:errors});
        },
        other: function (form) {
            res.render('admin/advertisements/settings',{nav:url,reg_form:reg_form,title:"Manage Website Advertisements"});
        }
    });
}
exports.userads = async(req,res) => {
    let LimitNum = 10;
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.params.page) ? parseInt(req.params.page) : 1;
    }

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

    const query = { ...req.query }
    let conditionalWhere = ""
    let condition = []
    if (query.name) {
        condition.push(query.name.toLowerCase())
        conditionalWhere += " AND LOWER( advertisements_user.name) LIKE CONCAT('%', ?,  '%')"
    }

    if (typeof query.status != "undefined") {
        condition.push(query.status)
        conditionalWhere += " AND advertisements_user.status = ?"
    }

    if (typeof query.adult != "undefined") {
        condition.push(query.adult)
        conditionalWhere += " AND advertisements_user.adult = ?"
    }

    if (typeof query.approve != "undefined") {
        condition.push(query.approve)
        conditionalWhere += " AND advertisements_user.approve = ?"
    }

    if (query.category_id && typeof query.category_id != "undefined") {
        condition.push(query.category_id)
        conditionalWhere += " AND advertisements_user.category_id = ?"
    }

    if (query.subcategory_id && typeof query.subcategory_id != "undefined") {
        condition.push(query.subcategory_id)
        conditionalWhere += " AND advertisements_user.subcategory_id = ?"
    }
    if (query.subsubcategory_id && typeof query.subsubcategory_id != "undefined") {
        condition.push(query.subsubcategory_id)
        conditionalWhere += " AND advertisements_user.subsubcategory_id = ?"
    }


    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM advertisements_user LEFT JOIN users ON users.user_id = advertisements_user.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id  WHERE 1 = 1 AND users.active = 1 AND users.approve = 1 AND completed = 1 " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY advertisements_user.ad_id DESC limit ? offset ?"
        let sqlQuery = "SELECT advertisements_user.*,userdetails.displayname,userdetails.username,users.wallet FROM advertisements_user  LEFT JOIN users ON users.user_id = advertisements_user.owner_id LEFT JOIN userdetails ON userdetails.user_id = advertisements_user.owner_id  WHERE 1 = 1 AND users.active = 1 AND users.approve = 1 AND completed = 1 " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    const defaultCurrency = getSymbolFromCurrency(req.appSettings.payment_default_currency)
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/advertisements/website', {defaultCurrency:defaultCurrency, categories: categories, totalCount: totalCount, query: query, nav: url, results: results, title: "Manage User Advertisements", paggingData: paggingData });
}

exports.websiteadsApprove = async(req,res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from advertisements_user where ad_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { approve: !item.approve }, "advertisements_user", "ad_id", id).then(result => {
                res.send({ status: !item.approve })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}

exports.websiteadsStatus = async(req,res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from advertisements_user where ad_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { status: !item.status }, "advertisements_user", "ad_id", id).then(result => {
                res.send({ status: !item.status })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}

exports.websiteadsDelete = async(req,res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/advertisements/website";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    await globalModel.delete(req,"advertisements_user",'ad_id',id).then(result => {
        res.redirect(backURL)
        return
    })
}

exports.index = async (req, res) => {

    let LimitNum = 10;
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.params.page) ? parseInt(req.params.page) : 1;
    }

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

    const query = { ...req.query }
    let conditionalWhere = ""
    let condition = []
    if (query.title) {
        condition.push(query.title.toLowerCase())
        conditionalWhere += " AND LOWER(advertisements_admin.title) LIKE CONCAT('%', ?,  '%')"
    }

    if (typeof query.active != "undefined") {
        condition.push(query.active)
        conditionalWhere += " AND advertisements_admin.active = ?"
    }

    if (query.category_id) {
        condition.push(query.category_id)
        conditionalWhere += " AND advertisements_admin.category_id = ?"
    }

    if (query.subcategory_id) {
        condition.push(query.subcategory_id)
        conditionalWhere += " AND advertisements_admin.subcategory_id = ?"
    }
    if (query.subsubcategory_id) {
        condition.push(query.subsubcategory_id)
        conditionalWhere += " AND advertisements_admin.subsubcategory_id = ?"
    }


    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM advertisements_admin WHERE 1 = 1 " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY advertisements_admin.ad_id DESC limit ? offset ?"
        let sqlQuery = "SELECT advertisements_admin.* FROM advertisements_admin  WHERE 1 = 1 " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/advertisements/index', { categories: categories, totalCount: totalCount, query: query, nav: url, results: results, title: "Manage Video Advertisements", paggingData: paggingData });
}
exports.active = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from advertisements_admin where ad_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { active: !item.active }, "advertisements_admin", "ad_id", id).then(result => {
                res.send({ status: !item.active })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.create = async (req, res) => {
    const id = req.params.id

    let adObj = {}

    await globalModel.custom(req, "SELECT * FROM advertisements_admin WHERE ad_id = ?", [id]).then(result => {
        if (result) {
            let obj = JSON.parse(JSON.stringify(result))
            if (obj && obj.length) {
                adObj = obj[0]
            }
        }
    })

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


    //get uploaded file by admin
    const files = { "": "" }

    await fileManager.findAll(req, { "column": "path", "like": "video" }).then(result => {
        result.forEach(res => {
            let url = res.path.split(/(\\|\/)/g).pop().split("_")
            if (url.length > 1) {
                url.splice(0, 2)
                url = url.join("_")
            } else {
                url = url[0]
            }
            files[res.path] = url
        });
    })

    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;

    let formFields = {
        type: fields.string({
            choices: { "1": "Video Ad", "2": "Vast/Vpaid Ad" },
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            label: "Ad Type",
            value: Object.keys(adObj).length > 0 ? adObj.type : "1"
        }),
        title: fields.string({
            label: "Title",
            required: true,
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: Object.keys(adObj).length > 0 ? adObj.title : ""
        }),
        click_link: fields.string({
            label: "URL redirect the user to this link after clicking on the ad",
            required: false,
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: Object.keys(adObj).length > 0 ? adObj.click_link : ""
        }),
        skip: fields.string({
            label: "Skip Ad Seconds (0=disabled)",
            validators: [validators.integer('Enter integer value only.')],
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: Object.keys(adObj).length > 0 ? adObj.skip : 0
        }),
        link: fields.string({
            label: "Select Video File",
            choices: files,
            required: false,
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            value: Object.keys(adObj).length > 0 && adObj.type == 1 ? adObj.link : ""
        }),
        link2: fields.string({
            label: "Vast/Vpaid XML Link",
            required: false,
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: Object.keys(adObj).length > 0 && adObj.type == 2 ? adObj.link : ""
        })
    }

    if (categories.length) {
        let categoriesOption = {}
        categoriesOption[0] = "Select Category"
        categories.forEach(cat => {
            categoriesOption[cat.category_id] = cat.title
        })
        let formFieldsView = {
            category_id: fields.string({
                choices: categoriesOption,
                widget: widgets.select({ "classes": ["select"] }),
                cssClasses: { "field": ["form-group"] },
                label: "Categories on which you want to show ads",
                value: Object.keys(adObj).length > 0 ? adObj.category_id : ""
            }),
            subcategory_id: fields.string({
                choices: {},
                widget: widgets.select({ "classes": ["select"] }),
                cssClasses: { "field": ["form-group"] },
                label: "Sub Categories",
                value: Object.keys(adObj).length > 0 ? adObj.subcategory_id : ""
            }),
            subsubcategory_id: fields.string({
                choices: {},
                widget: widgets.select({ "classes": ["select"] }),
                cssClasses: { "field": ["form-group"] },
                label: "Sub Sub Categories",
                value: Object.keys(adObj).length > 0 ? adObj.subsubcategory_id : ""
            }),
        }
        formFields = { ...formFields, ...formFieldsView }
    }

    let formFieldsAd = {
        adult: fields.string({
            choices: { "":"Show this Ad in both Adult and Non-Adult Videos", "1": "Show this Ad in Adult Videos only", "2": "Show this Ad in Non-Adult Videos only" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Adult",
            cssClasses: { "field": ["form-group"] },
            value: Object.keys(adObj).length > 0 ? adObj.adult : ""
        }),
        active: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Ad",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: Object.keys(adObj).length > 0 ? adObj.active : "1"
        })
    }
    formFields = { ...formFields, ...formFieldsAd }

    var reg_form = forms.create(formFields, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            if (form.data.type == 1 && !form.data.link) {
                res.send({ errors: { link: "This is required field." } });
                return
            } else if (form.data.type == 2 && !form.data.link2) {
                res.send({ errors: { link: "This is required field." } });
                return
            }
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            form.data.creation_date = formatted
            form.data.owner_id = req.user.user_id
             if (form.data.type == 2) {
                form.data.link = form.data.link2
                delete form.data.link2
            }
            if(!form.data.adult){
                delete form.data.adult
            }
            form.data["category_id"] = form.data.category_id ? form.data.category_id : 0
            form.data["subcategory_id"] = form.data.subcategory_id ? form.data.subcategory_id : 0
            form.data["subsubcategory_id"] = form.data.subsubcategory_id ? form.data.subsubcategory_id : 0

            delete form.data.link2
            if (!Object.keys(adObj).length) {
                globalModel.create(req, form.data, "advertisements_admin").then(result => {
                    res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/advertisements" })
                })
            }else{
                globalModel.update(req,form.data,"advertisements_admin","ad_id",adObj.ad_id).then(result => {
                    res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/advertisements" })
                })
            }
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/advertisements/create', { query: { category_id: Object.keys(adObj).length > 0 ? adObj.category_id : 0, subcategory_id: Object.keys(adObj).length > 0 ? adObj.subcategory_id : 0, subsubcategory_id: Object.keys(adObj).length > 0 ? adObj.subsubcategory_id : 0 }, categories: categories, nav: url, reg_form: reg_form, title: "Create New Advertisement" });
        }
    });

}

exports.delete = async (req,res,next) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/advertisements";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    await globalModel.delete(req,"advertisements_admin",'ad_id',id).then(result => {
        res.redirect(backURL)
        return
    })
}