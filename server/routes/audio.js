const express = require('express');
const router = express.Router();
const controller = require("../controllers/Audio")
const multer = require("multer")
const middlewareEnable = require("../middleware/enable")

router.use('/:lng?/audio/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"audio",'view')
},controller.view);
router.get('/:lng?/audio',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"audio",'view')
},multer().none(),controller.browse);
router.use('/:lng?/create-audio/:id?',(req,res,next) => {
    let permission = "create"
    if(req.params.id){
        permission = "edit"
    }
    middlewareEnable.isEnable(req,res,next,"audio",permission)
},controller.create);

module.exports = router;