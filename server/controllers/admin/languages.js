const forms = require('forms')
const formFunctions = require('../../functions/forms/file')
const globalModel = require("../../models/globalModel")
const languagesModel = require("../../models/languages")
const fs = require('fs')
const pathExt = require('path')
const pagging = require("../../functions/pagging")
const axios = require("axios")

exports.index = async (req, res) => {

    //get all languages
    let languages = []
    await languagesModel.findAll(req, {}).then(results => {
        languages = results
    })
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    let APIkey = req.appSettings['google_translateapi_key']
    let status = req.query.status
    res.render("admin/languages", { results: languages, title: "Manage Languages", nav: url,APIkey:APIkey,status:status })
}
exports.addTranslations = async(req,res) => {
    let code = req.params.id
    let defaultLanguage = {}
    await exports.getTranslationData("en",req).then(result => {
        defaultLanguage = result
    }).catch(err => {

    })
    if(Object.keys(defaultLanguage).length == 0){
        await exports.getTranslationData(code,req).then(result => {
            defaultLanguage = result
        }).catch(err => {
    
        })
    }
    
    let translations = {}
    let isValid = true
    for (var key in defaultLanguage) {
        if(isValid){
            await exports.getGoogleTranslationData(code,defaultLanguage[key],req).then(result => {
                translations[key] = result
            }).catch(err => {
                console.log(err)
                isValid = false
            })
        }
    }
    if(!isValid){
        res.redirect(process.env.ADMIN_SLUG + "/languages?status=0")
    }else{
        let data = JSON.stringify(translations,null,4)
        fs.writeFile(req.serverDirectoryPath + "/../public/static/locales/" + code + "/common.json", data, 'utf8', function (err) {
            res.redirect(process.env.ADMIN_SLUG + "/languages?status=1")
            return
        });   
    }
}
exports.getGoogleTranslationData = (code,text,req) => {
    return new Promise(function(resolve, reject) {

        let APIkey = req.appSettings['google_translateapi_key'];
        
        let reqData = {
            "q":text,
            "source": "en",
            "target": code
        }
        
        var config = {
            method: 'POST',
            url: "https://www.googleapis.com/language/translate/v2?key="+APIkey,
            headers: { 
                'Content-Type': 'application/json;charset=utf-8'
            },
            data : JSON.stringify(reqData),
            //httpsAgent: agent
        };
        axios.request(config)
        .then(function (response) {
            if(response.status == 200){
                resolve(response.data.data.translations[0].translatedText)
            }else{
                reject('error')
            }        
        })
        .catch(error => {
            reject(error)
        });
    })
}
exports.getTranslationData = (code,req) => {
    return new Promise(function(resolve, reject) {
        const filePath = req.serverDirectoryPath + "/../public/static/locales/" + code + "/common.json"
        fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
            if (!err) {
                const fileJsonData = JSON.parse(data)
                resolve(fileJsonData)
            }else{
                reject(false)
            }
        })
    })
}

exports.missingTranslation = async (req,res) => {
    let code = req.params.id
    let defaultLanguage = {}
    let givenLanguage = {}
    await exports.getTranslationData("en",req).then(result => {
        defaultLanguage = result
    }).catch(err => {

    })
    await exports.getTranslationData(code,req).then(result => {
        givenLanguage = result
    }).catch(err => {

    })
    if(Object.keys(defaultLanguage).length == 0 || Object.keys(givenLanguage).length == 0){
        res.redirect(process.env.ADMIN_SLUG + "/languages")
        return
    }

    let missingTranslations = {}
    for (var key in defaultLanguage) {
        if(typeof givenLanguage[key] == "undefined"){
            missingTranslations[key] = defaultLanguage[key]
        }
    }
    let fileJsonData = {...givenLanguage,...missingTranslations}
    let data = JSON.stringify(fileJsonData,null,4)
    fs.writeFile(req.serverDirectoryPath + "/../public/static/locales/" + code + "/common.json", data, 'utf8', function (err) {
        res.redirect(process.env.ADMIN_SLUG + "/languages")
        return
    });

}
exports.delete = async (req, res) => {
    const language_id = req.params.id
    let existingLanguage = {}
    if (language_id) {
        await languagesModel.findById(language_id, req, res).then(result => {
            existingLanguage = result
        }).catch(error => {

        });
    }
    if (!Object.keys(existingLanguage).length || existingLanguage.default) {
        res.redirect(process.env.ADMIN_SLUG + "/languages")
        return
    }
    globalModel.delete(req, "languages", "language_id", language_id).then(result => {
        deleteFolderRecursive(req.serverDirectoryPath + "/../public/static/locales/" + existingLanguage.code)
        //remove from language cache file
        const filePath = req.cacheDir + "/languages.json"
        fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
            if (!err) {
                const fileJsonData = JSON.parse(data)
                const indexKey = fileJsonData['others'].indexOf(existingLanguage.code)
                if (indexKey > -1) {
                    fileJsonData['others'].splice(indexKey, 1)
                    fs.writeFile(filePath, JSON.stringify(fileJsonData), 'utf8', function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            }
        })
        res.redirect(process.env.ADMIN_SLUG + "/languages")
    })
}
exports.default = async (req, res) => {
    const language_id = req.params.id
    let existingLanguage = {}
    if (language_id) {
        await languagesModel.findById(language_id, req, res).then(result => {
            existingLanguage = result
        }).catch(error => {

        });
    }
    if (!Object.keys(existingLanguage).length || existingLanguage.default) {
        res.redirect(process.env.ADMIN_SLUG + "/languages")
        return
    }
    globalModel.custom(req, "UPDATE languages set `default` = 0",[]).then(result => {
        globalModel.update(req, { default: "1" }, "languages", "language_id", language_id).then(result => {
            const filePath = req.cacheDir + "/languages.json"
            fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
                if (!err) {
                    const fileJsonData = JSON.parse(data)
                    fileJsonData['default'] = existingLanguage['code']
                    fs.writeFile(filePath, JSON.stringify(fileJsonData), 'utf8', function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            })
            res.redirect(process.env.ADMIN_SLUG + "/languages")
        })
    })
}
exports.download = async (req,res,next) => {
    const code = req.params.id
    
    var file = req.serverDirectoryPath + "/../public/static/locales/" + code + "/common.json";
    await res.download(file, (err) => {
        if (err) {
            res.redirect(process.env.ADMIN_SLUG+"/languages")
            console.log(err);
          }
    });
}
exports.import = async (req,res,next) => {
    let languageCode = req.params.code
    if(req.imageError){
        res.status(200).send({error:1,message:req.imageError})
    }else{
        const imagename = req.fileName;
        fs.readFile(req.serverDirectoryPath+"/public/"+imagename,{ encoding: 'utf8' },function(err,data) {
            if(err){
                res.status(200).send({error:1,message:"Error in uploading file.",'code':languageCode})
            }else{
                fs.unlink(req.serverDirectoryPath+"/public/"+imagename,(err) => {

                })
                fs.writeFile(req.serverDirectoryPath + "/../public/static/locales/" + languageCode + "/common.json", data, 'utf8', function (err) {
                    if (err) {
                        res.status(200).send({error:1,message:"Error in uploading file.",'code':languageCode})
                    }else{
                        res.status(200).send({error:0,message:"Language imported successfully",'code':languageCode})
                    }
                });
            }
        })
    }

}
exports.edit = (req, res, next) => {
    const languageCode = req.params.id
    let LimitNum = 1;
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.params.page) ? parseInt(req.params.page) : 1;
    }
    const query = { ...req.query }
    let totalCount = 0

    //get language from folder
    const filePath = req.serverDirectoryPath + "/../public/static/locales/" + languageCode + "/common.json"
    fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
        if (!err) {
            const fileJsonData = JSON.parse(data)
            const fileJsonDataOrg = JSON.parse(data)
            let valid = false

            if(query.text){
                for (var key in fileJsonData) {
                    if((fileJsonData[key].toLowerCase()).indexOf(query.text.toLowerCase()) < 0 && key.toLowerCase().indexOf(query.text.toLowerCase()) < 0){
                        delete fileJsonData[key]
                    }
                }
            }

            if (req.editPhrase || req.addPhrase) {
                if (req.editPhrase) {
                    valid = true
                    for (var key in req.body) {
                        fileJsonDataOrg[key] = req.body[key];
                        fileJsonData[key] = req.body[key];
                    }
                } else {
                    if (!fileJsonDataOrg[req.body.phrase]) {
                        valid = true
                        fileJsonDataOrg[req.body.phrase] = req.body["phrase"];
                        fileJsonData[req.body.phrase] = req.body["phrase"];
                    }
                }
                if (valid) {
                    fs.writeFile(req.serverDirectoryPath + "/../public/static/locales/" + languageCode + "/common.json", JSON.stringify(fileJsonDataOrg,null,4), 'utf8', function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            }
            const arrayObject = Object.entries(fileJsonData)
            const convertedArray = []
            while (arrayObject.length > 0)
                convertedArray.push(arrayObject.splice(0, 50));

            if (page > convertedArray.length - 1) {
               // res.redirect(process.env.ADMIN_SLUG + "/languages")
              //  return
            }

            totalCount = convertedArray.length - 1
            const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
            const results = convertedArray[page - 1]
            const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
            res.render('admin/languages/edit', { adminURL: process.env.ADMIN_SLUG, languageCode: languageCode, baseURL: req.protocol + '://' + req.get('host'), totalCount: Object.keys(fileJsonData).length, query: query, nav: url, results: results, title: "Edit Phrases", paggingData: paggingData });
            res.end();
        } else {
            res.redirect(process.env.ADMIN_SLUG + "/languages");
            return
        }
    });

}

const deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = pathExt.join(path, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
exports.create = async (req, res) => {
    const language_id = req.params.id
    let languageSlide = {}

    if (language_id) {
        await languagesModel.findById(language_id, req, res).then(result => {
            languageSlide = result
        }).catch(error => {

        });
    }
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    var fields = forms.fields;
    var widgets = forms.widgets;

    let form = {
        title: fields.string({
            label: "Title",
            required: true,
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: languageSlide.title
        }),
        code: fields.string({
            label: "Code",
            required: true,
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: languageSlide.code
        }),
        class: fields.string({
            label: "Flag Class",
            required: true,
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: languageSlide.class ? languageSlide.class : "flag-icon flag-icon-xx",
        }),
        classlabel: fields.string({
            widget: formFunctions.makeClickable({ content: 'where xx is the [0] code of a country (* write code in small).', replace: [{ 0: '<a href="https://www.iso.org/obp/ui/#search" target="_blank">ISO 3166-1-alpha-2</a>' }] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        is_rtl: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Is Language RTL?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: Object.keys(languageSlide).length ? languageSlide["is_rtl"].toString() : "0"
        })
    }

    if( !languageSlide.default){
        let form1 = {
            enabled: fields.string({
                choices: { "1": "Enabled", "0": "Disabled" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Enabled",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: Object.keys(languageSlide).length ? languageSlide["enabled"].toString() : "1"
            })   
        }
        form = {...form,...form1}
    }
    var reg_form = forms.create(form, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            delete form.data['classlabel']
            if (!language_id) {
                globalModel.custom(req, "SELECT code FROM languages where `code` = ?", [form.data.code]).then(codeData => {
                    const codeDataRes = JSON.parse(JSON.stringify(codeData));
                    if (codeDataRes && codeDataRes.length) {
                        res.send({ errors: { code: "Language with same code already exists." } })
                        res.end()
                        return
                    }
                    if (form.data.enabled != "0") {
                        const filePath = req.cacheDir + "/languages.json"
                        fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
                            if (!err) {
                                const fileJsonData = JSON.parse(data)
                                fileJsonData['others'].push(form.data.code)
                                fs.writeFile(filePath, JSON.stringify(fileJsonData), 'utf8', function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                        })
                    }
                    globalModel.create(req, form.data, 'languages').then(result => {
                        //copy default language file to new language
                        globalModel.custom(req, "SELECT code FROM languages where `default` = ?", ["1"]).then(results => {
                            if (results) {
                                const defaultCode = JSON.parse(JSON.stringify(results));
                                if (defaultCode[0]) {
                                    const code = defaultCode[0].code
                                    fs.mkdir(req.serverDirectoryPath + "/../public/static/locales/" + form.data.code, "0777", function (error) {
                                        if (!error) {
                                            fs.copyFile(req.serverDirectoryPath + "/../public/static/locales/" + code + "/common.json", req.serverDirectoryPath + "/../public/static/locales/" + form.data.code + "/common.json", (err) => {
                                                if (err) throw err;
                                            });
                                        }
                                    })
                                }
                            }
                            res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/languages" })
                        })
                    })
                })
            } else {
                globalModel.custom(req, "SELECT * FROM languages where `language_id` = ?", [language_id]).then(codeData => {
                    const codeDataRes = JSON.parse(JSON.stringify(codeData))[0];
                    if (form.data.code != codeDataRes.code) {
                        //rename old language dir
                        fs.rename(req.serverDirectoryPath + "/../public/static/locales/" + codeDataRes.code, req.serverDirectoryPath + "/../public/static/locales/" + form.data.code, err => {

                        })
                    }
                    if (form.data.enabled != "0") {
                        const filePath = req.cacheDir + "/languages.json"
                        fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
                            if (!err) {
                                const fileJsonData = JSON.parse(data)
                                if (fileJsonData['others'].indexOf(codeDataRes['code']) < 0) {
                                    fileJsonData['others'].push(form.data.code)
                                    fs.writeFile(filePath, JSON.stringify(fileJsonData), 'utf8', function (err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }
                            }
                        })
                    } else {
                        const filePath = req.cacheDir + "/languages.json"
                        fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
                            if (!err) {
                                const fileJsonData = JSON.parse(data)
                                if (fileJsonData['others'].indexOf(codeDataRes['code']) > -1) {
                                    //get index 
                                    const indexKey = fileJsonData['others'].indexOf(codeDataRes.code)
                                    if (indexKey > -1) {
                                        fileJsonData['others'].splice(indexKey, 1)
                                        fs.writeFile(filePath, JSON.stringify(fileJsonData), 'utf8', function (err) {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });
                                    }
                                }
                            }
                        })
                    }
                })
                globalModel.update(req, form.data, 'languages', 'language_id', language_id).then(result => {
                    res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/languages" })
                })
            }
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/languages/add', { nav: url, reg_form: reg_form, title: (!language_id ? "Create" : "Edit") + "  Language" });
        }
    });
}

