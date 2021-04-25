const commonFunction = require("../functions/commonFunctions")
module.exports = {
    isEnable: async (req, res, next,type,permissionType) => {
        if (type != "video" && type != "livestreaming" && req.appSettings["enable_"+type] != 1) {
            await commonFunction.getGeneralInfo(req, res, "page_not_found")
            if (req.query.data) {
                res.send({data: req.query,pagenotfound:1});
                return
            }
            req.app.render(req, res, '/page-not-found', req.query);
            return 
        }else if(req.levelPermissions[type != "ads" ? type+"."+permissionType : "member.ads"] != 1 && req.levelPermissions[type != "ads" ? type+"."+permissionType : "member.ads"] != 2){
            if(!req.user){
                if(permissionType == "view" || permissionType == "edit" || permissionType == "create"){
                    await commonFunction.getGeneralInfo(req, res, "login")
                    if (req.query.data) {
                        res.send({data: req.query,user_login:1});
                        return
                    }
                    req.app.render(req, res, '/login', req.query);
                    return
                }
            }
            await commonFunction.getGeneralInfo(req, res, "permission_error")
            if (req.query.data) {
                res.send({data: req.query,permission_error:1});
                return
            }
            req.app.render(req, res, '/permission-error', req.query);
            return
        }else{
            next()
        }
    }
}