var dateTime = require('node-datetime');
module.exports = {
    findById: function(id,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT * FROM comments WHERE comment_id = ?',[(id)],function(err,results,fields)
                {
                    if(err)
                        reject(err)
                    
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
    getComments: function(data,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){

                let owner_id = 0

                if(req.user){
                    owner_id = parseInt(req.user.user_id)
                }

                let leftJoin = ""
                if(data.reply_id){
                    leftJoin = "LEFT JOIN comments as c ON c.parent_id = comments.comment_id "
                }

                let condition = []
                let sql = "SELECT comments.*,likes.like_dislike,userdetails.displayname,userdetails.username,userdetails.verified,IF(userdetails.avtar IS NULL || userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar FROM comments "+leftJoin+" LEFT JOIN users ON users.user_id = comments.owner_id LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN likes ON likes.id = comments.comment_id AND likes.type = 'comments' AND likes.owner_id =  "+owner_id;

                sql += " WHERE users.active = 1 AND users.approve = 1 "
                                
                if(!data.approved){
                    condition.push(req.user ? req.user.user_id : 0)
                    sql += " AND ( CASE WHEN  approved = 1 THEN true"+
                                " WHEN comments.approved = 0 and comments.owner_id = ? THEN true ELSE false END) "
                }else{
                    sql += " AND (comments.approved = 0 OR replies_approved != 0) "
                }
                if(data.reply_id){
                    condition.push(parseInt(data.reply_id))
                    sql += " AND c.comment_id = ?"
                }else{
                    sql += " AND comments.parent_id = 0 "
                }


                if(data.id){
                    condition.push((data.id))
                    sql += " AND comments.id = ?"
                }

                if(data.type){
                    condition.push(data.type)
                    sql += " AND comments.type = ?"
                }

                if(data.data_comment_id){
                    condition.push(parseInt(data.data_comment_id))
                    sql += " AND comments.comment_id = ?"
                }

                if(!data.search){
                    if(data.comment_id){
                        condition.push(parseInt(data.comment_id))
                        sql += " comments.comment_id < ?"
                    }
                    sql += " ORDER BY comment_id DESC "
                }else{
                    if(data.search == "newest"){
                        sql += " ORDER BY comment_id DESC "
                    }else if(data.search == "oldest"){
                        sql += " ORDER BY comment_id ASC "
                    }else if(data.search == "liked"){
                        sql += " ORDER BY comments.like_count DESC "
                    }else if(data.search == "replied"){
                        sql += " ORDER BY comments.reply_count DESC "
                    }else if(data.search == "disliked"){
                        sql += " ORDER BY comments.dislike_count DESC "
                    }
                    sql += " , comment_id DESC "
                }
                sql += " limit "+data.limit 
                if(data.offset)
                    sql += " offset "+data.offset
                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        reject(false)
                    
                    if(results){
                        const result = JSON.parse(JSON.stringify(results));
                        resolve(result);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    getReplies: function(data,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let condition = []
                let owner_id = 0

                if(req.user){
                    owner_id = parseInt(req.user.user_id)
                }

                let sql = "SELECT comments.*,likes.like_dislike,userdetails.displayname,userdetails.username,userdetails.verified,IF(userdetails.avtar IS NULL || userdetails.avtar = '',(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar FROM comments LEFT JOIN users ON users.user_id = comments.owner_id LEFT JOIN userdetails ON userdetails.user_id = users.user_id LEFT JOIN likes ON likes.id = comments.comment_id AND likes.type = 'comments' AND likes.owner_id =  "+owner_id+" WHERE parent_id = "+data.comment_id;
               
                sql += " AND users.active = 1 AND users.approve = 1 "

                if(data.data_comment_id){
                    condition.push(parseInt(data.data_comment_id))
                    sql += " AND comments.comment_id = ?"
                }
                if(data.id){
                    condition.push((data.id))
                    sql += " AND comments.id = ?"
                }

                if(data.type){
                    condition.push(data.type)
                    sql += " AND comments.type = ?"
                }

                if(!data.approved){
                    condition.push(req.user ? req.user.user_id : 0)
                    sql += " AND ( CASE WHEN  approved = 1 THEN true"+
                                " WHEN comments.approved = 0 and comments.owner_id = ? THEN true ELSE false END) "
                }else{
                    sql += " AND comments.approved = 0 "
                }

                sql += " ORDER BY comment_id DESC "

                sql += " limit "+data.limit

                if(data.offset)
                    sql += " offset "+data.offset
                
                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        reject(false)
                    
                    if(results){
                        const result = JSON.parse(JSON.stringify(results));
                        resolve(result);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    }
}
