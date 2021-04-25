const nodemailer = require("nodemailer")
const commonFunction = require("../functions/commonFunctions")

exports.transport = (req) => {
    if (req.appSettings['email_type'] == "sendmail") {
        return nodemailer.createTransport("Sendmail", req.appSettings['sendmail_server_path'])
    } else if (req.appSettings['email_type'] == "ses") {
        return nodemailer.createTransport("SES", {
            AWSAccessKeyID: req.appSettings['aws_access_key'],
            AWSSecretKey: req.appSettings['aws_access_secret'],
            ServiceUrl: req.appSettings['aws_access_serviceurl'], // optional
        });
    } else if (req.appSettings['email_type'] == "directEmail") {
        return nodemailer.createTransport("Direct", { debug: true })
    } else if (req.appSettings['email_type'] == "smtp") {
        return nodemailer.createTransport({
            host: req.appSettings['email_smtp_host'],
            port: req.appSettings['email_smtp_port'],
            secure: req.appSettings['email_smtp_type'] == "1" ? true : false,
            auth: {
                user: req.appSettings['email_smtp_username'],
                pass: req.appSettings['email_smtp_password']
            },
        })
    } else if (req.appSettings['email_type'] == "gmail") {
        return nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: req.appSettings['email_smtp_username'],
                pass: req.appSettings['email_smtp_password']
            }
        });
    }else if (req.appSettings['email_type'] == "sendgrid") {
        return nodemailer.createTransport({
            service: "SendGrid",
            auth: {
                user: req.appSettings['sendgrid_username'],
                pass: req.appSettings['sendgrid_password']
            }
        });
    } else if (req.appSettings['email_type'] == "gmailxauth2") {
        return nodemailer.createTransport(
            {
                service: 'Gmail',
                auth: {
                    type: 'OAuth2',
                    user: req.appSettings['gmail_xauth_email'],
                    clientId: req.appSettings['gmail_xauth_clientid'],
                    clientSecret: req.appSettings['gmail_xauth_clientsecret'],
                    refreshToken: req.appSettings['gmail_xauth_refreshtoken'],
                },
            });
    } else {
        return false
    }
}
exports.links = (req, data) => {
    if (!data.commentType && (data.type == "users" || data.type == "members")) {
        if (data.subjectEmail) {
            return commonFunction.truncate(data.title)
        }
        return '<a href="' + process.env.PUBLIC_URL + '/member/' + data.custom_url + '">' + commonFunction.truncate(data.title) + '</a>'
    } else if (!data.commentType && data.type == "channels") {
        if (data.subjectEmail) {
            return commonFunction.truncate(data.title)
        }
        return '<a href="' + process.env.PUBLIC_URL + '/channel/' + data.custom_url + '">' + commonFunction.truncate(data.title) + '</a>'
    }else if (!data.commentType && data.type == "channel_posts") {
        if (data.subjectEmail) {
            return req.i18n.t("channel post")
        }
        return '<a href="' + process.env.PUBLIC_URL + '/post/' + data.custom_url + '">' + req.i18n.t("channel post") + '</a>'
    } else if (!data.commentType && data.type == "blogs") {
        if (data.subjectEmail) {
            return commonFunction.truncate(data.title)
        }
        return '<a href="' + process.env.PUBLIC_URL + '/blog/' + data.custom_url + '">' + commonFunction.truncate(data.title) + '</a>'
    } else if (!data.commentType && data.type == "artists") {
        if (data.subjectEmail) {
            return commonFunction.truncate(data.title)
        }
        return '<a href="' + process.env.PUBLIC_URL + '/artist/' + data.custom_url + '">' + commonFunction.truncate(data.title) + '</a>'
    } else if (!data.commentType && data.type == "playlists") {
        if (data.subjectEmail) {
            return commonFunction.truncate(data.title)
        }
        return '<a href="' + process.env.PUBLIC_URL + '/playlist/' + data.custom_url + '">' + commonFunction.truncate(data.title) + '</a>'
    }else if (!data.commentType && data.type == "audio") {
        if (data.subjectEmail) {
            return commonFunction.truncate(data.title)
        }
        return '<a href="' + process.env.PUBLIC_URL + '/audio/' + data.custom_url + '">' + commonFunction.truncate(data.title) + '</a>'
    } else if (!data.commentType && data.type == "videos") {
        if (data.subjectEmail) {
            return commonFunction.truncate(data.title)
        }
        return '<a href="' + process.env.PUBLIC_URL + '/watch/' + data.custom_url + '">' + commonFunction.truncate(data.title) + '</a>'
    } else if (data.commentType == "comments" || data.type == "comment") {
        if (data.subjectEmail) {
            return commonFunction.truncate(data.title)
        }
        return '<a href="' + process.env.PUBLIC_URL + '/comment/' + data.id + '">' + commonFunction.truncate(data.title) + '</a>'
    } else if (data.commentType == "reply" || data.type == "reply") {
        if (data.subjectEmail) {
            return commonFunction.truncate(data.title)
        }
        return '<a href="' + process.env.PUBLIC_URL + '/reply/' + data.id + '">' + commonFunction.truncate(data.title) + '</a>'
    } else if (data.type == "reply_title" || data.type == "comment_title") {
        if (data.subjectEmail) {
            return commonFunction.truncate(data.title)
        }
        return '<span>' + commonFunction.truncate(data.title) + '</span>'
    }else if(data.type == "text"){
        return data.title
    }else if(data.changeText){
        return '<a href="' + data.title + '">' + data.changeText + '</a>'
    } else {
        if (data.subjectEmail) {
            return data.title
        }
        return '<a href="' + data.title + '">' + data.title + '</a>'
    }
}
exports.replacePatternToComponent = (text, pattern, array) => {
    const splitText = text.split(pattern);
    const matches = text.match(pattern);
    if (splitText.length <= 1) {
        return text;
    }
    return splitText.reduce((arr, element) => {
        if (!element) return arr;
        if (matches.includes(element)) {
            return [...arr, array[element]];
        }
        return [...arr, element];
    },
        []
    );
}

exports.header = async (req, data = {}) => {
    return new Promise(async function (resolve) {
        if (data.ownerEmail) {
            //logged in user
            let body = req.i18n.t("login_header_email_body") ? req.i18n.t("login_header_email_body") : ""
            if (!body)
                body = " "    
             resolve(body.replace("{user_title}", data.ownerEmail.displayname).replace("{site_title}", req.appSettings['site_title'] ? req.appSettings['site_title'] : "Site Title"))
        } else {
            let body = req.i18n.t("loggedout_header_email_body") ? req.i18n.t("loggedout_header_email_body") : ""
            if (!body)
                body = " "
            resolve(body.replace("{site_title}", req.appSettings['site_title'] ? req.appSettings['site_title'] : "Site Title"))
        }
    })
}
exports.footer = (req, data = {}) => {
    return new Promise(async function (resolve) {
        if (data.ownerEmail) {
            //logged in user
            let body = req.i18n.t("login_footer_email_body") ? req.i18n.t("login_footer_email_body") : ""
            if (!body)
                body = " "
            resolve(body.replace("{user_email}", data.ownerEmail.email).replace("{site_title}", req.appSettings['site_title'] ? req.appSettings['site_title'] : "Site Title").replace("{unsubscribe_link}", "<a href='" + process.env.PUBLIC_URL + "/dashboard/emails" + "'>"+req.i18n.t("Click here")+"</a>"))
        } else {
                let body = req.i18n.t("login_footer_email_body") ? req.i18n.t("login_footer_email_body") : ""
                if (!body)
                    body = " "
                resolve(body.replace("{site_title}", req.appSettings['site_title'] ? req.appSettings['site_title'] : "Site Title"))
        }
    })
}
exports.sendMessage = async (req, notification,change = true) => {
    return new Promise(async function (resolve) {
        if (notification.ownerEmail.language != req.i18n.languages[0] && change){
            try{
            req.i18n.changeLanguage(notification.ownerEmail.language)
            }catch (e) {
                //silence
            }
        }
        
        let body = req.i18n.t(notification.type+"_email_body")
        if (!body) {
            body = ""
        }
        if(notification.body && !body){
            body = notification.body
        }
        if(!notification.subjectEmail){
            notification.subjectEmail = req.i18n.t(notification.type+"_email_subject")
            if(!notification.subjectEmail){
                notification.subjectEmail = ""
            }
        }
        
        const rx = /(\{.*?\})/gi;
        const matches = body.match(rx)
        const array = {}
        let vars = []
        if(notification.vars){
            vars = JSON.parse(notification.vars)
        }
        if (matches && matches.length) {
            matches.forEach(match => {
                if (match.indexOf('_') < 0 || match == "{channel_posts}") {
                    let data = { ...notification[match.replace('{', '').replace('}', '')] }
                    if (data) {
                        if(match == "{channel_posts}"){
                            data.title = req.i18n.t("channel post")
                        }else if (vars[match.replace('{', '').replace('}', '')]) {
                            if (vars[match.replace('{', '').replace('}', '')])
                                data.title = vars[match.replace('{', '').replace('}', '')]
                        }

                        array[match] = exports.links(req, data)
                    }
                } else {
                    const matchOrg = match
                    let matchString = match.split('_')[0]
                    let data = { ...notification[matchString.replace('{', '')] }
                    array[matchOrg] = exports.links(req, { title: data.title, type: match.replace('{', '').replace('}', '') })
                }
            });
        }
        const pattern = /({signuplink})|({subject})|({videos})|({channels})|({blogs})|({playlists})|({audio})|({comment})|({reply})|({comment_title})|({reply_title})|({members})|({resetpasswordlink})|({verificationlink})|({email})|({planName})|({period})|({getstarted})|({contactus})|({userprofilelink})|({signupdate})|({usertitle})|({senderemail})|({message})|({channel_posts})/g;
        let bodyFinal = exports.replacePatternToComponent(body, pattern, array)
        if (bodyFinal && typeof bodyFinal != "string") {
            bodyFinal = bodyFinal.join('')
        }
        notification.body = bodyFinal.replace(/{site_title}/gi, req.appSettings['site_title'] ? req.appSettings['site_title'] : "Site Title")

        //subject email
        let subjectEmail = notification.subjectEmail
        if (!subjectEmail) {
            subjectEmail = ""
        }
        const rxSubject = /(\{.*?\})/gi;
        const matchesSubject = subjectEmail.match(rxSubject)
        const arraySubject = {}
        if (matchesSubject && matchesSubject.length) {
            matchesSubject.forEach(match => {
                if (match.indexOf('_') < 0 || match == "{channel_posts}") {
                    let data = { ...notification[match.replace('{', '').replace('}', '')] }
                    if (data) {
                        if(match == "{channel_posts}"){
                            data.title = req.i18n.t("channel post")
                        }else if (vars[match.replace('{', '').replace('}', '')]) {
                            data.title = vars[match.replace('{', '').replace('}', '')]
                        }
                        data.subjectEmail = true
                        arraySubject[match] = exports.links(req, data)
                    }
                } else {
                    const matchOrg = match
                    let matchString = match.split('_')[0]
                    let data = { ...notification[matchString.replace('{', '')] }
                    data.subjectEmail = true
                    arraySubject[matchOrg] = exports.links(req, { title: data.title, type: match.replace('{', '').replace('}', '') })
                }
            });
        }
        let subjectFinal = exports.replacePatternToComponent(subjectEmail, pattern, arraySubject)
        if (subjectFinal && typeof subjectFinal != "string") {
            subjectFinal = subjectFinal.join('')
        }
        notification.subjectEmail = subjectFinal.replace(/{site_title}/gi, req.appSettings['site_title'] ? req.appSettings['site_title'] : "Site Title")

        await exports.send(req, notification)
        resolve(true)
    })

}

exports.send = async (req, data) => {
    return new Promise(async function (resolve) {
        if (!data) {
            resolve(false)
        }
        //req.appSettings['email_type'] = "gmailxauth2"
        if (!req.appSettings['email_type'])
            req.appSettings['email_type'] = "gmail"
        let headerData = ""
        let footerData = ""
        if (!data.disableHeader) {
            await exports.header(req, data).then(result => {
                if (result)
                    headerData = result + "<br /><br />"
            }).catch(err => { })
        }
        if (!data.disableFooter) {
            await exports.footer(req, data).then(result => {
                if (result)
                    footerData = "<br /><br />"+result
            }).catch(err => { })
        }
        let unsubscribe_link = ''
        if(!data.disableUnsubscribe){
            unsubscribe_link = req.i18n.t('This message was sent to {user_email}. If you prefer not to receive further communication, please {unsubscribe_link}.')
            if(data.ownerEmail)
                unsubscribe_link = unsubscribe_link.replace("{user_email}", data.ownerEmail.email).replace("{site_title}", req.appSettings['site_title'] ? req.appSettings['site_title'] : "Site Title").replace("{unsubscribe_link}", "<a href='" + process.env.PUBLIC_URL + "/dashboard/emails" + "'>"+req.i18n.t("Click here")+"</a>")
        }
        let emailContent =  '<div style="font-family:Helvetica Neue,Helvetica,Lucida Grande,tahoma,verdana,arial,sans-serif;color: #000000;background: #ffffff;line-height: 21px;font-size: 16px;letter-spacing: normal;">'+
                            '<div class="emailWrap" style="width: 100%;background-color: #ffffff;position: relative;">'+
                                '<div class="emailContentWrap" style="max-width: 640px;background-color: #ffffff;position: relative;margin: 0 auto;">'+
                                    '<div class="emailLogo" style="border-bottom: 1px solid #cccccc;padding-top: 10px;padding-bottom: 10px;width: 100%;">'+
                                        '<a href="'+process.env.PUBLIC_URL+'" style="display: block;max-width: 200px;"><img style=" width: 100%;height: auto;" src="'+req.appSettings['imageSuffix']+req.appSettings['lightheme_logo']+'" width="200"></a>'+
                                    '</div>'+
                                    '<div class="emailContent" style="width: 100%;position: relative;">'+
                                        '<div class="postCommentName" style="padding-top: 20px;padding-bottom: 15px;">' + headerData;

                    emailContent = emailContent  + data.body + footerData + '</div>'+
                                    '</div>';

                    if(footerData && data.ownerEmail)
                    emailContent = emailContent + '<div class="emailFooter" style="border-top: 1px solid #cccccc;width: 100%; margin-bottom: 10px; font-size: 11px;margin-top: 10px;color: #666666;">'+
                                        '<p style="padding-top: 10px;padding-bottom: 10px;color: #666666;line-height: 16px;">'+
                                        unsubscribe_link+
                                        '</p>'+
                                '</div>';

                    emailContent = emailContent +  '</div>'+
                            '</div>'+
                        '</div>';
        // Message object
        var transport = exports.transport(req)
        if (transport) {
            var message = {
                // sender info
                from: `"${req.appSettings['contact_from_name'] ? req.appSettings['contact_from_name'] : "Site Admin"}" <${req.appSettings['contact_from_address'] ? req.appSettings['contact_from_address'] : "admin@site.com"}>`,
                // Comma separated list of recipients
                to: `"${data.toName}" <${data.toEmail}>`,
                // Subject of the message
                subject: data.subjectEmail, //
                // HTML body
                html: emailContent
            }
            if(process.env.NODE_ENV == "development"){
                console.log(message);
            }
            if (req.appSettings['email_type'] == "directEmail") {
                transport(message)
                resolve(true)
            } else {
                transport.sendMail(message, function (error) {
                    if (error) {
                        console.log('Error sending email to : ' + data.toName + " <" + data.toEmail + ">");
                        console.log(error.message);
                    }
                    resolve(true)
                });
            }
        } else {
            resolve(false)
        }
    })
}