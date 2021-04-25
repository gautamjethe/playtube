module.exports = (req, res, next) => {
    //if(req.user)
    if (!req.user) {
        return res.redirect('/login?redirect=/'+process.env.ADMIN_SLUG);
    }else if(req.user.levelFlag != "superadmin" && (typeof process.env.ALLOWALLUSERINADMIN == "undefined" || !process.env.ALLOWALLUSERINADMIN)){
        return res.redirect("/");
    }else if((!req.user || req.user.levelFlag != "superadmin" ) &&  (typeof process.env.ALLOWALLUSERINADMIN != "undefined" || process.env.ALLOWALLUSERINADMIN)){
        if(req.method == "POST"){
            res.send({});
            return
        }
    }
    next();
}