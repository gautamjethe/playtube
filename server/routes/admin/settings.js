const express = require('express')
const router = express.Router()
const {upload} = require("../../functions/upload")
const resize = require("../../functions/resize")
const controller = require("../../controllers/admin/settings")
const is_admin = require("../../middleware/admin/is-admin")

router.get('/settings',is_admin, controller.settings);
router.post('/settings',is_admin, controller.settings);

router.get('/settings/email',is_admin, controller.emails);
router.post('/settings/email',is_admin, controller.emails);

router.get('/settings/login',is_admin, controller.login);
router.post('/settings/login',is_admin, controller.login);

router.get('/settings/s3',is_admin, controller.s3);
router.post('/settings/s3',is_admin, controller.s3);

router.get('/settings/newsletter',is_admin, controller.newsletter);
router.post('/settings/newsletter',is_admin, controller.newsletter);

router.get('/settings/contact',is_admin, controller.contact);
router.post('/settings/contact',is_admin, controller.contact);

router.get('/settings/signup',is_admin, controller.signup);
router.post('/settings/signup',is_admin, controller.signup);

router.get('/pwa',is_admin, controller.pwa);
router.post('/pwa',is_admin, controller.pwa);


module.exports = router;