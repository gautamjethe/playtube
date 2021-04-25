const express = require('express');
const router = express.Router();
const controller = require("../controllers/home");
const multer = require("multer")

router.use('/stream-start?',multer().none(), async (req, res, next) => {
    console.log(req.body,'stream start');
});
router.use('/stream-stop',multer().none(), async (req, res, next) => {
    console.log(req.body,'stream stop');
});
router.use('/stream-record',multer().none(), async (req, res, next) => {
    console.log(req.body,'stream record');
});

router.use('/:install?', async (req, res, next) => {
    if(req.installScript){
        if(req.params.install == "install"){
            next()
            return
        }else{
            res.redirect("/install")
            return
        }
    }
    var isValid = false;
    if (req.user && req.user.level_id == 1) {
        isValid = true
    } else {
        if(req.body.maintenance_code){
            if(req.body.maintenance_code == req.appSettings.maintanance_code){
                req.session.maintanance = true
                res.redirect("/")
                res.end()
                return
                //next()
            }
        }
        if (req.session && !req.session.maintanance) {
            if (req.appSettings["maintanance"] == 1) {
                const commonFunction = require("../functions/commonFunctions")
                await commonFunction.getGeneralInfo(req, res, 'maintenance')
                let appSettings = {}
                appSettings['favicon'] = req.appSettings['favicon']
                appSettings['darktheme_logo'] = req.appSettings['darktheme_logo']
                appSettings['lightheme_logo'] = req.appSettings['lightheme_logo']
                delete req.query.appSettings
                //delete req.query.languages
                delete req.query.levelPermissions
                const menus = { ...req.query.menus }
                req.query.appSettings = appSettings
                delete req.query.menus
                req.query.socialShareMenus = menus.socialShareMenus
                req.query.maintanance = true
                if (req.query.data) {
                    res.send({ data: req.query, maintanance: true })
                    return
                }
                req.app.render(req, res, '/maintenance', req.query);
            } else {
                isValid = true
            }
        }else{
            isValid = true
        }
    }

    if(isValid){
        next()
    }
})



router.use('/:lng?/pages/:id',controller.pages )
router.use('/:lng?/contact',controller.contact )
router.use('/:lng?/privacy',controller.privacy )
router.use('/:lng?/terms',controller.terms )
router.use(require("./movies"))
router.use(require("./comment"))
router.use(require("./dashboard"))
router.use(require("./search"))
router.use(require("./video"))
router.use(require("./livestreaming"))
router.use(require('./channel'))
router.use(require("./blog"))
router.use(require('./playlists'))
router.use(require('./audio'))
router.use(require('./artist'))
router.use(require("./auth"))
router.use(require("./ipn"))
router.use(require("./ads"))
router.use(require("./member"))

router.use('/cron/execute',controller.cronFunction);
router.use('/:lng?/:data?', controller.index)
router.use('/:lng?/*', controller.notFound)
module.exports = router