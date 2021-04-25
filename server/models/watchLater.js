module.exports = {
    isActive: function(id,req,res){
        return new Promise(function(resolve, reject) {
            if(!req.user){
                resolve(false)
                return false
            }
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM watchlaters WHERE  id = ? AND owner_id = ? LIMIT 1',[id,req.user.user_id],function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const favourite = JSON.parse(JSON.stringify(results));
                        resolve(favourite[0]);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    insert: function(data,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){                
                if(data.watchLaterId){
                    //delete
                    connection.query('DELETE FROM watchlaters WHERE watchlater_id = ?',[data.watchLaterId],function(err,results,fields)
                    {
                        if(err)
                            resolve(false)
                        if(results){
                            resolve(true);
                        }else{
                            resolve(false);
                        }
                    })
                }else{
                    connection.query('INSERT INTO watchlaters SET ? ',[{id:data.id,owner_id:req.user.user_id,creation_date:data.creation_date}],function(err,results,fields)
                    {
                        if(err)
                            resolve(false)
                        if(results){
                            resolve(true);
                        }else{
                            resolve(false);
                        }
                    })
                }
            })
        });
    },
}
