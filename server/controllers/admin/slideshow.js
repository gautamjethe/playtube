const forms = require('forms')
const formFunctions = require('../../functions/forms/file');
const settings = require("../../models/settings")
const globalModel = require("../../models/globalModel")
const commonFunctions = require("../../functions/commonFunctions")
const slideshowModel = require("../../models/slideshow")

exports.index = async (req,res) => {
     //get all artists
     let slideshows = []

     await slideshowModel.findAll(req,{}).then(results => {
        slideshows = results
     })
     let imageSuffix = ""
    if (req.appSettings.upload_system == "s3") {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi") {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
     const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
     res.render("admin/slideshow",{imageSuffix:imageSuffix,results:slideshows,title:"Manage Slideshows",nav:url})
 
}

exports.delete = async (req,res) => {
    const slide_id = req.params.id
    let existingSlide= {}

    if(slide_id){
        await slideshowModel.findById(slide_id,req,res).then(result => {
            existingSlide = result
        }).catch(error => {
            
        });
    }

    if(existingSlide.image){
        commonFunctions.deleteImage(req,res,existingSlide.image,"slideshow")
    }

    globalModel.delete(req,"slideshows","slideshow_id",slide_id).then(result => {
        res.redirect(process.env.ADMIN_SLUG+"/slideshow/")
    })

}

exports.create = async (req,res) => {
    const slide_id = req.params.id
    let existingSlide= {}
    //if exists means req from edit page
    if(req.imageError){
        res.send({"errors": {'file': "Error Uploading file."}})
        return
    }
    if(slide_id){
        await slideshowModel.findById(slide_id,req,res).then(result => {
            existingSlide = result
        }).catch(error => {
            
        });
    }else{
        if(!req.fileName && req.checkImage){
            res.send({"errors": {'file': "Please select file."}})
            return
        }
    }
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3" && existingSlide.image) {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com"+existingSlide.image;
    }else if (req.appSettings.upload_system == "wisabi" && existingSlide.image) {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket+existingSlide.image ;
    }else if(existingSlide.image){
        imageSuffix = existingSlide.image
    }
    const cssClasses = {
        label :[""],
        field : ["form-group"],
        classes : ["form-control"]
    };
    var reg_form = forms.create({
        title: fields.string({
            label:"Title",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:existingSlide.title
        }),
        description: fields.string({
            label:"Description",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.textarea({"classes":["form-control"]}),
            value:existingSlide.description
        }),
        file: fields.string({
            label:"Upload Image",
            cssClasses: {"field" : ["form-group"]},
            widget: formFunctions.file({name:"file",value:imageSuffix ? imageSuffix : ""}),
            
        }),
        
        button_1_enabled: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Enable Button 1",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:Object.keys(existingSlide).length ? existingSlide.button_1_enabled.toString() : 1
        }),
        text1: fields.string({
            label:"Text on Button 1",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:existingSlide.text1
        }),
        link1: fields.string({
            label:"Link on Button 1",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:existingSlide.link1
        }),


        button_2_enabled: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Enable Button 2",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:Object.keys(existingSlide).length  ? existingSlide["button_2_enabled"].toString() : 1
        }),
        text2: fields.string({
            label:"Text on Button 2",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:existingSlide.text2
        }),
        link2: fields.string({
            label:"Link on Button 2",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:existingSlide.link2
        }),
        
        enabled: fields.string({
            choices: {"1" : "Yes","0" : "No"},
           widget: widgets.select({ "classes": ["select"] }),
            label:"Enable Slide",
            fieldsetClasses:"form_fieldset",
            cssClasses: {"field" : ["form-group"]},
            value:Object.keys(existingSlide).length  ? existingSlide["enabled"].toString() : 1
        }),
    },{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {
            delete form.data["file"]
            if(req.fileName){
                form.data["image"] = "/upload/images/slideshow/"+req.fileName
                if(existingSlide.image){
                    commonFunctions.deleteImage(req,res,existingSlide.image,"slideshow")
                }
            }
            
            if(!slide_id)
                globalModel.create(req,form.data,'slideshows').then(result => {
                    res.send({success:1,message:"Operation performed successfully.",url:process.env.ADMIN_SLUG+"/slideshow"})
                })
            else
                globalModel.update(req,form.data,'slideshows','slideshow_id',slide_id).then(result => {
                    res.send({success:1,message:"Operation performed successfully.",url:process.env.ADMIN_SLUG+"/slideshow"})
                })
           
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            res.send({errors:errors});
        },
        other: function (form) {
            res.render('admin/slideshow/create',{nav:url,reg_form:reg_form,title:(!slide_id ? "Create" : "Edit")+"  Slide"});
        }
    });
}

