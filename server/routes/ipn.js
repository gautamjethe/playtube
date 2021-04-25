const express = require('express');
const router = express.Router();
const controller = require("../controllers/ipn")
router.use('/payment/IPN',controller.index);

module.exports = router;