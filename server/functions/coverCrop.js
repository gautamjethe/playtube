const s3Upload = require('./upload').uploadtoS3,
 commonFunction = require("./commonFunctions"),
 imageSize = require("image-size"),
 path = require("path"),
 uniqid = require('uniqid'),
 resize = require("./resize"),
 fs = require("fs")
Jimp = require('jimp');
const { GifFrame, GifUtil, GifCodec,BitmapImage } = require('gifwrap');
exports.getSize = async (req,image) => {
    return new Promise(async function (resolve,reject) {
        await imageSize(image, async function (err, dimensions) {
            if(!err){
                oldw = dimensions.width
                oldh = dimensions.height
                resolve(dimensions)
            }else{
                reject(err)
            }
          });

    });
}

exports.crop = async (req,data = {},image) => {
    return new Promise(async function (resolve) {
        const rootPath = req.serverDirectoryPath+"/public"
        const createPath = data['path']
        if(data.screenWidth > 1400){
            data.screenWidth = 1400;
        }
        let oldw = 0
        let oldh = 0
        await exports.getSize(req,image).then(result => {
            oldh = result.height
            oldw = result.width
        }).catch(err => {
            console.log(err,'Error in coverCrop')
        })
        
        let newh = oldh;//(oldh * parseInt(data.screenWidth)) / oldw;

        var cropHeight = Math.abs(data.y)
        //height
        if(oldh < 350){
          cropHeight =  0
        }else if(oldh < Math.abs(data.y) + 350){
            cropHeight = oldh - 350
        }
        let croppedImage = ""
        const extension = path.extname(image);
        const file = path.basename(image, extension);
        const pathName = req.serverDirectoryPath + "/public/upload/"
        const newFileName = file + uniqid.process('c') + extension;
        var resizeObj = new resize(pathName, image.replace(req.serverDirectoryPath + "/public/upload/",''), req)
        await resizeObj.save(newFileName,{width:parseInt(data.screenWidth),height:newh,fromCover:true}).then(res => {            
            croppedImage = pathName+newFileName;
            commonFunction.deleteImage(req, "", image, 'locale')
            exports.readImage(croppedImage)
                .then( (image) => {
                    return image
                            .crop(0, cropHeight,parseInt(data.screenWidth), oldh < 350 ? oldh : 350 ) // resize
                            .quality(60) // set JPEG quality
                }).then((image) => exports.getBuffer(image))
                .then((lenna) => {
                  fs.writeFile(rootPath+createPath, lenna, function(err) {
                    if (err) {
                      reject(err)
                    }
                    // fs.unlink(croppedImage, function (err) {
                    //     // if (err) {
                    //     //     console.error(err);
                    //     // } 
                    // });
                    if (req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi") {
                        s3Upload(req, rootPath+createPath, createPath).then(result => {
                            //remove local file
                            commonFunction.deleteImage(req, "", createPath, 'locale')
                            if(result){
                                resolve(true)
                            }
                        }).catch(err => {
                            console.log(err)
                            resolve(false)
                        })
                    }else{
                        resolve(true)
                    }
                });
              }).catch(err => {
                resolve(false)
                console.error(err,'ERROR RESIZE');
              })
        })
    });
}


 /* This is a way of handing Jimp.read that will also take gif format.
   Ideally, we wouldn't need this, but Jimp cant handle gifs natively */
   exports.readImage = async (imageUrl) => {
    var promise = new Promise ((resolve, reject) => {
      Jimp.read(imageUrl)
        .then((jimp) => {
          resolve(jimp);
        })
        .catch((err) => {
          if (err.toString() === 'Unsupported MIME type: image/gif') {
            GifUtil.read(imageUrl)
              .then((gif) => {
                let image = GifUtil.copyAsJimp(Jimp, gif.frames[0]);
                resolve(image);
              })
              .catch((giferror) => {
                reject(giferror);
              });
          } else {
            reject(err);
          }
        });
    });
    return promise;
  };
  
  /* This is a way of handing Jimp.getBufferAsync that will also handle gif format.
     Ideally, we wouldn't need this, but Jimp cant handle gifs natively */
     exports.getBuffer = async (image) => {
    var promise = new Promise ((resolve, reject) => {
      image
        .getBufferAsync(image._originalMime)
        .then((buffer) => {
          resolve(buffer);
        })
        .catch((err) => {
          if (err.toString() === 'Unsupported MIME type: image/gif') {
            let bitmap = new BitmapImage(image.bitmap);
            GifUtil.quantizeDekker(bitmap, 256);
            let newFrame = new GifFrame(bitmap);
            let gifCodec = new GifCodec();
            gifCodec
              .encodeGif([newFrame], {})
              .then((gif) => {
                resolve(gif.buffer);
              })
              .catch((giferror) => {
                reject(giferror);
              });
          } else {
            reject(err);
          }
        });
    });
    return promise;
  };