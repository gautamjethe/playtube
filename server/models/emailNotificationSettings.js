module.exports = {
    findAll: function (req, data = {}) {
        return new Promise(function (resolve) {
            if (!req.user) {
                resolve(false)
                return false
            }
            let owner_id = 0
            if (req.user.user_id) {
                owner_id = parseInt(req.user.user_id)
            }
            if(data.owner_id){
                owner_id = parseInt(data.owner_id)
            }
            let modulesIn = "'members','videos'"
            if (req.appSettings["enable_blog"] == 1) {
                modulesIn = modulesIn + ",'blogs'"
            }
            if (req.appSettings["enable_playlist"] == 1) {
                modulesIn = modulesIn + ",'playlists'"
            }
            if (req.appSettings["enable_audio"] == 1) {
                modulesIn = modulesIn + ",'audio'"
            }
            if (req.appSettings["enable_channel"] == 1) {
                modulesIn = modulesIn + ",'channels'"
            }
            if (req.appSettings["live_stream_start"] == 1) {
                modulesIn = modulesIn + ",'livestreaming'"
            }
            req.getConnection(function (err, connection) {
                let sql = ""
                if (data.notification) {
                    sql = 'SELECT notificationtypes.content_type,notificationtypes.type,IF(notificationsettings.notification,0,1) as enable FROM notificationtypes LEFT JOIN notificationsettings on notificationsettings.type = notificationtypes.type AND owner_id = ? WHERE content_type IN (' + modulesIn + ') ORDER BY notificationtypes.content_type DESC'
                } else {
                    sql = 'SELECT IF(emailsettings.email,0,1) as enable,emailtemplates.type,emailtemplates.content_type FROM emailtemplates LEFT JOIN emailsettings on emailtemplates.type = emailsettings.type AND owner_id = ? WHERE content_type IN (' + modulesIn + ')  ORDER BY emailtemplates.content_type DESC'
                }
                connection.query(sql, [owner_id], function (err, results, fields) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const notifications = JSON.parse(JSON.stringify(results));
                        resolve(notifications);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    }
}
