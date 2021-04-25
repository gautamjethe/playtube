const forms = require('forms')
const formFunctions = require('../../functions/forms/file');
const settings = require("../../models/settings")
const levels = require("../../models/levels")
const packages = require("../../models/packages")
const pagging = require("../../functions/pagging")
const getSymbolFromCurrency = require('currency-symbol-map')
const globalModel = require("../../models/globalModel")
const recurringPaypal = require("../../functions/recurring-paypal")
const fileManager = require("../../models/fileManager")


exports.delete = async (req,res) => {
    const id = req.params.id
    let existing= {}

    if(id){
        await packages.findById(id,req,res).then(result => {
            existing = result
        }).catch(error => {
            
        });
    }

    globalModel.delete(req,"packages","package_id",id).then(() => {
        res.redirect(process.env.ADMIN_SLUG+"/payments/packages/")
    })
}

exports.payments = async (req,res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    var cssClasses = {
        label :[""],
        field : ["form-group"],
        classes : ["form-control"]
    };
    var currencies = {}
    currencies["USD"] = "United States dollar (USD)"
    currencies["AUD"] = "Australian dollar (AUD)"
    currencies["CAD"] = "Canadian dollar (CAD)"
    currencies["CZK"] = "Czech koruna (CZK)"
    currencies["DKK"] = "Danish krone (DKK)"
    currencies["EUR"] = "Euro (EUR)"
    currencies["HKD"] = "Hong Kong dollar (HKD)"
    currencies["ILS"] = "Israeli new shekel (ILS)"
    currencies["MXN"] = "Mexican peso (MXN)"
    currencies["NZD"] = "New Zealand dollar (NZD)"
    currencies["NOK"] = "Norwegian krone (NOK)"
    currencies["PHP"] = "Philippine peso (PHP)"
    currencies["PLN"] = "Polish złoty (PLN)"
    currencies["GBP"] = "Pound sterling (GBP)"
    currencies["RUB"] = "Russian ruble (RUB)"
    currencies["SGD"] = "Singapore dollar (SGD)"
    currencies["SEK"] = "Swedish krona (SEK)"
    currencies["CHF"] = "Swiss franc (CHF)"
    currencies["THB"] = "Thai baht (THB)"
    currencies['INR'] = "Indian rupee (INR)"

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
        payment_default_currency: fields.string({
            choices: currencies,
           widget: widgets.select({ "classes": ["select"] }),
            label:"Set a Default Currency",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"payment_default_currency",'USD')
        }),
        maintanance_label: fields.string({ 
            widget: widgets.label({content : 'You can change the currency of your website by selecting the above radio button. INR currency is supported as a payment currency and a currency balance for in-country paypal accounts only.' }),
            cssClasses:{"field" : ["form-group","form-description"]},
        }),
        payment_paypal_sanbox: fields.string({
            choices: {"1":"Live","0":"Sandbox"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"PayPal Mode",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:settings.getSetting(req,"payment_paypal_sanbox",'0').toString()
        }),

        paypal_label: fields.string({ 
            widget: formFunctions.makeClickable({content : '[0] to learn how to create below credentials.',replace: [{ 0: '<a href="/Documentation/paypal" target="_blank">Click here</a>' }]}),
            cssClasses:{"field" : ["form-group","form-description"]},
        }),

        payment_client_id: fields.string({
            label:"Paypal Client ID",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:req.loguserallowed ? "****" : settings.getSetting(req,"payment_client_id",'')
        }),
        payment_client_secret: fields.string({
            label:"Paypal Secret Key",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:req.loguserallowed ? "****" : settings.getSetting(req,"payment_client_secret",'')
        }),
        default_notification_image: fields.string({
            label: "Payment Notification Image",
            choices: files,
            required:false,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:settings.getSetting(req,"default_notification_image","").toString()
        }),


    },{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {
            delete form.data["maintanance_label"]
            delete form.data['paypal_label']
            settings.setSettings(req,form.data)
            res.send({success:1,message:"Setting Saved Successfully."})
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            res.send({errors:errors});
        },
        other: function (form) {
            res.render('admin/payments/index',{nav:url,reg_form:reg_form,title:"Settings"});
        }
    });
}

exports.transactions = async (req,res) => {
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
    if (query.transaction_id && parseInt(query.transaction_id) > 0) {
        condition.push(query.transaction_id)
        conditionalWhere += " AND transactions.transaction_id = ?"
    }
    if(query.state){
        if(query.state != "completed"){
            condition.push(query.state)
            conditionalWhere += " AND transactions.state = ?"
        }else{
            conditionalWhere += " AND (transactions.state = 'completed' || transactions.state = 'active' || transactions.state = 'approved')"
        }
    }else{
        conditionalWhere += " AND (transactions.state = 'completed' || transactions.state = 'active' || transactions.state = 'approved')"
    }
    if (query.order_id && parseInt(query.order_id) > 0) {
        condition.push(query.order_id)
        conditionalWhere += " AND transactions.order_id = ?"
    }
    if (query.subscription_id && parseInt(query.subscription_id) > 0) {
        condition.push(query.subscription_id)
        conditionalWhere += " AND transactions.subscription_id = ?"
    }
    if (query.owner_id && parseInt(query.owner_id) > 0) {
        condition.push(query.owner_id)
        conditionalWhere += " AND transactions.owner_id = ?"
    }
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

    let sql = "SELECT COUNT(*) as totalCount FROM transactions INNER JOIN users on users.user_id = transactions.owner_id  INNER JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 AND users.active = '1' AND users.approve = '1' AND transactions.type = 'member_subscription' " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY transactions.transaction_id DESC limit ? offset ?"
        let sqlQuery = "SELECT transactions.*,userdetails.username,userdetails.displayname FROM transactions INNER JOIN users on users.user_id = transactions.owner_id  INNER JOIN userdetails ON users.user_id = userdetails.user_id  WHERE 1 = 1 AND users.active = '1' AND users.approve = '1' AND transactions.type = 'member_subscription' " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }

    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/payments/transactions',{totalCount:totalCount,getSymbolFromCurrency:getSymbolFromCurrency,query:query,paggingData:paggingData,results:results,nav:url,title:"Manage Transactions"});
}

exports.subscriptions = async (req,res) => {
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
    if (query.transaction_id && parseInt(query.transaction_id) > 0) {
        condition.push(query.transaction_id)
        conditionalWhere += " AND subscriptions.subscription_id = ?"
    }
    if(query.status){
        if(query.status != "completed"){
            condition.push(query.status)
            conditionalWhere += " AND subscriptions.status = ?"
        }else{
            conditionalWhere += " AND (subscriptions.status = 'completed' || subscriptions.status = 'active' || subscriptions.status = 'approved')"
        }
    }else{
        conditionalWhere += " AND (subscriptions.status = 'completed' || subscriptions.status = 'active' || subscriptions.status = 'approved')"
    }
    
    if (query.package_id && parseInt(query.package_id) > 0) {
        condition.push(query.package_id)
        conditionalWhere += " AND subscriptions.package_id = ?"
    }
    if (query.level_id && parseInt(query.level_id) > 0) {
        condition.push(query.level_id)
        conditionalWhere += " AND packages.level_id = ?"
    }
    if (query.owner_id && parseInt(query.owner_id) > 0) {
        condition.push(query.owner_id)
        conditionalWhere += " AND subscriptions.owner_id = ?"
    }
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

    let sql = "SELECT COUNT(*) as totalCount FROM subscriptions INNER JOIN packages on packages.package_id = subscriptions.package_id INNER JOIN levels on levels.level_id = packages.level_id INNER JOIN users on users.user_id = subscriptions.owner_id  INNER JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 AND users.active = '1' AND users.approve = '1' AND subscriptions.type = 'member_subscription' " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY subscriptions.subscription_id DESC limit ? offset ?"
        let sqlQuery = "SELECT subscriptions.*,userdetails.username,userdetails.displayname,levels.title as levelTitle,levels.level_id as levelID,packages.title as packageTitle,packages.package_id as packageId FROM subscriptions INNER JOIN packages on packages.package_id = subscriptions.package_id INNER JOIN levels on levels.level_id = packages.level_id INNER JOIN users on users.user_id = subscriptions.owner_id  INNER JOIN userdetails ON users.user_id = userdetails.user_id  WHERE 1 = 1 AND users.active = '1' AND users.approve = '1' AND subscriptions.type = 'member_subscription' " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }

    let memberLevels = []
    await  levels.findAll(req,{typeNotIn:"'admin','moderator','public'"}).then(result => {
         if(result)
            memberLevels = result
    })

    let packagesData = []
    await packages.findAll(req,{column:"packages.*",enabled:1}).then(result => {   
        if(result)
            packagesData = result
    })

    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '')
    res.render('admin/payments/subscriptions',{packagesData:packagesData,memberLevels:memberLevels,totalCount:totalCount,getSymbolFromCurrency:getSymbolFromCurrency,query:query,paggingData:paggingData,results:results,nav:url,title:"Manage Subscriptions"});
}
exports.createEdit = async(req,res) => {
    const package_id = req.params.id
    let existingPackage = {}
    //if exists means req from edit page

    let memberLevels = {}
    memberLevels[0] = ""
    await  levels.findAll(req,{typeNotIn:"'admin','moderator','public'"}).then(result => {
         if(result){
             result.forEach(res => {
                 memberLevels[res.level_id] = res.title
             });
         }
    })
    
    if(package_id){
        await packages.findById(package_id,req,res).then(result => {
            existingPackage = result
        }).catch(error => {
            
        });
    }
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    const cssClasses = {
        label :[""],
        field : ["form-group"],
        classes : ["form-control"]
    };
    let disabled = package_id ? true : false
    var reg_form = forms.create({
        title: fields.string({
            label:"Package Title",
            required:true,
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:existingPackage.title
        }),
        description: fields.string({
            label:"Description",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.textarea({"classes":["form-control"]}),
            value:existingPackage.description
        }),
        level_id: fields.string({
            label: "Member Role",
            choices: memberLevels,
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:existingPackage.level_id
        }),
        
        downgrade_level_id: fields.string({
            label: "Downgrade Member Role",
            required:true,
            choices: memberLevels,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:existingPackage.downgrade_level_id
        }),
        downgrade_label: fields.string({ 
            widget: widgets.label({content : 'When plan expires, member will be move into this role.' }),
            cssClasses:{"field" : ["form-group","form-description"]},
        }),
        price: fields.string({
            label:"Plan Charges",
            validators:[validators.integer('Enter integer value only.')],
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:existingPackage.price
        }),
       
        // is_recurring: fields.string({
        //     choices: {"1":"Yes",'0':"No"},
        //    widget: widgets.select({ "classes": ["select"] }),
        //     label:"Recurring Plan",
        //     fieldsetClasses:"form_fieldset",
        //     cssClasses: {"field" : ["form-group"]},
        //     value:Object.keys(existingPackage).length > 0 ?  existingPackage.is_recurring.toString() : "0"
        // }),
        
        interval: fields.string({
            label:"Billing Cycle",
            validators:[validators.integer('Enter integer value only.')],
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"],'disabled':disabled}),
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.interval : "0"
        }),

        type: fields.string({
            choices: {'day':'Day','week':'Week',"month":"Month",'year':"Year",'forever':'One Time'},
            widget: widgets.select({"classes":["select_1"],'disabled':disabled}),
            label:"Frequency",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"],label:['select_1']},
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.type : "forever"
        }),
        type_label: fields.string({ 
            widget: widgets.label({content : ''}),
            cssClasses:{"field" : ["form-group","form-description","type_label"]},
        }),

        duration: fields.string({
            label:"Package Duration",
            validators:[validators.integer('Enter integer value only.')],
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"],'disabled':disabled}),
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.duration : "0"
        }),

        duration_type: fields.string({
            choices: {'day':'Day','week':'Week',"month":"Month",'year':"Year",'forever':'Forever'},
            widget: widgets.select({"classes":["select_1"],'disabled':disabled}),
            label:"Frequency",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.duration_type : "forever"
        }),
        duration_type_label: fields.string({ 
            widget: widgets.label({content : ''}),
            cssClasses:{"field" : ["form-group","form-description","type_label"]},
        }),

        setup_fee: fields.string({
            label:"Setup Fees",
            validators:[validators.integer('Enter integer value only.')],
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.setup_fee : ""
        }),
        setup_fee_label: fields.string({ 
            widget: widgets.label({content : 'So you want to charge one time setup fees.NOTE: Setup fee work for paid plans only.'}),
            cssClasses:{"field" : ["form-group","form-description","type_label"]},
        }),
        
       

        email_notification: fields.string({
            choices: {"1":"Yes",'0':"No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Want to Enable Email Reminder?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.email_notification.toString() : "1"
        }),
        site_notification: fields.string({
            choices: {"1":"Yes",'0':"No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Want to Enable Site Notification Reminder?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.site_notification.toString() : "1"
        }),

        alert_number: fields.string({
            label:"Reminders for Emails & Notifications",
            validators:[validators.integer('Enter integer value only.')],
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.alert_number : "0"
        }),

        alert_type: fields.string({
            choices: {'minutes':'Minutes','days':'Days','weeks':'Weeks',"months":"Months"},
            widget: widgets.select({"classes":["select_1"]}),
            label:"",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.alert_type : "days"
        }),
        alert_type_label: fields.string({ 
            widget: widgets.label({content : ''}),
            cssClasses:{"field" : ["form-group","form-description","type_label"]},
        }),       
        enabled: fields.string({
            choices: {"1":"Yes",'0':"No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Want to Enable Plan?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.enabled.toString() : "1"
        }),
        default: fields.string({
            choices: {"1":"Yes",'0':"No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Default Plan?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:Object.keys(existingPackage).length > 0 ?  existingPackage.default.toString() : "1"
        }),
        default_label: fields.string({ 
            widget: widgets.label({content : 'This will change the current default plan. Only free plan will be the default plan. '}),
            cssClasses:{"field" : ["form-group","form-description","default_label"]},
        }),
    },{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {
            if(form.data.default.toString() == "1" && form.data.price > 0){
                res.send({errors:{"default_1" : "Only free account will become default plan."}});
                return
            }
            delete form.data["setup_fee_label"]
            delete form.data["ad_create_limit_label"]
            delete form.data["channel_create_limit_label"]
            delete form.data["video_create_limit_label"]
            delete form.data["playlist_create_limit_label"]
            delete form.data["blog_create_limit_label"]
            delete form.data['duration_type_label']
            delete form.data["default_label"]
            delete form.data["type_label"]
            delete form.data["downgrade_label"]
            delete form.data["level_label"]
            delete form.data["price_label"]
            delete form.data['channel_create_limit_label']
            delete form.data['alert_type_label']
            if(parseInt(form.data.interval) <= 0 || form.data.type == 'forever'){
                form.data.is_recurring = 0
            }else{
                form.data.is_recurring = 1
            }
            if(!parseFloat(form.data.price)){
                form.data.setup_fee = 0
                form.data.price = 0
            }
            if(!parseFloat(form.data.setup_fee))
                form.data.setup_fee = 0

            if(!package_id)
                globalModel.create(req,form.data,'packages')
            else
                globalModel.update(req,form.data,'packages','package_id',package_id)

            res.send({success:1,message:"Operation performed successfully.",url:process.env.ADMIN_SLUG+"/payments/packages"})
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            res.send({errors:errors});
        },
        other: function (form) {
            res.render('admin/payments/create',{nav:url,reg_form:reg_form,title:(!package_id ? "Add" : "Edit")+" Package"});
        }
    });
}
exports.packages = async (req,res) => {
    let memberLevels = []
    await  levels.findAll(req,req.query).then(result => {
         memberLevels = result;
    })
    let LimitNum = 10;
    let page = 1
    if(req.params.page == ''){
         page = 1;
    }else{
        //parse int Convert String to number 
         page = parseInt(req.params.page) ? parseInt(req.params.page) : 1;
    }

    const query = {...req.query}
    query['column'] = "COUNT(*) as totalCount"
    
    let results = []
    let totalCount = 0

    await packages.findAll(req,query).then(result => {        
        totalCount = result[0].totalCount
    })

    if(totalCount > 0){
        query['column'] = "COUNT(subscriptions.subscription_id) as activeMembers,packages.*"
        query['limit'] = LimitNum
        query['offset'] = (page - 1)*LimitNum
        query['groupBy'] = "GROUP by subscriptions.package_id,packages.package_id";
        query['leftJoin'] = 'LEFT JOIN subscriptions ON (subscriptions.package_id = packages.package_id AND status = "completed")'
        await packages.findAll(req,query).then(result => {
            results = result
        })
    }

    const defaultCurrency = getSymbolFromCurrency(req.appSettings.payment_default_currency)
    const paggingData = pagging.create(req,totalCount,page,'',LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    res.render('admin/payments/packages',{recurringPaypal:recurringPaypal,req:req,totalCount:totalCount,defaultCurrency:defaultCurrency,query:query,nav:url,results:results,title:"Manage Packages",memberLevels:memberLevels,paggingData:paggingData});    
}

