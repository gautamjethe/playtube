module.exports = {
    findAll: function(id,req,res,limit,offset){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){


                let owner_id = 0
                if(req.user && req.user.user_id){
                    owner_id = parseInt(req.user.user_id)
                }
                let sql = "SELECT playlists.*,likes.like_dislike,userdetails.displayname,userdetails.username,userdetails.verified,IF(playlists.image IS NULL || playlists.image = '','"+req.appSettings['playlist_default_photo']+"',playlists.image) as image,IF(userdetails.avtar IS NULL || userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,favourites.favourite_id,channelplaylists.channelplaylist_id FROM channelplaylists LEFT JOIN playlists ON channelplaylists.playlist_id = playlists.playlist_id  "  
                
                sql += " LEFT JOIN users on users.user_id = playlists.owner_id LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN likes ON likes.id = playlists.playlist_id AND likes.type = 'playlists'  AND likes.owner_id =  "+owner_id+"  LEFT JOIN favourites ON (favourites.id = playlists.playlist_id AND favourites.type = 'playlists' AND favourites.owner_id = "+owner_id+") WHERE channel_id = ? AND playlists.playlist_id IS NOT NULL AND playlists.approve = 1 "
                sql += " ORDER BY channelplaylists.creation_date DESC "
                sql += "limit "+limit +" offset "+offset
                connection.query(sql ,[id],function(err,results,fields)
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
    insert: function(data,req,channel_id){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('INSERT IGNORE INTO channelplaylists ( `playlist_id`, `channel_id`, `owner_id`, `creation_date`) VALUES (?,?,?,?)',data,function(err,results,fields)
                {
                    if(err)
                    resolve(false)
                    if(results){
                        connection.query("UPDATE channels SET total_playlists = total_playlists + 1  WHERE channel_id = "+channel_id,function(err,results,fields)
                            {
                            });
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
}
