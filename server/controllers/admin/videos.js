const forms = require('forms')
const formFunctions = require('../../functions/forms/file');
const settings = require("../../models/settings")
const levels = require("../../models/levels")
const pagging = require("../../functions/pagging")
const globalModel = require("../../models/globalModel")
const fileManager = require("../../models/fileManager")
const permission = require("../../models/levelPermissions")
const categoryModel = require("../../models/categories")
const commonFunctions = require("../../functions/commonFunctions")
const artistsModel = require("../../models/artists")
const uniqid = require("uniqid")
const videoModel = require("../../models/videos")
const notifications = require("../../models/notifications")
const dateTime = require('node-datetime')
const getSymbolFromCurrency = require('currency-symbol-map')


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
        conditionalWhere += " AND LOWER(videos.title) LIKE CONCAT('%', ?,  '%')"
    }
    if (query.displayname) {
        condition.push(query.displayname.toLowerCase())
        conditionalWhere += " AND LOWER(userdetails.displayname) LIKE CONCAT('%', ?,  '%')"
    }
    if (query.email) {
        condition.push(query.email.toLowerCase())
        conditionalWhere += " AND LOWER(users.email) LIKE CONCAT('%', ?,  '%')"
    }

    if (query.category_id) {
        condition.push(query.category_id)
        conditionalWhere += " AND videos.category_id = ?"
    }

    if (query.subcategory_id) {
        condition.push(query.subcategory_id)
        conditionalWhere += " AND videos.subcategory_id = ?"
    }
    if (query.subsubcategory_id) {
        condition.push(query.subsubcategory_id)
        conditionalWhere += " AND videos.subsubcategory_id = ?"
    }
    if (typeof query.paidfree != "undefined" && query.paidfree.length) {
        
        if(query.paidfree == 0){
            conditionalWhere += " AND videos.price  == 0"
        }else{
            conditionalWhere += " AND videos.price > 0"
        }
        
    }
    if (typeof query.adult != "undefined" && query.adult.length) {
        condition.push(query.adult)
        conditionalWhere += " AND videos.adult = ?"
    }
    if (typeof query.approve != "undefined" && query.approve.length) {
        condition.push(query.approve)
        conditionalWhere += " AND videos.approve = ?"
    }

    if (typeof query.is_locked != "undefined" && query.is_locked.length) {
        condition.push(query.is_locked)
        conditionalWhere += " AND videos.is_locked = ?"
    }
    if (typeof query.type != "undefined" && query.type.length) {
        if (query.type != 0 && req.type == 11) {
            conditionalWhere += " AND (videos.type = 11 || videos.type = 10) "
        }else if (query.type != 0) {
            condition.push(query.type)
            conditionalWhere += " AND videos.type = ? "
        } else {
            conditionalWhere += " AND videos.type NOT IN (1,2,3,4,5,6,7,10,11) "
        }
    }
    if (typeof query.featured != "undefined" && query.featured.length) {
        condition.push(query.featured)
        conditionalWhere += " AND videos.is_featured = ?"
    }
    if (typeof query.sponsored != "undefined" && query.sponsored.length) {
        condition.push(query.sponsored)
        conditionalWhere += " AND videos.is_sponsored = ?"
    }
    if (typeof query.hot != "undefined" && query.hot.length) {
        condition.push(query.hot)
        conditionalWhere += " AND videos.is_hot = ?"
    }
    conditionalWhere += " AND videos.custom_url != '' "
    conditionalWhere += " AND users.user_id IS NOT NULL "

    let results = []
    let totalCount = 0
 
    let sql = "SELECT COUNT(*) as totalCount FROM videos LEFT JOIN users on users.user_id = videos.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 AND (custom_url IS NOT NULL) " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY videos.video_id DESC limit ? offset ?"
        let sqlQuery = "SELECT videos.*,userdetails.username,userdetails.displayname FROM videos LEFT JOIN users on users.user_id = videos.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id  WHERE 1 = 1 AND (custom_url IS NOT NULL) " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/videos/index', { categories: categories, loggedin_id: (req.user ? req.user.user_id : ""), loggedinLevel_id: (req.user ? req.user.level_id : ""), totalCount: totalCount, query: query, nav: url, results: results, title: "Manage Videos", paggingData: paggingData });
}
exports.approve = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from videos where video_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { approve: !item.approve }, "videos", "video_id", id).then(result => {
                if (item.owner_id != req.user.user_id && !item.approve) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "videos_admin_approved", subject_type: "users", subject_id: item.owner_id, object_type: "videos", object_id: item.video_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                } else if (item.owner_id != req.user.user_id && item.approve) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "videos_admin_disapproved", subject_type: "users", subject_id: item.owner_id, object_type: "videos", object_id: item.video_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({ status: !item.approve })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.featured = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from videos where video_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { is_featured: !item.is_featured }, "videos", "video_id", id).then(result => {
                if (item.owner_id != req.user.user_id && !item.is_featured) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "videos_featured", subject_type: "users", subject_id: item.owner_id, object_type: "videos", object_id: item.video_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({ status: !item.is_featured })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.sponsored = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from videos where video_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { is_sponsored: !item.is_sponsored }, "videos", "video_id", id).then(result => {
                if (item.owner_id != req.user.user_id && !item.is_sponsored) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "videos_sponsored", subject_type: "users", subject_id: item.owner_id, object_type: "videos", object_id: item.video_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({ status: !item.is_sponsored })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.hot = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from videos where video_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { is_hot: !item.is_hot }, "videos", "video_id", id).then(result => {
                if (item.owner_id != req.user.user_id && !item.is_hot) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "videos_hot", subject_type: "users", subject_id: item.owner_id, object_type: "videos", object_id: item.video_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({ status: !item.is_hot })
            })
        } else {
            res.send({ error: 1 })
        }
    })
}
exports.delete = async (req, res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/videos";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    await videoModel.delete(id, req).then(result => {
        res.redirect(backURL)
        return
    })
}

exports.createArtists = async (req, res) => {
    const artist_id = req.params.id
    let existingArtist = {}
    //if exists means req from edit page
    if (req.imageError) {
        res.send({ "errors": { 'file': "Error Uploading file." } })
        return
    }
    if (artist_id) {
        await artistsModel.findById(artist_id, req, res).then(result => {
            existingArtist = result
        }).catch(error => {

        });
    } else {
        if (!req.fileName && req.checkImage) {
            res.send({ "errors": { 'file': "Please select file." } })
            return
        }
    }
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    const cssClasses = {
        label: [""],
        field: ["form-group"],
        classes: ["form-control"]
    };
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3" && existingArtist.image) {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi" && existingArtist.image) {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    var reg_form = forms.create({
        title: fields.string({
            label: "Artist Name",
            required: true,
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: existingArtist.title
        }),
        description: fields.string({
            label: "About Artist",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.textarea({ "classes": ["form-control"] }),
            value: existingArtist.description
        }),
        age: fields.string({
            label: "Artist Age",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: existingArtist.age
        }),
        gender: fields.string({
            label: "Artist Gender",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: existingArtist.gender
        }),
        birthplace: fields.string({
            label: "Artist Birth Place",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: existingArtist.birthplace
        }),
        file: fields.string({
            label: "Upload Artist Photo",
            cssClasses: { "field": ["form-group"] },
            widget: formFunctions.file({ name: "file", value: existingArtist.image ? imageSuffix + existingArtist.image : "" }),

        })
    }, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            delete form.data["file"]
            if (req.fileName) {
                form.data["image"] = "/upload/images/videos/artists/" + req.fileName
            }
            if (existingArtist.image && req.fileName) {
                commonFunctions.deleteImage(req, res, existingArtist.image, "artist/video")
            }
            if (!artist_id) {
                form.data['custom_url'] = uniqid.process('va')
                globalModel.create(req, form.data, 'artists').then(result => {
                })
            } else
                globalModel.update(req, form.data, 'artists', 'artist_id', artist_id)

            res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/videos/artists" })
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/videos/artists/create', { nav: url, reg_form: reg_form, title: (!artist_id ? "Add" : "Edit") + " Video Artist" });
        }
    });
}

exports.deleteArtist = async (req, res) => {
    const id = req.params.id
    let existingArtist = {}

    if (id) {
        await artistsModel.findById(id, req, res).then(result => {
            existingArtist = result
        }).catch(error => {

        });
    }

    if (existingArtist.image) {
        commonFunctions.deleteImage(req, res, existingArtist.image, "video/artist")
    }

    globalModel.delete(req, "artists", "artist_id", id).then(result => {
        res.redirect(process.env.ADMIN_SLUG + "/videos/artists/")
    })

}
exports.getGalleries = async(req,res,next) => {
    let LimitNum = 10;
    let page = 1
    if (req.params.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.params.page) ? parseInt(req.params.page) : 1;
    }

    let artist_id = req.params.artist_id
    let artists = {}
    await globalModel.custom(req, "SELECT * FROM artists where artist_id = ?", [artist_id]).then(result => {
        if(result && result[0])
            artists = result[0]
    })

    if(!artist_id || Object.keys(artists) < 1){
        next()
        return
    }
    
    const query = { ...req.query }
    let conditionalWhere = ""
    let condition = []

    condition.push(artist_id)
    conditionalWhere += " where artist_id = ? "

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM artist_photos " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY artist_photos.photo_id DESC limit ? offset ?"
        let sqlQuery = "SELECT artist_photos.* FROM artist_photos " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }

    const paggingData = pagging.create(req, totalCount, page, '', LimitNum,artist_id+"/")

    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/videos/artists/gallery', { loggedin_id: (req.user ? req.user.user_id : ""),artists:artists, totalCount: totalCount, query: query, nav: url, results: results, title: "Manage "+artists.title+" Artist Gallery", paggingData: paggingData });

}
exports.createGallery = async(req,res) => {
    const artist_id = req.params.artist_id
    const photo_id = req.params.id
    let artists = {}
    await globalModel.custom(req, "SELECT * FROM artists where artist_id = ?", [artist_id]).then(result => {
        if(result && result[0])
            artists = result[0]
    })

    let existingPhoto = {}
   
    //if exists means req from edit page
    if (req.imageError) {
        res.send({ "errors": { 'file': "Error Uploading file." } })
        return
    }

    if (photo_id) {
        await globalModel.custom(req, "SELECT * FROM artist_photos where photo_id = ?", [photo_id]).then(result => {
            if(result && result[0])
            existingPhoto = result[0]
        })
    } else {
        if (!req.fileName && req.checkImage) {
            res.send({ "errors": { 'file': "Please select file." } })
            return
        }
    }
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    const cssClasses = {
        label: [""],
        field: ["form-group"],
        classes: ["form-control"]
    };
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3" && existingPhoto.image) {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi" && existingPhoto.image) {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    var reg_form = forms.create({
        title: fields.string({
            label: "Title",
            required: false,
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: existingPhoto.title
        }),
        // description: fields.string({
        //     label: "Description",
        //     cssClasses: { "field": ["form-group"] },
        //     widget: widgets.textarea({ "classes": ["form-control"] }),
        //     value: existingPhoto.description
        // }),
        file: fields.string({
            label: "Upload Photo",
            cssClasses: { "field": ["form-group"] },
            widget: formFunctions.file({ name: "file", value: existingPhoto.image ? imageSuffix + existingPhoto.image : "" }),

        })
    }, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            delete form.data["file"]
            if (req.fileName) {
                form.data["image"] = "/upload/images/artists/gallery/" + req.fileName
            }
            form.data["artist_id"] = artists.artist_id
            if (existingPhoto.image && req.fileName) {
                commonFunctions.deleteImage(req, res, existingPhoto.image, "artist/galley/photo")
            }
            if (!photo_id) {
                globalModel.create(req, form.data, 'artist_photos').then(result => {})
            } else
                globalModel.update(req, form.data, 'artist_photos', 'photo_id', photo_id)

            res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/videos/artists/gallery/"+artists.artist_id })
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/videos/artists/createphoto', { nav: url, reg_form: reg_form, title: (!artist_id ? "Add " : "Edit ") + artists.title +" Artist Photo" });
        }
    });
}
exports.deleteGallery = async(req,res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/videos";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    await globalModel.custom(req,"DELETE FROM artist_photos WHERE photo_id = ?",[id]).then(result => {
        res.redirect(backURL)
        return
    })
}
exports.soldVideos = async (req,res) => {
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
    if (query.title) {
        condition.push(query.title.toLowerCase())
        conditionalWhere += " AND LOWER(videos.title) LIKE CONCAT('%', ?,  '%')"
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

    let sql = "SELECT COUNT(*) as totalCount FROM transactions INNER JOIN videos on videos.video_id = transactions.id LEFT JOIN users on users.user_id = transactions.owner_id  INNER JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 AND users.active = '1' AND users.approve = '1' AND (transactions.state = 'approved' || transactions.state = 'completed' || transactions.state = 'active') AND transactions.type = 'video_purchase' " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY transactions.transaction_id DESC limit ? offset ?"
        let sqlQuery = "SELECT transactions.*,userdetails.username,userdetails.displayname,videos.title as videoTitle,videos.custom_url as video_url,transactions.price as amount FROM transactions INNER JOIN videos on videos.video_id = transactions.id INNER JOIN users on users.user_id = transactions.owner_id  INNER JOIN userdetails ON users.user_id = userdetails.user_id  WHERE 1 = 1 AND users.active = '1' AND users.approve = '1' AND (transactions.state = 'approved' || transactions.state = 'completed' || transactions.state = 'active') AND transactions.type = 'video_purchase' " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }

    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/videos/sold-videos', {getSymbolFromCurrency:getSymbolFromCurrency, loggedin_id: (req.user ? req.user.user_id : ""), loggedinLevel_id: (req.user ? req.user.level_id : ""), totalCount: totalCount, query: query, nav: url, results: results, title: "Manage Sold Videos", paggingData: paggingData });

}
exports.deleteSoldVideo = async(req,res) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/videos";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    await globalModel.custom(req,"DELETE FROM transactions WHERE transaction_id = ?",[id]).then(result => {
        res.redirect(backURL)
        return
    })
}
exports.artists = async (req, res) => {
    //get all artists
    let artists = []

    await artistsModel.findAll(req, { type: "video" }).then(results => {
        artists = results
    })
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3") {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi") {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render("admin/videos/artists", { imageSuffix: imageSuffix, results: artists, title: "Manage Videos Artists", nav: url })

}

exports.changeOrder = async (req, res) => {
    const id = req.body.id
    const nextid = req.body.nextid
    let order = req.body.articleorder
    order = order.split(',')
    if (id || nextid) {
        let categoryData = {}
        await globalModel.custom(req, "SELECT * from categories WHERE category_id = ?", [id]).then(result => {
            categoryData = JSON.parse(JSON.stringify(result));
            categoryData = categoryData[0]
        })

        let categoryType = "", categoryTypeId = ""
        if (categoryData.subcategory_id != 0) {
            categoryType = 'subcategory_id'
            categoryTypeId = categoryData.subcategory_id
        } else if (categoryData.subsubcategory_id != 0) {
            categoryType = 'subsubcategory_id'
            categoryTypeId = categoryData.subsubcategory_id
        } else
            categoryType = 'category_id';

        let categories = []
        if (categoryTypeId) {
            await globalModel.custom(req, "SELECT category_id FROM categories WHERE show_video = 1 AND " + categoryType + " = ?", [categoryTypeId]).then(results => {
                Object.keys(results).forEach(function (key) {
                    let result = JSON.parse(JSON.stringify(results[key]))
                    categories.push(result.category_id.toString())
                })
            })
        } else {
            await globalModel.custom(req, "SELECT category_id FROM categories WHERE show_video = 1 AND  subcategory_id = 0 AND subsubcategory_id = 0").then(results => {
                Object.keys(results).forEach(function (key) {
                    let result = JSON.parse(JSON.stringify(results[key]))
                    categories.push(result.category_id.toString())
                })
            })
        }
        const newOrder = order.filter(Set.prototype.has, new Set(categories))
        let orderIndex = newOrder.length + 1
        newOrder.forEach(cat => {
            orderIndex = orderIndex - 1;
            globalModel.custom(req, "UPDATE categories SET `order` = " + orderIndex + " WHERE category_id = " + cat).then(result => {
            })
        })

    }

    res.send(req.body)
}

exports.deleteCategories = async (req, res) => {
    let category_id = req.params.category_id
    let categoryData = {}
    await globalModel.custom(req, "SELECT * from categories WHERE category_id = ?", [category_id]).then(result => {
        categoryData = JSON.parse(JSON.stringify(result));
        categoryData = categoryData[0]
        if (categoryData.subsubcategory_id == 0) {
            if (categoryData.subcategory_id != 0) {
                //select all subsubcategory_id
                globalModel.custom(req, "SELECT * from categories WHERE subsubcategory_id = ?", [categoryData.category_id]).then(result => {
                    result.forEach(cat => {
                        if (cat.image) {
                            commonFunctions.deleteImage(req, res, cat.image, "video/category")
                        }
                        globalModel.custom(req, "UPDATE videos SET subsubcategory_id = 0 WHERE subsubcategory_id = ?", [cat.category_id])
                    })
                    globalModel.custom(req, "DELETE from categories WHERE subsubcategory_id = ?", [categoryData.category_id]);
                })
            } else {
                //select all subcategory_id
                globalModel.custom(req, "SELECT * from categories WHERE subcategory_id = ?", [categoryData.category_id]).then(result => {
                    result.forEach(cat => {
                        globalModel.custom(req, "SELECT * from categories WHERE subsubcategory_id = ?", [cat.category_id]).then(result => {
                            result.forEach(cat => {
                                if (cat.image) {
                                    commonFunctions.deleteImage(req, res, cat.image, "video/category")
                                }
                                globalModel.custom(req, "UPDATE videos SET subsubcategory_id = 0 WHERE subsubcategory_id = ?", [cat.category_id])
                            })
                            globalModel.custom(req, "DELETE from categories WHERE subsubcategory_id = ?", [cat.category_id]);
                        })
                        if (cat.image) {
                            commonFunctions.deleteImage(req, res, cat.image, "video/category")
                        }
                        globalModel.custom(req, "UPDATE videos SET subcategory_id = 0 WHERE subcategory_id = ?", [cat.category_id])
                    })
                    globalModel.custom(req, "DELETE from categories WHERE subcategory_id = ?", [categoryData.category_id]);
                })
            }
        }
    })
    if (categoryData.image) {
        commonFunctions.deleteImage(req, res, categoryData.image, "video/category")
    }
    await globalModel.delete(req, "categories", "category_id", category_id).then(result => {
        res.redirect(process.env.ADMIN_SLUG + "/videos/categories")
    })
}

exports.categories = async (req, res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    //get all categories
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
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3") {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi") {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    res.render('admin/videos/categories', { imageSuffix: imageSuffix, nav: url, title: "Manage Videos Categories", categories: categories });
}

exports.addCategories = async (req, res) => {
    let category_id = req.params.category_id
    let categoryData = {}
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    if (category_id) {

        await categoryModel.findById(category_id, req, res).then(result => {
            if (result) {
                categoryData = result
            } else {
                res.redirect(process.env.ADMIN_SLUG + "/error")
            }
        })
    }
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3") {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi") {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    if (Object.keys(req.body).length === 0 && category_id) {
        res.render("admin/videos/editCategories", { imageSuffix: imageSuffix, category_id: category_id, categoryData: categoryData, nav: url, title: "Edit Video Category" })
        return
    }

    if (req.imageError) {
        res.send({ 'imageError': true })
        return
    }

    categoryData['title'] = req.body.category_name;
    categoryData['slug'] = req.body.slug
    categoryData['show_home'] = parseInt(req.body.show_home) == 1 ? 1 : 0

    let cat_id = req.body.parent

    if (category_id && categoryData.image && req.fileName) {
        //remove image
        commonFunctions.deleteImage(req, res, categoryData.image, "video/category")
    }
    if (req.fileName) {
        categoryData["image"] = "/upload/images/categories/videos/" + req.fileName
    }
    let slugExists = false
    await categoryModel.findAll(req, { slug: req.body.slug, type: "video", category_id: category_id }).then(result => {
        if (result && result.length > 0) {
            slugExists = true
        }
    })
    if (slugExists) {
        res.send({ 'slugError': true })
        return
    }
    let parentId = 0, seprator = "", tableSeprator = "", data = ""
    if (!category_id) {

        if (cat_id != -1) {
            let catData = {}
            await categoryModel.findById(cat_id, req, res).then(result => {
                catData = result
            })
            if (catData.subcategory_id == 0) {
                categoryData['subcategory_id'] = cat_id;
                seprator = '&nbsp;&nbsp;&nbsp;';
                tableSeprator = '-&nbsp;';
                parentId = cat_id;
                await categoryModel.orderNext(req, res, { 'subcat_id': cat_id }).then(result => {
                    categoryData['order'] = result ? result : 1
                })
            } else {
                categoryData['subsubcategory_id'] = cat_id;
                seprator = '3';
                tableSeprator = '--&nbsp;';
                await categoryModel.orderNext(req, res, { 'subsubcat_id': cat_id }).then(result => {
                    categoryData['order'] = result ? result : 1
                })
                parentId = cat_id;
            }
        } else {
            parentId = 0;
            seprator = '';
            await categoryModel.orderNext(req, res, { 'category_id': true }).then(result => {
                categoryData['order'] = result ? result : 1
            })
            tableSeprator = '';
        }
        categoryData["show_video"] = 1;
    }
    //create category
    let categoryId = ""
    if (!category_id) {
        await globalModel.create(req, categoryData, "categories").then(category => {
            categoryId = category.insertId;
        })
        if (req.fileName) {
            data = '<img  style="height: 50px;width:50px;margin-bottom: 10px;"  src="' + categoryData["image"] + '" />';
        } else {
            data = "---";
        }

        let editCat = '<a class="btn btn-primary btn-xs" href="' + process.env.ADMIN_SLUG + '/videos/categories/add/' + categoryId + '">Edit</a>';
        let deleteCat = ' <a class="btn btn-danger btn-xs" onclick="preDeleteFn(this)" data-id="' + categoryId + '" data-toggle="modal" data-target="#modal-danger">Delete</a>'
        let tableData = '<tr id="categoryid-' + categoryId + '"><td>' + data + '</td><td>' + tableSeprator + req.body.category_name + '<div class="hidden" style="display:none" id="inline_' + categoryId + '"><div class="parent">' + parentId + '</div></div></td><td>' + req.body.slug + '</td><td>' + editCat + deleteCat + '</td></tr>';
        res.send({ 'seprator': seprator, 'tableData': tableData, 'id': categoryId, 'name': req.body.category_name, 'slugError': false })
    } else {
        await globalModel.update(req, categoryData, "categories", "category_id", category_id).then(category => {

            res.send({ success: true })
        })

    }
}

exports.levels = async (req, res) => {
    let level_id = req.params.level_id
    
    let memberLevels = {}
    let flag = ""
    let type = "user"
    await levels.findAll(req, req.query).then(result => {
        if (result) {
            result.forEach(res => {
                if ((!level_id && res.flag == "default")) {
                    level_id = res.level_id
                }
                if (res.level_id == level_id || (!level_id && res.flag == "default")) {
                    flag = res.flag
                    type = res.type
                }
                memberLevels[res.level_id] = res.title
            });
        }
    })
    const cacheContent = await permission.getKeyValue(req, level_id)
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
    const viewOptions = {}
    const editOptions = {}
    if (type == "admin" || type == "moderator") {
        deleteOptions["2"] = "Yes, allow to delete other users videos."
        viewOptions["2"] = "Yes, allow to view private and locked videos of users."
        editOptions["2"] = "Yes, allow to edit everyones videos."
    }
    viewOptions["0"] = "No, do not allow to view videos."
    viewOptions["1"] = "Yes, allow to view videos."

    deleteOptions["1"] = "Yes, allow to delete own videos."
    deleteOptions["0"] = "No, do not allow to delete videos."

    editOptions["1"] = "Yes, allow to edit own videos."
    editOptions["0"] = "No, do not edit videos."

    let formFields = {
        level_id: fields.string({
            label: "Member Role",
            choices: memberLevels,
            required: true,
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            value: level_id
        }),
    }

    if (flag != "public") {
           let formFieldsPublic ={
                create: fields.string({
                    choices: {"1" : "Yes, allow to upload videos","0" : "No, do not allow to upload videos"},
                   widget: widgets.select({ "classes": ["select"] }),
                    label:"Allow member to upload videos",
                    fieldsetClasses:"form_fieldset",
                    cssClasses: {"field" : ["form-group"]},
                    value:cacheContent["video.create"] ? cacheContent["video.create"].toString() : 1
                })
            }
            formFields = {...formFields,...formFieldsPublic}
    }

    let formFieldsView = {
        view: fields.string({
            choices: viewOptions,
            widget: widgets.select({ "classes": ["select"] }),
            label: "Can Member view uploaded videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: cacheContent["video.view"] ? cacheContent["video.view"].toString() : 1
        }),

    }
    formFields = { ...formFields, ...formFieldsView }



    if (flag != "public") {
        let formFields1 = {
            edit: fields.string({
                choices: editOptions,
                widget: widgets.select({ "classes": ["select"] }),
                label: "Can Member edit uploaded videos?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["video.edit"] ? cacheContent["video.edit"].toString() : 1
            }),
            delete: fields.string({
                choices: deleteOptions,
                widget: widgets.select({ "classes": ["select"] }),
                label: "Can Member delete uploaded videos?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["video.delete"] ? cacheContent["video.delete"].toString() : 1
            }),
            quota: fields.string({
                label: "No. Of videos member can upload to selected level? Enter 0 for unlimited",
                validators: [validators.integer('Enter integer value only.')],
                cssClasses: { "field": ["form-group"] },
                widget: widgets.text({ "classes": ["form-control"] }),
                value: cacheContent["video.quota"] ? cacheContent["video.quota"].toString() : 0
            }),
            storage: fields.string({
                label: "Video Storage Limit",
                choices: { "1048576": "1 MB", "5242880": "5 MB", "26214400": "25 MB", "52428800": "50 MB", "104857600": "100 MB", "524288000": "50 MB", "1073741824": "1 GB", "2147483648": "2 GB", "5368709120": "5 GB", "10737418240": "10 GB", "0": "Unlimited" },
                required: true,
                widget: widgets.select({ "classes": ["select"] }),
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["video.storage"] ? cacheContent["video.storage"].toString() : 0
            }),
            // watermark: fields.string({
            //     label: "Watermark",
            //     choices: files,
            //     required: false,
            //     widget: widgets.select({ "classes": ["select"] }),
            //     cssClasses: { "field": ["form-group"] },
            //     value: cacheContent["video.watermark"] ? cacheContent["video.watermark"].toString() : 0
            // }),

            // watermark_label: fields.string({
            //     widget: widgets.label({ content: 'If you do not want to apply watermark on uploaded videos (by user in this level) then leave this field blank.' }),
            //     cssClasses: { "field": ["form-group", "form-description"] },
            // }),
            //
            embedcode: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Do you want to allow Embed Code?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["video.embedcode"] ? cacheContent["video.embedcode"].toString() : 0
            }),
            sponsored: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Do you want to auto mark Videos as Sponsored?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["video.sponsored"] ? cacheContent["video.sponsored"].toString() : 1
            }),
            featured: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Do you want to auto mark Videos as Featured?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["video.featured"] ? cacheContent["video.featured"].toString() : 1
            }),
            hot: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Do you want to auto mark Videos as Hot?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["video.hot"] ? cacheContent["video.hot"].toString() : 1
            }),


            auto_approve: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Do you want to auto approve videos?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["video.auto_approve"] ? cacheContent["video.auto_approve"].toString() : 1
            }),
            donation: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Do you want to enable donation on uploaded videos?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["video.donation"] ? cacheContent["video.donation"].toString() : 1
            }),
            sell_videos: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Do you want to allow member to sell uploaded videos?",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["video.sell_videos"] ? cacheContent["video.sell_videos"].toString() : 1
            }),
        }
        formFields = { ...formFields, ...formFields1 }
    }
    var reg_form = forms.create(formFields, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            permission.insertUpdate(req, res, form.data, level_id, "video").then(result => {
                res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/videos/levels/" + level_id })
            })
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/videos/levels', { nav: url, reg_form: reg_form, title: "Videos Member Role Settings" });
        }
    });
}

exports.settings = async (req, res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    var fields = forms.fields;
    var validators = forms.validators;
    var widgets = forms.widgets;
    var cssClasses = {
        field: ["form-group"],
        classes: ["form-control"]
    };


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

    const videos = { "": "" }

    await fileManager.findAll(req, { "column": "path", "like": "video" }).then(result => {
        result.forEach(res => {
            let url = res.path.split(/(\\|\/)/g).pop().split("_")
            if (url.length > 1) {
                url.splice(0, 2)
                url = url.join("_")
            } else {
                url = url[0]
            }
            videos[res.path] = url
        });
    })
    var reg_form = forms.create({
        video_upload: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Allow user to upload videos on your website?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_upload", '0').toString()
        }),
        video_upload_label: fields.string({
            widget: widgets.label({ content: 'Do you want to allow user on your website to upload videos from their computer.' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        video_ffmpeg_path: fields.string({
            label: "FFMPEG Path",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: req.loguserallowed ? "****" : settings.getSetting(req, "video_ffmpeg_path", '')
        }),
        video_ffmpeg_path_label: fields.string({
            widget: widgets.label({ content: 'This will compress, convert, and optimise videos to mp4. Please contact your hosting provider if you can not install FFMPEG.' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        video_upload_videos_type: fields.string({
            label: "Select from below Video upload types",
            choices: { "360": "360p", "480": "480p",'720':"720p","1080":"1080p","2048":"2048p","4096":"4096p" },
            cssClasses: { "field": ["form-group"] },
            widget: widgets.multipleCheckbox({ "classes": ["form-control-checkbox"] }),
            value:  settings.getSetting(req, "video_upload_videos_type", '').split(",")
        }),
        video_upload_videos_type_label: fields.string({
            widget: widgets.label({ content: 'Choose from above setting in which format you want to upload video on your website. If you enable higher resolution videos than your server must be that much capable to convert those resolution videos.' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        video_conversion_type: fields.string({
            label: "Convert video speed",
            choices: { "ultrafast": "Ultrafast", "superfast": "Superfast",'veryfast':"Veryfast",'faster':"Faster",'fast':"Fast",'medium':"Medium",'slow':"Slow",'slower':"Slower",'veryslow':"Veryslow" },
            widget: widgets.select({ "classes": ["select"] }),
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_conversion_type", 'ultrafast')
        }),

        video_conversion_type_label: fields.string({
            widget: widgets.label({ content: 'Using a slower preset gives you better compression, or quality per filesize, whereas faster presets give you worse compression and higher filesize.' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        enable_iframely: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Iframely",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "enable_iframely", '0').toString()
        }),
        enable_iframely_label: fields.string({
            widget: formFunctions.makeClickable({ content: 'Iframely integration works with the ‘Import Videos’ feature and enhances import functionality. [0] to learn about all the awesome features Iframely provides.', replace: [{ 0: '<a href="https://iframely.com/features" target="_blank">Click here</a>' }] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        iframely_api_key: fields.string({
            label: "Iframely API Key",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: req.loguserallowed ? "****" : settings.getSetting(req, "iframely_api_key", '')
        }),

        iframely_disallow_sources: fields.string({
            label: "Disallow Sites",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.textarea({ "classes": ["form-control"] }),
            value: settings.getSetting(req, "iframely_disallow_sources", '')
        }),
        iframely_disallow_sources_label: fields.string({
            widget: formFunctions.makeClickable({ content: 'You can use this setting to control which sites should not be allowed in this section. Enter the domains of the sites (separated by commas) that you do not want to allow for Video Source. ' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        enable_youtube_import: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Youtube Import",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "enable_youtube_import", '0').toString()
        }),
        enable_youtube_import_label: fields.string({
            widget: widgets.label({ content: 'Do you want to enable youtube import on your website' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        youtube_api_key: fields.string({
            label: "Youtube Api Key",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: req.loguserallowed ? "****" : settings.getSetting(req, "youtube_api_key", '')
        }),
        youtubelabel: fields.string({
            widget: formFunctions.makeClickable({ content: '[0] to learn how to create Youtube API key.', replace: [{ 0: '<a href="'+process.env.PUBLIC_URL+'/Documentation/youtube" target="_blank">Click here</a>' }] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        enable_twitch_import: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Twitch Import",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "enable_twitch_import", '0').toString()
        }),
        twitchlabel: fields.string({
            widget: formFunctions.makeClickable({ content: '[0] to learn how to create Twitch API key.', replace: [{ 0: '<a href="'+process.env.PUBLIC_URL+'/Documentation/twitch" target="_blank">Click here</a>' }] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        enable_twitch_import_label: fields.string({
            widget: widgets.label({ content: 'Do you want to enable twitch import on your website' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        twitch_api_key: fields.string({
            label: "Twitch Client Id",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: req.loguserallowed ? "****" : settings.getSetting(req, "twitch_api_key", '')
        }),

        enable_facebook_import: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Facebook Import",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "enable_facebook_import", '0').toString()
        }),
        
        facebooklabel: fields.string({
            widget: formFunctions.makeClickable({ content: '[0] to learn how to create Facebook API key.', replace: [{ 0: '<a href="'+process.env.PUBLIC_URL+'/Documentation/facebook" target="_blank">Click here</a>' }] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        enable_facebook_import_label: fields.string({
            widget: widgets.label({ content: 'Do you want to enable facebook import on your website' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        facebook_client_id: fields.string({
            label: "Facebook Client Id",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: req.loguserallowed ? "****" : settings.getSetting(req, "facebook_client_id", '')
        }),

        facebook_client_secret: fields.string({
            label: "Facebook Client Secret",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: req.loguserallowed ? "****" : settings.getSetting(req, "facebook_client_secret", '')
        }),
        whitelist_domain: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Whitelist Domain Privacy in Videos",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "whitelist_domain", '0').toString()
        }),
        video_embed_code: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Embed Video",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_embed_code", '0').toString()
        }),
        video_tip: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Allow user to set tip on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_tip", '1').toString()
        }),
        videotip_commission_type: fields.string({
            choices: { "1": "Fixed Price", "2": "Percentage" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Commission Type of video tips?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "videotip_commission_type", '1').toString()
        }),
        videotip_commission_value: fields.string({
            label: "Get Commission from tip videos (put 0 if you not want comission.)",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: settings.getSetting(req, "videotip_commission_value", '')
        }),
        video_sell: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Allow user to sell videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_sell", '1').toString()
        }),
        video_commission_type: fields.string({
            choices: { "1": "Fixed Price", "2": "Percentage" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Commission Type of sell videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_commission_type", '1').toString()
        }),
        video_commission_value: fields.string({
            label: "Get Commission from sell videos (put 0 if you not want comission.)",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: settings.getSetting(req, "video_commission_value", '')
        }),
        video_upload_limit: fields.string({
            label: "Maximum Upload Limit of Videos. Enter value in MB (Enter 0 for unlimited.)",
            validators: [validators.integer('Enter integer value only.')],
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: settings.getSetting(req, "video_upload_limit", '0')
        }),


        video_autoplay: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Autoplay feature on video view page (work only when above Iframely setting is set \"NO\")?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_autoplay", '1').toString()
        }),
        video_miniplayer: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Miniplayer feature on videos (work only when above Iframely setting is set \"NO\")?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_miniplayer", '1').toString()
        }),
        video_preview: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Preview feature on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_preview", '1').toString()
        }),
        video_favourite: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Favourite feature on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_favourite", '1').toString()
        }),
        video_donation: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable donation feature on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_donation", '1').toString()
        }),
        video_donation_label: fields.string({
            widget: widgets.label({ content: 'Enabling this feature user can request for donation on uploaded videos' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        
        video_watchlater: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable Watch Later Feature on Videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_watchlater", '1').toString()
        }),
        video_like: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable like feature on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_like", '1').toString()
        }),
        video_dislike: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable dislike feature on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_dislike", '1').toString()
        }),

        video_comment: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable comment feature on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_comment", '1').toString()
        }),

        video_comment_like: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable like feature on videos comment?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_comment_like", '1').toString()
        }),

        video_comment_dislike: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable dislike feature on videos comment?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_comment_dislike", '1').toString()
        }),

        video_rating: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable rating feature on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_rating", '1').toString()
        }),

        video_featured: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable featured label on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_featured", '1').toString()
        }),

        video_sponsored: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable sponsored label on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_sponsored", '1').toString()
        }),

        video_hot: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable hot label on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_hot", '1').toString()
        }),



        video_adult: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable adult marking on videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_adult", '1').toString()
        }),
        video_watermark: fields.string({
                label: "Logo on videos",
                choices: files,
                required: false,
                widget: widgets.select({ "classes": ["select"] }),
                cssClasses: { "field": ["form-group"] },
                value: settings.getSetting(req,"video_watermark","")
        }),
        video_default_photo: fields.string({
            label: "Default Photo on Videos",
            choices: files,
            required: false,
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_default_photo", "").toString()
        }),
        video_category_default_photo: fields.string({
            label: "Default Photo on Videos Category",
            choices: files,
            required: false,
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_category_default_photo", "").toString()
        }),
        // video_createpage: fields.string({
        //     label: "Video Create Page Background Video",
        //     choices: videos,
        //     required: false,
        //     widget: widgets.select({ "classes": ["select"] }),
        //     cssClasses: { "field": ["form-group"] },
        //     value: settings.getSetting(req, "video_createpage", "").toString()
        // }),

        artist_cnt_label: fields.string({
            widget: formFunctions.makeClickable({ content: '<h2 style="text-align: center;margin: 40px;text-decoration: underline;">Video Artists Settings</h2>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        video_artists: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable artists functionality in videos?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_artists", '1').toString()
        }),

        video_artists_label: fields.string({
            widget: widgets.label({ content: 'If you enable this feature then user are able to select artists in the videos.' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        video_artist_rating: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable rating functionality in artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_artist_rating", '1').toString()
        }),
        video_artist_favourite: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable favourite feature on video artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_artist_favourite", '1').toString()
        }),

        video_artist_like: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable like feature on video artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_artist_like", '1').toString()
        }),
        video_artist_dislike: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable dislike feature on video artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_artist_dislike", '1').toString()
        }),

        video_artist_comment: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable comment feature on video artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_artist_comment", '1').toString()
        }),

        video_artist_comment_like: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable like feature on comment video artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_artist_comment_like", '1').toString()
        }),

        video_artist_comment_dislike: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable dislike feature on comment video artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "video_artist_comment_dislike", '1').toString()
        }),

    }, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {

            if(form.data['video_commission_type'] == "1"){
                if(parseFloat(form.data['video_commission_value']) < 0){
                    res.send({ "errors": { 'video_commission_value': "Please enter valid value." } })
                    return
                }
            }else if(form.data['video_commission_type'] == "2"){
                if(parseFloat(form.data['video_commission_value']) > 99.99 || parseFloat(form.data['video_commission_value']) < 0){
                    //error
                    res.send({ "errors": { 'video_commission_value': "Please enter valid value." } })
                    return
                }
            }

            delete form.data["video_upload_label"]

            delete form.data["twitchlabel"]
            delete form.data["youtubelabel"]
            delete form.data["facebooklabel"]
            delete form.data["video_upload_label"]
            
            delete form.data["video_ffmpeg_path_label"]
            delete form.data["video_donation_label"]
            delete form.data["video_artists_label"]
            delete form.data["artist_cnt_label"]
            delete form.data["enable_iframely_label"]
            delete form.data["enable_youtube_import_label"]
            delete form.data["enable_twitch_import_label"]
            delete form.data["enable_facebook_import_label"]
            delete form.data["iframely_disallow_sources_label"]
            form.data['video_commission_value'] = parseInt(form.data['video_commission_value'])
            settings.setSettings(req, form.data)
            res.send({ success: 1, message: "Setting Saved Successfully." })
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/videos/settings', { nav: url, reg_form: reg_form, title: "Videos Settings" });
        }
    });
}

exports.youtubeImport = async (req, res, next) => {
    let params = {}
    const query = { ...req.query }
    if (query.page) {
        params = { pageToken: query.page }
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


    if (query.search) {
        let LimitNum = parseInt(query.LimitNum) ? parseInt(query.LimitNum) : 50;
        var YouTube = require('youtube-node');
        var youTube = new YouTube();
        youTube.setKey(req.appSettings['youtube_api_key']);
        youTube.addParam('type', 'video');

        youTube.search(query.search, LimitNum, params, function (error, itemResults) {
            // res.send(itemResults)
            // return
            var ids = [];
            var videos = [];
            itemResults.items.forEach(function (item) {
                ids.push(item.id.videoId);
            });
            youTube.getById(ids.join(','), function (error, results) {
                results.items.forEach(function (video) {
                    var reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
                    var hours = 0, minutes = 0, seconds = 0, d, duration = 0;
                    if (reptms.test(video.contentDetails.duration)) {
                        var matches = reptms.exec(video.contentDetails.duration);
                        if (matches[1]) hours = Number(matches[1]);
                        if (matches[2]) minutes = Number(matches[2]);
                        if (matches[3]) seconds = Number(matches[3]);
                        d = hours * 3600 + minutes * 60 + seconds;
                        var h = Math.floor(d / 3600).toString();
                        var m = Math.floor(d % 3600 / 60).toString();
                        var s = Math.floor(d % 3600 % 60).toString();

                        var hDisplay = h.length > 0 ? (h.length < 2 ? "0" + h : h) : "00"
                        var mDisplay = m.length > 0 ? ":" + (m.length < 2 ? "0" + m : m) : ":00"
                        var sDisplay = s.length > 0 ? ":" + (s.length < 2 ? "0" + s : s) : ":00"
                        duration = hDisplay + mDisplay + sDisplay
                    }

                    var obj = {
                        id: video.id,
                        title: video.snippet.title,
                        description: video.snippet.description,
                        thumbnail_url: video.snippet.thumbnails.standard ? video.snippet.thumbnails.standard.url : (video.snippet.thumbnails.high ? video.snippet.thumbnails.high.url : video.snippet.thumbnails.default.url),
                        duration: duration,
                        tags: video.snippet.tags,
                        viewCount: video.statistics.viewCount,
                        likeCount: video.statistics.likeCount,
                        dislikeCount: video.statistics.dislikeCount,
                        favoriteCount: video.statistics.favoriteCount,
                        categoryId: video.snippet.categoryId,
                        link:"https://www.youtube.com/watch?v="+video.id
                    };
                    videos.push(obj);
                });
                const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
                var valid = false
                let paggingData = '<ul class="pagination pagination-md">'
                if (itemResults.prevPageToken) {
                    let previousUrl = req.protocol + '://' + req.get('host') + process.env.ADMIN_SLUG + "/videos/import/youtube"

                    let queryString = []

                    if (query.search) {
                        queryString.push("search=" + query.search)
                    }
                    if (query.limit) {
                        queryString.push("limit=" + query.limit)
                    }
                    if (itemResults.prevPageToken) {
                        queryString.push("page=" + itemResults.prevPageToken)
                    }
                    if (queryString.length) {
                        previousUrl += "?" + queryString.join("&")
                    }
                    valid = true
                    paggingData += '<li class="page-item previouspage" id="previous-page"><a class="page-link" href="' + previousUrl + '">Previous</a></li>'
                }
                if (itemResults.nextPageToken) {
                    let nextUrl = req.protocol + '://' + req.get('host') + process.env.ADMIN_SLUG + "/videos/import/youtube"

                    let queryString = []

                    if (query.search) {
                        queryString.push("search=" + query.search)
                    }
                    if (query.limit) {
                        queryString.push("limit=" + query.limit)
                    }
                    if (itemResults.nextPageToken) {
                        queryString.push("page=" + itemResults.nextPageToken)
                    }
                    if (queryString.length) {
                        nextUrl += "?" + queryString.join("&")
                    }
                    valid = true
                    paggingData += '<li class="page-item nextpage"><a class="page-link" id="next-page" href="' + nextUrl + '">Next</a></li>'
                }
                paggingData += '</ul>'
                if (!valid) {
                    paggingData = ""
                }
                res.render('admin/videos/youtube', {type:1, adminLink: process.env.ADMIN_SLUG, results: videos, categories: categories, query: query, paggingData: paggingData, nav: url, title: "Import Youtube Videos" });
            });
        });
    } else {
        const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
        res.render('admin/videos/youtube', {type:1, adminLink: process.env.ADMIN_SLUG, results: [], categories: categories, query: {}, paggingData: "", nav: url, title: "Import Youtube Videos" });
    }
}


exports.createImportedVideos = async (req, res, next) => {
    const videos = req.body.videos
    const category_id = req.body.category_id
    const subcategory_id = req.body.subcategory_id
    const subsubcategory_id = req.body.subsubcategory_id
    const user_email = req.body.user_email
    const like_count = req.body.like_count
    const dislike_count = req.body.dislike_count
    const view_count = req.body.view_count
    const favourite_count = req.body.favourite_count
    const adult = req.body.adult
    const is_sponsored = req.body.is_sponsored
    const is_featured = req.body.is_featured
    const is_hot = req.body.is_hot

    let user = {}

    if (user_email) {
        await globalModel.custom(req, "SELECT * FROM users where email = ?", [user_email]).then(result => {
            results = JSON.parse(JSON.stringify(result));
            if (results && result.length) {
                user = results[0]
            } else {
                user = req.user
            }
        })
    } else {
        user = req.user
    }

    const videoData = JSON.parse(videos)
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    videoData.forEach(video => {
        globalModel.custom(req, "SELECT * FROM videos WHERE type = 1 AND code = ?", [video.video_id]).then(resultData => {
            if (resultData) {
                let resultsDatas = JSON.parse(JSON.stringify(resultData));
                if (resultsDatas.length == 0) {
                    var videoObject = {}
                    videoObject['title'] = video.title
                    videoObject['description'] = video.description
                    videoObject['duration'] = video.duration
                    videoObject['tags'] = video.tags
                    videoObject['code'] = video.video_id
                    videoObject['type'] = req.body.type
                    videoObject['image'] = video.image
                    videoObject['completed'] = 1
                    videoObject['status'] = 1
                    videoObject['view_privacy'] = "everyone"
                    videoObject['approve'] = 1

                    videoObject["custom_url"] = uniqid.process('v')
                    videoObject["is_sponsored"] = is_sponsored ? is_sponsored : 0
                    videoObject["is_featured"] = is_featured ? is_featured : 0
                    videoObject["is_hot"] = is_hot ? is_hot : 0

                    videoObject["adult"] = adult ? adult : 0
                    videoObject["like_count"] = like_count ? like_count : 0
                    videoObject["dislike_count"] = dislike_count ? dislike_count : 0

                    videoObject["view_count"] = view_count ? view_count : 0
                    videoObject["favourite_count"] = favourite_count ? favourite_count : 0
                    videoObject["category_id"] = category_id ? category_id : 0
                    videoObject["subcategory_id"] = subcategory_id ? subcategory_id : 0
                    videoObject["subsubcategory_id"] = subsubcategory_id ? subsubcategory_id : 0

                    videoObject['owner_id'] = user.user_id
                    videoObject["creation_date"] = formatted

                    videoObject["modified_date"] = formatted

                    globalModel.create(req, videoObject, "videos").then(res => {

                    }).catch(err => { })
                }
            }
        }).catch(err => { })
    });
    res.send({ status: 1 })
}

exports.dailyMotionImport = async (req, res, next) => {
    let params = {}
    const query = { ...req.query }
    if (query.page) {
        params = { pageToken: query.page }
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


    if (query.search) {
        let LimitNum = parseInt(query.LimitNum) ? parseInt(query.LimitNum) : 50;
        var axios = require('axios');
        let page = 1
        if (req.params.page == '') {
            page = 1;
        } else {
            //parse int Convert String to number 
            page = parseInt(req.params.page) ? parseInt(req.params.page) : 1;
        }

        axios.get("https://api.dailymotion.com/videos?fields=id,tags,duration,description,thumbnail_url,title&page=" + page + "&limit=" + LimitNum + "&search=" + query.search).then(function (itemResults) {

            var videos = [];
            if (itemResults.data && itemResults.data.list) {
                itemResults.data.list.forEach(function (video) {


                    var  d, duration = 0;

                    d = video.duration
                    var h = Math.floor(d / 3600).toString();
                    var m = Math.floor(d % 3600 / 60).toString();
                    var s = Math.floor(d % 3600 % 60).toString();

                    var hDisplay = h.length > 0 ? (h.length < 2 ? "0" + h : h) : "00"
                    var mDisplay = m.length > 0 ? ":" + (m.length < 2 ? "0" + m : m) : ":00"
                    var sDisplay = s.length > 0 ? ":" + (s.length < 2 ? "0" + s : s) : ":00"
                    duration = hDisplay + mDisplay + sDisplay

                    var obj = {
                        id: video.id,
                        title: video.title,
                        description: video.description,
                        thumbnail_url: video.thumbnail_url,
                        duration: duration,
                        tags: video.tags.join(","),
                        link:"https://www.dailymotion.com/video/"+video.id
                    };
                    videos.push(obj);
                });
            }
            const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
            const paggingData = pagging.create(req, itemResults.data.total, page, '', LimitNum)

            res.render('admin/videos/youtube', {type:4, adminLink: process.env.ADMIN_SLUG, results: videos, categories: categories, query: query, paggingData: paggingData, nav: url, title: "Import Dailymotion Videos" });
        });
    } else {
        const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
        res.render('admin/videos/youtube', {type:4, adminLink: process.env.ADMIN_SLUG, results: [], categories: categories, query: {}, paggingData: "", nav: url, title: "Import Dailymotion Videos" });
    }
}