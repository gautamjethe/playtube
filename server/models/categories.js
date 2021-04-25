module.exports = {
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let sql = 'SELECT '+(data && data.column ? data.column : "*")+',IF(categories.image IS NULL || categories.image = "","'+req.appSettings[data.type+'_default_photo']+'",categories.image) as image FROM categories '+(data && data.leftJoin ? data.leftJoin : "")+' where 1 = 1'
                let condition = []
                if(data && data.type){
                    if(data.type == "video")
                        sql += " AND show_video = 1 "
                    if(data.type == "channel")
                        sql += " AND show_channel = 1 "
                    if(data.type == "blog")
                        sql += " AND show_blog = 1 "
                    if(data.type == "movie")
                        sql += " AND show_movies = 1 "
                    if(data.type == "series")
                        sql += " AND show_series = 1 "
                }
                if(data && data.onlyCategories){
                    sql += " AND subcategory_id = 0 AND subsubcategory_id = 0"
                }
                if(data && data.item_count){
                    condition.push(0)
                    sql += " AND item_count > ?"
                }
                if(data && data.slug){
                    condition.push(data.slug)
                    sql += " AND slug = ? "
                }
                if(data && data.category_id){
                    condition.push(parseInt(data.category_id))
                    sql += " AND category_id != ?"
                }
                if(data && data.show_home){
                    condition.push(parseInt(data.show_home))
                    sql += " AND show_home != ?"
                }
                if(data && data.subcategory_id){
                    condition.push(parseInt(data.subcategory_id))
                    sql += " AND subcategory_id = ?"
                }
                if(data && data.subsubcategory_id){
                    condition.push(parseInt(data.subsubcategory_id))
                    sql += " AND subsubcategory_id = ?"
                }
                if(data && data.groupBy)
                    sql += data.groupBy
                

                if(data && data.orderBy){
                    sql += " ORDER BY "+data.orderBy
                }else
                    sql += " ORDER BY `order` DESC" 


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
    findByCustomUrl: function(data,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let condition = []
                condition.push(data.id)
                let sql  = 'SELECT * FROM categories WHERE slug = ? '

                if(data.type == "blog"){
                    sql += " AND show_blog = 1"
                }else if(data.type == "video"){
                    sql += " AND show_video = 1"
                }else if(data.type == "channel"){
                    sql += " AND show_channel = 1"
                }

                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    findById: function(id,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM categories WHERE category_id = ?',[parseInt(id)],function(err,results,fields)
                {
                    if(err)
                        reject(false)
                    if(results){
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    
    orderNext: function(req,res,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let sql = "SELECT * FROM categories WHERE 1=1"

                if(data.category_id){
                    sql += " and subcategory_id = 0 AND subsubcategory_id = 0 "
                }

                if(data.subsubcat_id){
                    sql += " and subsubcategory_id = "+parseInt(data.subsubcat_id)
                }
                
                if(data.subcat_id){
                    sql += " and subcategory_id = "+parseInt(data.subcat_id)
                }
                sql += " ORDER BY `order` DESC limit 1 "
                connection.query(sql,function(err,results,fields)
                {
                    if(err)
                        reject("")
                    if(results){
                        const level = JSON.parse(JSON.stringify(results));
                        if(!level){
                            resolve(1)
                        }else{
                            if(level[0])
                                resolve(parseInt(level[0].order) + 1)
                            else
                                resolve(1)
                        }
                    }else{
                        resolve("");
                    }
                })
            })
        });
    }
}
