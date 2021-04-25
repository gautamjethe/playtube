const pagging = require("../../functions/pagging")
const globalModel = require("../../models/globalModel")
const fileManagerModel = require("../../models/fileManager")
const fs = require("fs")
const path = require("path")
var fsExtra = require("fs-extra");

exports.fileManager = async (req,res) => {
   
    let LimitNum = 20;
    let page = 1
    if(req.params.page == ''){
         page = 1;
    }else{
        //parse int Convert String to number 
         page = parseInt(req.params.page) ? parseInt(req.params.page) : 1;
    }

    const query = {...req.query}

    let results = []
    let totalCount = 0
    query["column"] = "COUNT(*) as totalCount"
    await fileManagerModel.findAll(req,query).then(result => {        
        totalCount = result[0].totalCount
    })

    if(totalCount > 0){
        query['limit'] = LimitNum
        query['offset'] = (page - 1)*LimitNum
        query["column"] = "*"
        await fileManagerModel.findAll(req,query).then(result => {
            results = result
        })
    }
    let imageSuffix = ""
    if (req.appSettings.upload_system == "s3") {
        imageSuffix = "https://" + req.appSettings.s3_bucket + ".s3.amazonaws.com";
    }else if (req.appSettings.upload_system == "wisabi") {
        imageSuffix = "https://s3.wasabisys.com/"+req.appSettings.s3_bucket ;
    }
    const paggingData = pagging.create(req,totalCount,page,'',LimitNum)
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    res.render('admin/file-manager/index',{imageSuffix:imageSuffix,baseURL:req.protocol + '://' + req.get('host'),totalCount:totalCount,query:query,nav:url,results:results,title:"Manage Files",paggingData:paggingData});    
}
exports.deleteFile = async (req,res,next) => {
    let id = req.params.id

    await globalModel.delete(req,'file_manager','file_id',req.params.id).then(result => {
        res.redirect(process.env.ADMIN_SLUG+"/file-manager")
    }).catch(error => {
        res.redirect(process.env.ADMIN_SLUG+"/file-manager")
    })
} 

exports.copyDir = async (source,dest) => {
    return new Promise(function (resolve, reject) {
        fsExtra.copy(source,dest, function (err) {
            if (err) {
                reject(false)
            }
            resolve(true)
        });
    })
}
exports.uploadZip = async (req,res,next) => {
    var extract = require('extract-zip')
    if(req.imageError){
        res.status(200).send({error:1,message:"Error in uploading file."})
    }else{
        const imagename = req.fileName;
        extract(req.serverDirectoryPath+"/public/"+imagename, {dir: req.serverDirectoryPath+"/public/"}, async function (err) {
                if(!err){
                    try{
                        await exports.copyDir(req.serverDirectoryPath+"/public/scriptMediaFiles/upload", req.serverDirectoryPath+"/public/upload");
                        await exports.copyDir(req.serverDirectoryPath+"/public/scriptMediaFiles/resources", req.serverDirectoryPath+"/public/resources");
                        res.status(200).send({error:0,message:"Files imported successfully."})
                        const rmdir = require('rimraf');
                        rmdir(req.serverDirectoryPath+"/public/scriptMediaFiles", function(error){});
                        fs.unlink(req.serverDirectoryPath+"/public/"+imagename, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }catch (e) {
                        res.status(200).send({error:1,message:"Error in uploading file."})
                    }
                }else{
                    res.status(200).send({error:1,message:"Error in uploading file."})
                }
            })
            
    }
}
exports.downloadZip = async (req,res,next) => {
    const zip = require("../../functions/zip")
    const fs = require("fs")
    await zip.zipDirectory(req.serverDirectoryPath+"/public/",["upload","resources"],req.serverDirectoryPath+"/scriptMediaFiles.zip")
    var file =  req.serverDirectoryPath+ "/scriptMediaFiles.zip";
    await res.download(file, (err) => {
        if (err) {
            console.log(err);
          }
        fs.unlink(file, (err) => {
        if (err) {
            console.log(err);
        }
        });
    });
}
exports.downloadFile = async (req,res,next) => {
    let results = {}
    await fileManagerModel.findById(req.params.id,req).then(result => {
        results = result
    })
    var file = req.serverDirectoryPath + "/public"+results.path;
    await res.download(file, (err) => {
        if (err) {
            res.redirect(process.env.ADMIN_SLUG+"/file-manager")
            console.log(err);
          }
    });
};
exports.UploadFileManager = (req,res,next) => {
    if(req.imageError){
        res.status(200).send({error:1,message:"Error in uploading file."})
    }else{
        const imagename = req.fileName;
        return globalModel.create(req,{path:"/resources/"+imagename},'file_manager').then(result => {
            res.status(200).send({error:0,message:"File uploaded successfully"})
        })
    }
}