const fieldErrors = require('../functions/error'),
errorCodes = require("../functions/statusCodes"),
constant = require("../functions/constant")

module.exports = (req, res, next) => {
    //if(req.user)
    if (!req.user) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.LOGIN }], true), status: errorCodes.unauthorized }).end();
    }
    next();
}