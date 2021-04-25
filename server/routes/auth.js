const express = require('express');
const router = express.Router();
const controller = require("../controllers/auth")

router.use('/:lng?/logout', (req, res, next) => {
    if(!req.user){
        res.redirect("/")
        return
    }
    req.logOut()
     
    if (req.query.data) {
        req.session.user = null;
        res.send({ success: true })
    }else{
        req.session.user = null;
        req.session.logout = true
        res.redirect( "/")
    }
})
router.get('/:lng?/login',controller.login);
router.get('/:lng?/signup',controller.signup);
router.get('/:lng?/signup/invite/:code',controller.invitesignup);
router.get('/:lng?/forgot',controller.forgotPassword);
router.get('/:lng?/reset/:code',controller.verifyCode);
router.get('/:lng?/verify-account/:code?',controller.verifyAccount)
module.exports = router;