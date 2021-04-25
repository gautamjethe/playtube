const  commonFunction = require("../functions/commonFunctions")

module.exports = async (req, res, next) => {
    //if(req.user)
    await commonFunction.getGeneralInfo(req, res, "", true);
    next();
}