const express = require('express');
const router = express.Router();
const controller = require("../controllers/video")
const multer = require("multer")
const middlewareEnable = require("../middleware/enable")


router.use('/:lng?/videos/successulPayment/:id',controller.successul)
router.use('/:lng?/videos/cancelPayment/:id',controller.cancel)

router.get('/:lng?/videos/purchase/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"video",'view')
},controller.purchase);

router.use('/:lng?/create-video/:id?',(req,res,next) => {
    let permission = "create"
    if(req.params.id){
        permission = "edit"
    }
    
    middlewareEnable.isEnable(req,res,next,"video",permission)
},controller.create);
router.use('/:lng?/watch/:id?',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"video",'view')
},controller.view);
router.use('/:lng?/embed/:id?',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"video",'view')
    req.embed = true;
},controller.view);
router.use('/:lng?/video/categories',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"video",'view')
},controller.categories);
router.use('/:lng?/video/category/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"video",'view')
},controller.category);
router.get('/:lng?/videos/:pageType?',multer().none(),(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"video",'view')
},controller.browse);
router.get('/:lng?/ad-clicked/:type/:id',multer().none(),controller.adClicked);

module.exports = router; 