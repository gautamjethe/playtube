const flatCache = require("flat-cache")
const path = require('path');
module.exports = {
    getFetchedMenus: function (req, reset = false) {
        return new Promise(function (resolve, reject) {
            let cache = flatCache.load("siteMenus", path.resolve(req.cacheDir));
            let key = "__express__siteMenus"
            let cacheContent = cache.getKey(key)
            if (cacheContent && cacheContent != "{}" && reset == false) {
                req.siteMenus = cacheContent
                resolve(cacheContent)
            } else {
                req.getConnection(function (err, connection) {
                    connection.query('SELECT * FROM menus WHERE type = 1 AND enabled = 1 ORDER BY `order` DESC ', async function (err, results, fields) {
                        if (err)
                            reject("")
                        
                        const menus = []
                        const footerMenus = []
                        const bottomFooterMenus = []
                        const socialShareMenus = []
                        if (results) {
                            
                            results.forEach(function (result, index) {
                                let doc = JSON.parse(JSON.stringify(result))
                                if (doc.submenu_id == 0 && doc.subsubmenu_id == 0) {
                                    const docObject = doc
                                    //2nd level
                                    let sub = []
                                    results.forEach(function (subcatData, index) {
                                        let subcat = JSON.parse(JSON.stringify(subcatData))
                                        if (subcat.submenu_id == doc.menu_id) {
                                            let subsub = []
                                            results.forEach(function (subsubcatData, index) {
                                                let subsubcat = JSON.parse(JSON.stringify(subsubcatData))
                                                if (subsubcat.subsubmenu_id == subcat.menu_id) {
                                                    subsub.push(subsubcat)
                                                }
                                            });
                                            if (subsub.length > 0) {
                                                subcat["subsubmenus"] = subsub;
                                            }
                                            sub.push(subcat)
                                        }
                                    });
                                    if (sub.length > 0) {
                                        docObject["submenus"] = sub;
                                    }
                                    menus.push(docObject);
                                }
                            })
                            connection.query('SELECT * FROM menus WHERE type = 2 AND enabled = 1 ORDER BY `order` DESC ', function (err, results, fields) {
                                if (results && !err) {
                                    results.forEach(function (result, index) {
                                        let doc = JSON.parse(JSON.stringify(result))
                                        footerMenus.push(doc);
                                    })
                                }
                                connection.query('SELECT * FROM menus WHERE type = 3 AND enabled = 1 ORDER BY `order` DESC ', function (err, results, fields) {
                                    if (results && !err) {
                                        results.forEach(function (result, index) {
                                            let doc = JSON.parse(JSON.stringify(result))
                                            bottomFooterMenus.push(doc);
                                        })
                                    }
                                    connection.query('SELECT * FROM menus WHERE type = 4 AND enabled = 1 ORDER BY `order` DESC ', function (err, results, fields) {
                                        if (results && !err) {
                                            results.forEach(function (result, index) {
                                                let doc = JSON.parse(JSON.stringify(result))
                                                socialShareMenus.push(doc);
                                            })
                                        }
                                        cache.setKey(key, {menus:menus,footerMenus:footerMenus,bottomFooterMenus,bottomFooterMenus,socialShareMenus:socialShareMenus})
                                        cache.save()
                                        resolve(menus)
                                    });
                                });
                            });
                        } else {
                            resolve("")
                        }
                    })
                })
            }
        })
    },
    findAll: function (req, data,type = false) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                let sql = 'SELECT ' + (data && data.column ? data.column : "*") + ' FROM menus ' + (data && data.leftJoin ? data.leftJoin : "") + ' where 1 = 1'
                let condition = []

                if (data && data.menu_id) {
                    condition.push(data.menu_id)
                    sql += " AND menu_id != ?"
                }
                if(type){
                    condition.push(type)
                    sql += " AND type = ?"
                }
                if (data && data.groupBy)
                    sql += data.groupBy

                sql += " ORDER BY `order` DESC"

                connection.query(sql, condition, function (err, results, fields) {
                    if (err)
                        reject("")
                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level);
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    findById: function (id, req, res) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM menus WHERE menu_id = ?', [id], function (err, results, fields) {
                    if (err)
                        reject("")
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

    orderNext: function (req, res, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                let sql = "SELECT * FROM menus WHERE 1=1"

                if (data.menu_id) {
                    sql += " and submenu_id = 0 AND subsubmenu_id = 0 "
                }

                if (data.subsubcat_id) {
                    sql += " and subsubmenu_id = " + data.subsubcat_id
                }

                if (data.subcat_id) {
                    sql += " and submenu_id = " + data.subcat_id
                }
                sql += " ORDER BY `order` DESC limit 1 "
                connection.query(sql, function (err, results, fields) {
                    if (err)
                        reject("")
                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        if (!level) {
                            resolve(1)
                        } else {
                            if (level[0])
                                resolve(parseInt(level[0].order) + 1)
                            else
                                resolve(1)
                        }
                    } else {
                        resolve("");
                    }
                })
            })
        });
    }
}
