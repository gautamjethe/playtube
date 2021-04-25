module.exports = {
    isFavourite: function(id,type,req,res){
        return new Promise(function(resolve, reject) {
            if(!req.user){
                resolve(false)
                return false
            }
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM favourites WHERE type = ? AND id = ? AND owner_id = ? LIMIT 1',[type,id,req.user.user_id],function(err,results,fields)
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
                connection.query('INSERT INTO playlistvideos SET ? ',[{video_id:data.video_id,playlist_id:data.playlist_id,owner_id:req.user.user_id,creation_date:data.creation_date}],function(err,results,fields)
                    {
                        resolve(true)
                    }
                ) 
            })
        });
    },
}
