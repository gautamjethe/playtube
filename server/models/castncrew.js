module.exports = {
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                let sql = 'SELECT '+(data && data.column ? data.column : "*")+',cast_crew_members.cast_crew_member_id as id,cast_crew_members.name as title FROM cast_crew_members '+(data && data.leftJoin ? data.leftJoin : "")+' where 1 = 1'
                
                if(data && data.type){
                    condition.push(data.type)
                    sql += " and type = ?"
                }
                if(data.name){
                    condition.push(data.name.toLowerCase())
                    sql += " AND LOWER(cast_crew_members.name) LIKE CONCAT('%', ?,  '%')"
                }
                if(data && data.groupBy)
                    sql += data.groupBy
                
                sql += " ORDER BY cast_crew_members.cast_crew_member_id DESC" 
                
                connection.query(sql,condition,function(err,results,fields)
                {
                    console.log(err)
                    if(err)
                        reject(false)
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
    getAllCrewMember:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                let sql = 'SELECT cast_crew.*,cast_crew_members.name,cast_crew_members.image FROM cast_crew LEFT JOIN cast_crew_members ON (cast_crew_members.cast_crew_member_id = cast_crew.cast_crew_member_id)  where 1 = 1 '
                
                if(data && data.resource_type){
                    condition.push(data.resource_type)
                    sql += " and resource_type = ?"
                }
                if(data && data.resource_id){
                    condition.push(data.resource_id)
                    sql += " and resource_id = ?"
                }

                if(data && data.cast_crew_id){
                    condition.push(data.cast_crew_id)
                    sql += " and cast_crew_id = ?"
                }

                
                
                sql += " ORDER BY cast_crew.cast_crew_id ASC" 
                
                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        reject([])
                    if(results){
                        const members = JSON.parse(JSON.stringify(results));
                        resolve(members);
                    }else{
                        resolve([]);
                    }
                })
            })
        });
    },
    getPhotos:function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                condition.push(data.resource_id)
                condition.push("cast_crew")
                let sql = 'SELECT * FROM photos WHERE resource_id = ? AND resource_type = ?'
                
                sql += " ORDER BY photos.photo_id DESC" 
                
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
                connection.query('SELECT * FROM cast_crew_members WHERE cast_crew_member_id = ?',[(id)],function(err,results,fields)
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
                connection.query('SELECT * FROM cast_crew_members WHERE custom_url = ?',[(id)],function(err,results,fields)
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

                let sql = "SELECT cast_crew_members.*,likes.like_dislike,favourites.favourite_id FROM cast_crew_members LEFT JOIN likes ON likes.id = cast_crew_members.cast_crew_member_id AND likes.type = 'cast_crew'  AND likes.owner_id =  "+owner_id+"  LEFT JOIN favourites ON (favourites.id = cast_crew_members.cast_crew_member_id AND favourites.type = 'cast_crew' AND favourites.owner_id = "+owner_id+") WHERE 1 = 1  "

                if(ids){
                    sql += " AND cast_crew_member_id IN ("+ids+")"
                }
                if(data && data.type && !data.artistType){
                    condition.push(data.type)
                    sql += " and cast_crew_members.type = ?"
                }
                
                if(data.artistType){
                    condition.push(data.artistType)
                    sql += " and cast_crew_members.type = ?"
                }
                
                if(data.title){
                    condition.push(data.title.toLowerCase())
                    sql += " AND LOWER(cast_crew_members.name) LIKE CONCAT('%', ?,  '%')"
                }

                
                if(data.not_cast_crew_member_id){
                    condition.push(data.not_cast_crew_member_id)
                    sql += " AND cast_crew_member_id != ?"
                }
                
                if(data.custom_url){
                    condition.push(data.custom_url)
                     sql += " AND cast_crew_members.custom_url =?"
                }
                
                sql += " ORDER BY  cast_crew_members.cast_crew_member_id DESC "
                
                
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
