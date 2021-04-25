module.exports = {
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                let sql = 'SELECT '+(data && data.column ? data.column : "*")+' FROM levels '+(data && data.leftJoin ? data.leftJoin : "")+' where 1 = 1'
                if(data && data.flagNotIn){
                    sql += " AND flag is NULL || flag NOT IN ("+data.flagNotIn+")"
                }
                if(data && data.typeNotIn){
                    sql += " AND type NOT IN ("+data.typeNotIn+")"
                }
                if(data && data.groupBy)
                    sql += data.groupBy
                
                sql += " ORDER BY levels.level_id DESC" 

                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    findById: function(id,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM levels WHERE level_id = ?',[id],function(err,results,fields)
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
    findByType: function(type,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM levels WHERE type = ?',[type],function(err,results,fields)
                {
                    if(err)
                        reject("")
                    if(results){
                        const levels = JSON.parse(JSON.stringify(results));
                        resolve(levels);
                    }else{
                        resolve("");
                    }
                })
            })
        });
    },
    getByType: function(type,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM levels WHERE flag = ?',[type],function(err,results,fields)
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
    }
}
