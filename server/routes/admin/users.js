const express = require('express');
const router = express.Router();
const is_admin = require("../../middleware/admin/is-admin")
const controller = require("../../controllers/admin/users")
const userModel = require("../../models/users")
const globalModel = require("../../models/globalModel")
const multer = require("multer")
const { check } = require('express-validator')
const constant = require("../../functions/constant");

router.get('/users/withdraw/:page?',is_admin, controller.withdraws);
router.get('/users/withdraw/approved/:id',is_admin, controller.withdrawsApprove);
router.get('/users/withdraw/reject/:id',is_admin, controller.withdrawsReject);
router.get('/users/withdraw/delete/:id',is_admin, controller.withdrawsDelete);


router.get('/users/settings',is_admin, controller.settings);
router.post('/users/settings',is_admin, controller.settings);
router.get("/users/delete/:id",is_admin,controller.delete)
router.get("/users/login/:id",is_admin,controller.login)
router.post("/users/verified/:id",is_admin,controller.verified)
router.post("/users/featured/:id",is_admin,controller.featured)
router.post("/users/sponsored/:id",is_admin,controller.sponsored)
router.post("/users/hot/:id",is_admin,controller.hot)
router.post("/users/popular/:id",is_admin,controller.popular)
router.post("/users/approve/:id",is_admin,controller.approve)
router.post("/users/active/:id",is_admin,controller.active)


router.post('/users/edit/:id', is_admin,multer().none(), async (req, res, next) => {
    const id = req.params.id
    req.allowAll = true
    await userModel.findById(id, req, res,true).then(result => {
        if (result) {
            req.item = result
        }
    })
    req.allowAll = false
    next()
}, 
[
    check('email')
      .isEmail()
      .trim()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        // return true;
        if (req.item.email != value) {
            return globalModel.custom(req, "SELECT users.user_id FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id WHERE users.user_id != ? AND email = ?", [req.params.id, value]).then(result => {
                if (result && result.length > 0) {
                    return Promise.reject( constant.member.EMAILTAKEN)
                }else{
                    return Promise.resolve(true)
                }
            })
        }else{
            return Promise.resolve(true)
        } 
      }),
    check('username')
      .optional({ checkFalsy:true })
        .custom((value, { req }) => {
            if (req.item.username != value ) {
                if(req.levelPermissions['member.username'] == 1){
                    if (value.length < 4 || value.length > 40){
                        return Promise.reject("'Username must be at least 4 characters long'")
                    }
                    return globalModel.custom(req, "SELECT users.user_id FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id WHERE users.user_id != ? AND username = ?", [req.params.id, value]).then(result => {
                        if (result && result.length > 0) {
                            return Promise.reject( constant.member.USERNAMETAKEN)
                        }else{
                            const banword = require("../../models/banwords")
                            return banword.find(req,{text:value}).then(result => {
                                if (result) {
                                    return Promise.reject(
                                        constant.member.USERNAMETAKEN
                                    );
                                }
                            })
                        }
                    })
                }else{
                    return Promise.resolve(true)
                }
            } else{
                return Promise.resolve(true)
            }  
        }),

    check('password')
        .trim()
        .custom(password => {
			if (password && password.trim().length < 7) {
					return Promise.reject(
                        "Password must be at least 6 chars long"
                    );
			} else {
				return Promise.resolve(true)
			}

        }),
    check('first_name')
        .trim()
        .not()
        .isEmpty()
        .withMessage('First Name should not be empty.'),
    check('level_id')
        .not()
        .isEmpty()
        .withMessage('Member Role should not be empty.')
        .trim()
        

     ], controller.edit) 


router.get('/users/invite',is_admin, controller.invite);
router.post('/users/invite',is_admin, controller.invite);

router.get('/users/verification/:page?',is_admin, controller.verification);
router.get('/users/verification/delete/:id',is_admin, controller.deleteVerification);
router.get('/users/verification/approve/:id',is_admin, controller.approveVerification);

router.get('/users/monetization/:page?',is_admin, controller.monetization);
router.get('/users/monetization/delete/:id',is_admin, controller.deleteMonetization);
router.get('/users/monetization/approve/:id',is_admin, controller.approveMonetization);


router.get('/users/:page?',is_admin, controller.index);
router.post('/users',is_admin, controller.index);


router.get("/levels/create/:id?",is_admin,controller.createLevel);
router.post("/levels/create/:id?",is_admin,controller.createLevel);
router.get("/levels/default/:level_id",is_admin,controller.defaultLevel)
router.get(`/levels/delete/:level_id`, is_admin,controller.deleteLevel)
router.get(`/levels/edit/:level_id`, is_admin,controller.editLevel)
router.post(`/levels/edit/:level_id`, is_admin,controller.editLevel)
router.get(`/levels/:page?`, is_admin,controller.levels);


module.exports = router;