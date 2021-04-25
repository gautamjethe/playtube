const express = require('express');
const router = express.Router();
const controller = require("../controllers/ads")
const multer = require("multer")
const middlewareEnable = require("../middleware/enable")

router.use('/:lng?/create-ad/:id?',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"ads",'create')
},controller.create);

router.use('/:lng?/ads/successulPayment',controller.successul)
router.use('/:lng?/ads/cancelPayment',controller.cancel)

router.get('/ads/recharge',(req,res,next) => {
    middlewareEnable.isEnable(req,res,next,"ads",'view')
},controller.recharge);
module.exports = router;