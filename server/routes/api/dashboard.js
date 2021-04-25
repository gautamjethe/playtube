const router = require('express').Router()
const controller = require("../../controllers/api/dashboard")
const multer = require("multer")
const privacyMiddleware = require("../../middleware/has-permission")
const userModel = require("../../models/users")

router.post('/dashboard/stats',multer().none(), controller.stats)

router.post('/dashboard/notifications',multer().none(), async (req, res, next) => {
    const id = req.body.user_id
    await userModel.findById(id, req, res).then(result => {
        if (result) {
            req.item = result
        }
    })

    privacyMiddleware.isValid(req, res, next, 'member', 'edit')
}, controller.notifications)
router.post('/dashboard/emails',multer().none(), async (req, res, next) => {
    const id = req.body.user_id
    await userModel.findById(id, req, res).then(result => {
        if (result) {
            req.item = result
        }
    })

    privacyMiddleware.isValid(req, res, next, 'member', 'edit')
}, controller.emails)
router.post('/dashboard/:type?/:filter?',multer().none(), controller.index)

module.exports = router;