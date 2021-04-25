const express = require('express');
const router = express.Router();
const upload = require("../../functions/upload").upload

const controller = require("../../controllers/admin/menus")
const is_admin = require("../../middleware/admin/is-admin")



router.post('/menus/change-order', is_admin, controller.changeOrder);
router.get("/menus/delete/:menu_id", is_admin, controller.delete)
router.use("/menus/add/:menu_id?", is_admin, async (req, res, next) => {
    req.allowedFileTypes = /jpeg|jpg|png|gif/
    req.imageResize = [
        { width: req.widthResize, height: req.heightResize }
    ];
    var currUpload = upload('thumbnail', "upload/images/menus/", req)
    currUpload(req, res, function (err) {
        if (err) {
            req.imageError = "Uploaded image is too large to upload, please choose smaller image and try again.";;
            next()
        } else {
            req.fileName = req.file ? req.file.filename : false;
            if (req.file && req.appSettings.upload_system != "s3"  && req.appSettings.upload_system != "wisabi") {
                const extension = path.extname(req.fileName);
                const file = path.basename(req.fileName, extension);
                const pathName = req.serverDirectoryPath + "/public/upload/images/menus/"
                const newFileName = file + "_main" + extension;
                var resizeObj = new resize(pathName, req.fileName, req)
                resizeObj.save(newFileName).then(res => {
                    if(res){
                        fs.unlink(pathName + req.fileName, function (err) {
                            if (err) {
                                console.error(err);
                            }
                        });
                        req.fileName = newFileName;
                        next()
                    }else{
                        req.imageError = "Your image contains an unknown image file encoding. The file encoding type is not recognized, please use a different image.";
                        next()
                    }
                })
            }else if(req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi"){
                req.fileName = req.originalS3ImageName
                next()
            } else {
                next()
            }
        }
    });
}, controller.add)
router.get("/menus", is_admin, controller.index)

module.exports = router;