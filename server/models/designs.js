module.exports = {
    findAll:  function(req,data){
        return new Promise(function(resolve, reject) {
            req.getConnection(function(err,connection){
                const condition = []
                let sql = 'SELECT * FROM themes where `key` IN ("font_style","fontFamily_default","fontFamily_heading")'
                
                connection.query(sql,condition,function(err,results,fields)
                {
                    if(err)
                        reject("")
                    if(results){
                        const designs = JSON.parse(JSON.stringify(results));
                        let designsArray = {}
                        designsArray.white = {}
                        designsArray.dark = {}
                        designs.forEach(design => {
                            designsArray[design.type][design.key] = design.value
                        });
                        resolve(designsArray);
                    }else{
                        resolve("");
                    }
                })
            })
        });
    }
}
