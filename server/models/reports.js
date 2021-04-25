const date = require("node-datetime")
module.exports = {
    findAll: function (req, data = {}) {
        return new Promise(function (resolve) {
            req.getConnection(function (_, connection) {
                let condition = []
                let sql = 'SELECT * FROM reports WHERE 1 = 1 '

                if (data.type) {
                    condition.push(data.type)
                    sql += " AND type = ?"
                }
                if (data.id) {
                    condition.push(data.id)
                    sql += " AND id = ?"
                }
                if (data.owner_id) {
                    condition.push(data.owner_id)
                    sql += " AND owner_id = ?"
                }
                connection.query(sql, condition, function (err, results, fields) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const reports = JSON.parse(JSON.stringify(results))
                        resolve(reports)
                    } else {
                        resolve(false)
                    }
                })
            })
        });
    },
    insert: function ( req,data) {
        return new Promise(function (resolve) {
            req.getConnection(function (_, connection) {
                connection.query('SELECT report_id FROM reports WHERE id = ? AND type = ? AND owner_id = ?', [data.id, data.type, data.owner_id], function (err, results, fields) {
                    if (err)
                        resolve(false)
                    let existing = JSON.parse(JSON.stringify(results));
                    let report_id = false
                    if (existing && existing.length) {
                        report_id = existing[0]
                    }
                    if (report_id) {
                        //delete
                        connection.query('DELETE FROM reports WHERE report_id = ?', [report_id], function (err, results, fields) {
                            
                        })
                    }
                    let dataTime = date.create().format("Y-m-d H:M:S")
                    connection.query('INSERT INTO reports SET ? ', [{ id: data.id, owner_id: data.owner_id, creation_date: dataTime,type:data.type,reportmessage_id:data.reportmessage_id,description:data.description ? data.description : "" }], function (err, results, fields) {
                        console.log(err)
                        if (err)
                            resolve(false)
                        if (results) {
                            resolve(true)
                        } else {
                            resolve(false)
                        }
                    })
                })
            })
        });
    },
}
