const multer = require('multer');
const path = require('path');
const fs = require("fs")
  , aws = require('aws-sdk');

  var makeDirectory = function(dirPath, mode, callback) {
    //Call the standard fs.mkdir
    fs.mkdir(dirPath, mode, function(error) {
      //When it fail in this way, do the custom steps
      if (error && error.errno === 34) {
        //Create all the parents recursively
        fs.mkdirParent(path.dirname(dirPath), mode, callback);
        //And then the directory
        fs.mkdirParent(dirPath, mode, callback);
      }
      //Manually run the callback since we used our own callback to do all these
      callback && callback(error);
    });
  };

var upload = function(filename,destination,req,type = "image") {
    const upload_system = req.appSettings.upload_system
    var storageEngine;
    if(upload_system == "s3" && !req.uploadDirect){
     
      aws.config.update({
        secretAccessKey: req.appSettings.s3_secret_access_key,
        accessKeyId: req.appSettings.s3_access_key,
        region: req.appSettings.s3_region
      });

      const s3 = new aws.S3()
      const storageObject = {
        Key: (req, file, cb) => {
            let originalS3ImageName = Date.now() + '_' + Math.random().toString(36).substring(7)+path.extname(file.originalname);
            req.originalS3ImageName = originalS3ImageName
            if(file.fieldname){
              if(!req.fieldImageName)
                req.fieldImageName = {}
              req.fieldImageName[file.fieldname] = originalS3ImageName
            }
            cb(null, destination+originalS3ImageName)
        },
        s3,
        Bucket: req.appSettings.s3_bucket,
        multiple: req.imageResize && req.imageResize.length > 1 ? true : false,
      }
      if(req.imageResize && !req.fromadmin)
        storageObject['resize'] = req.imageResize;
      let s3Storage = require('multer-sharp-s3')
      storageEngine = s3Storage(storageObject)
    }else if(upload_system == "wisabi" && !req.uploadDirect){
      const accessKeyId = req.appSettings.s3_access_key;
      const secretAccessKey = req.appSettings.s3_secret_access_key;    
      const wasabiEndpoint = new aws.Endpoint(`s3.${req.appSettings.s3_region}.wasabisys.com`);
      let wisabiStorage = {
        endpoint: wasabiEndpoint,
        region: req.appSettings.s3_region,
        accessKeyId,
        secretAccessKey
      };
      const s3 = new aws.S3(wisabiStorage)
      const storageObject = {
        Key: (req, file, cb) => {
            let originalS3ImageName = Date.now() + '_' + Math.random().toString(36).substring(12)+path.extname(file.originalname);
            req.originalS3ImageName = originalS3ImageName
            if(file.fieldname){
              if(!req.fieldImageName)
                req.fieldImageName = {}
              req.fieldImageName[file.fieldname] = originalS3ImageName
            }
            cb(null, destination+originalS3ImageName)
        },
        s3,
        Bucket: req.appSettings.s3_bucket,
        multiple: req.imageResize && req.imageResize.length > 1 ? true : false,
      }
      if(req.imageResize && !req.fromadmin)
        storageObject['resize'] = req.imageResize;
      let s3Storage = require('multer-sharp-s3')
      storageEngine = s3Storage(storageObject)
    }else{
      if(!fs.existsSync('./server/public/'+destination)){
        makeDirectory('./server/public/'+destination,'0777');
      }
      storageEngine = multer.diskStorage({
          destination: './server/public/'+destination,
          filename: function (req, file, cb) {
              return cb(null, Date.now() + '_' + Math.random().toString(36).substring(12) + '_' + path.extname(file.originalname))
          }
      })
    }
    let size = 50
    if(type == "fromadmin"){
      size = 1000000
    }else if(type == "image"){
      size = parseInt(req.appSettings['image_upload_limit']) == 0 ? 100000 : parseInt(req.appSettings['image_upload_limit'])
    }else if(type == "video"){
      size = parseInt(req.appSettings['video_upload_limit']) == 0 ? 100000 : parseInt(req.appSettings['video_upload_limit'])
    }else if(type == "audio"){
      size = 100
    }else{
      size = parseInt(req.appSettings['advertisement_upload_limit']) == 0 ? 100000 : parseInt(req.appSettings['advertisement_upload_limit'])
    }
    
    //init
    const multerObj = multer({
        storage: storageEngine,
        limits: { fileSize: size * 1024 * 1024 },//30mb
        fileFilter: function (req, file, callback) {
            validateFile(file, callback,req);
        }
    })
    if(filename){
      return multerObj.single(filename)
    }else{
      return multerObj.fields(req.uploadFields)
    }
}

//file validation
var validateFile = function (file, cb,req) {
  let allowedFileTypes = ""
  if(req.allowedFileTypes){
    allowedFileTypes = req.allowedFileTypes
  }else{
   allowedFileTypes = /jpeg|jpg|png|gif/
  }
  if(req.fromadmin){
    return cb(null, true)
  }
  const extension = allowedFileTypes.test(path.extname(file.originalname).toLowerCase())
  //const mimeType = allowedFileTypes.test(file.mimetype)
  if(extension) {
    return cb(null, true)
  }else{
    cb("Invalid file type. Only JPEG, PNG and GIF file are allowed.", false)
  }
}

function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${Math.round(bytes / Math.pow(1024, i), 2)}${sizes[i]}`;
};

var uploadtoS3 = async (req,uploadFile,uploadPath) => {
  return new Promise(async (resolve, reject) => {
    let wisabiStorage = {}
    if(req.appSettings.upload_system == "s3"){
      aws.config.update({
        secretAccessKey: req.appSettings.s3_secret_access_key,
        accessKeyId: req.appSettings.s3_access_key,
        region: req.appSettings.s3_region
      });
    }else{
      const accessKeyId = req.appSettings.s3_access_key;
      const secretAccessKey = req.appSettings.s3_secret_access_key;    
      const wasabiEndpoint = new aws.Endpoint(`s3.${req.appSettings.s3_region}.wasabisys.com`);
       wisabiStorage = {
        endpoint: wasabiEndpoint,
        region: req.appSettings.s3_region,
        accessKeyId,
        secretAccessKey
      };
    }
    var s3 = new aws.S3(wisabiStorage);
    fs.readFile(uploadFile,async function read(err, data) {
      let uploadMainPath = uploadPath
      if (uploadPath.charAt(0) == "/") uploadMainPath = uploadPath.substr(1);
      if (err) { resolve(false) }
      const mimeType = require("./mimeTypes")
      const type = await mimeType.ext.getExt(uploadMainPath);
      const ContentType = await mimeType.ext.getContentType(type);
      let params = {Bucket: req.appSettings.s3_bucket, Key: uploadMainPath, Body: data,ContentType:ContentType };
      s3.putObject(params, function(err, _data) {
          if (err) {
              resolve(false)
          } else {
              resolve(true)
          }
      });
    })
  });
}
var readS3Image = async (req,image,newimage) => {
  return new Promise(async function (resolve,reject) {
      let wisabiStorage = {}
      if(req.appSettings.upload_system == "s3"){
        aws.config.update({
          secretAccessKey: req.appSettings.s3_secret_access_key,
          accessKeyId: req.appSettings.s3_access_key,
          region: req.appSettings.s3_region
        });
      }else{
        const accessKeyId = req.appSettings.s3_access_key;
        const secretAccessKey = req.appSettings.s3_secret_access_key;    
        const wasabiEndpoint = new aws.Endpoint(`s3.${req.appSettings.s3_region}.wasabisys.com`);
         wisabiStorage = {
          endpoint: wasabiEndpoint,
          region: req.appSettings.s3_region,
          accessKeyId,
          secretAccessKey
        };
      }


      let trimImage = image
      if (image.charAt(0) == "/") trimImage = image.substr(1);

      var s3 = new aws.S3(wisabiStorage);
          s3.getObject(
            { Bucket: req.appSettings.s3_bucket, Key: trimImage }, 
            function(err, data) {
            if (!err) {
                const fs = require("fs")
                fs.writeFile(newimage, data.Body, function(err){
                    if(err)                
                      reject(false)
                    else
                    return resolve(newimage)
                
                  });
            }else{
                reject(false)
            }
            }
        );
  });
}
module.exports = { upload, bytesToSize, uploadtoS3,readS3Image };