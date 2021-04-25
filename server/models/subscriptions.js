var dateTime = require('node-datetime');
module.exports = {
    findAll: function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                let sql = 'SELECT * FROM subscriptions where 1 = 1'
                let condition = []
                if (data.gateway_order_id) {
                    condition.push(data.gateway_order_id)
                    sql += " AND gateway_order_id = ?"
                }

                if (data.gateway_transaction_id) {
                    condition.push(data.gateway_transaction_id)
                    sql += " AND gateway_transaction_id = ?"
                }
                if(data.gateway_id){
                    condition.push(parseInt(data.gateway_id))
                    sql += " AND gateway_id = ?"
                }
                if (data.subscription_id) {
                    condition.push(parseInt(data.subscription_id))
                    sql += " AND subscription_id = ?"
                }

                if(data.order_id){
                    condition.push(parseInt(data.order_id))
                    sql += " AND order_id = ? "
                }

                sql += " ORDER BY `subscription_id` DESC"
                connection.query(sql, condition, function (err, results, fields) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const subscriptions = JSON.parse(JSON.stringify(results));
                        resolve(subscriptions);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    userActivePackage: function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                const condition = []
                let sql = 'SELECT s.expiration_date as plan_expiration_date,p.* FROM subscriptions s LEFT JOIN packages p  ON p.package_id = s.package_id  where 1 = 1'
                condition.push(parseInt(req.user.user_id))
                sql += " and owner_id = ?"
                condition.push("subscription")
                sql += " and s.type = ?"
                var dt = dateTime.create();
                var formatted = dt.format('Y-m-d H:M:S');
                condition.push(formatted)
                sql += " and (expiration_date IS NULL || expiration_date >= ?)"
                sql += " and (status = 'completed' || status = 'approved' || status = 'approved') "
                condition.push(1)
                sql += " LIMIT ?"
                connection.query(sql, condition, function (err, results, fields) {
                    if (err)
                        resolve(false)

                    if (results.length > 0) {
                        const plan = JSON.parse(JSON.stringify(results));
                        resolve(plan[0]);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },

    findById: function (id, req, res) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM subscriptions WHERE subscription_id = ?', [id], function (err, results, fields) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const subscriptions = JSON.parse(JSON.stringify(results));
                        resolve(subscriptions[0]);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
}
