const Jimp = require('jimp');
const imageSize = require("image-size")
const { GifFrame, GifUtil, GifCodec,BitmapImage } = require('gifwrap');
var fs = require("fs");
class Resize {
  constructor(folder,filename,req) {
    this.folder = folder;
    this.filename = filename;
    this.req = req;
    this.filepath = req.serverDirectoryPath
  }
  async save(uploadedFilename,data = {}) {
    const filepath = this.folder+this.filename;
    let width = 0 
    let height = 0
    await imageSize(filepath, function (err, dimensions) {
      width = dimensions.width
      height = dimensions.height
    });
    return new Promise((resolve, reject) => {
        this.readImage(filepath)
        .then( (image) => {
           if(!data.fromCover) {
            return image
                    .scaleToFit(Object.keys(data).length ? data.width : this.req.imageResize[0].width,Jimp.AUTO, Jimp.RESIZE_BEZIER) 
                    .quality(100)
           } else{ 
            return image
                    .resize(Object.keys(data).length ? data.width : this.req.imageResize[0].width, Object.keys(data).length ? data.height : this.req.imageResize[0].height) 
                    .quality(100)
           }
        }).then((image) => this.getBuffer(image))
        .then((lenna) => {
          fs.writeFile(this.folder+uploadedFilename, lenna, function(err) {
            if (err) {
              reject(err)
            }
            resolve(true)
        });
      }).catch(err => {
        resolve(false)
        console.error(err,'ERROR RESIZE');
      })
    })
  }
  /* This is a way of handing Jimp.read that will also take gif format.
   Ideally, we wouldn't need this, but Jimp cant handle gifs natively */
 async readImage (imageUrl) {
  return new Promise ((resolve, reject) => {
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
};

/* This is a way of handing Jimp.getBufferAsync that will also handle gif format.
   Ideally, we wouldn't need this, but Jimp cant handle gifs natively */
 async getBuffer(image){
  return new Promise ((resolve, reject) => {
    image
      .quality(100)
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
  };
}
module.exports = Resize;