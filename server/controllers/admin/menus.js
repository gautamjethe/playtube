const globalModel = require("../../models/globalModel")
const menuModel = require("../../models/menus")

exports.changeOrder = async (req, res) => {
    const id = req.body.id
    const nextid = req.body.nextid
    let order = req.body.articleorder
    order = order.split(',')
    const type = req.query.type
    if (id || nextid) {
        let menuData = {}
        await globalModel.custom(req, "SELECT * from menus WHERE menu_id = ?", [id]).then(result => {
            menuData = JSON.parse(JSON.stringify(result));
            menuData = menuData[0]
        })

        let categoryType = "", categoryTypeId = ""
        if (menuData.submenu_id != 0) {
            categoryType = 'submenu_id'
            categoryTypeId = menuData.submenu_id
        } else if (menuData.subsubmenu_id != 0) {
            categoryType = 'subsubmenu_id'
            categoryTypeId = menuData.subsubmenu_id
        } else
            categoryType = 'menu_id';

        let menus = []
        if (categoryTypeId) {
            await globalModel.custom(req, "SELECT menu_id FROM menus WHERE  " + categoryType + " = ?", [categoryTypeId]).then(results => {
                Object.keys(results).forEach(function (key) {
                    let result = JSON.parse(JSON.stringify(results[key]))
                    menus.push(result.menu_id.toString())
                })
            })
        } else {
            await globalModel.custom(req, "SELECT menu_id FROM menus WHERE  submenu_id = 0 AND subsubmenu_id = 0 AND type = "+type).then(results => {
                Object.keys(results).forEach(function (key) {
                    let result = JSON.parse(JSON.stringify(results[key]))
                    menus.push(result.menu_id.toString())
                })
            })
        }
        const newOrder = order.filter(Set.prototype.has, new Set(menus))
        let orderIndex = newOrder.length + 1
        let counter = 1
        newOrder.forEach(cat => {
            orderIndex = orderIndex - 1;
            globalModel.custom(req, "UPDATE menus SET `order` = " + orderIndex + " WHERE menu_id = " + cat).then(result => {
                if(newOrder.length == counter){
                    //updade menus
                    menuModel.getFetchedMenus(req, true).then(result => {
                    });
                }
                counter = counter+1
            })

        })

    }

    res.send(req.body)
}

exports.delete = async (req, res) => {
    let menu_id = req.params.menu_id
    let menuData = {}
    await globalModel.custom(req, "SELECT * from menus WHERE menu_id = ?", [menu_id]).then(result => {
        menuData = JSON.parse(JSON.stringify(result));
        menuData = menuData[0]
        if (menuData.subsubmenu_id == 0) {
            if (menuData.submenu_id != 0) {
                //select all subsubmenu_id                
                globalModel.custom(req, "DELETE from menus WHERE subsubmenu_id = ?", [menuData.menu_id]);
            } else {
                //select all submenu_id
                globalModel.custom(req, "SELECT * from menus WHERE submenu_id = ?", [menuData.menu_id]).then(result => {
                    result.forEach(cat => {
                        globalModel.custom(req, "DELETE from menus WHERE subsubmenu_id = ?", [cat.menu_id]);
                    })
                    globalModel.custom(req, "DELETE from menus WHERE submenu_id = ?", [menuData.menu_id]);
                })
            }
        }
    })

    await globalModel.delete(req, "menus", "menu_id", menu_id).then(result => {
        res.redirect(process.env.ADMIN_SLUG + "/menus")
        menuModel.getFetchedMenus(req, true).then(result => {
        });
    })
}

exports.index = async (req, res) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    //get all menus
    const menus = []
    const type = req.query.type ? req.query.type : 1
    if(type && type > 5 && type < 1){
        type = 1
    }
    await menuModel.findAll(req, {},type).then(result => {
        result.forEach(function (doc, index) {
            if (doc.submenu_id == 0 && doc.subsubmenu_id == 0) {
                const docObject = doc
                //2nd level
                let sub = []
                result.forEach(function (subcat, index) {
                    if (subcat.submenu_id == doc.menu_id) {
                        let subsub = []
                        result.forEach(function (subsubcat, index) {
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
    })
    res.render('admin/menus/index', { nav: url, title: "Manage Menus", menus: menus,type:type });
}

exports.add = async (req, res) => {
    let menu_id = req.params.menu_id
    let menuData = {}
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    if (menu_id) {

        await menuModel.findById(menu_id, req, res).then(result => {
            if (result) {
                menuData = result
            } else {
                res.redirect(process.env.ADMIN_SLUG + "/error")
            }
        })
    }
    if (Object.keys(req.body).length === 0 && menu_id) {
        res.render("admin/menus/edit", { menu_id: menu_id, menuData: menuData, nav: url, title: "Edit Menu" })
        return
    }
    if(!menu_id)
        menuData['type'] = req.body.type ? req.body.type : 1
    menuData['label'] = req.body.category_name;
    menuData['url'] = req.body.url
    menuData['icon'] = req.body.icon
    menuData['enabled'] = typeof req.body.enabled != "undefined" ? req.body.enabled : 1
    menuData['target'] = req.body.target ? req.body.target : "_self"
    cat_id = req.body.parent ? req.body.parent : -1


    let parentId = 0, seprator = "", tableSeprator = "", data = ""
    if (!menu_id) {

        if (cat_id != -1) {
            let catData = {}
            await menuModel.findById(cat_id, req, res).then(result => {
                catData = result
            })
            if (catData.submenu_id == 0) {
                menuData['submenu_id'] = cat_id;
                seprator = '&nbsp;&nbsp;&nbsp;';
                tableSeprator = '-&nbsp;';
                parentId = cat_id;
                await menuModel.orderNext(req, res, { 'subcat_id': cat_id }).then(result => {
                    menuData['order'] = result ? result : 1
                })
            } else {
                menuData['subsubmenu_id'] = cat_id;
                seprator = '3';
                tableSeprator = '--&nbsp;';
                await menuModel.orderNext(req, res, { 'subsubcat_id': cat_id }).then(result => {
                    menuData['order'] = result ? result : 1
                })
                parentId = cat_id;
            }
        } else {
            parentId = 0;
            seprator = '';
            await menuModel.orderNext(req, res, { 'menu_id': true }).then(result => {
                menuData['order'] = result ? result : 1
            })
            tableSeprator = '';
        }
    }
    //create category
    let categoryId = ""
    if (!menu_id) {
        await globalModel.create(req, menuData, "menus").then(category => {
            categoryId = category.insertId;
        })
        if (req.icon) {
            data = req.body.icon;
        } else {
            data = "---";
        }

        let editCat = '<a class="btn btn-primary btn-xs" href="' + process.env.ADMIN_SLUG + '/menus/add/' + categoryId + '">Edit</a>';
        let deleteCat = ' <a class="btn btn-danger btn-xs" onclick="preDeleteFn(this)" data-id="' + categoryId + '" data-toggle="modal" data-target="#modal-danger">Delete</a>'
        tableData = '<tr id="categoryid-' + categoryId + '"><td>' + tableSeprator + req.body.category_name + '<div class="hidden" style="display:none" id="inline_' + categoryId + '"><div class="parent">' + parentId + '</div></div></td><td>' + req.body.url + '</td><td>' + data + '</td><td>' + editCat + deleteCat + '</td></tr>';
        res.send({ 'seprator': seprator, 'tableData': tableData, 'id': categoryId, 'name': req.body.category_name, 'slugError': false })
        menuModel.getFetchedMenus(req, true).then(result => {
        });
    } else {
        await globalModel.update(req, menuData, "menus", "menu_id", menu_id).then(category => {
            res.send({ success: true })
            menuModel.getFetchedMenus(req, true).then(result => { });
        })
    }
}
