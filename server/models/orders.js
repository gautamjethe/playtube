module.exports = {
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let sql = 'SELECT * FROM orders where 1 = 1'
                let condition = []
                
                if(data.gateway_id){
                    condition.push(parseInt(data.gateway_id))
                    sql += " AND gateway_id = ?"
                }
                if(data.gateway_transaction_id){
                    condition.push(data.gateway_transaction_id)
                    sql += " AND gateway_transaction_id = ?"
                }

                if(data.order_id){
                    condition.push(parseInt(data.order_id))
                    sql += " AND order_id = ?"
                }


                sql += " ORDER BY `order_id` DESC" 
                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const transaction = JSON.parse(JSON.stringify(results));
                        resolve(transaction);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    }
}
