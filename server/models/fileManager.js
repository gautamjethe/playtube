module.exports = {
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let condition = []
                let sql = 'SELECT '+data.column+' FROM file_manager '
                if(data.like && data.like == "image"){
                    condition.push(".png")
                    sql += " WHERE path LIKE CONCAT('%', ?,  '%') " 

                    condition.push(".jpg")
                    sql += " OR path LIKE CONCAT('%', ?,  '%') " 

                    condition.push(".jpeg")
                    sql += " OR path LIKE CONCAT('%', ?,  '%') " 

                    condition.push(".gif")
                    sql += " OR path LIKE CONCAT('%', ?,  '%') " 
                }
                if(data.like && data.like == "video"){
                    condition.push(".mp4")
                    sql += " WHERE path LIKE CONCAT('%', ?,  '%') " 
                }
                sql += " ORDER BY file_manager.file_id DESC " 

                if(data.limit){
                    condition.push(data['limit'])
                    sql += " LIMIT ? "
                }
                if(data.offset){
                    condition.push(data['offset'])
                    sql += " OFFSET ? "
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
    findById: function(id,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM file_manager WHERE file_id = ?',[id],function(err,results,fields)
                {
                    if(err)
                        reject("")
                    if(results){
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    }else{
                        resolve("");
                    }
                })
            })
        });
    },
}
