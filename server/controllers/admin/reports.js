const pagging = require("../../functions/pagging")
const globalModel = require("../../models/globalModel")
const reports = require("../../models/reports")
exports.index = async (req, res) => {
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
    if (query.type) {
        condition.push(query.type.toLowerCase())
        conditionalWhere += " AND LOwer(reports.type) LIKE CONCAT('%', ?,  '%')"
    }

    let results = []
    let totalCount = 0

    let sql = "SELECT COUNT(*) as totalCount FROM reports LEFT JOIN users on users.user_id = reports.owner_id  LEFT JOIN userdetails ON users.user_id = userdetails.user_id LEFT JOIN reportmessages on reportmessages.reportmessage_id = reports.reportmessage_id WHERE 1 = 1 AND reportmessages.reportmessage_id IS NOT NULL " + conditionalWhere
    await globalModel.custom(req, sql, condition).then(result => {
        totalCount = result[0].totalCount
    })

    if (totalCount > 0) {
        condition.push(LimitNum)
        condition.push((page - 1) * LimitNum)
        conditionalWhere += " ORDER BY reports.report_id DESC limit ? offset ?"
        let sqlQuery = "SELECT reports.*,userdetails.username,userdetails.displayname,reportmessages.description as messagereason FROM reports LEFT JOIN users on users.user_id = reports.owner_id LEFT JOIN userdetails on userdetails.user_id = reports.owner_id LEFT JOIN reportmessages on reportmessages.reportmessage_id = reports.reportmessage_id  WHERE 1 = 1 AND reportmessages.reportmessage_id IS NOT NULL " + conditionalWhere
        await globalModel.custom(req, sqlQuery, condition).then(result => {
            results = result
        })
    }
    const paggingData = pagging.create(req, totalCount, page, '', LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG, '');
    res.render('admin/reports/index', {loggedin_id: (req.user ? req.user.user_id : ""), loggedinLevel_id: (req.user ? req.user.level_id : ""), totalCount: totalCount, query: query, nav: url, results: results, title: "Manage Reports", paggingData: paggingData });
}

exports.dismiss = async (req,res,next) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/blogs";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    await globalModel.custom(req,'DELETE FROM reports WHERE report_id = ?',[id]).then(result => {
        res.redirect(backURL)
        return
    })
}

exports.delete = async (req,res,next) => {
    const id = req.params.id
    let backURL = req.header('Referer') || process.env.ADMIN_SLUG + "/blogs";
    if (!id || !req.user) {
        res.redirect(backURL)
        return
    }
    let report = {}
    await globalModel.custom(req,"SELECT * FROM reports WHERE report_id = ?",[id]).then(result => {
        report = result[0]
    })
    await globalModel.custom(req,'DELETE FROM reports WHERE report_id = ?',[id]).then(async result => {
        const type = report.type
        let typeName = type.replace(/\s$/, '')
        if(typeName.charAt( typeName.length-1 ) == "s") {
            typeName = typeName.slice(0, -1)
        }
        await globalModel.custom(req,'DELETE FROM '+(typeName == "reply" ? "comments" : type)+' WHERE '+(typeName == "reply" || typeName == "comments" ? "comment_id" : (typeName == "users" ? "username" : "custom_url"))+' = ?',[report.id]).then(result => {
            
        })

        res.redirect(backURL)
        return
    })
}