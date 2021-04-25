const globalModel = require("../../models/globalModel")
const languagesModel = require("../../models/languages")
const emailModel = require("../../models/emailTemplates")
const fs = require('fs')
const path = require('path')
const forms = require('forms')

exports.index = async (req, res) => {
    let languageCode = req.params.language
    let template_id = req.params.template_id
    //get default language
    let defaultLanguage = ""
    const filePathLanguage = req.cacheDir + "/languages.json"
    await new Promise(function(resolve, reject){
        const filePathLanguage = req.cacheDir + "/languages.json"
        fs.readFile(filePathLanguage, { encoding: 'utf8' }, function (err, data) {
            if (!err) {
                const fileJsonData = JSON.parse(data)
                if (err) {
                    resolve()
                }else{
                    defaultLanguage = fileJsonData.default
                    resolve()
                }
            }
        })
    })
    //get all languages
    let languages = []
    await languagesModel.findAll(req, { enabled: 1 }).then(results => {
        languages = results 
    })
    let emailTypes = []
    await emailModel.findAll(req, {}).then(results => {
        if (results)
            emailTypes = results
    })


    if (!languageCode) {
        languageCode = defaultLanguage ? defaultLanguage : languages[0].code
    }
    if (!template_id) {
        template_id = emailTypes[0].emailtemplate_id
    }

    let selectedType = {}
    await emailModel.findAll(req, { template_id: template_id }).then(results => {
        if (results && results.length > 0)
            selectedType = results[0]
    })
    let currentData = { subject: "", body: "" }
    const filePath = req.serverDirectoryPath + "/../public/static/locales/" + languageCode + "/common.json"
    fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
        if (!err) {
            const fileJsonData = JSON.parse(data)
            currentData["subject"] = fileJsonData[selectedType.type + "_email_subject"]
            currentData["body"] = fileJsonData[selectedType.type + "_email_body"]

            var fields = forms.fields;
            var widgets = forms.widgets;
            
            let languagesArray = {};
            languages.forEach(elem => {
                languagesArray[elem.code] = elem.title
            })
            let messagesArray = {};
            emailTypes.forEach(elem => {
                messagesArray[elem.emailtemplate_id] = fileJsonData[elem.type + "_email_title"]
            })
            let formFields = {
                languageCode: fields.string({
                    label: "Language",
                    choices: languagesArray,
                    required: true,
                    widget: widgets.select({ "classes": ["select"] }),
                    cssClasses: { "field": ["form-group"] },
                    value: languageCode
                }),
                template_id: fields.string({
                    label: "Choose Message",
                    choices: messagesArray,
                    required: true,
                    widget: widgets.select({ "classes": ["select"] }),
                    cssClasses: { "field": ["form-group"] },
                    value: selectedType.emailtemplate_id
                }),
                subject: fields.string({
                    label:"Subject",
                    cssClasses: {"field" : ["form-group"]},
                    widget: widgets.text({"classes":["form-control"]}),
                    value:currentData["subject"]
                }),
                body: fields.string({
                    label:"Message Body",
                    cssClasses: {"field" : ["form-group"]},
                    widget: widgets.textarea({"classes":["form-control"]}),
                    value:currentData["body"]
                }),
            }

            var reg_form = forms.create(formFields, { validatePastFirstError: true });
            reg_form.handle(req, {
                success: function (form) {
                    fileJsonData[selectedType.type + "_email_subject"] = form.data.subject
                    fileJsonData[selectedType.type + "_email_body"] = form.data.body
                    fs.writeFile(req.serverDirectoryPath + "/../public/static/locales/" + languageCode + "/common.json", JSON.stringify(fileJsonData), 'utf8', function (err) {
                        if (err) {
                            res.send({ errors: "Error saving file." });
                        }else{
                            res.send({ success: 1, message: "Operation performed successfully." })
                        }
                    });
                },
                error: function (form) {
                    const errors = formFunctions.formValidations(form);
                    res.send({ errors: errors });
                },
                other: function (form) {
                    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
                    res.render("admin/mailTemplates/index", {admin_url:process.env.ADMIN_SLUG,reg_form:reg_form, title: "Manage Email Templates", nav: url })
                }
            });
        } else {
            res.redirect(process.env.ADMIN_SLUG+"/mail/templates")
        }
    })


}

