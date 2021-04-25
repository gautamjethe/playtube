const commonFunction = require("../functions/commonFunctions");

module.exports = {
    getPlaylist: function (video_id, req, res) {
        return new Promise(function (resolve, reject) {
            if (!req.user) {
                resolve(false);
                return
            }
            req.getConnection(function (err, connection) {
                connection.query('SELECT playlists.title,playlists.playlist_id FROM `playlists` WHERE playlist_id NOT IN (SELECT playlist_id FROM playlistvideos WHERE video_id = ? AND owner_id = ?) AND owner_id = ?', [parseInt(video_id), parseInt(req.user.user_id),parseInt(req.user.user_id)], function (err, results, fields) {
                    if (err)
                        reject(false)
                    if (results) {
                        const lists = JSON.parse(JSON.stringify(results));
                        resolve(lists);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    delete: function (id, req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query("SELECT * FROM playlists WHERE playlist_id = ?", [id], function (err, results, fields) {
                    const playlist = JSON.parse(JSON.stringify(results))[0];
                    connection.query("DELETE FROM playlists WHERE playlist_id = ?", [id], function (err, results, fields) {
                        if (err)
                            resolve(false)
                        if (results) {
                            commonFunction.deleteImage(req,'',"","",playlist);
                            connection.query("UPDATE channels SET total_playlists = total_playlists - 1 WHERE channel_id IN (SELECT channel_id FROM channelplaylists WHERE playlist_id = ?)", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM channelplaylists WHERE playlist_id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM playlistvideos WHERE playlist_id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM comments WHERE type = 'playlists' && id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM favourites WHERE type = 'playlists' && id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM likes WHERE type = 'playlists' && id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM recently_viewed WHERE type = 'playlists' && id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM ratings WHERE type = 'playlists' && id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM notifications WHERE (object_type = 'playlists' && object_id = ?) OR (subject_type = 'playlists' && object_id = ?)", [id,id], function (err, results, fields) { })
                            connection.query("DELETE FROM reports WHERE type = ? AND id = ?", ["playlists", playlist.custom_url], function (err, results, fields) {
                            })
                            resolve(true)
                        } else {
                            resolve("");
                        }
                    })
                })
            })
        });
    },
    getPlaylists: function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                let condition = []
                let owner_id = 0
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }
                let customSelect = ""
                if (data.orderby == "random") {
                    customSelect = ' FLOOR(1 + RAND() * playlists.playlist_id) as randomSelect, '
                }
                let customUrlVideo = ""
               // if(!data.myContent){
                    customUrlVideo = "videos.custom_url as vcustom_url,"
               // }
                let sql = 'SELECT '+customUrlVideo+'playlists.*,'+customSelect+'likes.like_dislike,userdetails.displayname,userdetails.username,userdetails.verified,IF(playlists.image IS NULL || playlists.image = "","' + req.appSettings['playlist_default_photo'] + '",playlists.image) as image,IF(userdetails.avtar IS NULL || userdetails.avtar = "",(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,favourites.favourite_id FROM playlists '
                
               // if (!data.myContent) {
                    sql += " INNER JOIN playlistvideos ON playlistvideos.playlist_id = playlists.playlist_id INNER JOIN videos ON playlistvideos.video_id = videos.video_id "
               // }
                if (data.channel_id) {
                    sql += " LEFT JOIN channelplaylists ON channelplaylists.playlist_id = playlists.playlist_id AND channel_id = " + data.channel_id
                }
                sql += ' LEFT JOIN users on users.user_id = playlists.owner_id LEFT JOIN userdetails on users.user_id = userdetails.user_id LEFT JOIN likes ON likes.id = playlists.playlist_id AND likes.type = "playlists"  AND likes.owner_id =  ' + owner_id + ' LEFT JOIN favourites ON (favourites.id = playlists.playlist_id AND favourites.type = "playlists" AND favourites.owner_id = ' + owner_id + ') '

                let orderbyField = false
                if (data.recentlyViewed) {
                    condition.push(parseInt(data.owner_id))
                    orderbyField = " recently_viewed.creation_date DESC "
                    sql += " INNER JOIN recently_viewed ON playlists.playlist_id = recently_viewed.id AND recently_viewed.owner_id = ? AND recently_viewed.type='playlists' "
                }
                if (data.myrated) {
                    orderbyField = " ratings.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN ratings ON playlists.playlist_id = ratings.id AND ratings.owner_id = ? AND ratings.type='playlists' "
                }
                if (data.myfav) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN favourites as f ON playlists.playlist_id = f.id AND f.owner_id = ? AND f.type='playlists' "
                }
                if (data.mylike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON playlists.playlist_id = l.id AND l.owner_id = ? AND l.type='playlists' AND l.like_dislike = 'like' "
                }
                if (data.mydislike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON playlists.playlist_id = l.id AND l.owner_id = ? AND l.type='playlists' AND l.like_dislike = 'dislike' "
                }

                if (data.mycommented) {
                    orderbyField = " comments.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN comments ON playlists.playlist_id = comments.id AND comments.owner_id = ? AND comments.type='playlists' "
                }

                sql += " WHERE 1=1 "

                sql += " AND users.active = 1 AND users.approve = 1 "
                if (!data.myContent) {
                    sql += ' AND  playlists.approve = 1 AND playlists.search = 1 AND (playlists.owner_id = '+(req.user ? req.user.user_id : 0)+' || playlists.private != 1) '
                    if (!req.session.adult_allow && req.appSettings['playlist_adult'] == 1) {
                       // sql += " AND playlists.adult = 0 "
                    }
                }
                if (data.channel_id) {
                    sql += " AND channelplaylists.playlist_id IS NULL "
                }
                if (data.title) {
                    condition.push(data.title.toLowerCase())
                    sql += " AND LOWER(playlists.title) LIKE CONCAT('%', ?,  '%')"
                }

                if (data.owner_id && !data.myCustom) {
                    condition.push(parseInt(data.owner_id))
                    sql += " AND playlists.owner_id = ?"
                }
               
                if (data.is_featured) {
                    condition.push(parseInt(data.is_featured))
                    sql += " AND playlists.is_featured = ?"
                }
                if (data.is_not_hot) {
                    condition.push(1)
                    sql += " AND playlists.is_hot != ?"
                }
                if (data.is_not_featured) {
                    condition.push(1)
                    sql += " AND playlists.is_featured != ?"
                }
                if (data.not_playlist_id) {
                    condition.push(parseInt(data.not_playlist_id))
                    sql += " AND playlists.playlist_id != ?"
                }
                if (data.is_not_sponsored) {
                    condition.push(1)
                    sql += " AND playlists.is_sponsored != ?"
                }
                if (data.is_hot) {
                    condition.push(parseInt(data.is_hot))
                    sql += " AND playlists.is_hot = ?"
                }
                if (data.is_sponsored) {
                    condition.push(parseInt(data.is_sponsored))
                    sql += " AND playlists.is_sponsored = ?"
                }
                if (data.offtheday) {
                    condition.push(data.offtheday)
                    sql += " AND playlists.offtheday = ?"
                }


                if (data.custom_url) {
                    condition.push(data.custom_url)
                    sql += " AND playlists.custom_url =?"
                }
                //if (!data.myContent) {
                    sql += " GROUP BY playlists.playlist_id "
               // }
                if (data.orderby == "random") {
                    sql += " ORDER BY randomSelect DESC "
                } else if (orderbyField) {
                    sql += " ORDER BY " + orderbyField
                } else if (data.orderby) {
                    sql += " ORDER BY " + data.orderby
                } else {
                    sql += " ORDER BY playlists.playlist_id desc "
                }

                if (data.limit) {
                    condition.push(data.limit)
                    sql += " LIMIT ?"
                }

                if (data.offset) {
                    condition.push(data.offset)
                    sql += " OFFSET ?"
                }
                connection.query(sql, condition, function (err, results, fields) {
                    if (err)
                        reject(err)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level);
                    } else {
                        resolve("");
                    }
                })
            })
        })
    },
    userPlaylistUploadCount: function (req, res) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT COUNT(playlist_id) as totalPlaylists FROM playlists WHERE  owner_id = ?', [req.user.user_id], function (err, results, fields) {
                    if (err)
                        reject(err)

                    if (results) {
                        const playlists = JSON.parse(JSON.stringify(results));
                        resolve(playlists[0]);
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    findByCustomUrl: function (id, req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM playlists WHERE custom_url = ?', [id], function (err, results, fields) {
                    if (err)
                        reject(false)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        let playlist = level[0]
                        resolve(playlist);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
}
