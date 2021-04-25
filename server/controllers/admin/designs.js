const forms = require('forms')
const formFunctions = require('../../functions/forms/file');
const globalModel = require("../../models/globalModel")
var settings = require("../../models/settings")
const fs = require("fs")
const fileManager = require("../../models/fileManager")

exports.theme = async(req,res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    const selectedTheme = settings.getSetting(req,"selectedtheme",'night');
    res.render('admin/designs/theme',{selectedTheme:selectedTheme,nav:url,title:"Manage Themes"});
}
exports.assets = async(req,res) => {
    
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

    var reg_form = forms.create({
        favicon: fields.string({
            label: "Favicon",
            choices: files,
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:settings.getSetting(req,"favicon","").toString()
        }),
        darktheme_logo: fields.string({
            label: "Dark Theme Logo",
            choices: files,
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:settings.getSetting(req,"darktheme_logo","").toString()
        }),
        lightheme_logo: fields.string({
            label: "Light Theme Logo",
            choices: files,
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:settings.getSetting(req,"lightheme_logo","").toString()
        }),
        fixed_header: fields.string({
            label: "Want to make Horizontal menu?",
            choices: {'1':"Yes",'2':"No"},
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:settings.getSetting(req,"fixed_header","1").toString()
        }),
        // theme_design_mode: fields.string({
        //     choices: {'1':"Dark Theme",'2':"Light Theme","3" : "Dark & Light Theme (Default: light, Toggle)","4" : "Dark & Light (Default: dark, Toggle)"},
        //    widget: widgets.select({ "classes": ["select"] }),
        //     label:"Select the Theme toggle button?",
        //     fieldsetClasses:"form_fieldset",
        //     cssClasses: {"field" : ["form-group"]},
        //     value:settings.getSetting(req,"theme_design_mode",'3').toString()
        // }),
    });

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
            res.render('admin/designs/assets',{nav:url,reg_form:reg_form,title: "Manage Theme Assets"});
        }
    });

}
const getScript = (url) => {
    return new Promise((resolve, reject) => {
        const http      = require('http'),
              https     = require('https');

        let client = http;

        if (url.toString().indexOf("https") === 0) {
            client = https;
        }

        client.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(data);
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
};
exports.color = async(req,res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    var cssClasses = {
        label :[""],
        field : ["form-group"],
        classes : ["form-control"]
    };

    var colors = {}
    let type = "white"
    if(req.params.theme){
        type = req.params.theme
    }
    await globalModel.custom(req,"SELECT * from themes WHERE type = ?",[type]).then(result => {
        result.forEach(elem => {
            colors[elem.key] = elem.value
        });
    })

    let webfontData = {
      'Georgia, serif' : 'Georgia, serif',
      "'Palatino Linotype', 'Book Antiqua', Palatino, serif" : '"Palatino Linotype", "Book Antiqua", Palatino, serif',
      "'Times New Roman', Times, serif" : '"Times New Roman", Times, serif',
      'Arial, Helvetica, sans-serif' : 'Arial, Helvetica, sans-serif',
      "'Arial Black', Gadget, sans-serif" : '"Arial Black", Gadget, sans-serif',
      "'Comic Sans MS', cursive, sans-serif" : '"Comic Sans MS", cursive, sans-serif',
      'Impact, Charcoal, sans-serif' : 'Impact, Charcoal, sans-serif',
      "'Lucida Sans Unicode', 'Lucida Grande', sans-serif" : '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
      'Tahoma, Geneva, sans-serif' : 'Tahoma, Geneva, sans-serif',
      "'Trebuchet MS', Helvetica, sans-serif" : '"Trebuchet MS", Helvetica, sans-serif',
      'Verdana, Geneva, sans-serif' : 'Verdana, Geneva, sans-serif',
      "'Courier New', Courier, monospace" : '"Courier New", Courier, monospace',
      "'Lucida Console', Monaco, monospace" : '"Lucida Console", Monaco, monospace',
      "'Roboto', sans-serif" : '"Roboto", sans-serif'
    }

    let fontData = {}
    //get google fonts
    await getScript('https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyBZLVvcldwc6SxpeHlHzhGxdtSRPYeX7RQ').then(data => {
        data = JSON.parse(data)
        data.items.forEach(item => {
            fontData[item.family] = item.family
        })
    }).catch(err => {
        console.log(err)
    })



    var reg_form = forms.create({
        mode: fields.string({
            label : "Theme Mode" ,
            choices: {"dark":"Dark Theme",'white':"White Theme"},
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:colors['fontFamily_heading'],
            value:type
        }),
        label1: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Settings</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        Bgcolor_default: fields.string({
            required: validators.required('%s is required'),
            label : "Body Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['Bgcolor_default']
        }),
        
        Bgcolor_primary: fields.string({
            required: validators.required('%s is required'),
            label : "Theme Primary Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['Bgcolor_primary']
        }),
        Bgcolor_secondry: fields.string({
            required: validators.required('%s is required'),
            label : "Theme Secondary Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['Bgcolor_secondry']
        }),
        Bgcolor_tertiary: fields.string({
            required: validators.required('%s is required'),
            label : "Theme Tertiary Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['Bgcolor_tertiary']
        }),
        Border_color: fields.string({
            required: validators.required('%s is required'),
            label : "Border Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['Border_color']
        }),

        label2: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Text Settings</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        Textcolor_default: fields.string({
            required: validators.required('%s is required'),
            label : "Default Text Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['Textcolor_default']
        }),
        Textcolor_primary: fields.string({
            required: validators.required('%s is required'),
            label : "Primary Text Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['Textcolor_primary']
        }),
        Textcolor_secondry: fields.string({
            required: validators.required('%s is required'),
            label : "Secondary Text Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['Textcolor_secondry']
        }),
        Textcolor_tertiary: fields.string({
            required: validators.required('%s is required'),
            label : " Tertiary Text Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['Textcolor_tertiary']
        }),
        label3: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Font Settings</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        font_style: fields.string({
            label: "Choose Fonts Style",
            choices: {"web":"Web Font Style","google":"Google Fonts"},
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:colors['font_style']
        }),

        fontFamily_default_web: fields.string({
            label: "Font Family Default",
            choices: webfontData,
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:colors['fontFamily_default']
        }),
        fontFamily_heading_web: fields.string({
            label: "Headings Font Family",
            choices: webfontData,
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:colors['fontFamily_heading']
        }),

        fontFamily_default: fields.string({
            label: "Font Family Default",
            choices: fontData,
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:colors['fontFamily_default']
        }),
        fontFamily_heading: fields.string({
            label: "Headings Font Family",
            choices: fontData,
            required:true,
            widget: widgets.select({"classes":["select"]}),
            cssClasses: {"field" : ["form-group"],label:['select']},
            value:colors['fontFamily_heading']
        }),
        
        label4: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Font Sizes</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        fontSize_default: fields.string({
            required: validators.required('%s is required'),
            label : "Default Font Sizes" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['fontSize_default']
        }),
        menu_FontSize: fields.string({
            required: validators.required('%s is required'),
            label : "Menu Font Sizes" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['menu_FontSize']
        }),
        MenuDropDown_Bg: fields.string({
            required: validators.required('%s is required'),
            label : "Menu Dropdown Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['MenuDropDown_Bg']
        }),
        
        label5: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Label Colors</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        username_varify_color: fields.string({
            required: validators.required('%s is required'),
            label : "User Verified Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['username_varify_color']
        }),
        lableHot_bg: fields.string({
            required: validators.required('%s is required'),
            label : "Hot Label Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['lableHot_bg']
        }),
        lableFeatured_bg: fields.string({
            required: validators.required('%s is required'),
            label : "Featured Label Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['lableFeatured_bg']
        }),
        lableSponsored_bg: fields.string({
            required: validators.required('%s is required'),
            label : "Sponsored Label Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['lableSponsored_bg']
        }),

        label6: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Videos Section</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        videogrid_info_height: fields.string({
            required: validators.required('%s is required'),
            label : "Video Box Info Height" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['videogrid_info_height']
        }),
        videogrid_text_color: fields.string({
            required: validators.required('%s is required'),
            label : "Video Title Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['videogrid_text_color']
        }),
        videoGrid_titlefontSize: fields.string({
            required: validators.required('%s is required'),
            label : "Video Title Font Size" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['videoGrid_titlefontSize']
        }),
        

        label7: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Channels Section</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        chanlThmb_nameColor: fields.string({
            required: validators.required('%s is required'),
            label : "Channel Title Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['chanlThmb_nameColor']
        }),
        chanlThmb_nameFontSize: fields.string({
            required: validators.required('%s is required'),
            label : "Channel Title Font Size" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['chanlThmb_nameFontSize']
        }),
        chanlThmb_bg: fields.string({
            required: validators.required('%s is required'),
            label : "Channel Box Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['chanlThmb_bg']
        }),

        label8: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Artists Section</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        artist_nameColor: fields.string({
            required: validators.required('%s is required'),
            label : "Artist Title Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['artist_nameColor']
        }),
        artist_nameFontSize: fields.string({
            required: validators.required('%s is required'),
            label : "Artist Title Font Size" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['artist_nameFontSize']
        }),
        artist_imgHeight: fields.string({
            required: validators.required('%s is required'),
            label : "Artist Image Height" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['artist_imgHeight']
        }),
        artist_bordercolor: fields.string({
            required: validators.required('%s is required'),
            label : "Artist Image Border Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['artist_bordercolor']
        }),

        label9: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Members Section</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        member_nameColor: fields.string({
            required: validators.required('%s is required'),
            label : "Member Title Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['member_nameColor']
        }),
        member_nameFontSize: fields.string({
            required: validators.required('%s is required'),
            label : "Member Title Font Size" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['member_nameFontSize']
        }),
        member_imgHeigh: fields.string({
            required: validators.required('%s is required'),
            label : "Member Image Height" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['member_imgHeigh']
        }),
        member_bordercolor: fields.string({
            required: validators.required('%s is required'),
            label : "Member Image Border Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['member_bordercolor']
        }),

        label10: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Playlists Section</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        playList_color: fields.string({
            required: validators.required('%s is required'),
            label : "Playlist Title Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['playList_color']
        }),
        playList_titleFontsize: fields.string({
            required: validators.required('%s is required'),
            label : "Playlist Title Font Size" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['playList_titleFontsize']
        }),
        playList_height: fields.string({
            required: validators.required('%s is required'),
            required: validators.required('%s is required'),
            label : "Playlist Content Box Height" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['playList_height']
        }),
        
        label11: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Category Section</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        category_color: fields.string({
            required: validators.required('%s is required'),
            label : "Category Info Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['category_color']
        }),
        category_titleFontsize: fields.string({
            required: validators.required('%s is required'),
            label : "Category Title Font Size" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['category_titleFontsize']
        }),
        category_height: fields.string({
            required: validators.required('%s is required'),
            label : "Category Box Height" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['category_height']
        }),
        
        
        label12: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Blogs Section</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        blogBox_bg: fields.string({
            required: validators.required('%s is required'),
            label : "Blog Box Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['blogBox_bg']
        }),
        blogBox_titleFontSize: fields.string({
            required: validators.required('%s is required'),
            label : "Blog Title Font Size" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['blogBox_titleFontSize']
        }),
        blogBox_imgHeight: fields.string({
            required: validators.required('%s is required'),
            label : "Blog Image Height" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['blogBox_imgHeight']
        }),
        blogBox_Color: fields.string({
            required: validators.required('%s is required'),
            label : "Blog Info Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['category_color']
        }),
        blogBox_lightColor: fields.string({
            required: validators.required('%s is required'),
            label : "Blog Info Light Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['blogBox_lightColor']
        }),
        
        label13: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Profile Tabs Section</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        tabsBtn_bg: fields.string({
            required: validators.required('%s is required'),
            label : "Tabs Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['tabsBtn_bg']
        }),
        tabsBtn_bgActive: fields.string({
            required: validators.required('%s is required'),
            label : "Tabs Button Active Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['tabsBtn_bgActive']
        }),


        tabsBtn_color: fields.string({
            required: validators.required('%s is required'),
            label : "Tabs Text Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['tabsBtn_color']
        }),
        tabsBtn_Activecolor: fields.string({
            required: validators.required('%s is required'),
            label : "Tabs Text Active Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['tabsBtn_Activecolor']
        }),

        tabsBtn_fontSize: fields.string({
            required: validators.required('%s is required'),
            label : "Tabs Text Font Size" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['tabsBtn_fontSize']
        }),


        
        label14: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Form Section</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        formField_lableFontColor: fields.string({
            required: validators.required('%s is required'),
            label : "Field Title Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['formField_lableFontColor']
        }),
        formField_inputBg: fields.string({
            required: validators.required('%s is required'),
            label : "Field Input Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['formField_inputBg']
        }),


        formField_inputColor: fields.string({
            required: validators.required('%s is required'),
            label : "Field Input Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['formField_inputColor']
        }),
        formField_inputBdrColor: fields.string({
            required: validators.required('%s is required'),
            label : "Field Input Border Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['formField_inputBdrColor']
        }),

        formField_lableFont: fields.string({
            required: validators.required('%s is required'),
            label : "Field Title Font Size" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['formField_lableFont']
        }),
        formField_inputFont: fields.string({
            required: validators.required('%s is required'),
            label : "Field Input Font Size" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control"]}),
            value:colors['formField_inputFont']
        }),

        formPage_bg: fields.string({
            required: validators.required('%s is required'),
            label : "Form Background Color" ,
            cssClasses:cssClasses,
            widget: widgets.text({"classes":["form-control script_color"]}),
            value:colors['formPage_bg']
        }),

        label15: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Side Menu Settings</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        header_sidebar_bg: fields.string({
            label: "Background Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_sidebar_bg']
        }),
        header_sidebar_color: fields.string({
            label: "Link Text Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_sidebar_color']
        }),
        header_sidebar_hovercolor: fields.string({
            label: "Link Text Hover/Active Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_sidebar_hovercolor']
        }),
        header_sidebar_title_color: fields.string({
            label: "Heading Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_sidebar_title_color']
        }),

        header_sidebar_icon_color: fields.string({
            label: "Icons Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_sidebar_icon_color']
        }),

        header_sidebar_fontsize: fields.string({
            label: "Font Size",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control"]}),
            cssClasses: cssClasses,
            value:colors['header_sidebar_fontsize']
        }),

        header_sidebar_search_bg: fields.string({
            label: "Header Search Background Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_sidebar_search_bg']
        }),

        header_sidebar_search_border: fields.string({
            label: "Header Search Border Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_sidebar_search_border']
        }),

        header_sidebar_search_textcolor: fields.string({
            label: "Header Search Text Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_sidebar_search_textcolor']
        }),

        label16: fields.string({
            widget: formFunctions.makeClickable({ content: '<h3 style="text-align: center;margin: 40px;text-decoration: underline;">Popup Search Settings</h3>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        header_popup_bodybg: fields.string({
            label: "Background Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_popup_bodybg']
        }),
        header_popup_headbg: fields.string({
            label: "Top Head Background Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_popup_headbg']
        }),
        header_popup_inputtextcolor: fields.string({
            label: "Input Text Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_popup_inputtextcolor']
        }),
        header_popup_inputbg: fields.string({
            label: "Input Background Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_popup_inputbg']
        }),

        header_popup_inputborder: fields.string({
            label: "Input Text Border Color",
            required:validators.required('%s is required'),
            widget: widgets.text({"classes":["form-control script_color"]}),
            cssClasses: cssClasses,
            value:colors['header_popup_inputborder']
        }),


        
    },{validatePastFirstError:true});
    reg_form.handle(req, {
        success: function (form) {            
            if(form.data.font_style == "web"){
                form.data.fontFamily_default = form.data.fontFamily_default_web
                form.data.fontFamily_heading = form.data.fontFamily_heading_web
                delete form.data.fontFamily_default_web
                delete form.data.fontFamily_heading_web
            }
            const filePath = req.serverDirectoryPath + "/../static/css/variables_default_"+type+".css"
            fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
                if (!err) {
                    const filePath = req.serverDirectoryPath + "/../static/css/variable_"+type+".css"
                    for (var key in form.data) {
                        data = data.replace(key,form.data[key]);
                    }
                    fs.writeFile(filePath,data, 'utf8', function (err) {
                        if (err) {
                            console.log(err);
                        }else{
                            delete form.data['mode']
                            delete form.data['label1']
                            delete form.data['label2']
                            delete form.data['label3']
                            delete form.data['label4']
                            delete form.data['label5']
                            delete form.data['label6']
                            delete form.data['label7']
                            delete form.data['label8']
                            delete form.data['label9']
                            delete form.data['label10']
                            delete form.data['label11']
                            delete form.data['label12']
                            delete form.data['label13']
                            delete form.data['label14']
                            delete form.data['label15']
                            delete form.data['label16']

                            for (var key in form.data) {
                                globalModel.custom(req,'INSERT INTO themes SET ? ON DUPLICATE KEY UPDATE value = ?',[{key:key,value:form.data[key],type:type},form.data[key]],function(err,results,fields)
                                {
                                    
                                })
                            }
                        }
                    });
                }
            })
            
            res.send({success:1,message:"Setting Saved Successfully."})
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            
            res.send({errors:errors});
        },
        other: function (form) {
            res.render('admin/designs/site',{nav:url,reg_form:reg_form,title:"Change Site Designs"});
        }
    });
}

exports.customDesign = async(req,res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    var cssClasses = {
        label :[""],
        field : ["form-group"],
        classes : ["form-control"]
    };
    let headerJs = ""
    let footerJs = ""
    let headerCss = ""
    //read files
    const filePath = req.serverDirectoryPath + "/../public/static/custom/"
    await new Promise(function(resolve, reject){
        const filePathLanguage = filePath + "/header.js"
        fs.readFile(filePathLanguage, { encoding: 'utf8' }, function (err, data) {
            if (!err) {
                headerJs = data
                resolve()
            }
        })
    })
    // await new Promise(function(resolve, reject){
    //     const filePathLanguage = filePath + "/footer.js"
    //     fs.readFile(filePathLanguage, { encoding: 'utf8' }, function (err, data) {
    //         if (!err) {
    //             footerJs = data
    //             resolve()
    //         }
    //     })
    // })
    await new Promise(function(resolve, reject){
        const filePathLanguage = filePath + "/header.css"
        fs.readFile(filePathLanguage, { encoding: 'utf8' }, function (err, data) {
            if (!err) {
                headerCss = data
                resolve()
            }
        })
    })


    var reg_form = forms.create({
        
        custom_header_js: fields.string({ 
            label : "Header Custom JavaScript (Appears on all pages in header)" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:headerJs
        }),
        // custom_footer_js: fields.string({ 
        //     label : "Footer Custom JavaScript (Appears on all pages in footer)" ,
        //     cssClasses:cssClasses,
        //     widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
        //     value:footerJs
        // }),
        custom_css: fields.string({ 
            label : "Header CSS Style (Appears on all pages in header)" ,
            cssClasses:cssClasses,
            widget: widgets.textarea({"classes":["form-control website_ads_textarea"]}),
            value:headerCss
        }),
        
    },{validatePastFirstError:true});
    reg_form.handle(req, {
        success:  function (form) {
             new Promise(function(resolve, reject){
                const filePathLanguage = filePath + "/header.js"
                fs.writeFile(filePathLanguage, form.data["custom_header_js"], 'utf8', function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
            //  new Promise(function(resolve, reject){
            //     const filePathLanguage = filePath + "/footer.js"
            //     fs.writeFile(filePathLanguage, form.data["custom_footer_js"], 'utf8', function (err) {
            //         if (err) {
            //             console.log(err);
            //         }
            //     });
            // });
             new Promise(function(resolve, reject){
                const filePathLanguage = filePath + "/header.css"
                fs.writeFile(filePathLanguage, form.data["custom_css"], 'utf8', function (err) {
                    if (err) {
                        console.log(err);
                    }
                    resolve(true)
                });
            });
           
            res.send({success:1,message:"Setting Saved Successfully."})
        },
        error: function(form){
            const errors = formFunctions.formValidations(form);
            res.send({errors:errors});
        },
        other: function (form) {
            res.render('admin/designs/custom-design',{nav:url,reg_form:reg_form,title:"Custom JS / CSS"});
        }
    });
}