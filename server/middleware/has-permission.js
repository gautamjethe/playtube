const fieldErrors = require('../functions/error'),
errorCodes = require("../functions/statusCodes"),
constant = require("../functions/constant")

module.exports = {
    isValid: (req, res, next,type,permissionName,checkLevelPermission = true) => {
        if(!type){
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.unauthorized }).end();
        }
        let typeName = type.replace(/\s$/, '')
        if(typeName.charAt( typeName.length-1 ) == "s") {
            typeName = typeName.slice(0, -1)
        }
        if((req.levelPermissions && parseInt(req.levelPermissions[typeName+'.'+permissionName])) || !checkLevelPermission){
            if(parseInt(req.levelPermissions[typeName+'.'+permissionName]) == 2){
                next()
            }else if((!checkLevelPermission ||  parseInt(req.levelPermissions[typeName+'.'+permissionName]) == 1) && ((req.item && parseInt(req.user.user_id) == parseInt(req.item.user_id ? req.item.user_id : req.item.owner_id))  ||  (req.itemData && parseInt(req.user.user_id) == parseInt(req.itemData.user_id ? req.itemData.user_id : req.itemData.owner_id))  ) ){
                next()
            }else{
                //permission error
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.unauthorized }).end();
            }
        }else{
            //permission error
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.unauthorized }).end();
        }
    }
}