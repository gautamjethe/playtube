const express = require('express');
const router = express.Router();


router.use(`/sitemap`, (req,res,next) => {
    const url = req.originalUrl.replace(process.env.ADMIN_SLUG,'');
    res.render('admin/languages/add',{nav:url})
});


module.exports = router;