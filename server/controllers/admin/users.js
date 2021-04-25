const forms = require('forms')
const formFunctions = require('../../functions/forms/file');
const settings = require("../../models/settings")
const levels = require("../../models/levels")
const globalModel = require("../../models/globalModel")
const fileManager = require("../../models/fileManager")
const permission = require("../../models/levelPermissions")
const pagging = require("../../functions/pagging")
const userModel = require("../../models/users")
const notifications = require("../../models/notifications")
const commonFunction = require("../../functions/commonFunctions")
const getSymbolFromCurrency = require('currency-symbol-map')
const timezones = require("../../../utils/timezone");
const md5 = require("md5");
const emailFunction = require("../../functions/emails")
const languageModel = require("../../models/languages")
const  dateTime = require('node-datetime')
const { validationResult } = require('express-validator')
const fieldErrors = require('../../functions/error')
const bcrypt = require('bcryptjs')

exports.edit = async(req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors) }).end();
    }
    let data = {}
    let userData = {}
    if (req.body.username) {
        data.username = req.body.username
    }
    if (req.body.email) {
        userData.email = req.body.email
    }
    if (req.body.level_id) {
        userData.level_id = req.body.level_id
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
    }
    data.displayname = userTitle['first_name']+" "+userTitle['last_name']
    if (req.body.wallet) {
        userData.wallet = parseFloat(req.body.wallet).toFixed(2);
    }
    if (req.body.balance) {
        userData.balance = parseFloat(req.body.balance).toFixed(2);
    }
    if(req.body.password){
        await exports.password(req).then(password => {
            userData['password'] = password
        })
    }
    if(Object.keys(userData).length){
        await globalModel.update(req, userData, "users", 'user_id', req.item.user_id).then(result => {
            
        });
    }
    await globalModel.update(req, data, "userdetails", 'user_id', req.item.user_id).then(result => {
        
    });
    return res.send("1").end();
}
exports.password = async(req) => {
    return new Promise( (resolve, reject) => {
        bcrypt
        .hash(req.body.password, 12)
        .then(async hashedPassword => {
            resolve(hashedPassword);
        });
    });
}

exports.invite = async(req,res) => {

    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    var fields = forms.fields;
    var widgets = forms.widgets;


    var reg_form = forms.create({
        recipients: fields.string({
            widget: widgets.textarea({"classes": ["form-control"]}),
            label: "Recipients",
            required:true,
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: ""
        }),
        label_res: fields.string({
            widget: widgets.label({ content: 'Comma-separated email ids.' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        message: fields.string({
            widget: widgets.textarea({"classes": ["form-control"]  }),
            label: "Custom Message",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: "You are being invited to join our website."
        })
        
    }, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: async function (form) { 
            let recipients = form.data.recipients;
            let message = form.data.message;

            let split = recipients.split(",");
            let defaultLanguage = {}
            //get default language
            await languageModel.defaultLanguage(req).then(result => {
                if(result){
                    defaultLanguage = result
                }
            })
            //check email in database
            var existingEmails = []
            await globalModel.custom(req,"SELECT email from users where email IN (?)",[split]).then(result => {
                if(result && result.length){
                    let emails = JSON.parse(JSON.stringify(result));
                    emails.forEach(obj => {
                        existingEmails.push(obj.email);
                    })
                } 
            })
            
            //defaultLanguage

            let newRecipients = split
            //get diff emails
            if(existingEmails.length > 0){
                await exports.arrayDiff(split,existingEmails).then(result => {
                    newRecipients = result
                })
            }
            await asyncForEach(newRecipients, async (email, i) => {
                let emailUser = newRecipients[i];
                //geneare random code
                await exports.randomCode(emailUser,req).then(async code =>  {
                    //send email and store values in db

                    await globalModel.custom(req, "SELECT vars,type FROM emailtemplates WHERE type = ?", ["member_invite"]).then(async resultsType => {
                        if (resultsType) {
                            const typeData = JSON.parse(JSON.stringify(resultsType))[0];
                            let result = {}
                            result.vars = typeData.vars
                            result.type = "member_invite"

                            result['signuplink'] = {}
                            result['signuplink']["title"] = "<a href='"+process.env.PUBLIC_URL+"/signup/invite/"+code+"'>"+process.env.PUBLIC_URL+"/signup/invite/"+code+"</a>"
                            result['signuplink']['type'] = "text"

                            result['message'] = {}
                            result['message']["title"] = req.body.message ? req.body.message : "You are being invited to join our website."
                            result['message']['type'] = "text"


                            result.ownerEmail = {language:Object.keys(defaultLanguage).length ? defaultLanguage.code : "en"}
                           // result.toName = req.appSettings["contact_from_name"]
                            result.toEmail = emailUser
                            result.disableFooter = true
                            result.disableHeader = true

                            await globalModel.create(req,{code:code,creation_date:dateTime.create().format('Y-m-d H:M:S'),recipient:emailUser,user_id:req.user.user_id,new_user_id:0},'invites')
                            emailFunction.sendMessage(req, result)
                        }
                    })
                    

                })
 
            });

            res.send({ success: 1, message: "Invite Send Successfully."});
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/users/invite', { nav: url, reg_form: reg_form, title: "Invite Users" });
        }
    });
}

exports.randomCode = async(email,req) => {
    return new Promise(async function(resolve, reject) {
        let valid = false;
        do {
            let randomNumber = Math.floor(100000 + Math.random() * 900000)
            let code = md5(email+randomNumber);
            code = code.substr(1,7);
            await globalModel.custom(req,"SELECT * from invites WHERE code = ?",[code]).then(result => {
                if(result && result.length){
                    valid = false
                }else{
                    valid = true
                }
            })
            if(valid){
                resolve(code)
            }
        }while(!valid)
    });
}
exports.arrayDiff = async(a1,a2) => {
    return new Promise(function(resolve, reject) {
    var a = [], diff = [];
    
        for (var i = 0; i < a1.length; i++) {
            a[a1[i]] = true;
        }
    
        for (var i = 0; i < a2.length; i++) {
            if (a[a2[i]]) {
                delete a[a2[i]];
            } else {
                a[a2[i]] = true;
            }
        }
    
        for (var k in a) {
            diff.push(k);
        }
    
        resolve(diff)

    })

}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
exports.withdraws = async(req,res) => {
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
    if (query.paypal_email) {
        condition.push(query.paypal_email.toLowerCase())
        conditionalWhere += " AND LOWER(video_monetizations_withdrawals.email) LIKE CONCAT('%', ?,  '%')"
    }

    if (query.email) {
        condition.push(query.email.toLowerCase())
        conditionalWhere += " AND LOWER(users.email) LIKE CONCAT('%', ?,  '%')"
    }
    if (typeof query.status != "undefined") {
        condition.push(query.status)
        conditionalWhere += " AND video_monetizations_withdrawals.status = ?"
    }
    conditionalWhere += " AND users.user_id IS NOT NULL"

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM video_monetizations_withdrawals LEFT JOIN users on video_monetizations_withdrawals.owner_id = users.user_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 " + conditionalWhere

    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY video_monetizations_withdrawals.withdraw_id DESC limit ? offset ?"
        let sqlQuery = "SELECT video_monetizations_withdrawals.*,userdetails.username,userdetails.displayname FROM video_monetizations_withdrawals LEFT JOIN users on video_monetizations_withdrawals.owner_id = users.user_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    const defaultCurrency = getSymbolFromCurrency(req.appSettings.payment_default_currency)
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/users/withdraw', {defaultCurrency:defaultCurrency, totalCount: totalCount, query: query, nav: url, results: results, title: "Manage User Withdraw Requests", paggingData: paggingData });

}

exports.withdrawsApprove = async(req,res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/users/withdraw";
    if (!id || !req.user || req.user.level_id != 1) {
        res.redirect(backURL)
        return
    }

    let userData = {}
    //update balance
    await globalModel.custom(req, "SELECT video_monetizations_withdrawals.*,users.balance from video_monetizations_withdrawals LEFT JOIN users ON users.user_id = video_monetizations_withdrawals.owner_id where video_monetizations_withdrawals.withdraw_id = ?", id).then(async result => {
        if (result && result.length) {
            userData = result[0]
        }
    })

    if(!Object.keys(userData).length || parseFloat(userData.balance) < parseFloat(userData.amount)){
        res.redirect(backURL)
        return
    }
    //update values in monetization table
    await globalModel.custom(req,"UPDATE users SET `balance` = balance - ? WHERE user_id = ?",[userData.amount,userData.owner_id]).then(result => {
    })
    await globalModel.custom(req,"UPDATE video_monetizations_withdrawals SET `status` = 1 WHERE withdraw_id = ?",[id]).then(result => {
        res.redirect(backURL)
        return
    })
}
exports.withdrawsReject = async(req,res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/users/withdraw";
    if (!id || !req.user || req.user.level_id != 1) {
        res.redirect(backURL)
        return
    }
    await globalModel.custom(req,"UPDATE video_monetizations_withdrawals SET `status` = 2 WHERE withdraw_id = ?",[id]).then(result => {
        res.redirect(backURL)
        return
    })
}
exports.withdrawsDelete = async(req,res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/users/withdraw";
    if (!id || !req.user || req.user.level_id != 1) {
        res.redirect(backURL)
        return
    }
    await globalModel.custom(req,"DELETE FROM video_monetizations_withdrawals WHERE withdraw_id = ?",[id]).then(result => {
        res.redirect(backURL)
        return
    })
}

exports.index = async (req, res) => {
    let memberLevels = []
    await levels.findAll(req, req.query).then(result => {
        memberLevels = result;
    })
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
    if (query.displayname) {
        condition.push(query.displayname.toLowerCase())
        conditionalWhere += " AND LOWER(displayname) LIKE CONCAT('%', ?,  '%')"
    }
    if (query.username) {
        condition.push(query.username.toLowerCase())
        conditionalWhere += " AND LOWER(username) LIKE CONCAT('%', ?,  '%')"
    }
    if (query.email) {
        condition.push(query.email.toLowerCase())
        conditionalWhere += " AND LOWER(email) LIKE CONCAT('%', ?,  '%')"
    }
    if (query.level_id) {
        condition.push(query.level_id)
        conditionalWhere += " AND users.level_id = ?"
    }
    if (typeof query.approve != "undefined" && query.approve.length) {
        condition.push(query.approve)
        conditionalWhere += " AND approve = ?"
    }

    if (typeof query.featured != "undefined" && query.featured.length) {
        condition.push(query.featured)
        conditionalWhere += " AND is_featured = ?"
    }
    if (typeof query.popular != "undefined" && query.popular.length) {
        condition.push(query.popular)
        conditionalWhere += " AND is_popular = ?"
    }
    if (typeof query.sponsored != "undefined" && query.sponsored.length) {
        condition.push(query.sponsored)
        conditionalWhere += " AND is_sponsored = ?"
    }
    if (typeof query.hot != "undefined" && query.hot.length) {
        condition.push(query.hot)
        conditionalWhere += " AND is_hot = ?"
    }

    if (typeof query.active != "undefined" && query.active.length) {
        condition.push(query.active)
        conditionalWhere += " AND active = ?"
    }
    if (typeof query.verified != "undefined" && query.verified.length) {
        condition.push(query.verified)
        conditionalWhere += " AND verified = ?"
    }

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM users LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 " + conditionalWhere

    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY users.user_id DESC limit ? offset ?"
        let sqlQuery = "SELECT *,levels.title as memberlevel FROM users LEFT JOIN userdetails ON  userdetails.user_id = users.user_id LEFT JOIN levels on levels.level_id = users.level_id WHERE 1 = 1 " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    const defaultCurrency = getSymbolFromCurrency(req.appSettings.payment_default_currency)
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/users/index', {defaultCurrency:defaultCurrency, loggedin_id: (req.user ? req.user.user_id : ""), loggedinLevel_id: (req.user ? req.user.level_id : ""), totalCount: totalCount, query: query, nav: url, results: results, title: "Manage Users", memberLevels: memberLevels, paggingData: paggingData });
}
exports.verified = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user || req.user.level_id != 1) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from users LEFT JOIN userdetails ON users.user_id = userdetails.user_id where users.user_id = ?", id).then(async result => {
        if (result && result.length) {
            let user = result[0]
            await globalModel.update(req, { verified: !user.verified }, "userdetails", "user_id", id).then(result => {
                if (user.user_id != req.user.user_id && !user.verified) {
                    notifications.insert(req, { owner_id: user.user_id, type: "members_verified", subject_type: "users", subject_id: user.user_id, object_type: "members", object_id: user.user_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }


                res.send({ status: !user.verified })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.featured = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user || req.user.level_id != 1) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from users LEFT JOIN userdetails ON users.user_id = userdetails.user_id where users.user_id = ?", id).then(async result => {
        if (result && result.length) {
            let user = result[0]
            await globalModel.update(req, { is_featured: !user.is_featured }, "userdetails", "user_id", id).then(result => {
                if (user.user_id != req.user.user_id && !user.is_featured) {
                    notifications.insert(req, { owner_id: user.user_id, type: "members_featured", subject_type: "users", subject_id: user.user_id, object_type: "members", object_id: user.user_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({ status: !user.is_featured })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.sponsored = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user || req.user.level_id != 1) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from users LEFT JOIN userdetails ON users.user_id = userdetails.user_id where users.user_id = ?", id).then(async result => {
        if (result && result.length) {
            let user = result[0]
            await globalModel.update(req, { is_sponsored: !user.is_sponsored }, "userdetails", "user_id", id).then(result => {
                if (user.user_id != req.user.user_id && !user.is_sponsored) {
                    notifications.insert(req, { owner_id: user.user_id, type: "members_sponsored", subject_type: "users", subject_id: user.user_id, object_type: "members", object_id: user.user_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({ status: !user.is_sponsored })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.hot = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user || req.user.level_id != 1) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from users LEFT JOIN userdetails ON users.user_id = userdetails.user_id where users.user_id = ?", id).then(async result => {
        if (result && result.length) {
            let user = result[0]
            await globalModel.update(req, { is_hot: !user.is_hot }, "userdetails", "user_id", id).then(result => {
                if (user.user_id != req.user.user_id && !user.is_hot) {
                    notifications.insert(req, { owner_id: user.user_id, type: "members_hot", subject_type: "users", subject_id: user.user_id, object_type: "members", object_id: user.user_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({ status: !user.is_hot })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.popular = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user || req.user.level_id != 1) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from users LEFT JOIN userdetails ON users.user_id = userdetails.user_id where users.user_id = ?", id).then(async result => {
        if (result && result.length) {
            let user = result[0]
            await globalModel.update(req, { is_popular: !user.is_popular }, "userdetails", "user_id", id).then(result => {
                
                res.send({ status: !user.is_popular })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.approve = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user || req.user.level_id != 1) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from users LEFT JOIN userdetails ON users.user_id = userdetails.user_id where users.user_id = ?", id).then(async result => {
        if (result && result.length) {
            let user = result[0]
            await globalModel.update(req, { approve: !user.approve }, "users", "user_id", id).then(result => {
                if (user.user_id != req.user.user_id && !user.approve) {
                    notifications.insert(req, { owner_id: user.user_id, type: "members_admin_approved", subject_type: "users", subject_id: user.user_id, object_type: "members", object_id: user.user_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                } else if (user.user_id != req.user.user_id && user.approve) {
                    notifications.insert(req, { owner_id: user.user_id, type: "members_admin_disapproved", subject_type: "users", subject_id: user.user_id, object_type: "members", object_id: user.user_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({ status: !user.approve })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.active = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user || req.user.level_id != 1) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from users LEFT JOIN userdetails ON users.user_id = userdetails.user_id where users.user_id = ?", id).then(async result => {
        if (result && result.length) {
            let user = result[0]
            await globalModel.update(req, { active:!user.active }, "users", "user_id", id).then(result => {
                if (user.user_id != req.user.user_id && !user.approve) {
                    // notifications.insert(req, { owner_id: user.user_id, type: "members_admin_active", subject_type: "users", subject_id: user.user_id, object_type: "members", object_id: user.user_id, insert: true }).then(result => {

                    // }).catch(err => {

                    // })
                } else if (user.user_id != req.user.user_id && user.approve) {
                    // notifications.insert(req, { owner_id: user.user_id, type: "members_admin_disactive", subject_type: "users", subject_id: user.user_id, object_type: "members", object_id: user.user_id, insert: true }).then(result => {

                    // }).catch(err => {

                    // })
                }
                res.send({ status: !user.active })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.delete = async (req, res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/users";
    if (!id || !req.user || req.user.level_id != 1) {
        res.redirect(backURL)
        return
    }
    await userModel.delete(req, id).then(result => {
        res.redirect(backURL)
        return
    })
}
exports.login = async (req, res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/users";
    if (!id || !req.user || req.user.level_id != 1) {
        res.redirect(backURL)
        return
    }
    await globalModel.custom(req, "select * from users where user_id = ?", [id]).then(result => {
        if (result && result.length) {
            const user = result[0]
            if (user.active && user.approve) {
                req.session.user = id
                res.redirect("/")
            } else {
                res.redirect(backURL)
            }
        } else {
            res.redirect(backURL)
        }
    })
}
exports.settings = async (req, res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    var fields = forms.fields;
    var widgets = forms.widgets;

    let timezone = {}

    timezones.timezones.forEach(item => {
        timezone[item.value] = item.label
    })
    let memberLevels = {}
    memberLevels[0] = ""
    await  levels.findAll(req,{typeNotIn:"'admin','moderator','public'"}).then(result => {
         if(result){
             result.forEach(res => {
                 memberLevels[res.level_id] = res.title
             });
         }
    })
    var reg_form = forms.create({
        member_registeration: fields.string({
            choices: { 1: 'Enabled', 0: 'Disabled',2:"Invite only" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "User Registration",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_registeration", "1")
        }),
        invite_member_lid: fields.string({
            choices: memberLevels,
            widget: widgets.select({ "classes": ["select"] }),
            label: "Assign this member level to invited user.",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "invite_member_lid", "")
        }),
        member_verification: fields.string({
            choices: { 1: 'Enabled', 0: 'Disabled' },
            widget: widgets.select({ "classes": ["select"] }),
            label: "User Verification",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_verification", "1")
        }),
        user_follow: fields.string({
            choices: { 1: 'Enabled', 0: 'Disabled' },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable User Follow Functionaity",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "user_follow", "1")
        }),
        member_email_verification: fields.string({
            choices: { 1: 'Enabled', 0: 'Disabled' },
            widget: widgets.select({ "classes": ["select"] }),
            label: "User E-mail Verification",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_email_verification", "0")
        }),
        member_delete_account: fields.string({
            choices: { 1: 'Enabled', 0: 'Disabled' },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Delete User Account",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_delete_account", "1")
        }),
        member_rating: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Rating feature on members",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_rating", '1').toString()
        }),
        member_like: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Like feature on members",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_like", '1').toString()
        }),
        member_dislike: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Dislike feature on members",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_dislike", '1').toString()
        }),
        member_favourite: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Favourite feature on members",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_favourite", '1').toString()
        }),
        member_comment: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Comment feature on members",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_comment", '1').toString()
        }),

        member_comment_like: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Like feature on members comment",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_comment_like", '1').toString()
        }),
        member_default_timezone: fields.string({
            choices: timezone,
            widget: widgets.select({ "classes": ["select"] }),
            label: "Default User Timezone",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_default_timezone", 'America/Los_Angeles').toString()
        }),

        member_comment_dislike: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Dislike feature on members comment",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_comment_dislike", '1').toString()
        }),

        member_featured: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Featured label on members",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_featured", '1').toString()
        }),

        member_sponsored: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Sponsored label on members",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_sponsored", '1').toString()
        }),

        member_hot: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Hot label on members",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "member_hot", '1').toString()
        }),
    }, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            settings.setSettings(req, form.data)
            res.send({ success: 1, message: "Setting Saved Successfully." })
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/users/settings', { nav: url, reg_form: reg_form, title: "Users Settings" });
        }
    });
}
exports.verification = async (req, res, next) => {

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
    if (query.displayname) {
        condition.push(query.displayname.toLowerCase())
        conditionalWhere += " AND LOWER(displayname) LIKE CONCAT('%', ?,  '%')"
    }

    if (query.email) {
        condition.push(query.email.toLowerCase())
        conditionalWhere += " AND LOWER(email) LIKE CONCAT('%', ?,  '%')"
    }

    conditionalWhere += " AND users.user_id IS NOT NULL"

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM verification_requests LEFT JOIN users on verification_requests.owner_id = users.user_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 " + conditionalWhere

    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY verification_requests.request_id DESC limit ? offset ?"
        let sqlQuery = "SELECT verification_requests.*,userdetails.username,userdetails.displayname,users.email FROM verification_requests LEFT JOIN users on verification_requests.owner_id = users.user_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/users/verifications', { totalCount: totalCount, query: query, nav: url, results: results, title: "Manage User Verification Requests", paggingData: paggingData });

}
exports.approveVerification = async (req, res, next) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/users/verification";
    if (!id || !req.user || req.user.level_id != 1) {
        res.redirect(backURL)
        return
    }
    await globalModel.custom(req, "SELECT * FROM verification_requests WHERE request_id = ?", [id]).then(async results => {
        let result = JSON.parse(JSON.stringify(results))[0];
        if (Object.keys(result).length) {
            await globalModel.update(req, { verified: 1 }, "userdetails", "user_id", result.owner_id).then(async results => {
                if (results) {
                    await globalModel.custom(req, "DELETE FROM verification_requests WHERE request_id = ?", [id]).then(results => {
                        commonFunction.deleteImage(req,res,result.media)
                        notifications.insert(req, { owner_id: result.owner_id, type: "members_verified", subject_type: "users", subject_id: result.owner_id, object_type: "members", object_id: result.owner_id, insert: true }).then(result => {

                        }).catch(err => {
        
                        })
                        res.redirect(backURL)
                    })
                } else {
                    res.redirect(backURL)
                }
            })
        } else {
            res.redirect(backURL)
        }
    })
}
exports.deleteVerification = async (req, res, next) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/users/verification";
    if (!id || !req.user || req.user.level_id != 1) {
        res.redirect(backURL)
        return
    }
    await globalModel.custom(req, "SELECT * FROM verification_requests WHERE request_id = ?", [id]).then(async results => {
        let result = JSON.parse(JSON.stringify(results))[0];
        if (Object.keys(result).length) {
            await globalModel.custom(req, "DELETE FROM verification_requests WHERE request_id = ?", [id]).then(results => {
                commonFunction.deleteImage(req,res,result.media)
                notifications.insert(req, { owner_id: result.owner_id, type: "members_reject_verified", subject_type: "users", subject_id: result.owner_id, object_type: "members", object_id: result.owner_id, insert: true }).then(result => {

                }).catch(err => {

                })

                res.redirect(backURL)
            })
        } else {
            res.redirect(backURL)
        }
    })
}


exports.monetization = async (req, res, next) => {

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
    if (query.displayname) {
        condition.push(query.displayname.toLowerCase())
        conditionalWhere += " AND LOWER(displayname) LIKE CONCAT('%', ?,  '%')"
    }

    if (query.email) {
        condition.push(query.email.toLowerCase())
        conditionalWhere += " AND LOWER(email) LIKE CONCAT('%', ?,  '%')"
    }

    conditionalWhere += " AND users.user_id IS NOT NULL"

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount from users LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE monetization_request = 1 " + conditionalWhere

    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })
    
    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY modified_date ASC limit ? offset ?"
        let sqlQuery = "SELECT users.*,userdetails.username,userdetails.displayname FROM users LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE monetization_request = 1  " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/users/monetizations', { totalCount: totalCount, query: query, nav: url, results: results, title: "Manage User Monetization Requests", paggingData: paggingData });

}
exports.approveMonetization = async (req, res, next) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/users/monetization";
    if (!id || !req.user || req.user.level_id != 1) {
        res.redirect(backURL)
        return
    }
    await globalModel.custom(req, "SELECT * FROM users WHERE user_id = ?", [id]).then(async results => {
        let result = JSON.parse(JSON.stringify(results))[0];
        if (Object.keys(result).length) {
            await globalModel.update(req, { monetization_request: 0,monetization:1 }, "users", "user_id", result.user_id).then(async results => {
                if (results) {
                    // notifications.insert(req, { owner_id: result.owner_id, type: "members_monetization_request_approve", subject_type: "users", subject_id: result.owner_id, object_type: "members", object_id: result.owner_id, insert: true }).then(result => {
                    // }).catch(err => {
                    // })
                    res.redirect(backURL)
                } else {
                    res.redirect(backURL)
                }
            })
        } else {
            res.redirect(backURL)
        }
    })
}
exports.deleteMonetization = async (req, res, next) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/users/monetization";
    if (!id || !req.user || req.user.level_id != 1) {
        res.redirect(backURL)
        return
    }
    await globalModel.custom(req, "SELECT * FROM users WHERE user_id = ?", [id]).then(async results => {
        let result = JSON.parse(JSON.stringify(results))[0];
        if (Object.keys(result).length) {
            await globalModel.update(req, { monetization_request: 0,monetization:0 }, "users", "user_id", result.user_id).then(async results => {
                if (results) {
                    // notifications.insert(req, { owner_id: result.owner_id, type: "members_monetization_request_reject", subject_type: "users", subject_id: result.owner_id, object_type: "members", object_id: result.owner_id, insert: true }).then(result => {
                    // }).catch(err => {
                    // })
                    res.redirect(backURL)
                }
            });
        } else {
            res.redirect(backURL)
        }
    })
}



exports.levels = async (req, res) => {

    const query = { ...req.query }
    query['column'] = "COUNT(*) as totalCount"

    let results = []
    let totalCount = 0

    await levels.findAll(req, query).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        query['column'] = "levels.*,COUNT(users.user_id) as totalMembers"
        query['leftJoin'] = " LEFT JOIN users ON users.level_id = levels.level_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id"
        query['groupBy'] = " GROUP BY users.level_id,levels.level_id"
        await levels.findAll(req, query).then(result => {
            results = result
        })
    }

    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/users/levels', { totalCount: totalCount, nav: url, results: results, title: "Manage Levels" });
}
exports.editLevel = async (req, res) => {
    const level_id = req.params.level_id
    const cacheContent = await permission.getKeyValue(req, level_id)
    let title = ""
    let description = ""
    let memberLevels = {}
    let flag = ""
    let type = "user"
    await levels.findAll(req, req.query).then(result => {
        if (result) {
            result.forEach(res => {
                if (res.level_id == level_id) {
                    title = res.title
                    description = res.description
                    flag = res.flag
                    type = res.type
                }
                memberLevels[res.level_id] = res.title
            });
        }
    })

    //get uploaded file by admin
    const files = { "": "" }

    await fileManager.findAll(req, { "column": "path", "like": "image" }).then(result => {
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
    const cssClasses = {
        label: [""],
        field: ["form-group"],
        classes: ["form-control"]
    };

    const deleteOptions = {}
    const editOptions = {}
    const editAdsOptions = {}
    const deleteAdsOptions = {}
    if (type == "admin" || type == "moderator") {
        deleteOptions["2"] = "Yes, allow to delete other users."
        editOptions["2"] = "Yes, allow to edit everyones profiles."
        editAdsOptions["2"] = "Yes, allow to edit everyones ads."
        deleteAdsOptions["2"] = "Yes, allow to delete other users ads."
    }
    deleteOptions["1"] = "Yes, allow members to delete their account."
    deleteOptions["0"] = "No, do not allow account deletion."

    deleteAdsOptions["1"] = "Yes, allow to delete their own ads."
    deleteAdsOptions["0"] = "No, do not allow ads deletion."

    editOptions["1"] = "Yes, allow to edit own profile."
    editOptions["0"] = "No, do not edit profile."

    editAdsOptions["1"] = "Yes, allow to edit own ads."
    editAdsOptions["0"] = "No, do not edit ads."

    let formFields = {
        level_id: fields.string({
            label: "Member Role",
            choices: memberLevels,
            required: true,
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            value: level_id
        }),
        title: fields.string({
            label: "Member Role Name",
            required: true,
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: title
        }),
        description: fields.string({
            label: "Member Role Description",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.textarea({ "classes": ["form-control"] }),
            value: description
        }),
    }
    if (flag != "public") {
        let formFields1 = {
            edit: fields.string({
                choices: editOptions,
                widget: widgets.select({ "classes": ["select"] }),
                label: "Allow member to edit profile?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.edit"] ? cacheContent["member.edit"].toString() : 1
            }),
            delete: fields.string({
                label: "Allow Account Deletion?",
                required: true,
                choices: deleteOptions,
                widget: widgets.select({ "classes": ["select"] }),
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.delete"] ? cacheContent["member.delete"].toString() : 1
            }),
            username: fields.string({
                label: "Allow username changes?",
                required: true,
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.username"] ? cacheContent["member.username"].toString() : "1"
            }),
            
            ads: fields.string({
                choices: {"1":"Yes, Users can create ads",'0':"No, Users can not create ads"},
               widget: widgets.select({ "classes": ["select"] }),
                label:"Create Ads",
                fieldsetClasses:"form_fieldset",
                cssClasses: {"field" : ["form-group"]},
                value:cacheContent['member.ads']  ?  cacheContent['member.ads']  : "1"
            }),
            editads: fields.string({
                choices: editAdsOptions,
                widget: widgets.select({ "classes": ["select"] }),
                label: "Allow member to edit ads?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.editads"] ? cacheContent["member.editads"].toString() : 1
            }),
            deleteads: fields.string({
                choices: deleteAdsOptions,
                widget: widgets.select({ "classes": ["select"] }),
                label: "Allow member to delete ads?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.deleteads"] ? cacheContent["member.deleteads"].toString() : 1
            }),
            addsapprove: fields.string({
                choices: {"1":"Yes",'0':"No"},
                widget: widgets.select({ "classes": ["select"] }),
                label: "Allow member ads auto approve?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.addsapprove"] ? cacheContent["member.addsapprove"].toString() : 1
            }),
            adsquota: fields.string({
                label:"Create Ads Limit (Enter 0 for unlimited)",
                validators:[validators.integer('Enter integer value only.')],
                cssClasses: {"field" : ["form-group"]},
                widget: widgets.text({"classes":["form-control"]}),
                value: cacheContent['member.adsquota']  ?  cacheContent['member.adsquota']  : "0"
            }),
            monetization: fields.string({
                choices: {"1":"Yes, Enable Ads Monetization",'0':"No, Disable Ads Monetization"},
               widget: widgets.select({ "classes": ["select"] }),
                label:"Ads Monetization",
                fieldsetClasses:"form_fieldset",
                cssClasses: {"field" : ["form-group"]},
                value:cacheContent["member.monetization"] ? cacheContent['member.monetization'] : "1"
            }),
            monetization_threshold_amount: fields.string({
                validators:[validators.integer('Enter integer value only.')],
                cssClasses: {"field" : ["form-group"]},
                widget: widgets.text({"classes":["form-control"]}),
                value:cacheContent["member.monetization_threshold_amount"] ? cacheContent['member.monetization_threshold_amount'] : "50"
            }), 
            is_sponsored: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Do you want to auto mark Member as Sponsored?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.is_sponsored"] ? cacheContent["member.is_sponsored"].toString() : "0"
            }),
            is_featured: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Do you want to auto mark Member as Featured?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.is_featured"] ? cacheContent["member.is_featured"].toString() : "0"
            }),
            is_hot: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Do you want to auto mark Member as Hot?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.is_hot"] ? cacheContent["member.is_hot"].toString() : "0"
            }),
            // storage: fields.string({
            //     label: "Type",
            //     choices: {"1048576":"1 MB","5242880":"5 MB","26214400":"25 MB","52428800":"50 MB","104857600":"100 MB","524288000":"50 MB","1073741824":"1 GB","2147483648":"2 GB","5368709120":"5 GB","10737418240":"10 GB","0":"Unlimited"},
            //     required:true,
            //     widget: widgets.select({"classes":["select"]}),
            //     cssClasses: {"field" : ["form-group"],label:['select']},
            //     value:cacheContent["member.storage"] ? cacheContent["member.storage"].toString() : "0"
            // }),

            coverphoto_upload: fields.string({
                label: "Allow Cover Photo Uploads ?",
                required: true,
                choices: { "1": "Yes, allow user to upload cover photos", "0": "No, do not allow users to upload cover photos." },
                widget: widgets.select({ "classes": ["select"] }),
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.coverphoto_upload"] ? cacheContent["member.coverphoto_upload"].toString() : "1"
            }),

            default_coverphoto: fields.string({
                label: "Default User Cover Photo",
                choices: files,
                required: true,
                widget: widgets.select({ "classes": ["select"] }),
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.default_coverphoto"] ? cacheContent["member.default_coverphoto"].toString() : ""
            }),

            default_mainphoto: fields.string({
                label: "Default Male User  Main Photo",
                choices: files,
                required: true,
                widget: widgets.select({ "classes": ["select"] }),
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.default_mainphoto"] ? cacheContent["member.default_mainphoto"].toString() : ""
            }),
            default_femalemainphoto: fields.string({
                label: "Default Female User Main Photo",
                choices: files,
                required: true,
                widget: widgets.select({ "classes": ["select"] }),
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["member.default_femalemainphoto"] ? cacheContent["member.default_femalemainphoto"].toString() : ""
            })
        }
        formFields = { ...formFields, ...formFields1 }
    }
    let changeMode = {
        enable_theme_design_mode: fields.string({
            choices: {'1':"Yes",'0':"No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Do you want to enable theme toogle?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:cacheContent["member.enable_theme_design_mode"] ? cacheContent["member.enable_theme_design_mode"].toString() : "1"
        }),
        theme_design_mode: fields.string({
            choices: {'1':"Dark Theme",'2':"Light Theme","3" : "Dark & Light Theme (Default: light, Toggle)","4" : "Dark & Light (Default: dark, Toggle)"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Select the Theme toggle option?",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:cacheContent["member.theme_design_mode"] ? cacheContent["member.theme_design_mode"].toString() : "3"
        }),
    }
    formFields = { ...formFields, ...changeMode }
    var reg_form = forms.create(formFields, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            const formData = { ...form.data }
            const levelTitle = formData.title
            const levelDescription = formData.description
            delete form.data["username_label"]
            delete form.data["title"]
            delete form.data["description"]

            globalModel.update(req, { title: levelTitle, description: levelDescription }, 'levels', 'level_id', level_id)
            if (flag == "public") {
                permission.insertUpdate(req, res, form.data, level_id, "member").then(result => {
                    res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/levels/" })
                });
            } else {
                permission.insertUpdate(req, res, form.data, level_id, "member").then(result => {
                    res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/levels/" })
                })
            }
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/users/level/edit', { nav: url, reg_form: reg_form, title: "Edit Member Role" });
        }
    });
}

exports.deleteLevel = async (req, res) => {
    const level_id = req.params.level_id
    await globalModel.custom(req, "DELETE FROM levels WHERE level_id = " + level_id).then(response => {
        res.redirect(process.env.ADMIN_SLUG + "/levels")
    }).catch(error => {

    })
}
exports.defaultLevel = async (req, res) => {
    const level_id = req.params.level_id
    await globalModel.custom(req, "UPDATE levels SET flag = NULL WHERE flag = 'default'").then(response => {
        globalModel.custom(req, "UPDATE levels SET flag = 'default' WHERE level_id = " + level_id).then(response => {
            res.redirect(process.env.ADMIN_SLUG + "/levels")
        }).catch(error => {

        })
    }).catch(error => {

    })
}

exports.createLevel = async (req, res) => {
    //if exists means req from edit page

    let memberLevels = {}
    await levels.findAll(req, req.query).then(result => {
        if (result) {
            result.forEach(res => {
                memberLevels[res.level_id] = res.title
            });
        }
    })


    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    const cssClasses = {
        label: [""],
        field: ["form-group"],
        classes: ["form-control"]
    };
    var reg_form = forms.create({
        title: fields.string({
            label: "Member Role Name",
            required: true,
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: ""
        }),
        description: fields.string({
            label: "Description",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.textarea({ "classes": ["form-control"] }),
            value: ""
        }),

        type: fields.string({
            label: "Type",
            choices: { "admin": "Admin", "moderator": "Moderator", "user": "Normal" },
            required: true,
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            value: "user"
        }),
        type_label: fields.string({
            widget: widgets.label({ content: 'Role type.' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        level_id: fields.string({
            label: "Copy Member Role From",
            choices: memberLevels,
            required: true,
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            value: "4"
        }),
        // level_label: fields.string({
        //     widget: widgets.label({ content: 'You must select a level that is the same type as selected above.' }),
        //     cssClasses: { "field": ["form-group", "form-description"] },
        // }),
    }, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            const level_id = form.data["level_id"];
            delete form.data["level_id"]
            delete form.data["type_label"]
            delete form.data["level_label"]
            globalModel.create(req, form.data, 'levels').then(response => {
                const result = JSON.parse(JSON.stringify(response));
                if (result.insertId) {
                    const customQuery = "INSERT INTO level_permissions (level_id,type,name,value) SELECT " + (result.insertId) + ",type,name,value FROM level_permissions WHERE level_id = " + level_id
                    globalModel.custom(req, customQuery).then(result => {

                    }).catch(error => {

                    });
                }
                res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/levels" })
            })
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/users/level/create', { nav: url, reg_form: reg_form, title: "Add Member Role" });
        }
    });
}