const forms = require('forms')
const formFunctions = require('../../functions/forms/file');
const pagging = require("../../functions/pagging")
const globalModel = require("../../models/globalModel")
const commonFunctions = require("../../functions/commonFunctions")
const pagesModel = require("../../models/pages")
var settings = require("../../models/settings")


exports.pagesContent = async(req,res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    var fields = forms.fields;
    var widgets = forms.widgets;    

    var reg_form = forms.create({
        users_cnt_label: fields.string({
            widget: formFunctions.makeClickable({ content: '<h2 style="text-align: center;margin: 40px;text-decoration: underline;">Users Content Settings</h2>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        
        users_follow: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Follow Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "users_follow", '1').toString()
        }),
        users_followers: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Followers Count?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "users_followers", '1').toString()
        }),
        users_like: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Like Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "users_like", '1').toString()
        }),
        users_dislike: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Dislike Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "users_dislike", '1').toString()
        }),
        users_favourite: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Favourite Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "users_favourite", '1').toString()
        }),
        users_views: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show View Counts?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "users_views", '1').toString()
        }),
        users_share: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Share Options?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "users_share", '1').toString()
        }),
        users_featuredlabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Featured Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "users_featuredlabel", '1').toString()
        }),
        users_sponsoredLabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Sponsored Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "users_sponsoredLabel", '1').toString()
        }),
        users_hotLabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Hot Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "users_hotLabel", '1').toString()
        }),

        videos_cnt_label: fields.string({
            widget: formFunctions.makeClickable({ content: '<h2 style="text-align: center;margin: 40px;text-decoration: underline;">Videos Content Settings</h2>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        
        videos_datetime: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Uploaded Date?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_follow", '1').toString()
        }),
        videos_username: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Video Uploaded By?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_username", '1').toString()
        }),
        videos_watchlater: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Watchlater Option?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_watchlater", '1').toString()
        }),
        videos_playlist: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Addto Playlist Option?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_playlist", '1').toString()
        }),
        videos_like: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Like Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_like", '1').toString()
        }),
        videos_dislike: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Dislike Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_dislike", '1').toString()
        }),
        videos_favourite: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Favourite Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_favourite", '1').toString()
        }),
        videos_views: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show View Counts?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_views", '1').toString()
        }),
        videos_share: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Share Options?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_share", '1').toString()
        }),
        videos_featuredlabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Featured Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_featuredlabel", '1').toString()
        }),
        videos_sponsoredLabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Sponsored Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_sponsoredLabel", '1').toString()
        }),
        videos_hotLabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Hot Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videos_hotLabel", '1').toString()
        }),


        channels_cnt_label: fields.string({
            widget: formFunctions.makeClickable({ content: '<h2 style="text-align: center;margin: 40px;text-decoration: underline;">Channels Content Settings</h2>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),


        
        channels_browse_videoscount: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Videos Count?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_videoscount", '1').toString()
        }),
        channels_browse_subscribecount: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Subscribe Count?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_subscribecount", '1').toString()
        }),
        channels_browse_subscribe: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Subscribe Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_subscribe", '1').toString()
        }),
        channels_browse_datetime: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Uploaded Date?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_datetime", '1').toString()
        }),
        channels_browse_username: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Channel Uploaded By?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_username", '1').toString()
        }),
        channels_browse_like: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Like Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_like", '1').toString()
        }),
        channels_browse_dislike: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Dislike Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_dislike", '1').toString()
        }),
        channels_browse_favourite: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Favourite Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_favourite", '1').toString()
        }),
        channels_browse_views: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show View Counts?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_views", '1').toString()
        }),
        channels_browse_share: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Share Options?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_share", '1').toString()
        }),
        channels_browse_featuredlabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Featured Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_featuredlabel", '1').toString()
        }),
        channels_browse_sponsoredLabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Sponsored Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_sponsoredLabel", '1').toString()
        }),
        channels_browse_hotLabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Hot Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channels_browse_hotLabel", '1').toString()
        }),

        blogs_cnt_label: fields.string({
            widget: formFunctions.makeClickable({ content: '<h2 style="text-align: center;margin: 40px;text-decoration: underline;">Blogs Content Settings</h2>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        blogs_browse_username: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Created By?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "blogs_browse_username", '1').toString()
        }),
        blogs_browse_datetime: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Created At?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "blogs_browse_datetime", '1').toString()
        }),
        
        blogs_browse_like: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Like Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "blogs_browse_like", '1').toString()
        }),
        blogs_browse_dislike: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Dislike Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "blogs_browse_dislike", '1').toString()
        }),
        blogs_browse_favourite: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Favourite Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "blogs_browse_favourite", '1').toString()
        }),
        blogs_browse_views: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show View Counts?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "blogs_browse_views", '1').toString()
        }),
        blogs_browse_share: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Share Options?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "blogs_browse_share", '1').toString()
        }),
        blogs_browse_featuredlabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Featured Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "blogs_browse_featuredlabel", '1').toString()
        }),
        blogs_browse_sponsoredLabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Sponsored Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "blogs_browse_sponsoredLabel", '1').toString()
        }),
        blogs_browse_hotLabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Hot Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "blogs_browse_hotLabel", '1').toString()
        }),

        playlists_cnt_label: fields.string({
            widget: formFunctions.makeClickable({ content: '<h2 style="text-align: center;margin: 40px;text-decoration: underline;">Playlists Content Settings</h2>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

      
        playlists_browse_videoscount: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Videos Count?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_videoscount", '1').toString()
        }),
        playlists_browse_username: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Created By?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_username", '1').toString()
        }),
        playlists_browse_datetime: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Created At?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_datetime", '1').toString()
        }),
        
        playlists_browse_like: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Like Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_like", '1').toString()
        }),
        playlists_browse_dislike: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Dislike Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_dislike", '1').toString()
        }),
        playlists_browse_favourite: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Favourite Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_favourite", '1').toString()
        }),
        playlists_browse_views: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show View Counts?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_views", '1').toString()
        }),
        playlists_browse_share: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Share Options?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_share", '1').toString()
        }),
        playlists_browse_featuredlabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Featured Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_featuredlabel", '1').toString()
        }),
        playlists_browse_sponsoredLabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Sponsored Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_sponsoredLabel", '1').toString()
        }),
        playlists_browse_hotLabel: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Hot Label?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "playlists_browse_hotLabel", '1').toString()
        }),

        artists_cnt_label: fields.string({
            widget: formFunctions.makeClickable({ content: '<h2 style="text-align: center;margin: 40px;text-decoration: underline;">Artists Content Settings</h2>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
       
        artists_browse_like: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Like Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "artists_browse_like", '1').toString()
        }),
        artists_browse_dislike: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Dislike Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "artists_browse_dislike", '1').toString()
        }),
        artists_browse_favourite: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Favourite Button?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "artists_browse_favourite", '1').toString()
        }),
       
        artists_browse_share: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Show Share Options?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "artists_browse_share", '1').toString()
        })
    }, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            delete form.data["artists_cnt_label"]
            delete form.data["playlists_cnt_label"]
            delete form.data["blogs_cnt_label"]
            delete form.data["channels_cnt_label"]
            delete form.data['videos_cnt_label']
            delete form.data['users_cnt_label']

            settings.setSettings(req, form.data)
            res.send({ success: 1, message: "Setting Saved Successfully." })
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/pages/content', { nav: url, reg_form: reg_form, title: "Manage Browse Pages Content Settings" });
        }
    })

}

exports.delete = async (req,res) => {
    const id = req.params.id
    let existingPage= {}

    if(id){
        await pagesModel.findById(id,req,res).then(result => {
            existingPage = result
        }).catch(() => {
            
        });
    }

    if(existingPage.image){
        commonFunctions.deleteImage(req,res,existingPage.image,"pages")
    }

    globalModel.delete(req,"pages","page_id",id).then(() => {
        res.redirect(process.env.ADMIN_SLUG+"/pages/")
    })
}

exports.index = async (req,res) => {
    let LimitNum = 20;
    let page = 1
    if(req.params.page == ''){
         page = 1;
    }else{
        //parse int Convert String to number 
         page = parseInt(req.params.page) ? parseInt(req.params.page) : 1;
    }

    const query = {...req.query}

    let results = []
    let totalCount = 0
    query["column"] = "COUNT(*) as totalCount"
    await pagesModel.findAll(req,query).then(result => {        
        totalCount = result[0].totalCount
    })

    if(totalCount > 0){
        query['limit'] = LimitNum
        query['offset'] = (page - 1)*LimitNum
        query["column"] = "*"
        await pagesModel.findAll(req,query).then(result => {
            results = result
        })
    }
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3") {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi") {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    const paggingData = pagging.create(req,totalCount,page,'',LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    res.render("admin/pages/index",{imageSuffix:imageSuffix,totalCount:totalCount,query:query,results:results,title:"Manage Pages",nav:url,paggingData:paggingData})
 
}

exports.create = async (req,res) => {
    const page_id = req.params.id
    let existingPage= {}
    //if exists means req from edit page
    if(req.imageError){
        res.send({"errors": {'file': "Error Uploading meta image."}})
        return
    }
    if(req.bannerImageError){
        res.send({"errors": {'file': "Error Uploading banner image."}})
        return
    }
    if(page_id){
        await pagesModel.findById(page_id,req,res).then(result => {
            if(result){
                existingPage = result
            }
        }).catch(() => {
            
        });
    }
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var widgets = forms.widgets;
    let formFields = {}
    
    formFields = {
        label: fields.string({
            label:"Page Name (for your reference only)",
            required:true,
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:existingPage.label
        }),
        title: fields.string({
            label:"Page Title (title tag)",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:existingPage.title
        })
    }
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3" && existingPage.image) {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi" && existingPage.image) {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    let formFields1 = {}
    if(!Object.keys(existingPage).length || existingPage.custom == 1 || existingPage.type == "privacy" || existingPage.type == "terms"){
        formFields1 = {
            url: fields.string({
                label:"Page URL",
                cssClasses: {"field" : ["form-group"]},
                widget: widgets.text({"classes":["form-control"]}),
                //required:true,
                value:existingPage.url
            }),
            url_label: fields.string({ 
                widget: widgets.label({content : 'The URL may only contain alphanumeric characters - any other characters will be stripped. The full url will be '+req.protocol + '://' + req.get('host')+'/pages/[url]' }),
                cssClasses:{"field" : ["form-group","form-description"]},
            }),
            // bannerImage: fields.string({
            //     label:"Banner Image",
            //     cssClasses: {"field" : ["form-group"]},
            //     widget: formFunctions.file({name:"bannerImage",value:existingPage.banner ? imageSuffix+existingPage.banner : ""}),
                
            // }),
            content: fields.string({
                label:"Content",
                cssClasses: {"field" : ["form-group"]},
                widget: widgets.textarea({"classes":["form-control"]}),
                value:existingPage["content"]
            }),
        }

        if(existingPage.type == "privacy" || existingPage.type == "terms"){
            formFields1 = {
                
                // bannerImage: fields.string({
                //     label:"Banner Image",
                //     cssClasses: {"field" : ["form-group"]},
                //     widget: formFunctions.file({name:"bannerImage",value:existingPage.banner ? imageSuffix+existingPage.banner : ""}),
                    
                // }),
                content: fields.string({
                    label:"Content",
                    cssClasses: {"field" : ["form-group"]},
                    widget: widgets.textarea({"classes":["form-control"]}),
                    value:existingPage["content"]
                }),
            }
        }

    }else{
        // if(existingPage.banner_image === 1){
        //     formFields1 = {
        //         bannerImage: fields.string({
        //             label:"Banner Image",
        //             cssClasses: {"field" : ["form-group"]},
        //             widget: formFunctions.file({name:"bannerImage",value:existingPage.banner ? imageSuffix+existingPage.banner : ""}),
                    
        //         })
        //     }
        // }
    }
    
    
    formFields = {...formFields,...formFields1}
    let formFields2 = {
        description: fields.string({
            label:"Page Description (meta tag)",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.textarea({"classes":["form-control"]}),
            value:existingPage.description
        }),
        keywords: fields.string({
            label:"Page Keywords (meta tag)",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:existingPage.keywords
        }),
        custom_tags: fields.string({
            label:"Custom Tags",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.textarea({"classes":["form-control"]}),
            value:existingPage.custom_tags
        }),
        file: fields.string({
            label:"Upload Image (meta image)",
            cssClasses: {"field" : ["form-group"]},
            widget: formFunctions.file({name:"file",value:existingPage.image ? imageSuffix+existingPage.image : ""}),
            
        })
    }
    formFields = {...formFields,...formFields2}
    if(!Object.keys(existingPage).length || existingPage.custom == 1){
        let formFields1 = {
            file1: fields.string({
                label:"Upload Banner Image",
                cssClasses: {"field" : ["form-group"]},
                widget: formFunctions.file({name:"filebanner",value:existingPage.banner ? imageSuffix+existingPage.banner : ""}),
            })            
        }
        formFields = {...formFields,...formFields1}
    }else{
        if(existingPage.banner_image === 1){
            let formFields1 = {
                file1: fields.string({
                    label:"Upload Banner Image",
                    cssClasses: {"field" : ["form-group"]},
                    widget: formFunctions.file({name:"filebanner",value:existingPage.banner ? imageSuffix+existingPage.banner : ""}),
                })
            }
            formFields = {...formFields,...formFields1}
        }
    }

    
    var reg_form = forms.create(formFields,{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {
            delete form.data["file"]
            delete form.data["file1"]
            delete form.data['url_label']

            if(req.fileName){
                form.data["image"] = "/upload/images/pages/"+req.fileName
            }
            if(existingPage.image && req.fileName){
                commonFunctions.deleteImage(req,res,existingPage.image,"pages")
            }

            if(req.filebanner){
                form.data["banner"] = "/upload/images/pages/"+req.filebanner
            }
            if(existingPage.banner && req.filebanner){
                commonFunctions.deleteImage(req,res,existingPage.banner,"pages")
            }

            if(!page_id){
                let values = form.data
                values['custom'] = 1
                values['url'] = values.url.replace(/[^0-9a-z]/gi, ''); 
                globalModel.create(req,values,'pages').then(result=>{
                    if(result){
                        globalModel.update(req,{type:"custom_"+result.insertId},"pages","page_id",result.insertId);
                    }
                })
            }else{
                let values = form.data
                if(values.url)
                    values['url'] = values.url.replace(/[^0-9a-z]/gi, '');
                globalModel.update(req,values,'pages','page_id',page_id)
            }
            res.send({success:1,message:"Operation performed successfully.",url:process.env.ADMIN_SLUG+"/pages"})
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            res.send({errors:errors});
        },
        other: function () {
            res.render('admin/pages/create',{nav:url,reg_form:reg_form,title:(!page_id ? "Create New" : "Edit")+" Page"});
        }
    });


}


exports.default = async (req,res) => {
    //if exists means req from edit page
    if(req.imageError){
        res.send({"errors": {'file': "Error Uploading file."}})
        return
    }
    
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var widgets = forms.widgets;
    
    var reg_form = forms.create({
        page_default_title: fields.string({
            label:"Page Title (title tag)",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:settings.getSetting(req,"page_default_title","Videos Website")
        }),
        page_default_description: fields.string({
            label:"Page Description (meta tag)",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.textarea({"classes":["form-control"]}),
            value:settings.getSetting(req,"page_default_description","This is Videos Website.")
        }),
        page_default_keywords: fields.string({
            label:"Page Keywords (meta tag)",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.text({"classes":["form-control"]}),
            value:settings.getSetting(req,"page_default_keywords","videos,blogs,channels,playlists")
        }),
        page_default_custom_tags: fields.string({
            label:"Custom Tags",
            cssClasses: {"field" : ["form-group"]},
            widget: widgets.textarea({"classes":["form-control"]}),
            value:settings.getSetting(req,"page_default_custom_tags","")
        }),
        page_default_image: fields.string({
            label:"Upload Image (meta image)",
            cssClasses: {"field" : ["form-group"]},
            widget: formFunctions.file({name:"file",value:settings.getSetting(req,"page_default_image","")}),
            
        })
    },{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {
            delete form.data["file"]

            if(req.fileName){
                form.data["page_default_image"] = "/upload/images/pages/"+req.fileName
                if(settings.getSetting(req,"page_default_image")){
                    commonFunctions.deleteImage(req,res,settings.getSetting(req,"page_default_image"),"pages")
                }
            }
            
            settings.setSettings(req,form.data)
            
            res.send({success:1,message:"Operation performed successfully.",url:process.env.ADMIN_SLUG+"/pages"})
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            res.send({errors:errors});
        },
        other: function () {
            res.render('admin/pages/create',{nav:url,reg_form:reg_form,title:"Default Pages Meta Info"});
        }
    });


}