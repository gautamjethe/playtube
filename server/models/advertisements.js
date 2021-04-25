module.exports = {
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                let sql = 'SELECT * FROM advertisements_admin '
                sql += ' JOIN  (SELECT CEIL(RAND() *  (SELECT MAX(ad_id)  FROM advertisements_admin WHERE 1 = 1 )) AS ad_id) AS p2 '

                sql += " AND active = 1 "
                sql += " AND advertisements_admin.ad_id >= p2.ad_id LIMIT 1 "


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
    }
}