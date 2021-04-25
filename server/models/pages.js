module.exports = {
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                let sql = 'SELECT '+(data && data.column ? data.column : "*")+' FROM pages  where 1 = 1'
                
                if(data.type){
                    condition.push(data.type)
                    sql += " and type = ?"
                }
                if(data.name){
                    condition.push(data.name.toLowerCase())
                    sql += " and LOWER(label) LIKE CONCAT('%', ?,  '%') " 
                }
                if(data.page_url){
                    condition.push(data.page_url.toLowerCase())
                    sql += " and LOWER(url) LIKE CONCAT('%', ?,  '%') " 
                }
                if(data.url){
                    condition.push(data.url)
                    sql += " and url = ?"
                }

                sql += " ORDER BY pages.page_id DESC" 

                if(data.limit){
                    condition.push(data['limit'])
                    sql += " LIMIT ?"
                }
                if(data.offset){
                    condition.push(data['offset'])
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
    findByType: function(type,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM pages WHERE type = ?',[type],function(err,results,fields)
                {
                    
                    let pageData = {}
                    if(results && results.length){
                        const page = JSON.parse(JSON.stringify(results));
                        pageData = page[0]
                        delete pageData["page_id"]
                        delete pageData["label"]
                        delete pageData["custom"]
                        delete pageData["banner_image"]
                        if(!pageData['banner'])
                        delete pageData["banner"]
                        if(pageData.type != "terms" && pageData.type != "privacy"){
                            delete pageData["type"]
                            delete pageData["content"]
                        }
                        delete pageData["url"]
                        if(!pageData.custom_tags){
                            delete pageData.custom_tags
                        }
                        delete pageData["view_count"]
                        //increase page view count
                        connection.query('UPDATE pages SET view_count = view_count + 1 WHERE type = ?',[type],function(err,results,fields)
                        {

                        })
                    }else{
                        pageData.title = req.appSettings.page_default_title
                        pageData.description = req.appSettings.page_default_description
                        pageData.keywords = req.appSettings.page_default_keywords
                        pageData.image = req.appSettings.page_default_image
                    }
                    resolve(pageData)
                })
            })
        });
    },
    findById: function(id,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM pages WHERE page_id = ?',[id],function(err,results,fields)
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
    }
}
