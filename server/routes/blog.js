const express = require('express');
const router = express.Router();
const controller = require("../controllers/blog")
const multer = require("multer")
const middlewareEnable = require("../middleware/enable")

router.use('/:lng?/create-blog/:id?',(req,res,next) => {
    let permission = "create"
    if(req.params.id){
        permission = "edit"
    }
    middlewareEnable.isEnable(req,res,next,"blog",permission)
},controller.create);
router.use('/:lng?/blog/categories',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"blog",'view')
},controller.categories);
router.use('/:lng?/blog/category/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"blog",'view')
},controller.category);
router.use('/:lng?/blog/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"blog",'view')
},controller.view);
router.use('/:lng?/blogs',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"blog",'view')
},multer().none(),controller.browse);

module.exports = router;