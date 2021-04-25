const express = require('express');
const router = express.Router();
const controller = require("../controllers/channel")
const support = require("../controllers/channelSupport")
const multer = require("multer")
const middlewareEnable = require("../middleware/enable")

router.use('/:lng?/create-channel/:id?',(req,res,next) => {
    let permission = "create"
    if(req.params.id){
        permission = "edit"
    }
    middlewareEnable.isEnable(req,res,next,"channel",permission)
},controller.create);
router.use('/:lng?/channel/categories',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},controller.categories);
router.use('/:lng?/channel/category/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},controller.category);
router.use('/:lng?/post/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},controller.post);
router.use('/:lng?/channel/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},controller.view);
router.get('/:lng?/channels',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"channel",'view')
},multer().none(),controller.browse);


router.use("/:lng?/support/cancelPayment", support.cancel)
router.use("/:lng?/support/successulPayment", support.successul)
router.use("/:lng?/support/:id/:type", support.browse)

module.exports = router;