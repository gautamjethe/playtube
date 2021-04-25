const express = require('express');
const router = express.Router();
const controller = require("../controllers/movies")
const multer = require("multer")
const middlewareEnable = require("../middleware/enable")


router.use('/:lng?/movies/successulPayment/:id',controller.successul)
router.use('/:lng?/movies/cancelPayment/:id',controller.cancel)

router.get('/:lng?/movies/purchase/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"video",'view')
},controller.purchase);

router.use('/:lng?/create-movie/:id?',(req,res,next) => {

    let permission = "create"
    if(req.params.id){
        permission = "edit"
    }
    
    middlewareEnable.isEnable(req,res,next,"movie",permission)
},controller.create);
router.use('/:lng?/movie/:id?',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"movie",'view')
},controller.view);
router.use('/:lng?/movie/categories',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"movie",'view')
},controller.categories);
router.use('/:lng?/movie/category/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"movie",'view')
},controller.category);
router.get('/:lng?/movies/:pageType?',multer().none(),(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"movie",'view')
},controller.browse);
router.get('/:lng?/ad-clicked/:type/:id',multer().none(),controller.adClicked);

module.exports = router; 