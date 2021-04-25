const { data } = require("jquery");

module.exports = {
    findAll:  function(req){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let sql = 'SELECT * FROM countries where 1 = 1'
                let condition = []
                
                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const country = JSON.parse(JSON.stringify(results));
                        resolve(country);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    },
    findAllMoviesCountries:  function(req,data = {}){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                let sql = 'SELECT * FROM movie_countries INNER JOIN countries ON movie_countries.country_id = countries.id where 1 = 1 '
                let condition = []

                if(data.movie_id){
                    sql += " AND movie_id = ?"
                    condition.push(data.movie_id)
                }

                if(data.movie_country_ids){
                    sql += " AND movie_country_id IN ("+data.movie_country_ids.join(",")+")"
                }
                
                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        resolve(false)
                    if(results){
                        const country = JSON.parse(JSON.stringify(results));
                        resolve(country);
                    }else{
                        resolve(false);
                    }
                })
            })
        });
    }
}
