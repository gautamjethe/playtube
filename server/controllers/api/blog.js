const { validationResult } = require('express-validator'),
    fieldErrors = require('../../functions/error'),
    errorCodes = require("../../functions/statusCodes"),
    constant = require("../../functions/constant"),
    globalModel = require("../../models/globalModel"),
    dateTime = require('node-datetime'),
    uniqid = require('uniqid'),
    socketio = require("../../socket"),
    categoryModel = require("../../models/categories"),
    blogModel = require("../../models/blogs"),
    commonFunction = require("../../functions/commonFunctions"),
    notificationModel = require("../../models/notifications")

exports.delete = async (req, res) => {
    if (!req.item) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.invalid }).end();
    }

    await blogModel.delete(req.item.blog_id, req).then(result => {
        if (result) {
            commonFunction.deleteImage(req, res, "", "blog", req.item)
            socketio.getIO().emit('blogDeleted', {
                "blog_id": req.item.blog_id,
                "owner_id" : req.item.owner_id,
                "message": constant.blog.DELETED,
            });
        }
    })

    res.send({})

}
exports.browse = async (req, res) => {
    const queryString = req.query
    const limit = 13
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (limit - 1)
    const data = { limit: limit, offset: offset }
    data['type'] = queryString.type
    if (queryString.q && !queryString.tag) {
        data['title'] = queryString.q
    }
    if (queryString.type) {
        data['tags'] = queryString.tag
    }
    if (queryString.category_id) {
        data['category_id'] = queryString.category_id
        if (queryString.subcategory_id) {
            data['subcategory_id'] = queryString.subcategory_id
            if (queryString.subsubcategory_id) {
                data['subsubcategory_id'] = queryString.subsubcategory_id
            }
        }
    }
    
    if (queryString.sort == "latest") {
        data['orderby'] = "blogs.blog_id desc"
    } else if (queryString.sort == "favourite" && req.appSettings['blog_favourite'] == 1) {
        data['orderby'] = "blogs.favourite_count desc"
    } else if (queryString.sort == "view") {
        data['orderby'] = "blogs.view_count desc"
    } else if (queryString.sort == "like" && req.appSettings['blog_like'] == "1") {
        data['orderby'] = "blogs.like_count desc"
    } else if (queryString.sort == "dislike" && req.appSettings['blog_dislike'] == "1") {
        data['orderby'] = "blogs.dislike_count desc"
    } else if (queryString.sort == "rated" && req.appSettings['blog_rating'] == "1") {
        data['orderby'] = "blogs.rating desc"
    } else if (queryString.sort == "commented" && req.appSettings['blog_comment'] == "1") {
        data['orderby'] = "blogs.comment_count desc"
    }

    if (queryString.type == "featured" && req.appSettings['blog_featured'] == 1) {
        data['is_featured'] = 1
    } else if (queryString.type == "sponsored" && req.appSettings['blog_sponsored'] == 1) {
        data['is_sponsored'] = 1
    } else if (queryString.type == "hot" && req.appSettings['blog_hot'] == 1) {
        data['is_hot'] = 1
    }
    //get all blogs as per categories
    await blogModel.getBlogs(req, data).then(result => {
        if (result) {
            let pagging = false
            let items = result
            if (result.length > limit - 1) {
                items = result.splice(0, limit - 1);
                pagging = true
            }
            res.send({ blogs: items, pagging: pagging })
        }
    }).catch(err => {
        res.send({})
    })

}
exports.category = async (req, res) => {
    req.query.categoryId = req.params.id
    req.query.type = "blog"
    let category = {}
    let send = false
    let limit = 13;
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (limit - 1)
    await categoryModel.findByCustomUrl({ id: req.query.categoryId, type: req.query.type }, req, res).then(async result => {
        if (result) {
            category = result
            const data = { limit: limit, offset: offset }
            if (category.subcategory_id == 0 && category.subsubcategory_id == 0) {
                data['category_id'] = category.category_id
            } else if (category.subcategory_id > 0) {
                data['subcategory_id'] = category.category_id
            } else if (category.subsubcategory_id > 0) {
                data['subsubcategory_id'] = category.category_id
            }
            //get all blogs as per categories
            await blogModel.getBlogs(req, data).then(result => {
                if (result) {
                    let pagging = false
                    let items = result
                    if (result.length > limit - 1) {
                        items = result.splice(0, limit - 1);
                        pagging = true
                    }
                    send = true
                    res.send({ pagging: pagging, items: items })
                }
            })
        }
    }).catch(error => {
        res.send({ pagging: false, items: [] })
        return
    })
    if (!send)
        res.send({ pagging: false, items: [] })
}


exports.upload = async (req, res) => {
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    if (req.appSettings.upload_system == "S3") {
        req.query.imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi") {
        req.query.imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    } else {
        req.query.imageSuffix = req.APP_HOST
    }
    if (req.fileName) {
        res.send({ location: req.query.imageSuffix + "/upload/images/blogs/editors/" + req.fileName });
    } else {
        res.send({})
    }
}
exports.create = async (req, res) => {
    if (req.quotaLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.blog.QUOTAREACHED }], true), status: errorCodes.invalid }).end();
    }
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }
    // all set now
    let insertObject = {}
    const blogId = req.body.blogId
    let blogObject = {}
    if (blogId) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM blogs WHERE blog_id = ?", blogId).then(result => {
            if (result) {
                blogObject = JSON.parse(JSON.stringify(result))[0];
            }
        }).catch(err => {

        })
    } else {
        insertObject["owner_id"] = req.user.user_id;
        insertObject["custom_url"] = uniqid.process('b')
    }
    insertObject["title"] = req.body.title
    insertObject["description"] = req.body.description ? req.body.description : ""
    insertObject["category_id"] = req.body.category_id ? req.body.category_id : 0
    insertObject["subcategory_id"] = req.body.subcategory_id ? req.body.subcategory_id : 0
    insertObject["subsubcategory_id"] = req.body.subsubcategory_id ? req.body.subsubcategory_id : 0
    insertObject["adult"] = req.body.adult ? req.body.adult : 0
    insertObject["search"] = req.body.search ? req.body.search : 1
    insertObject["view_privacy"] = req.body.privacy ? req.body.privacy : 'everyone'
    if(typeof req.body.draft != "undefined"){
        insertObject['draft'] = req.body.draft
    }
    if (insertObject['view_privacy'] == "password" && req.body.password && req.body.password != "") {
        insertObject['password'] = req.body.password
        insertObject['is_locked'] = 1
    } else {
        if (insertObject["view_privacy"] == "password")
            insertObject["view_privacy"] = "everyone"
    }

    if (req.fileName) {
        insertObject['image'] = "/upload/images/blogs/" + req.fileName;
        if(Object.keys(blogObject).length && blogObject.image)
            commonFunction.deleteImage(req, res, blogObject.image, 'blog/image');
    }else if(!req.body.image){
        insertObject['image'] = "";
        if(Object.keys(blogObject).length && blogObject.image)
            commonFunction.deleteImage(req, res, blogObject.image, 'blog/image');
    }
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    if (!blogId) {
        insertObject["is_sponsored"] = req.levelPermissions['blog.sponsored'] == "1" ? 1 : 0
        insertObject["is_featured"] = req.levelPermissions['blog.featured'] == "1" ? 1 : 0
        insertObject["is_hot"] = req.levelPermissions['blog.hot'] == "1" ? 1 : 0
        if (req.levelPermissions["blog.auto_approve"] && req.levelPermissions["blog.auto_approve"] == "1")
            insertObject["approve"] = 1
        else
            insertObject["approve"] = 0
        insertObject["creation_date"] = formatted
    }
    if(typeof req.body.comments != "undefined"){
        insertObject['autoapprove_comments'] = parseInt(req.body.comments)
    }
    insertObject["modified_date"] = formatted
    let tags = req.body.tags
    if (tags && tags.length > 0)
        insertObject["tags"] = tags
    else {
        insertObject['tags'] = null
    }
    insertObject['publish_time'] = formatted
    if (blogId) {
        //update existing video
        await globalModel.update(req, insertObject, "blogs", 'blog_id', blogId).then(async result => {
            //update item count in categories if changed
            if (insertObject["category_id"] != blogObject.category_id) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + blogObject["category_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["subcategory_id"] != blogObject.subcategory_id || (insertObject["category_id"] == 0 && blogObject.subcategory_id)) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + blogObject["subcategory_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["subsubcategory_id"] != blogObject.subsubcategory_id || (insertObject["subcategory_id"] == 0 && blogObject.subsubcategory_id)) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + blogObject["subsubcategory_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["category_id"] != blogObject.category_id && insertObject["category_id"] > 0) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["category_id"]).then(result => {
                }).catch(err => { })
                if (insertObject["subcategory_id"] != blogObject.subcategory_id && insertObject["subcategory_id"] > 0) {
                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subcategory_id"]).then(result => {
                    }).catch(err => { })
                    if (insertObject["subsubcategory_id"] != blogObject.subsubcategory_id && insertObject["subsubcategory_id"] > 0) {
                        globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subsubcategory_id"]).then(result => {
                        }).catch(err => { })
                    }
                }
            }
            res.send({ blogId: blogId, message: constant.blog.EDIT, custom_url: blogObject.custom_url });
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    } else {
        //create new video
        await globalModel.create(req, insertObject, "blogs").then(async result => {
            if (result) {
                if (insertObject["category_id"] != 0) {
                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["category_id"]).then(result => {
                        if (insertObject["subcategory_id"] != 0) {
                            globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subcategory_id"]).then(result => {
                                if (insertObject["subsubcategory_id"] != 0) {
                                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subsubcategory_id"]).then(result => {
                                    }).catch(err => { })
                                }
                            }).catch(err => { })
                        }
                    }).catch(err => { })
                }
                notificationModel.insertFollowNotifications(req,{subject_type:"users",subject_id:req.user.user_id,object_type:"blogs",object_id:result.insertId,type:"members_followed"}).then(result => {

                }).catch(err => {

                })
                res.send({ blogId: result.insertId, message: constant.blog.SUCCESS, custom_url: insertObject['custom_url'] });
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }
}