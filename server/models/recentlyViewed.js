module.exports = {
    insert: function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let owner_id = 0
                let column = "video_id"
                if(data.type == "channels"){
                    column = "channel_id"
                }else if(data.type == "blogs"){
                    column = "blog_id"
                }else if(data.type == "members" || data.type == "users"){
                    column = "user_id"
                }else if(data.type == "artists"){
                    column = "artist_id"
                }else if(data.type == "playlists"){
                    column = "playlist_id"
                }
                let type = "view_count"
                            
                connection.query("UPDATE "+ (data.type == "members" ? "userdetails" : data.type) + " SET "+type+" = "+type+" + 1 WHERE "+column+" = "+data.id,function(err,results,fields)
                {
                    
                });

                if(req.user && req.user.user_id){
                    owner_id = req.user.user_id
                }
                if(owner_id == 0){
                    resolve(false)
                    return
                }
                if(parseInt(owner_id) == parseInt(data.owner_id)){
                    resolve(false)
                    return
                }
                var ip = req.headers['x-forwarded-for'] || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);
                connection.query('INSERT INTO recently_viewed SET ? ON DUPLICATE KEY UPDATE creation_date = ?',[{owner_id:owner_id,id:data.id,type:data.type,creation_date:data.creation_date,ip:ip},data.creation_date],function(err,results,fields)
                {
                    
                    if(err)
                        resolve(false)
                    if(results){
                        
                        resolve(true)
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    }
}
