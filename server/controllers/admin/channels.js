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
const uniqid = require('uniqid')
const notifications = require("../../models/notifications")
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
    await categoryModel.findAll(req, { type: "channel" }).then(result => {
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
        conditionalWhere += " AND LOWER(channels.title) LIKE CONCAT('%', ?,  '%')"
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
        conditionalWhere += " AND channels.category_id = ?"
    }

    if (query.subcategory_id) {
        condition.push(query.subcategory_id)
        conditionalWhere += " AND channels.subcategory_id = ?"
    }
    if (query.subsubcategory_id) {
        condition.push(query.subsubcategory_id)
        conditionalWhere += " AND channels.subsubcategory_id = ?"
    }

    if (typeof query.adult != "undefined" && query.adult.length) {
        condition.push(query.adult)
        conditionalWhere += " AND channels.adult = ?"
    }
    if (typeof query.verified != "undefined" && query.verified.length) {
        condition.push(query.verified)
        conditionalWhere += " AND channels.verified = ?"
    }
    if (typeof query.approve != "undefined" && query.approve.length) {
        condition.push(query.approve)
        conditionalWhere += " AND channels.approve = ?"
    }

    if (typeof query.is_locked != "undefined" && query.is_locked.length) {
        condition.push(query.is_locked)
        conditionalWhere += " AND channels.is_locked = ?"
    }

    if (typeof query.featured != "undefined" && query.featured.length) {
        condition.push(query.featured)
        conditionalWhere += " AND channels.is_featured = ?"
    }
    if (typeof query.sponsored != "undefined" && query.sponsored.length) {
        condition.push(query.sponsored)
        conditionalWhere += " AND channels.is_sponsored = ?"
    }
    if (typeof query.hot != "undefined" && query.hot.length) {
        condition.push(query.hot)
        conditionalWhere += " AND channels.is_hot = ?"
    }

    conditionalWhere += " AND users.user_id IS NOT NULL "

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM channels LEFT JOIN users on users.user_id = channels.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id WHERE 1 = 1 " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY channels.channel_id DESC limit ? offset ?"
        let sqlQuery = "SELECT channels.*,userdetails.username,userdetails.displayname FROM channels LEFT JOIN users on users.user_id = channels.owner_id LEFT JOIN userdetails on userdetails.user_id = channels.owner_id  WHERE 1 = 1 " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/channels/index', { categories: categories, loggedin_id: (req.user ? req.user.user_id : ""), loggedinLevel_id: (req.user ? req.user.level_id : ""), totalCount: totalCount, query: query, nav: url, results: results, title: "Manage Channels", paggingData: paggingData });
}
exports.approve = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from channels where channel_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { approve: !item.approve }, "channels", "channel_id", id).then(result => {
                if (item.owner_id != req.user.user_id && !item.approve) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "channels_admin_approved", subject_type: "users", subject_id: item.owner_id, object_type: "channels", object_id: item.channel_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                } else if (item.owner_id != req.user.user_id && item.approve) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "channels_admin_disapproved", subject_type: "users", subject_id: item.owner_id, object_type: "channels", object_id: item.channel_id, insert: true }).then(result => {

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
exports.verified = async (req, res) => {
    const id = req.params.id
    if (!id || !req.user) {
        res.send({ error: 1 })
        return
    }
    await globalModel.custom(req, "SELECT * from channels where channel_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { verified: !item.verified }, "channels", "channel_id", id).then(result => {
                if (item.owner_id != req.user.user_id && !item.verified) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "channels_verified", subject_type: "users", subject_id: item.owner_id, object_type: "channels", object_id: item.channel_id, insert: true }).then(result => {

                    }).catch(err => {

                    })
                }
                res.send({ status: !item.verified })
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
    await globalModel.custom(req, "SELECT * from channels where channel_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { is_featured: !item.is_featured }, "channels", "channel_id", id).then(result => {
                if (item.owner_id != req.user.user_id && !item.is_featured) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "channels_featured", subject_type: "users", subject_id: item.owner_id, object_type: "channels", object_id: item.channel_id, insert: true }).then(result => {

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
    await globalModel.custom(req, "SELECT * from channels where channel_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { is_sponsored: !item.is_sponsored }, "channels", "channel_id", id).then(result => {
                if (item.owner_id != req.user.user_id && !item.is_sponsored) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "channels_featured", subject_type: "users", subject_id: item.owner_id, object_type: "channels", object_id: item.channel_id, insert: true }).then(result => {

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
    await globalModel.custom(req, "SELECT * from channels where channel_id = ?", id).then(async result => {
        if (result && result.length) {
            let item = result[0]
            await globalModel.update(req, { is_hot: !item.is_hot }, "channels", "channel_id", id).then(result => {
                if (item.owner_id != req.user.user_id && !item.is_hot) {
                    notifications.insert(req, { owner_id: item.owner_id, type: "channels_featured", subject_type: "users", subject_id: item.owner_id, object_type: "channels", object_id: item.channel_id, insert: true }).then(result => {

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
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/channels";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    await channelModel.delete(id, req).then(result => {
        res.redirect(backURL)
        return
    })
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
        commonFunctions.deleteImage(req, res, existingArtist.image, "channel/artist")
    }

    globalModel.delete(req, "artists", "artist_id", id).then(result => {
        res.redirect(process.env.ADMIN_SLUG + "/channels/artists/")
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
            required: true,
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
            value: existingArtist.file
        })
    }, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            delete form.data["file"]
            if (req.fileName) {
                form.data["image"] = "/upload/images/channels/artists/" + req.fileName
            }
            if (existingArtist.image && req.fileName) {
                commonFunctions.deleteImage(req, res, existingArtist.image, "artist/channel")
            }
            if (!artist_id) {
                form.data['custom_url'] = uniqid.process('ca')
                form.data['type'] = "channel"
                globalModel.create(req, form.data, 'artists')
            } else
                globalModel.update(req, form.data, 'artists', 'artist_id', artist_id)

            res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/channels/artists" })
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {

            res.render('admin/channels/artists/create', { imageSuffix: imageSuffix, nav: url, reg_form: reg_form, title: (!artist_id ? "Add" : "Edit") + " Channel Artist" });
        }
    });
}

exports.artists = async (req, res) => {
    //get all artists
    let artists = []

    await artistsModel.findAll(req, { type: "channel" }).then(results => {
        artists = results
    })
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3") {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi") {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render("admin/channels/artists", {imageSuffix:imageSuffix, results: artists, title: "Manage Channels Artists", nav: url })

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
            await globalModel.custom(req, "SELECT category_id FROM categories WHERE show_channel = 1 AND " + categoryType + " = ?", [categoryTypeId]).then(results => {
                Object.keys(results).forEach(function (key) {
                    let result = JSON.parse(JSON.stringify(results[key]))
                    categories.push(result.category_id.toString())
                })
            })
        } else {
            await globalModel.custom(req, "SELECT category_id FROM categories WHERE show_channel = 1 AND  subcategory_id = 0 AND subsubcategory_id = 0").then(results => {
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
                        globalModel.custom(req, "UPDATE channels SET subsubcategory_id = 0 WHERE subsubcategory_id = ?", [cat.category_id])
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
                                    commonFunctions.deleteImage(req, res, cat.image, "channel/category")
                                }
                                globalModel.custom(req, "UPDATE channels SET subsubcategory_id = 0 WHERE subsubcategory_id = ?", [cat.category_id])
                            })
                            globalModel.custom(req, "DELETE from categories WHERE subsubcategory_id = ?", [cat.category_id]);
                        })
                        if (cat.image) {
                            commonFunctions.deleteImage(req, res, cat.image, "channel/category")
                        }
                        globalModel.custom(req, "UPDATE channels SET subcategory_id = 0 WHERE subcategory_id = ?", [cat.category_id])
                    })
                    globalModel.custom(req, "DELETE from categories WHERE subcategory_id = ?", [categoryData.category_id]);
                })
            }
        }
    })
    if (categoryData.image) {
        commonFunctions.deleteImage(req, res, categoryData.image, "channel/category")
    }
    await globalModel.delete(req, "categories", "category_id", category_id).then(result => {
        res.redirect(process.env.ADMIN_SLUG + "/channels/categories")
    })
}

exports.categories = async (req, res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    //get all categories
    const categories = []
    await categoryModel.findAll(req, { type: "channel" }).then(result => {
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
    res.render('admin/channels/categories', {imageSuffix:imageSuffix, nav: url, title: "Manage Channels Categories", categories: categories });
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
        res.render("admin/channels/editCategories", {imageSuffix:imageSuffix, category_id: category_id, categoryData: categoryData, nav: url, title: "Edit Channel Category" })
        return
    }

    if (req.imageError) {
        res.send({ 'imageError': true })
        return
    }

    categoryData['title'] = req.body.category_name;
    categoryData['slug'] = req.body.slug
    cat_id = req.body.parent

    if (category_id && categoryData.image && req.fileName) {
        //remove image
        commonFunctions.deleteImage(req, res, categoryData.image, "channel/category")
    }
    if (req.fileName) {
        categoryData["image"] = "/upload/images/categories/channels/" + req.fileName
    }
    let slugExists = false
    await categoryModel.findAll(req, { slug: req.body.slug, type: "channel", category_id: category_id }).then(result => {
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
        categoryData["show_channel"] = 1;
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

        let editCat = '<a class="btn btn-primary btn-xs" href="' + process.env.ADMIN_SLUG + '/channels/categories/add/' + categoryId + '">Edit</a>';
        let deleteCat = ' <a class="btn btn-danger btn-xs" onclick="preDeleteFn(this)" data-id="' + categoryId + '" data-toggle="modal" data-target="#modal-danger">Delete</a>'
        tableData = '<tr id="categoryid-' + categoryId + '"><td>' + data + '</td><td>' + tableSeprator + req.body.category_name + '<div class="hidden" style="display:none" id="inline_' + categoryId + '"><div class="parent">' + parentId + '</div></div></td><td>' + req.body.slug + '</td><td>' + editCat + deleteCat + '</td></tr>';
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
        deleteOptions["2"] = "Yes, allow to delete other users channels."
        viewOptions["2"] = "Yes, allow to view private and locked channels of users."
        editOptions["2"] = "Yes, allow to edit everyones channels."
    }
    viewOptions["0"] = "No, do not allow to view channels."
    viewOptions["1"] = "Yes, allow to view channels."

    deleteOptions["1"] = "Yes, allow to delete own channels."
    deleteOptions["0"] = "No, do not allow channels deletion."

    editOptions["1"] = "Yes, allow to edit own channels."
    editOptions["0"] = "No,do not edit channels."

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
        let formFieldsPublic = {
            create: fields.string({
                choices: { "1": "Yes, allow to create channels", "0": "No, do not allow to create channels" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Allow member to create channels",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["channel.create"] ? cacheContent["channel.create"].toString() : 1
            })
        }
        formFields = { ...formFields, ...formFieldsPublic }
    }

    let formFieldsView = {
        view: fields.string({
            choices: viewOptions,
            widget: widgets.select({ "classes": ["select"] }),
            label: "Allow member to view channels",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: cacheContent["channel.view"] ? cacheContent["channel.view"].toString() : 1
        }),

    }
    formFields = { ...formFields, ...formFieldsView }


    if (flag != "public") {
        let formFields1 = {
            edit: fields.string({
                choices: editOptions,
                widget: widgets.select({ "classes": ["select"] }),
                label: "Allow member to edit channels",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["channel.edit"] ? cacheContent["channel.edit"].toString() : 1
            }),
            delete: fields.string({
                choices: deleteOptions,
                widget: widgets.select({ "classes": ["select"] }),
                label: "Allow member to delete channels",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["channel.delete"] ? cacheContent["channel.delete"].toString() : 1
            }),
            quota: fields.string({
                label: "How many channels member can create? Enter 0 for unlimited",
                validators: [validators.integer('Enter integer value only.')],
                cssClasses: { "field": ["form-group"] },
                widget: widgets.text({ "classes": ["form-control"] }),
                value: cacheContent["channel.quota"] ? cacheContent["channel.quota"].toString() : 0
            }),

            sponsored: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Auto Mark Channel as Sponsored",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["channel.sponsored"] ? cacheContent["channel.sponsored"].toString() : 1
            }),
            featured: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Auto Mark Channel as Featured",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["channel.featured"] ? cacheContent["channel.featured"].toString() : 1
            }),
            hot: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Auto Mark Channel as Hot",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["channel.hot"] ? cacheContent["channel.hot"].toString() : 1
            }),
            verified: fields.string({
                choices: { "1": "Yes", "0": "No" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Auto Mark Channel as Verified",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["channel.verified"] ? cacheContent["channel.verified"].toString() : 1
            }),

            auto_approve: fields.string({
                choices: { "1": "Yes, auto approve channels", "0": "No, do not auto approve channels" },
                widget: widgets.select({ "classes": ["select"] }),
                label: "Auto Approve Channels",
                fieldsetClasses: "form_fieldset",
                cssClasses: { "field": ["form-group"] },
                value: cacheContent["channel.auto_approve"] ? cacheContent["channel.auto_approve"].toString() : 1
            }),

        }
        formFields = { ...formFields, ...formFields1 }
    }
    var reg_form = forms.create(formFields, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            permission.insertUpdate(req, res, form.data, level_id, "channel").then(result => {
                res.send({ success: 1, message: "Operation performed successfully.", url: process.env.ADMIN_SLUG + "/channels/levels/" + level_id })
            })
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/channels/levels', { nav: url, reg_form: reg_form, title: "Channels Member Role Settings" });
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


    var reg_form = forms.create({
        enable_channel: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable channel feature on your website?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "enable_channel", '1').toString()
        }),
        channel_favourite: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable favourite feature on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_favourite", '1').toString()
        }),


        channel_like: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable like feature on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_like", '1').toString()
        }),
        channel_dislike: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable dislike feature on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_dislike", '1').toString()
        }),

        channel_comment: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable comment feature on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_comment", '1').toString()
        }),

        channel_comment_like: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable like feature on channels comment?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_comment_like", '1').toString()
        }),

        channel_comment_dislike: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable dislike feature on channels comment?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_comment_dislike", '1').toString()
        }),

        channel_rating: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable rating feature on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_rating", '1').toString()
        }),

        channel_featured: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable featured label on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_featured", '1').toString()
        }),

        channel_sponsored: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable sponsored label on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_sponsored", '1').toString()
        }),

        channel_hot: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable hot label on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_hot", '1').toString()
        }),
        channel_verified: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable verified icon on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_verified", '1').toString()
        }),
        channel_adult: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable adult marking on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_adult", '1').toString()
        }),

        channel_support: fields.string({
            choices: { "1": "Yes", "0": "No" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Allow user to set support button on channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_support", '0').toString()
        }),
        channel_support_commission_type: fields.string({
            choices: { "1": "Fixed Price", "2": "Percentage" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Commission Type of support channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_support_commission_type", '1').toString()
        }),
        channel_support_commission_value: fields.string({
            label: "Get Commission from support channels (put 0 if you not want comission.)",
            cssClasses: { "field": ["form-group"] },
            widget: widgets.text({ "classes": ["form-control"] }),
            value: settings.getSetting(req, "channel_support_commission_value", '')
        }),


        channel_default_photo: fields.string({
            label: "Default Channel Photo",
            choices: files,
            required: false,
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_default_photo", "").toString()
        }),
        channel_default_cover_photo: fields.string({
            label: "Default Channel Cover Photo",
            choices: files,
            required: false,
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_default_cover_photo", "").toString()
        }),
        channel_category_default_photo: fields.string({
            label: "Default Channel Category  Photo",
            choices: files,
            required: false,
            widget: widgets.select({ "classes": ["select"] }),
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_category_default_photo", "").toString()
        }),




        artist_cnt_label: fields.string({
            widget: formFunctions.makeClickable({ content: '<h2 style="text-align: center;margin: 40px;text-decoration: underline;">Channel Artists Settings</h2>', replace: [] }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),

        channel_artists: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable artists functionality in channels?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_artists", '1').toString()
        }),

        channel_artists_label: fields.string({
            widget: widgets.label({ content: 'If you enable this feature then user are able to select artists in the channels.' }),
            cssClasses: { "field": ["form-group", "form-description"] },
        }),
        channel_artist_rating: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable rating functionality in artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_artist_rating", '1').toString()
        }),
        channel_artist_favourite: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable favourite feature on channel artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_artist_favourite", '1').toString()
        }),

        channel_artist_like: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable like feature on channel artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_artist_like", '1').toString()
        }),
        channel_artist_dislike: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable dislike feature on channel artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_artist_dislike", '1').toString()
        }),

        channel_artist_comment: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable comment feature on channel artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_artist_comment", '1').toString()
        }),

        channel_artist_comment_like: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable like feature on comment channel artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_artist_comment_like", '1').toString()
        }),

        channel_artist_comment_dislike: fields.string({
            choices: { "1": "Enabled", "0": "Disabled" },
            widget: widgets.select({ "classes": ["select"] }),
            label: "Enable dislike feature on comment channel artists?",
            fieldsetClasses: "form_fieldset",
            cssClasses: { "field": ["form-group"] },
            value: settings.getSetting(req, "channel_artist_comment_dislike", '1').toString()
        }),
    }, { validatePastFirstError: true });
    reg_form.handle(req, {
        success: function (form) {
            delete form.data["channel_upload_label"]
            delete form.data["channel_ffmpeg_path_label"]
            delete form.data["channel_donation_label"]
            delete form.data["channel_artists_label"]
            delete form.data['artist_cnt_label']

            settings.setSettings(req, form.data)
            res.send({ success: 1, message: "Setting Saved Successfully." })
        },
        error: function (form) {
            const errors = formFunctions.formValidations(form);
            res.send({ errors: errors });
        },
        other: function (form) {
            res.render('admin/channels/settings', { nav: url, reg_form: reg_form, title: "Channels Settings" });
        }
    });
}