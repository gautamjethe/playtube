const express = require('express');
const router = express.Router();
const is_admin = require("../../middleware/admin/is-admin")
const controller = require("../../controllers/admin/comments")

router.get(`/comments/reply/:id/:page?`, is_admin,controller.replies);

router.get("/comments/delete/:id",is_admin,controller.delete)
router.get(`/comments/settings`, is_admin,controller.settings);
router.post('/comments/settings',is_admin, controller.settings);

router.get(`/comments/:page?`, is_admin,controller.index);
module.exports = router;