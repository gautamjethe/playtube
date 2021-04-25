module.exports = {
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                let sql = 'SELECT '+(data && data.column ? data.column : "*")+' FROM artists '+(data && data.leftJoin ? data.leftJoin : "")+' where 1 = 1'
                
                if(data && data.type){
                    condition.push(data.type)
                    sql += " and type = ?"
                }

                if(data && data.groupBy)
                    sql += data.groupBy
                if(data.verified_view){
                    sql += " ORDER BY verified DESC, view_count DESC"
                }else{
                    sql += " ORDER BY artists.artist_id DESC" 
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
    getPhotos:function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                condition.push(data.artist_id)
                let sql = 'SELECT * FROM artist_photos WHERE artist_id = ?'
                
                sql += " ORDER BY artist_photos.photo_id DESC" 
                
                if (data.limit) {
                    condition.push(data.limit)
                    sql += " LIMIT ?"
                }

                if (data.offset) {
                    condition.push(data.offset)
                    sql += " OFFSET ?"
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
    findById: function(id,req,res,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM artists WHERE artist_id = ?',[(id)],function(err,results,fields)
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
    findByCustomUrl: function(id,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM artists WHERE custom_url = ?',[(id)],function(err,results,fields)
                {
                    if(err)
                        reject(false)
                    
                    if(results){
                        const level = JSON.parse(JSON.stringify(results));
                        let artist = level[0]
                        resolve(artist);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    findByIds: function(ids,req,res,limit,offset,data = {}){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let owner_id = 0
                let condition= []
                if(req.user && req.user.user_id){
                    owner_id = req.user.user_id
                }

                let sql = "SELECT artists.*,likes.like_dislike,favourites.favourite_id FROM artists LEFT JOIN likes ON likes.id = artists.artist_id AND likes.type = 'artists'  AND likes.owner_id =  "+owner_id+"  LEFT JOIN favourites ON (favourites.id = artists.artist_id AND favourites.type = 'artists' AND favourites.owner_id = "+owner_id+") WHERE 1 = 1  "

                if(ids){
                    sql += " AND artist_id IN ("+ids+")"
                }
                if(data && data.type && !data.artistType){
                    condition.push(data.type)
                    sql += " and artists.type = ?"
                }
                
                if(data.artistType){
                    condition.push(data.artistType)
                    sql += " and artists.type = ?"
                }
                
                if(data.title){
                    condition.push(data.title.toLowerCase())
                    sql += " AND LOWER(artists.title) LIKE CONCAT('%', ?,  '%')"
                }

                if(data.owner_id){
                    condition.push(parseInt(data.owner_id))
                    sql += " AND artists.owner_id = ?"
                }
                if(data.is_featured){
                    condition.push(parseInt(data.is_featured))
                    sql += " AND artists.is_featured = ?"
                }
                if(data.is_not_hot){
                    condition.push(1)
                    sql += " AND artists.is_hot != ?"
                }
                if(data.is_not_featured){
                    condition.push(1)
                    sql += " AND artists.is_featured != ?"
                }
                if(data.is_not_sponsored){
                    condition.push(1)
                    sql += " AND artists.is_sponsored != ?"
                }
                if(data.is_hot){
                    condition.push(parseInt(data.is_hot))
                    sql += " AND artists.is_hot = ?"
                }
                if(data.is_sponsored){
                    condition.push(parseInt(data.is_sponsored))
                    sql += " AND artists.is_sponsored = ?"
                }
                if(data.not_artist_id){
                    condition.push(data.not_artist_id)
                    sql += " AND artist_id != ?"
                }
                if(data.category_id){
                    condition.push(parseInt(data.category_id))
                    sql += " AND  artists.category_id = ?"
                }
                if(data.subcategory_id){
                    condition.push(parseInt(data.subcategory_id))
                    sql += " AND artists.subcategory_id = ?"
                }
                if(data.subsubcategory_id){
                    condition.push(parseInt(data.subsubcategory_id))
                    sql += " AND artists.subsubcategory_id = ?"
                }
                if(data.rating){
                    condition.push(data.rating)
                    sql += " AND artists.rating = ?"
                }

                if(data.custom_url){
                    condition.push(data.custom_url)
                     sql += " AND artists.custom_url =?"
                }
                
                if(data.orderby){
                    sql += " ORDER BY  "+data.orderby
                }else{
                    sql += " ORDER BY artists.verified DESC, artists.view_count DESC"
                }
                
                sql += " limit "+limit
                if(offset)
                    sql += " offset "+offset

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
