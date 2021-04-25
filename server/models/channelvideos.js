module.exports = {
    findAll: function(id,req,res,limit,offset){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let owner_id = 0
                if(req.user && req.user.user_id){
                    owner_id = parseInt(req.user.user_id)
                }
                let sql = "SELECT videos.*,likes.like_dislike,userdetails.displayname,userdetails.username,userdetails.verified,IF(videos.image IS NULL || videos.image = '','"+req.appSettings['video_default_photo']+"',videos.image) as image,IF(userdetails.avtar IS NULL || userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,watchlaters.watchlater_id,favourites.favourite_id,channelvideos.channelvideo_id FROM channelvideos LEFT JOIN videos ON channelvideos.video_id = videos.video_id  "  
                
                sql += " LEFT JOIN users on users.user_id = videos.owner_id LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN likes ON likes.id = videos.video_id AND likes.type = 'videos'  AND likes.owner_id =  "+owner_id+" LEFT JOIN watchlaters ON watchlaters.id = videos.video_id AND watchlaters.owner_id = "+owner_id+" LEFT JOIN favourites ON (favourites.id = videos.video_id AND favourites.type = 'videos' AND favourites.owner_id = "+owner_id+") WHERE channel_id = ? AND videos.video_id IS NOT NULL AND videos.status = 1 AND videos.approve = 1 AND videos.completed = 1 "
                sql += " ORDER BY channelvideos.creation_date DESC "
                sql += "limit "+limit +" offset "+offset
                
                connection.query(sql ,[id],function(err,results,fields)
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
    insert: function(data,req,channel_id){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('INSERT IGNORE INTO channelvideos ( `video_id`, `channel_id`, `owner_id`, `creation_date`) VALUES (?,?,?,?)',data,function(err,results,fields)
                {
                    if(err)
                        reject(false)
                    if(results){

                        connection.query("UPDATE channels SET total_videos = total_videos + 1  WHERE channel_id = "+channel_id,function(err,results,fields)
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
