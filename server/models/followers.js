const notifications = require("./notifications")
const dateTime = require("node-datetime")

module.exports = {
    isFollowed: function(req,type,owner_id,id){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                connection.query('SELECT follower_id FROM followers WHERE type = ? AND owner_id= ? AND id = ?',[type,owner_id,id],function(err,results,fields)
                {
                    if(err){
                        resolve(false)
                    }
                    if(results.length){
                        const item = JSON.parse(JSON.stringify(results));
                        resolve(item[0]);
                    }
                    resolve(false)
                })
            })
        });
    },
    getStats:function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let condition = []
                let owner_id = 0
                let sql = ""
                if(req.user && req.user.user_id){
                    owner_id = req.user.user_id
                }
                
                if(data.criteria == "today"){
                    let match = { "00 AM": 0, "01 AM": 0, "02 AM": 0, "03 AM": 0, "04 AM": 0, "05 AM": 0, "06 AM": 0, "07 AM": 0, "08 AM": 0, "09 AM": 0, "10 AM": 0, "11 AM": 0, "12 PM": 0, "01 PM": 0, "02 PM": 0, "03 PM": 0, "04 PM": 0, "05 PM": 0, "06 PM": 0, "07 PM": 0, "08 PM": 0, "09 PM": 0, "10 PM": 0, "11 PM": 0 }
                    var dt = dateTime.create();
                    var currentDay = dt.format('Y-m-d')+' 00:00:00';
                    var d = new Date();
                    let dd = dateTime.create(d)
                    let nextDate = dd.format('Y-m-d')+" 23:59:00"
                    condition.push(data.type)
                    condition.push(currentDay)
                    condition.push(nextDate)
                    condition.push(data.id)
                    sql += "SELECT COUNT(*) as count,creation_date FROM followers WHERE type = ? AND creation_date >= ? AND creation_date <= ? AND id = ? "
                    sql += " GROUP BY DATE_FORMAT(creation_date,'%Y-%m-%d %h')"

                    req.getConnection(function(err,connection){
                        connection.query(sql,condition,function(err,results,fields)
                        {
                            if(err)
                                reject(false)
                            const resultArray = {}
                            if(results){
                                Object.keys(results).forEach(function(key) {
                                    let result = JSON.parse(JSON.stringify(results[key]))
                                    const H = dateTime.create(result.creation_date).format('I p')
                                    resultArray[H] = result.count                                   
                                })
                                let result = []
                                Object.keys(match).forEach(function (key) {
                                    if (resultArray[key]) {
                                        result.push(resultArray[key])
                                    } else {
                                        result.push(0)
                                    }
                                });
                                resolve({  result: result, xaxis: Object.keys(match),yaxis:dateTime.create(new Date()).format('W')})
                            }else{
                                resolve(false);
                            }
                        })
                    });
                }else if(data.criteria == "this_month"){
                    var dt = dateTime.create();
                    var currentYear = dt.format('Y');
                    var currentMonth = dt.format('m');
                    let daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
                    
                    var date = new Date();
                    var firstDay = dateTime.create(new Date(date.getFullYear(), date.getMonth(), 1)).format("Y-m-d")+" 00:00:00";
                    var lastDay = dateTime.create(new Date(date.getFullYear(), date.getMonth() + 1, 0)).format("Y-m-d")+" 23:59:00";

                    let match = ""
                    if (daysInMonth == 31) {
                        match = { "01 ": 0, "02 ": 0, "03 ": 0, "04 ": 0, "05 ": 0, "06 ": 0, "07 ": 0, "08 ": 0, "09 ": 0, "10 ": 0, "11 ": 0, "12 ": 0, "13 ": 0, "14 ": 0, "15 ": 0, "16 ": 0, "17 ": 0, "18 ": 0, "19 ": 0, "20 ": 0, "21 ": 0, "22 ": 0, "23 ": 0, "24 ": 0, "25 ": 0, "26 ": 0, "27 ": 0, "28 ": 0, "29 ": 0, "30 ": 0, "31 ": 0 }
                    } else if (daysInMonth == 30) {
                        match = { "01 ": 0, "02 ": 0, "03 ": 0, "04 ": 0, "05 ": 0, "06 ": 0, "07 ": 0, "08 ": 0, "09 ": 0, "10 ": 0, "11 ": 0, "12 ": 0, "13 ": 0, "14 ": 0, "15 ": 0, "16 ": 0, "17 ": 0, "18 ": 0, "19 ": 0, "20 ": 0, "21 ": 0, "22 ": 0, "23 ": 0, "24 ": 0, "25 ": 0, "26 ": 0, "27 ": 0, "28 ": 0, "29 ": 0, "30 ": 0 }
                    } else if (daysInMonth == 29) {
                        match = { "01 ": 0, "02 ": 0, "03 ": 0, "04 ": 0, "05 ": 0, "06 ": 0, "07 ": 0, "08 ": 0, "09 ": 0, "10 ": 0, "11 ": 0, "12 ": 0, "13 ": 0, "14 ": 0, "15 ": 0, "16 ": 0, "17 ": 0, "18 ": 0, "19 ": 0, "20 ": 0, "21 ": 0, "22 ": 0, "23 ": 0, "24 ": 0, "25 ": 0, "26 ": 0, "27 ": 0, "28 ": 0, "29 ": 0}
                    } else if (daysInMonth == 28) {
                        match = { "01 ": 0, "02 ": 0, "03 ": 0, "04 ": 0, "05 ": 0, "06 ": 0, "07 ": 0, "08 ": 0, "09 ": 0, "10 ": 0, "11 ": 0, "12 ": 0, "13 ": 0, "14 ": 0, "15 ": 0, "16 ": 0, "17 ": 0, "18 ": 0, "19 ": 0, "20 ": 0, "21 ": 0, "22 ": 0, "23 ": 0, "24 ": 0, "25 ": 0, "26 ": 0, "27 ": 0, "28 ": 0}
                    }

                    condition.push(data.type)
                    condition.push(firstDay)
                    condition.push(lastDay)
                    condition.push(data.id)
                    sql += "SELECT COUNT(*) as count,creation_date FROM followers WHERE type = ? AND creation_date >= ? AND creation_date <= ? AND id = ? "
                    sql += " GROUP BY DATE_FORMAT(creation_date,'%Y-%m-%d')"

                    req.getConnection(function(err,connection){
                        connection.query(sql,condition,function(err,results,fields)
                        {
                            if(err)
                                reject(false)
                            const resultArray = {}
                            if(results){
                                Object.keys(results).forEach(function(key) {
                                    let result = JSON.parse(JSON.stringify(results[key]))
                                    const H = dateTime.create(result.creation_date).format('d')
                                    resultArray[H+" "] = result.count                            
                                })
                                let result = []
                                Object.keys(match).forEach(function (key) {
                                    if (resultArray[key]) {
                                        result.push(resultArray[key])
                                    }else{
                                        result.push(0)
                                    }
                                });
                                resolve({  result: result, xaxis: Object.keys(match),yaxis:dateTime.create(new Date()).format('f') })
                            }else{
                                resolve(false);
                            }
                        })
                    });

                }else if(data.criteria == "this_week"){
                    let match = { "Saturday": 0, "Sunday": 0, "Monday": 0, "Tuesday": 0, "Wednesday": 0, "Thursday": 0, "Friday": 0 }
                    var dt = dateTime.create();
                    var currentDay = dt.format('W');
                    var weekStart = ""
                    var weekEnd = ""
                    
                    if(currentDay != "Saturday"){
                        var d = new Date();
                        // set to Monday of this week
                        d.setDate(d.getDate() - (d.getDay() + 6) % 7);
                        // set to previous Saturday
                        d.setDate(d.getDate() - 2);
                        weekStart = d
                    }else{
                        weekStart = new Date()
                    }
                    
                    if(currentDay == "Friday"){
                        weekEnd = new Date()
                    }else{
                        var d = new Date();
                        var resultDate = new Date(d.getTime());
                        resultDate.setDate(d.getDate() + (7 + 5 - d.getDay()) % 7);
                        weekEnd = resultDate
                    }
                    var weekStartObj = dateTime.create(weekStart);
                    var weekObj = weekStartObj.format('Y-m-d');
                    var weekEndObj = dateTime.create(weekEnd);
                    var weekendObj = weekEndObj.format('Y-m-d');
                    match = { "Saturday": 0, "Sunday": 0, "Monday": 0, "Tuesday": 0, "Wednesday": 0, "Thursday": 0, "Friday": 0 }
                    condition.push(data.type)
                    condition.push(weekObj)
                    condition.push(weekendObj)
                    condition.push(data.id)
                    sql += "SELECT COUNT(*) as count,creation_date FROM followers WHERE type = ? AND creation_date >= ? AND creation_date <= ? AND id = ? "
                    sql += " GROUP BY DATE_FORMAT(creation_date,'%d')"
                    req.getConnection(function(err,connection){
                        connection.query(sql,condition,function(err,results,fields)
                        {
                            if(err)
                                reject(false)
                            const resultArray = {}
                            if(results){
                                Object.keys(results).forEach(function (key) {
                                    let result = JSON.parse(JSON.stringify(results[key]))
                                    const H = dateTime.create(result.creation_date).format('W')
                                    resultArray[H] = result.count
                                })
                                let result = []
                                Object.keys(match).forEach(function (key) {
                                    if (resultArray[key]) {
                                        result.push(resultArray[key])
                                    }else{
                                        result.push(0)
                                    }
                                });
                                resolve({ result: result, xaxis: Object.keys(match),yaxis:weekObj +" - "+weekendObj })
                            }else{
                                resolve(false);
                            }
                        })
                    });
                }else if(data.criteria == "this_year"){
                    let match = { "Jan": 0, "Feb": 0, "Mar": 0, "Apr": 0, "May": 0, "Jun": 0, "Jul": 0, "Aug": 0, "Sep": 0, "Oct": 0, "Nov": 0, "Dec": 0 }
                    var d = new Date();
                    const start = d.getFullYear()+"-01-01 00:00:00"
                    const end = d.getFullYear()+"-12-31 23:59:00"
                    condition.push(data.type)
                    condition.push(start)
                    condition.push(end)
                    condition.push(data.id)
                    sql += "SELECT COUNT(*) as count,creation_date FROM followers WHERE type = ? AND creation_date >= ? AND creation_date <= ? AND id = ? "
                    sql += " GROUP BY DATE_FORMAT(creation_date,'%m')"
                    req.getConnection(function(err,connection){
                        connection.query(sql,condition,function(err,results,fields)
                        {
                            if(err)
                                reject(false)
                            const resultArray = {}
                            if(results){
                                Object.keys(results).forEach(function (key) {
                                    let result = JSON.parse(JSON.stringify(results[key]))
                                    const H = dateTime.create(result.creation_date).format('n')
                                    resultArray[H] = result.count
                                })
                                let result = []
                                Object.keys(match).forEach(function (key) {
                                    if (resultArray[key]) {
                                        result.push(resultArray[key])
                                    }else{
                                        result.push(0)
                                    }
                                });
                                resolve({  result: result, xaxis: Object.keys(match),yaxis:dateTime.create(new Date()).format('Y') })
                            }else{
                                resolve(false);
                            }
                        })
                    });
                }
            })
        });
    },
    insert: function(data,req,res){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                //like_dislike likeType

                let column = "user_id"
                if(data.type == "channels"){
                    column = "channel_id"
                }
                let notiType =   data.type + "_follow" 
                if(data.followId){
                    //delete
                    connection.query('DELETE FROM followers WHERE follower_id = ?',[data.followId],function(err,results,fields)
                    {
                        if(err)
                            resolve(false)
                        if(results){
                            connection.query("SELECT " + (data.type == "members" ? "user_id" : "owner_id") + " FROM " + (data.type == "members" ? "users" : data.type) + " WHERE " + column + " = " + data.id, function (err, results, fields) {
                                if (results) {
                                    const item = JSON.parse(JSON.stringify(results));
                                    if (item || item[0][(data.type == "members" ? "user_id" : "owner_id")] != req.user.user_id) {
                                        notifications.insert(req, {owner_id:item[0][(data.type == "members" ? "user_id" : "owner_id")], type: notiType, subject_type: "users", subject_id: req.user.user_id, object_type: data.type, object_id: data.id }).then(result => {

                                        }).catch(err => {
            
                                        })
                                    }
                                }
                            })
                            
                            //update counts
                            let type = "follow_count"
                            
                            connection.query("UPDATE "+ (data.type == "members" ? "userdetails" : data.type) + " SET "+type+" = "+type+" - 1 WHERE "+column+" = "+data.id,function(err,results,fields)
                            {

                            });
                            resolve(true);
                        }else{
                            resolve(false);
                        }
                    })
                }else{
                    //liked
                    connection.query('INSERT INTO followers SET ? ',[{type:data.type,id:data.id,owner_id:req.user.user_id,creation_date:data.creation_date}],function(err,results,fields)
                    {console.log(err)
                        if(err)
                            resolve(false)
                        if(results){
                            connection.query("SELECT " + (data.type == "members" ? "user_id" : "owner_id") + " FROM " + (data.type == "members" ? "users" : data.type) + " WHERE " + column + " = " + data.id, function (err, results, fields) {
                                if (results) {
                                    const item = JSON.parse(JSON.stringify(results));
                                    if (item || item[0][(data.type == "members" ? "user_id" : "owner_id")] != req.user.user_id) {
                                        notifications.insert(req, { owner_id:item[0][(data.type == "members" ? "user_id" : "owner_id")],type: notiType, subject_type: "users", subject_id: req.user.user_id, object_type: data.type, object_id: data.id, insert: true }).then(result => {

                                        }).catch(err => {
                                            console.log(err)
                                        })
                                    }
                                }
                            })
                            
                            //update counts
                            let type = "follow_count"
                            

                            connection.query("UPDATE "+ (data.type == "members" ? "userdetails" : data.type) + " SET "+type+" = "+type+" + 1  WHERE "+column+" = "+data.id,function(err,results,fields)
                            {
console.log(err)
                            });

                            resolve(true);
                        }else{
                            resolve(false);
                        }
                    })
                }
            })
        });
    },
}