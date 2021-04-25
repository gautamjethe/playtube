const express = require('express');
const router = express.Router();
const controller = require("../controllers/playlist")
const multer = require("multer")
const middlewareEnable = require("../middleware/enable")

router.use('/:lng?/playlist/:id',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"playlist",'view')
},controller.view);
router.get('/:lng?/playlists',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"playlist",'view')
},multer().none(),controller.browse);
router.use('/:lng?/create-playlist/:id?',(req,res,next) => {
    let permission = "create"
    if(req.params.id){
        permission = "edit"
    }
    middlewareEnable.isEnable(req,res,next,"playlist",permission)
},controller.create);

module.exports = router;