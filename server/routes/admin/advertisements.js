const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/advertisements")
const is_admin = require("../../middleware/admin/is-admin")
const multer = require("multer")


router.get(`/advertisements/website/delete/:id?`,multer().none(),is_admin,controller.websiteadsDelete);
router.post(`/advertisements/website/approve/:id`,multer().none(),is_admin,controller.websiteadsApprove);
router.post(`/advertisements/website/status/:id`,multer().none(),is_admin,controller.websiteadsStatus);
router.get(`/advertisements/user/:page?`,is_admin,controller.userads);
router.get(`/advertisements/website/:page?`,is_admin,controller.websiteads);
router.post(`/advertisements/website/:page?`,is_admin,controller.websiteads);

router.get(`/advertisements/settings`,multer().none(),is_admin,controller.settings)
router.post(`/advertisements/settings`,multer().none(),is_admin,controller.settings)

router.get(`/advertisements/create/:id?`,multer().none(),is_admin,controller.create);
router.post(`/advertisements/create/:id?`,multer().none(),is_admin,controller.create);
router.get(`/advertisements/delete/:id?`,multer().none(),is_admin,controller.delete);
router.post(`/advertisements/active/:id`,multer().none(),is_admin,controller.active);

router.get(`/advertisements/:page?`,is_admin,controller.index);
module.exports = router; 