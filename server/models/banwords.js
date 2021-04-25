module.exports = {
    find: function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT ban_id FROM banwords WHERE LOWER(text) = ?',[data.text.toLowerCase()],function(err,results,fields)
                {
                    if(err){
                        resolve(false)
                    } 
                    if(results && results.length){
                        const item = JSON.parse(JSON.stringify(results));
                        resolve(item[0]);
                    }
                    resolve(false)
                })
            })
        });
    },
}