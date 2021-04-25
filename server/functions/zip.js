const archiver = require('archiver');
const fs = require("fs")
/**
 * @param {String} source
 * @param {String} out
 * @returns {Promise}
 */
module.exports.zipDirectory = async (basePath,sources, out) => {
  const archive = archiver('zip', { zlib: { level: 9 }});
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .on('error', err => reject(err))
    
    sources.forEach(function(dirName) {
        archive.directory(basePath + dirName, dirName);
    });
    stream.on('close', () => resolve());
    archive.pipe(stream);
    archive.finalize();
  });
}