const { valid } = require("semver")
const commonFunction = require("../functions/commonFunctions")
const globalModel = require("../models/globalModel")
exports.login = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, 'login')

    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/login', req.query);
}
exports.invitesignup = async(req,res) => {
    await commonFunction.getGeneralInfo(req, res, 'signup')

    let code = req.params.code

    //validate code
    let isValid = false;
    await globalModel.custom(req,"SELECT * from invites WHERE code =?",[code]).then(result => {
        if(result && result.length){
            isValid = true;
        }
    })

    if(!code || !isValid){
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    req.query.code = code
    if (req.query.data) {
        res.send({ data: req.query })
        return
    } 
    
    req.app.render(req, res, '/signup', req.query);
}
exports.signup = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, 'signup')
    if(req.appSettings['member_registeration'] != 1){
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    if (req.query.data) {
        res.send({ data: req.query })
        return
    } 

    req.app.render(req, res, '/signup', req.query);
}

exports.forgotPassword = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, 'forgot_password')

    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/forgot', req.query);
}
exports.verifyAccount = async(req,res) => {
    await commonFunction.getGeneralInfo(req, res, 'verify_account')
    if(req.user){
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    let valid = false
    if(req.params.code){
        await globalModel.custom(req, "SELECT * FROM user_verify WHERE code = ?", [req.params.code]).then(async result => {
            if (result) {
                const item = JSON.parse(JSON.stringify(result));
                if(item && item.length){
                    valid = true
                    await globalModel.custom(req, "UPDATE users SET active = ? WHERE user_id = ?", [1,item[0].user_id]).then(async result => {
                        req.session.user = item[0].user_id
                        globalModel.custom(req, "DELETE FROM user_verify WHERE code = ?", [req.params.code]).then(result => {

                        })

                        //send welcome email
                        
                            globalModel.custom(req, "SELECT * FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id WHERE users.user_id = ?", [item[0].user_id]).then(async resultuser => {
                                if (resultuser) {
                                    const user = JSON.parse(JSON.stringify(resultuser))[0];
                                    if(req.appSettings.welcome_email == 1){
                                        globalModel.custom(req, "SELECT vars,type FROM emailtemplates WHERE type = ?", ["welcome"]).then(async resultsType => {
                                            if (resultsType) {
                                                const typeData = JSON.parse(JSON.stringify(resultsType))[0];
                                                let resultEmail = {}
                                                resultEmail.vars = typeData.vars
                                                resultEmail.type = typeData.type
                                                resultEmail.ownerEmail = {email:user.email,language:user.language,displayname:user.displayname}
                                                resultEmail.toName = user.displayname
                                                resultEmail.toEmail = user.email
                                                resultEmail['getstarted'] = {}
                                                resultEmail['getstarted']["title"] = process.env.PUBLIC_URL + "/login/" 
                                                resultEmail['getstarted']['changeText'] = req.i18n.t("Click here")
                                                resultEmail['contactus'] = {}
                                                resultEmail['contactus']["title"] = process.env.PUBLIC_URL + "/contact/" 
                                                resultEmail['contactus']["changeText"] = "Contact Us!"

                                                resultEmail['email'] = {}
                                                resultEmail['email']["title"] = user.email
                                                resultEmail['email']["changeText"] = user.email
                                                
                                                let emailFunction = require("../functions/emails")
                                                emailFunction.sendMessage(req, resultEmail).then(result => {
                                                    
                                                }).catch(err => {
                                
                                                })
                                            }
                                        });
                                    }

                                    //send email to admin
                                    if(req.appSettings.admin_signup_email == 1){
                                        //fetch admins
                                        globalModel.custom(req, "SELECT users.*,userdetails.* FROM users LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE level_id = ?", [1]).then(async results => {
                                            if (results) {
                                            const admins = JSON.parse(JSON.stringify(results));
                                            if(admins.length > 0){
                                                admins.forEach(admin => {
                                                        globalModel.custom(req, "SELECT vars,type FROM emailtemplates WHERE type = ?", ["notify_admin_user_signup"]).then(async resultsType => {
                                                            if (resultsType) {
                                                                const typeData = JSON.parse(JSON.stringify(resultsType))[0];
                                                                let resultEmail = {}
                                                                resultEmail.vars = typeData.vars
                                                                resultEmail.type = typeData.type
                                                                resultEmail.ownerEmail = {email:admin.email,language:admin.language,displayname:admin.displayname}
                                                                resultEmail.toName = admin.displayname
                                                                resultEmail.toEmail = admin.email
                                                                resultEmail['usertitle'] = {}
                                                                resultEmail['usertitle']["title"] = user.displayname
                                                                resultEmail['usertitle']['type'] = "text"
                                                                let dateTime = require('node-datetime');
                                                                var dt = dateTime.create();
                                                                var formatted = dt.format('Y-m-d H:M:S');
                                                                resultEmail['signupdate'] = {}
                                                                resultEmail['signupdate']["title"] = formatted
                                                                resultEmail['signupdate']['type'] = "text"

                                                                resultEmail['userprofilelink'] = {}
                                                                resultEmail['userprofilelink']["title"] = process.env.PUBLIC_URL + "/"+ user.username
                                                                resultEmail['userprofilelink']["changeText"] = "Profile"
                                                                let emailFunction = require("../functions/emails")
                                                                emailFunction.sendMessage(req, resultEmail).then(result => {
                                                
                                                                }).catch(err => {
                                                
                                                                })
                                                            }
                                                        });
                                                    })
                                                }
                                            }
                                        })
                                    }
                                }
                            })
                    })
                }
            }
        }).catch(err => {
            
        })
        if (!valid) {
            if (req.query.data) {
                res.send({ data: req.query, pagenotfound: 1 });
                return
            }
            req.app.render(req, res, '/page-not-found', req.query);
            return
        }else{
            req.query.accountVerify = 1;
        }
    }
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/verify-account', req.query);
}
exports.verifyCode = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, 'forgot_password_verify')
    let valid = false
    await globalModel.custom(req, "SELECT * FROM user_forgot WHERE code = ?", [req.params.code]).then(result => {
        if (result && result.length) {
            const data = result[0];
            let creationDate = data.creation_date
            var ONE_HOUR = 60 * 60 * 1000;
            const anHourAgo = Date.now() - ONE_HOUR;
            if (new Date(creationDate).getTime() > anHourAgo) {
                valid = true
            } else {
                valid = false
            }
        }
    }).catch(err => {

    })
    req.query.code = req.params.code
    if (!valid) {
        if (req.query.data) {
            res.send({ data: req.query, pagenotfound: 1 });
            return
        }
        req.app.render(req, res, '/page-not-found', req.query);
        return
    }
    if (req.query.data) {
        res.send({ data: req.query })
        return
    }
    req.app.render(req, res, '/forgot-verify', req.query);
}