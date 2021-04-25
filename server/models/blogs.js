const privacyModel = require("../models/privacy")
const commonFunction = require("../functions/commonFunctions");

module.exports = {
    findById: function (id, req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM blogs WHERE approve = 1 AND blog_id = ?', [parseInt(id)], function (err, results) {
                    if (err)
                        reject(err)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    userBlogUploadCount: function (req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT COUNT(blog_id) as totalBlogs FROM blogs WHERE  owner_id = ?', [parseInt(req.user.user_id)], function (err, results) {
                    if (err)
                        reject(err)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    delete: function (id, req) {
        return new Promise(function (resolve) {
            req.getConnection(function (err, connection) {
                connection.query("SELECT * FROM blogs WHERE blog_id = ?", [parseInt(id)], function (err, results) {
                    const blog = JSON.parse(JSON.stringify(results))[0];
                    connection.query("DELETE FROM blogs WHERE blog_id = ?", [parseInt(id)], function (err, results) {
                        if (err)
                            resolve(false)
                        if (results) {
                            commonFunction.deleteImage(req,'',"","",blog);
                            connection.query("DELETE FROM comments WHERE type = 'blogs' && id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM favourites WHERE type = 'blogs' && id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM likes WHERE type = 'blogs' && id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM recently_viewed WHERE type = 'blogs' && id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM ratings WHERE type = 'blogs' && id = ?", [parseInt(id)], function () { })
                            connection.query("DELETE FROM notifications WHERE (object_type = 'blogs' && object_id = ?) OR (subject_type = 'blogs' && object_id = ?)", [parseInt(id),parseInt(id)], function () { })
                            connection.query("DELETE FROM reports WHERE type = ? AND id = ?", ["blogs",blog.custom_url], function () {
                            })
                            resolve(true)
                        } else {
                            resolve("");
                        }
                    })
                })
            })
        });
    },
    getBlogs: async function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(async function (err, connection) {
                let condition = []
                let owner_id = 0
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }
                let customSelect = ""
                if (data.orderby == "random") {
                    customSelect = ' FLOOR(1 + RAND() * blog_id) as randomSelect, '
                }
                let sql = 'SELECT blogs.*,'+customSelect+'likes.like_dislike,userdetails.displayname,userdetails.username,userdetails.verified,IF(blogs.image IS NULL || blogs.image = "","' + req.appSettings['blog_default_photo'] + '",blogs.image) as image,IF(userdetails.avtar IS NULL || userdetails.avtar = "",(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,favourites.favourite_id FROM blogs '
                
                
                sql += ' LEFT JOIN users on users.user_id = blogs.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id LEFT JOIN likes ON likes.id = blogs.blog_id AND likes.type = "blogs"  AND likes.owner_id =  ' + owner_id + '  LEFT JOIN favourites ON (favourites.id = blogs.blog_id AND favourites.type = "blogs" AND favourites.owner_id = ' + owner_id + ') '


                let orderbyField = false
                if (data.recentlyViewed) {
                    condition.push(parseInt(data.owner_id))
                    orderbyField = " recently_viewed.creation_date DESC "
                    sql += " INNER JOIN recently_viewed ON blogs.blog_id = recently_viewed.id AND recently_viewed.owner_id = ? AND recently_viewed.type='blogs' "
                }
                if (data.myrated) {
                    orderbyField = " ratings.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN ratings ON blogs.blog_id = ratings.id AND ratings.owner_id = ? AND ratings.type='blogs' "
                }
                if (data.myfav) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN favourites as f ON blogs.blog_id = f.id AND f.owner_id = ? AND f.type='blogs' "
                }
                if (data.mylike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON blogs.blog_id = l.id AND l.owner_id = ? AND l.type='blogs' AND l.like_dislike = 'like' "
                }
                if (data.mydislike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON blogs.blog_id = l.id AND l.owner_id = ? AND l.type='blogs' AND l.like_dislike = 'dislike' "
                }

                if (data.mycommented) {
                    orderbyField = " comments.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN comments ON blogs.custom_url = comments.id AND comments.owner_id = ? AND comments.type='blogs' "
                }
                sql += ' WHERE 1=1 '
                if (!data.myContent) {
                    sql += ' AND blogs.approve = 1 AND blogs.search = 1 AND blogs.draft = 1 '
                    if (!req.session.adult_allow && req.appSettings['blog_adult'] == 1) {
                       // sql += " AND blogs.adult = 0 "
                    }
                }

                await privacyModel.checkSQL(req,'blog','blogs','blog_id').then(result => {
                    if(result){
                        sql += " AND ( "+result+" )"
                    }
                })

                sql += " AND users.active = 1 AND users.approve = 1 "

                if (data.title) {
                    condition.push(data.title.toLowerCase())
                    sql += " AND LOWER(blogs.title) LIKE CONCAT('%', ?,  '%')"
                }

                if (data.owner_id && !data.myCustom) {
                    condition.push(parseInt(data.owner_id))
                    sql += " AND blogs.owner_id = ?"
                }
                
                if (data.is_featured) {
                    condition.push(parseInt(data.is_featured))
                    sql += " AND blogs.is_featured = ?"
                }
                if (data.is_not_hot) {
                    condition.push(1)
                    sql += " AND blogs.is_hot != ?"
                }
                if (data.is_not_featured) {
                    condition.push(1)
                    sql += " AND blogs.is_featured != ?"
                }
                if (data.is_not_sponsored) {
                    condition.push(1)
                    sql += " AND blogs.is_sponsored != ?"
                }
                if (data.is_hot) {
                    condition.push(parseInt(data.is_hot))
                    sql += " AND blogs.is_hot = ?"
                }
                if (data.is_sponsored) {
                    condition.push(parseInt(data.is_sponsored))
                    sql += " AND blogs.is_sponsored = ?"
                }
                if (data.not_blog_id) {
                    condition.push(parseInt(data.not_blog_id))
                    sql += " AND blog_id != ?"
                }
                if (data.category_id) {
                    let customBraces = ""
                    if (data.tags && data.related) {
                        customBraces = " ( "
                    }
                    condition.push(parseInt(data.category_id))
                    sql += " AND " + customBraces + " blogs.category_id = ?"
                }
                //related blogs
                if (data.tags) {
                    if (data.related && data.category_id)
                        sql += " OR ( "
                    else {
                        sql += " AND ( "
                    }
                    const splitVal = data.tags.split(',')
                    let counter = 1
                    splitVal.forEach(tag => {
                        condition.push(tag)
                        sql += " CONCAT(',', tags, ',') like CONCAT('%,', ?,  ',%') "
                        if (counter != splitVal.length) {
                            sql += " OR "
                        }
                        counter = counter + 1
                    });
                    sql += " ) "
                    if (data.related && data.category_id) {
                        sql += "  ) "
                    }
                }
                if (data.subcategory_id) {
                    condition.push(parseInt(data.subcategory_id))
                    sql += " AND blogs.subcategory_id = ?"
                }
                if (data.subsubcategory_id) {
                    condition.push(parseInt(data.subsubcategory_id))
                    sql += " AND blogs.subsubcategory_id = ?"
                }
                if (data.rating) {
                    condition.push(data.rating)
                    sql += " AND blogs.rating = ?"
                }

                if (data.custom_url) {
                    condition.push(data.custom_url)
                    sql += " AND blogs.custom_url =?"
                }
                if (data.mycommented) {
                    sql += " GROUP BY blogs.blog_id "
                }
                if (data.orderby == "random") {
                    sql += " ORDER BY randomSelect DESC"
                } else if (data.orderby) {
                    sql += " ORDER BY  " + data.orderby
                } else if (orderbyField) {
                    sql += " ORDER BY " + orderbyField
                } else {
                    sql += " ORDER BY blogs.blog_id desc "
                }

                if (data.limit) {
                    condition.push(data.limit)
                    sql += " LIMIT ?"
                }

                if (data.offset) {
                    condition.push(data.offset)
                    sql += " OFFSET ?"
                }
                connection.query(sql, condition, function (err, results) {
                    if (err)
                    resolve(false)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level);
                    } else {
                        resolve(false);
                    }
                })
            })
        })
    },
    findByCustomUrl: function (id, req, res, allowData = false) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM blogs WHERE custom_url = ?', [(id)], function (err, results) {
                    if (err)
                        reject(false)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        let blog = level[0]
                        if (!allowData && blog) {
                            delete blog['password']
                        }
                        if (blog) {
                            //remove disabled settings
                            if (req.appSettings['blog_favourite'] != 1) {
                                delete blog['favourite_count']
                            }
                            if (req.appSettings['blog_rating'] != 1) {
                                delete blog['rating']
                            }
                            if (req.appSettings['blog_featured'] != 1) {
                                delete blog['is_featured']
                            }
                            if (req.appSettings['blog_comment'] != 1) {
                                delete blog['comment_count']
                            }
                            if (req.appSettings['blog_like'] != 1) {
                                delete blog['like_count']
                            }
                            if (req.appSettings['blog_dislike'] != 1) {
                                delete blog['dislike_count']
                            }
                            if (req.appSettings['blog_sponsored'] != 1) {
                                delete blog['is_sponsored']
                            }
                            if (req.appSettings['blog_hot'] != 1) {
                                delete blog['is_hot']
                            }
                            if (req.appSettings['blog_adult'] != 1) {
                                delete blog['adult']
                            }
                        }
                        resolve(blog);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
}
