const notifications = require("./notifications")
module.exports = {
    isRated: function(data = {},req,res){
        
        return new Promise(function(resolve, reject) {
            if(!req.user){
                resolve(false)
                return
            }
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM ratings WHERE type = ? AND id = ? AND owner_id = ? LIMIT 1',[data.type,data.id,req.user.user_id],function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const rating = JSON.parse(JSON.stringify(results));
                        resolve(rating[0]);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    totalRating: function(data,req) {
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT COUNT(*) as count FROM ratings WHERE type = ? AND id = ? LIMIT 1',[data.type,data.id],function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const rating = JSON.parse(JSON.stringify(results));
                        resolve(rating[0]);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    ratingStars: function(data,req) {
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT COUNT(*) as count FROM ratings WHERE type = ? AND id = ? AND rating = ? LIMIT 1',[data.type,data.id,data.rating],function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const rating = JSON.parse(JSON.stringify(results));
                        resolve(rating[0]);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    getRating: function(data = {},req){
        return new Promise(function(resolve, reject) {
           
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM ratings WHERE type = ? AND id = ? AND owner_id = ? LIMIT 1',[data.type,data.id,req.user.user_id],function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const rating = JSON.parse(JSON.stringify(results));
                        resolve(rating[0]);
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
                //like_dislike likeType

                let column = "video_id"
                if(data.type == "channels"){
                    column = "channel_id"
                }else if(data.type == "blogs"){
                    column = "blog_id"
                }else if(data.type == "members"){
                    column = "user_id"
                }else if(data.type == "playlists"){
                    column = "playlist_id"
                }else if(data.type == "artists"){
                    column = "artist_id"
                }

                let notiType =   data.type + "_rating" 
                //liked
                connection.query('INSERT INTO ratings SET ? ON DUPLICATE KEY UPDATE rating = ?',[{type:data.type,id:data.id,owner_id:req.user.user_id,creation_date:data.creation_date,rating:data.rating},data.rating],function(err,results,fields)
                {
                    
                    if(err)
                        resolve(false)
                    if(results){
                        connection.query("SELECT " + (data.type == "members" ? "user_id" : "owner_id") + " FROM " + (data.type == "members" ? "users" : data.type) + " WHERE " + column + " = " + data.id, function (err, results, fields) {
                            if (results) {
                                const item = JSON.parse(JSON.stringify(results));
                                if (item || item[0][(data.type == "members" ? "user_id" : "owner_id")] != req.user.user_id) {
                                    notifications.insert(req, {owner_id:item[0][(data.type == "members" ? "user_id" : "owner_id")], type: notiType, subject_type: "users", subject_id: req.user.user_id, object_type: data.type, object_id: data.id, insert: true }).then(result => {

                                    }).catch(err => {

                                    })
                                }
                            }
                        })
                        //update counts
                        let total = 0
                        let counts = 0
                        let rating = 0
                        const conditionalData = data
                        connection.query("SELECT SUM(rating) as total FROM `ratings` where type = ? AND id = ?",[(data.type == "members" ? "members" : data.type),data.id],function(err,results,fields)
                        {
                            if(results){
                                const data = JSON.parse(JSON.stringify(results));
                                total = data[0].total
                                connection.query("SELECT COUNT(rating_id) as counts FROM `ratings` where type = ? AND id = ?",[(conditionalData.type == "members" ? "members" : conditionalData.type),conditionalData.id],function(err,results,fields)
                                {
                                    if(results){
                                        const data = JSON.parse(JSON.stringify(results));
                                        counts = data[0].counts
                                        rating = total/counts
                                        connection.query("UPDATE "+ (conditionalData.type == "members" ? "userdetails" : conditionalData.type) + " SET rating = "+rating+"  WHERE "+column+" = "+conditionalData.id,function(err,results,fields)
                                        {
                                        });
                                        resolve(rating);
                                    }
                                });
                                
                            }
                        });
                        
                    }else{
                        resolve(false);
                    }
                })
                
            })
        });
    },
}
