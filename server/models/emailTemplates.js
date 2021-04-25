module.exports = {
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                let sql = 'SELECT * FROM emailtemplates where 1 = 1'
                
                if(data && data.type){
                    condition.push(data.type)
                    sql += " and type = ?"
                }
                if(data && data.template_id){
                    condition.push(parseInt(data.template_id))
                    sql += " AND emailtemplate_id = ?"
                }
                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        reject(false)
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
}
