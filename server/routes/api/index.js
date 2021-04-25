const express = require('express');
const router = express.Router();
const multer = require("multer")
const enableSettings = require("../../middleware/enable_settings")

router.use('/api', enableSettings,  require('./liveStreaming'));
router.use('/api', enableSettings,  require('./dashboard'))
router.use('/api', enableSettings,  require('./auth'));
router.use('/api', enableSettings,  require('./search'));
router.use('/api', enableSettings,  require('./report'));
router.use('/api', enableSettings,  require('./video'));
router.use('/api', enableSettings,  require('./movies'));
router.use('/api', enableSettings,  require('./channel'));
router.use('/api', enableSettings,  require('./comment'));
router.use('/api', enableSettings,  require('./like'));
router.use('/api', enableSettings,  require('./rattings'))

router.use('/api', enableSettings,  require('./follow'));
router.use('/api', enableSettings,  require('./favourite'));
router.use('/api', enableSettings,  require('./blog'));
router.use('/api', enableSettings,  require('./user'));
router.use('/api', enableSettings,  require('./watchLater'))
router.use('/api', enableSettings,  require('./playlists'))
router.use('/api', enableSettings,  require('./audio'))
router.use('/api', enableSettings,  require('./artist'))
router.use('/api', enableSettings,  require('./notifications'))
router.use('/api', enableSettings,  require('./ads'))


router.use('/api/contact',enableSettings,multer().none(), async (req, res, next) => {
    const emailFunction = require("../../functions/emails")
    const constant = require("../../functions/constant")
    const globalModel = require("../../models/globalModel")
    await globalModel.custom(req, "SELECT vars,type FROM emailtemplates WHERE type = ?", ["contact"]).then(async resultsType => {
        if (resultsType) {
            const typeData = JSON.parse(JSON.stringify(resultsType))[0];
            let result = {}
            result.vars = typeData.vars
            result.type = "contact"

            result['usertitle'] = {}
            result['usertitle']["title"] = req.body.name
            result['usertitle']['type'] = "text"

            result['senderemail'] = {}
            result['senderemail']["title"] = req.body.email
            result['senderemail']['type'] = "text"

            result['message'] = {}
            result['message']["title"] = req.body.message
            result['message']['type'] = "text"

            result.ownerEmail = {language:"en"}
            result.toName = req.appSettings["contact_from_name"]
            result.toEmail = req.appSettings["contact_email_from"]
            result.disableFooter = true
            result.disableHeader = true
            emailFunction.sendMessage(req, result)
        }
    })
    res.send({message:constant.general.CONTACTSUCCESS})
});

router.use('/api', enableSettings,  (req, res, next) => {
    return res.status(404).send({ error: [{ "message": "Invalid Request" }], status: 404 }).end()
});

module.exports = router;