const express = require('express');
const router = express.Router();
const multer = require("multer")
const controller = require("../../controllers/admin/languages")
const is_admin = require("../../middleware/admin/is-admin")
const upload = require("../../functions/upload").upload


router.use("/languages/add/:id?", is_admin, controller.create)
router.get("/languages/default/:id", is_admin, controller.default)
router.get("/languages/edit/:id/:page?",is_admin,controller.edit)
router.get("/languages/download/:id", is_admin, controller.download)

router.post("/languages/import/:code",is_admin,(req,res,next) => {
    req.allowedFileTypes = /json/
    req.uploadDirect = true
    var currUpload = upload('file',"/",req,'fromadmin')
    currUpload(req,res,function(err){
        if(err){
            req.imageError = err.message;
            next()
       }else{
           req.fileName = req.file ? req.file.filename : false;
            next()
       }
    });
},controller.import);


router.get("/languages/delete/:id", is_admin, controller.delete)
router.get("/languages/missing-translation/:id", is_admin, controller.missingTranslation)
router.get("/languages/add-translation/:id", is_admin, controller.addTranslations)
router.post("/languages/add-phrase/:id",multer().none(),is_admin,(req,res,next) => {
    req.addPhrase = true
    next()
},controller.edit)
router.post("/languages/edit/:id/:page?",multer().none(),is_admin,(req,res,next) => {
    req.editPhrase = true
    next()
},controller.edit)
router.get('/languages/:page?', is_admin, controller.index)

module.exports = router;