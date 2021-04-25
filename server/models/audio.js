const commonFunction = require("../functions/commonFunctions");
const privacyModel = require("../models/privacy")

module.exports = {
    delete: function (id, req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query("SELECT * FROM audio WHERE audio_id = ?", [id], function (err, results, fields) {
                    const audio = JSON.parse(JSON.stringify(results))[0];
                    connection.query("DELETE FROM audio WHERE audio_id = ?", [id], function (err, results, fields) {
                        if (err)
                            resolve(false)
                        if (results) {
                            commonFunction.deleteImage(req,'',"","",audio);
                            connection.query("DELETE FROM comments WHERE type = 'audio' && id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM favourites WHERE type = 'audio' && id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM likes WHERE type = 'audio' && id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM recently_viewed WHERE type = 'audio' && id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM ratings WHERE type = 'audio' && id = ?", [id], function (err, results, fields) { })
                            connection.query("DELETE FROM notifications WHERE (object_type = 'audio' && object_id = ?) OR (subject_type = 'audio' && object_id = ?)", [id,id], function (err, results, fields) { })
                            connection.query("DELETE FROM reports WHERE type = ? AND id = ?", ["audio", audio.custom_url], function (err, results, fields) {
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
    getAudios: function (req, data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(async function (err, connection) {
                let condition = []
                let owner_id = 0
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }
                let customSelect = ""
                if (data.orderby == "random") {
                    customSelect = ' FLOOR(1 + RAND() * audio.audio_id) as randomSelect, '
                }
                let customUrlAudio = ""
               // if(!data.myContent){
                customUrlAudio = "audio.custom_url as vcustom_url,"
               // }
                let sql = 'SELECT '+customUrlAudio+'audio.*,'+customSelect+'likes.like_dislike,userdetails.displayname,userdetails.username,userdetails.verified,IF(audio.image IS NULL || audio.image = "","' + req.appSettings['audio_default_photo'] + '",audio.image) as image,IF(userdetails.avtar IS NULL || userdetails.avtar = "",(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,favourites.favourite_id FROM audio '
                
                if (data.channel_id) {
                    sql += " LEFT JOIN channelaudio ON channelaudio.audio_id = audio.audio_id AND channel_id = " + data.channel_id
                }
                sql += ' LEFT JOIN users on users.user_id = audio.owner_id LEFT JOIN userdetails on users.user_id = userdetails.user_id LEFT JOIN likes ON likes.id = audio.audio_id AND likes.type = "audio"  AND likes.owner_id =  ' + owner_id + ' LEFT JOIN favourites ON (favourites.id = audio.audio_id AND favourites.type = "audio" AND favourites.owner_id = ' + owner_id + ') '

                let orderbyField = false
                if (data.recentlyViewed) {
                    condition.push(parseInt(data.owner_id))
                    orderbyField = " recently_viewed.creation_date DESC "
                    sql += " INNER JOIN recently_viewed ON audio.audio_id = recently_viewed.id AND recently_viewed.owner_id = ? AND recently_viewed.type='audio' "
                }
                if (data.myrated) {
                    orderbyField = " ratings.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN ratings ON audio.audio_id = ratings.id AND ratings.owner_id = ? AND ratings.type='audio' "
                }
                if (data.myfav) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN favourites as f ON audio.audio_id = f.id AND f.owner_id = ? AND f.type='audio' "
                }
                if (data.mylike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON audio.audio_id = l.id AND l.owner_id = ? AND l.type='audio' AND l.like_dislike = 'like' "
                }
                if (data.mydislike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON audio.audio_id = l.id AND l.owner_id = ? AND l.type='audio' AND l.like_dislike = 'dislike' "
                }

                if (data.mycommented) {
                    orderbyField = " comments.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN comments ON audio.audio_id = comments.id AND comments.owner_id = ? AND comments.type='audio' "
                }

                sql += " WHERE 1=1 "

                

                await privacyModel.checkSQL(req,'audio','audio','audio_id').then(result => {
                    if(result){
                        sql += " AND ( "+result+" )"
                    }
                })


                sql += " AND users.active = 1 AND users.approve = 1 "
                if (!data.myContent) {
                    if (data.audioview) {
                        if(!req.user || req.levelPermissions['audio.view'] != 2)
                            sql += " AND audio.approve = 1 "
                    }else{
                        sql += ' AND audio.search = 1 AND audio.approve = 1 '
                    }

                }
                sql += " AND audio.title IS NOT NULL AND audio.title != '' "
                if (data.title) {
                    condition.push(data.title.toLowerCase())
                    sql += " AND LOWER(audio.title) LIKE CONCAT('%', ?,  '%')"
                }

                if (data.owner_id && !data.myCustom) {
                    condition.push(parseInt(data.owner_id))
                    sql += " AND audio.owner_id = ?"
                }
               
                if (data.is_featured) {
                    condition.push(parseInt(data.is_featured))
                    sql += " AND audio.is_featured = ?"
                }
                if (data.is_not_hot) {
                    condition.push(1)
                    sql += " AND audio.is_hot != ?"
                }
                if (data.is_not_featured) {
                    condition.push(1)
                    sql += " AND audio.is_featured != ?"
                }
                if (data.not_audio_id) {
                    condition.push(parseInt(data.not_audio_id))
                    sql += " AND audio.audio_id != ?"
                }
                if (data.is_not_sponsored) {
                    condition.push(1)
                    sql += " AND audio.is_sponsored != ?"
                }
                if (data.is_hot) {
                    condition.push(parseInt(data.is_hot))
                    sql += " AND audio.is_hot = ?"
                }
                if (data.is_sponsored) {
                    condition.push(parseInt(data.is_sponsored))
                    sql += " AND audio.is_sponsored = ?"
                }
                if (data.offtheday) {
                    condition.push(data.offtheday)
                    sql += " AND audio.offtheday = ?"
                }


                if (data.custom_url) {
                    condition.push(data.custom_url)
                    sql += " AND audio.custom_url =?"
                }
                //if (!data.myContent) {
                    sql += " GROUP BY audio.audio_id "
               // }
                if (data.orderby == "random") {
                    sql += " ORDER BY randomSelect DESC "
                } else if (orderbyField) {
                    sql += " ORDER BY " + orderbyField
                } else if (data.orderby) {
                    sql += " ORDER BY " + data.orderby
                } else {
                    sql += " ORDER BY audio.audio_id desc "
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
                        const audios = []
                        if(level && level.length){
                            level.forEach(audio => {
                                delete audio.password
                                audios.push(audio)
                            })
                            resolve(audios)
                        }else{
                            resolve(level);
                        }
                    } else {
                        resolve("");
                    }
                })
            })
        })
    },
    userAudioUploadCount: function (req, res) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT COUNT(audio_id) as totalAudios FROM audio WHERE  owner_id = ?', [req.user.user_id], function (err, results, fields) {
                    if (err)
                        reject(err)

                    if (results) {
                        const audio = JSON.parse(JSON.stringify(results));
                        resolve(audio[0]);
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    findByCustomUrl: function (id, req,allowData = false) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM audio WHERE custom_url = ?', [id], function (err, results, fields) {
                    if (err)
                        reject(false)
                    if (results) {
                        const audio1 = JSON.parse(JSON.stringify(results));
                        let audio = audio1[0]
                        if (!allowData && audio) {
                            delete audio['password']
                        }
                        resolve(audio);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
}
