const fs = require("fs")
exports.index = async (req, res,next) => {
    if(!req.installScript){
        next()
        return
    }
    res.render('install/index',{});
}

exports.install = async(req,res,next) => {
    if(!req.installScript){
        next()
        return
    }
    //read env file
    const filePath = req.SQLFILE
//     const obj = Object.fromEntries(new URLSearchParams(req.body.data));

//    let purchase_code = obj['purchase_code'];

   fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
        if (!err) {
            req.getConnection(function (err, connection) {  
                if(!req.query.cronData){
                  connection.query(data,function(err,results,fields)
                  {
                      if(!err){
                        req.installScript = false
                        process.env['installScript'] = false
                        res.send({status:1})
                      }
                      else
                      res.send({status:0,error:err})
                  })
                }
            })
        }else{
            res.send({status:0})
        }
    })
  
}