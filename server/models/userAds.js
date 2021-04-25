module.exports = {
    getads:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                let sql = 'SELECT * FROM advertisements_user WHERE 1 = 1 '
                
                if(data.title){
                    condition.push(data.title.toLowerCase())
                    sql += " AND LOWER(advertisements_user.title) LIKE CONCAT('%', ?,  '%')"
                }
                if(data.name){
                    condition.push(data.name.toLowerCase())
                    sql += " AND LOWER(advertisements_user.name) LIKE CONCAT('%', ?,  '%')"
                }

                if(data.category_id){
                    condition.push(parseInt(data.category_id))
                    sql += " AND advertisements_user.category_id = ?"
                }
                if(data.subcategory_id){
                    condition.push(parseInt(data.subcategory_id))
                    sql += " AND advertisements_user.subcategory_id = ?"
                }
                if(data.subsubcategory_id){
                    condition.push(parseInt(data.subsubcategory_id))
                    sql += " AND advertisements_user.subsubcategory_id = ?"
                }

                if(data.owner_id){
                    condition.push(parseInt(data.owner_id))
                    sql += " AND advertisements_user.owner_id = ?"
                }

                sql += " ORDER BY ad_id DESC "

                if (data.limit) {
                    condition.push(data.limit)
                    sql += " LIMIT ?"
                }

                if (data.offset) {
                    condition.push(data.offset)
                    sql += " OFFSET ?"
                }

                
                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        reject("")
                    if(results){
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level);
                    }else{
                        resolve("");
                    }
                })
            })
        });
    }, 
    findById: function (id, req, res) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM advertisements_user WHERE ad_id = ?', [parseInt(id)], function (err, results, fields) {
                    if (err)
                        reject(err)
                    if (results) {
                        const ad = JSON.parse(JSON.stringify(results));
                        resolve(ad[0]);
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    userAdsUploadCount: function (req, res) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT COUNT(ad_id) as totalAds FROM advertisements_user WHERE  owner_id = ?', [parseInt(req.user.user_id)], function (err, results, fields) {
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
}