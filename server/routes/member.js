const express = require('express');
const router = express.Router();
const controller = require("../controllers/user")
const upgrade = require("../controllers/upgrade")
const passport = require("passport")

const multer = require("multer"),
request = require('request')
const { generateToken, sendToken } = require('../utils/token');


router.use("/:lng?/upgrade/cancelPayment", upgrade.cancel)
router.use("/:lng?/upgrade/successulPayment", upgrade.successul)
router.use("/:lng?/upgrade/success", upgrade.paymentSuccessul)
router.use("/:lng?/upgrade/fail", upgrade.paymentFail)

router.use("/:lng?/upgrade/:package_id?", upgrade.browse)
router.use('/:lng?/members', controller.browse);
router.use('/:lng?/:id', controller.view);

router.route('/auth/twitter/reverse', multer().none())
    .post(async function (req, res) {
        const setting = req.appSettings
        request.post({
            url: 'https://api.twitter.com/oauth/request_token',
            oauth: {
                oauth_callback: "http%3A%2F%2Flocalhost%3A3001%2Ftwitter-callback",
                consumer_key: setting.social_login_twitter_apiid,
                consumer_secret: setting.social_login_twitter_apikey
            }
        }, function (err, r, body) {
            if (err) {
                return res.status(500).send("");
            }
            try {
                var jsonStr = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
                res.send(JSON.parse(jsonStr));
            } catch (err) {
                return res.status(500).send("").end();
            }
            
        });
    });

router.route('/auth/twitter', multer().none())
    .post(async (req, res, next) => {
        const setting = req.appSettings
        request.post({
            url: `https://api.twitter.com/oauth/access_token?oauth_verifier`,
            oauth: {
                consumer_key: setting.social_login_twitter_apiid,
                consumer_secret: setting.social_login_twitter_apikey,
                token: req.query.oauth_token
            },
            form: { oauth_verifier: req.query.oauth_verifier }
        }, function (error, r, body) {
            if (error) {
                return res.status(500).send("").end();
            }
            try {
                const bodyString = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
                const parsedBody = JSON.parse(bodyString);
                req.body['oauth_token'] = parsedBody.oauth_token;
                req.body['oauth_token_secret'] = parsedBody.oauth_token_secret;
                req.body['user_id'] = parsedBody.user_id;
                require("../passport")(req, res)
            } catch (err) {
                return res.status(500).send("").end();
            }
            next()
        });
    }, passport.authenticate('twitter-token', { session: false }), function (req, res, next) {
        if (!req.user) {
            return res.status(500).send("").end();
        }
        req.auth = {
            id: req.user._id
        };
        return next();
    }, generateToken, sendToken);

router.use('/auth/facebook', multer().none()
    , async (req, res, next) => {
        require("../passport")(req, res)
        next()
    }, passport.authenticate('facebook-token', { session: false }), function (req, res, next) {
        if (!req.user) {
            return res.status(200).send("").end();
        }
        req.auth = {
            id: req.user.id
        };
        next();
    }, generateToken, sendToken);

router.use('/auth/google', multer().none(),
    async (req, res, next) => {
        require("../passport")(req, res)
        next();
    }
    , passport.authenticate('google-token', { session: false }), function (req, res, next) {
        if (!req.user) {
            return res.status(200).send("").end();
        }
        req.auth = {
            id: req.user.id
        }
        next()
    }, generateToken, sendToken);


router.use('/auth/apple', multer().none(),
    async (req, res, next) => {
        require("../passport")(req, res)
        next();
    }
    , passport.authenticate('apple', { failureRedirect: '/login',session:false,successRedirect:"/" }), function (req, res, next) {
        if (!req.user) {
            return res.status(200).send("").end();
        }
        req.auth = {
            id: req.user.id
        }
        next()
    }, generateToken, sendToken);
module.exports = router;