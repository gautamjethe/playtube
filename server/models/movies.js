const privacyModel = require("../models/privacy")
const dateTime = require("node-datetime")
const commonFunction = require("../functions/commonFunctions");
const globalModel = require("./globalModel")
module.exports = {
    checkMoviePurchased: function (data, req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT state FROM transactions WHERE (state = "approved" || state = "completed") AND owner_id = ? AND id = ? AND type = "movie_purchase"', [parseInt(data.owner_id),parseInt(data.id)], function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    createSeasons: function (req,data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM seasons WHERE movie_id = ? ORDER BY season_id DESC', [data.movie_id], function (err, results) {
                    if (err)
                        resolve(false)
                    let season = null
                    if (results) {
                        const seasons = JSON.parse(JSON.stringify(results));
                        season = seasons[0];                      
                    } 
                    let id = season ? parseInt(season.id) + 1 : 1
                    globalModel.create(req, {movie_id:data.movie_id,id:id}, "seasons").then(result => {
                        if (result) {
                            let season = {}
                            season.season_id = result.insertId
                            season.id =  id
                            season.castncrew = []
                            season.episodes = []
                            resolve(season);
                        } else {
                            resolve(false)
                        }
                    })
                })

            });
        });
    },
    getGeneres : function (req,data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                let sql = 'SELECT * FROM movie_genres LEFT JOIN genres ON genres.genre_id = movie_genres.genre_id WHERE 1=1 ';
                let condition = []

                if(data.resource_id){
                    sql += " AND movie_id = ?"
                    condition.push(data.resource_id)
                }
                if(data.movie_genre_ids){
                    sql += " AND movie_genres.movie_genre_id IN ("+data.movie_genre_ids.join(",")+")"
                }

                sql += " ORDER BY movie_genres.genre_id DESC";
                connection.query(sql, condition, function (err, results) {
                    console.log(err);
                    if (err)
                        resolve(false)
                    if (results) {
                        const photos = JSON.parse(JSON.stringify(results));
                        resolve(photos)
                    }else{
                        resolve(false)
                    }
                })
            });
        });
    },
    getPhotos: function (req,data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM photos WHERE resource_id = ? AND resource_type = "movies" ORDER BY photo_id DESC', [data.resource_id], function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const photos = JSON.parse(JSON.stringify(results));
                        resolve(photos)
                    }else{
                        resolve(false)
                    }
                })
            });
        });
    },
    getSeasons: function (req,data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM seasons WHERE  movie_id = ? ORDER BY season_id ASC', [data.movie_id], function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const seasons = JSON.parse(JSON.stringify(results));
                        resolve(seasons)
                    }else{
                        resolve(false)
                    }
                })
            });
        });
    },
    getEpisods: function (req,data) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT *,IF(episodes.image IS NULL || episodes.image = "","' + req.appSettings['episode_default_photo'] + '",episodes.image) as image FROM episodes WHERE  season_id = ? ORDER BY episode_id ASC', [data.season_id], function (err, results) {
                    if (err)
                        resolve([])
                    if (results) {
                        const episods = JSON.parse(JSON.stringify(results));
                        resolve(episods)
                    }else{
                        resolve([])
                    }
                })
            });
        });
    },
    findById: function (id, req, isApprove = true) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {

                let approve = ""
                if(isApprove){
                    approve = " approve = 1 AND "
                }
                connection.query('SELECT * FROM movies WHERE '+approve+' completed = 1 AND movie_id = ?', [id], function (err, results) {
                    console.log(err)
                    if (err)
                        resolve(false)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
    deleteEpisode:function ( req,episode) {
        return new Promise(function (resolve) {
            req.getConnection(function (err, connection) {
                connection.query("DELETE FROM episodes WHERE episode_id = ?", [episode.episode_id], function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        let type = "episodes"
                        let id = episode.episode_id
                        commonFunction.deleteImage(req,'',episode.image);
                        connection.query("DELETE FROM comments WHERE type = ? && id = ?", [type,id], function () { })
                        connection.query("DELETE FROM favourites WHERE type = ? && id = ?", [type,id], function () { })
                        connection.query("DELETE FROM likes WHERE type = ? && id = ?", [type,id], function () { })
                        connection.query("DELETE FROM recently_viewed WHERE type = ? && id = ?", [type,id], function () { })
                        connection.query("DELETE FROM ratings WHERE type = ? && id = ?", [type,id], function () { })
                        connection.query("DELETE FROM notifications WHERE (object_type = ? && object_id = ?) OR (subject_type = ? && object_id = ?)", [type,id,type,id], function () { })
                        connection.query("DELETE FROM reports WHERE type = ? AND id = ?", [type, episode.custom_url], function () {
                        })
                        resolve(true)
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    deleteSeason:function ( req,season) {
        return new Promise(function (resolve) {
            req.getConnection(function (err, connection) {
                connection.query("DELETE FROM seasons WHERE season_id = ?", [season.season_id], function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        let type = "seasons"
                        let id = season.season_id
                        commonFunction.deleteImage(req,'',season.image);
                        connection.query("DELETE FROM episodes WHERE season_id = ?", [id], function () { })
                        connection.query("DELETE FROM cast_crew WHERE resource_type= 'season' AND resource_id = ?", [id], function () { })
                        connection.query("DELETE FROM comments WHERE type = ? && id = ?", [type,id], function () { })
                        connection.query("DELETE FROM favourites WHERE type = ? && id = ?", [type,id], function () { })
                        connection.query("DELETE FROM likes WHERE type = ? && id = ?", [type,id], function () { })
                        connection.query("DELETE FROM recently_viewed WHERE type = ? && id = ?", [type,id], function () { })
                        connection.query("DELETE FROM ratings WHERE type = ? && id = ?", [type,id], function () { })
                        connection.query("DELETE FROM notifications WHERE (object_type = ? && object_id = ?) OR (subject_type = ? && object_id = ?)", [type,id,type,id], function () { })
                        connection.query("DELETE FROM reports WHERE type = ? AND id = ?", [type, season.custom_url], function () {
                        })
                        resolve(true)
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    delete: function (id, req,type = "movies") {
        return new Promise(function (resolve) {
            req.getConnection(function (err, connection) {
                connection.query("SELECT * FROM movies WHERE movie_id = ?", [id], function (err, results) {
                    const movie = JSON.parse(JSON.stringify(results))[0];
                    connection.query("DELETE FROM movies WHERE movie_id = ?", [id], function (err, results) {
                        if (err)
                            resolve(false)
                        if (results) {
                            commonFunction.deleteImage(req,'',"","",movie);
                            connection.query("DELETE FROM channelmovies WHERE movie_id = ?", [id], function () { })
                            connection.query("DELETE FROM videos_meta WHERE movie_id = ?", [id], function () { })
                            connection.query("DELETE FROM seasons WHERE movie_id = ?", [id], function () { })
                            connection.query("DELETE FROM episodes WHERE movie_id = ?", [id], function () { })
                            connection.query("DELETE FROM photos WHERE movie_id = ?", [id], function () { })
                            connection.query("DELETE FROM genres WHERE movie_id = ?", [id], function () { })
                            connection.query("DELETE FROM keywords WHERE movie_id = ?", [id], function () { })
                            connection.query("DELETE FROM reviews WHERE movie_id = ?", [id], function () { })
                            connection.query("DELETE FROM watchlaters WHERE id = ? AND type = ?", [id,type], function () { })
                            connection.query("DELETE FROM comments WHERE type = ? && id = ?", [type,id], function () { })
                            connection.query("DELETE FROM favourites WHERE type = ? && id = ?", [type,id], function () { })
                            connection.query("DELETE FROM likes WHERE type = ? && id = ?", [type,id], function () { })
                            connection.query("DELETE FROM recently_viewed WHERE type = ? && id = ?", [type,id], function () { })
                            connection.query("DELETE FROM ratings WHERE type = ? && id = ?", [type,id], function () { })
                            connection.query("DELETE FROM notifications WHERE (object_type = ? && object_id = ?) OR (subject_type = ? && object_id = ?)", [type,id,type,id], function () { })
                            connection.query("DELETE FROM reports WHERE type = ? AND id = ?", [type, movie.custom_url], function () {
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
    getMovies: async function (req, data) {
        return new Promise(function (resolve) {
            req.getConnection(async function (err, connection) {
                let condition = []
                let owner_id = 0
                if (req.user && req.user.user_id) {
                    owner_id = parseInt(req.user.user_id)
                }
                let customSelect = ""
                if (data.orderby == "random") {
                    customSelect = ' FLOOR(1 + RAND() * movie_id) as randomSelect, '
                }
                let sql = 'SELECT movies.*,'+customSelect+'likes.like_dislike,users.level_id,userdetails.displayname,userdetails.username,users.paypal_email,userdetails.verified,IF(movies.image IS NULL || movies.image = "","' + req.appSettings['movie_default_photo'] + '",movies.image) as image,IF(userdetails.avtar IS NULL || userdetails.avtar = "",(SELECT value FROM `level_permissions` WHERE name = \"default_mainphoto\" AND type = \"member\" AND level_id = users.level_id),userdetails.avtar) as avtar,watchlaters.watchlater_id,favourites.favourite_id FROM movies '
                
                if (parseInt(data.channel_id)) {
                    condition.push(parseInt(data.channel_id))
                    if(!data.search){
                        sql += " INNER JOIN channelmovies ON channelmovies.movie_id = movies.movie_id AND channel_id = ?"
                    }else{
                        sql += " LEFT JOIN channelmovies ON channelmovies.movie_id = movies.movie_id AND channel_id = ?"
                    }
                }
                
                sql += ' INNER JOIN users on users.user_id = movies.owner_id  INNER JOIN userdetails on users.user_id = userdetails.user_id LEFT JOIN likes ON likes.id = movies.movie_id AND likes.type = "movies"  AND likes.owner_id =  ' + owner_id + ' LEFT JOIN watchlaters ON watchlaters.id = movies.movie_id AND watchlaters.owner_id = ' + owner_id + ' LEFT JOIN favourites ON (favourites.id = movies.movie_id AND favourites.type = "movies" AND favourites.owner_id = ' + owner_id + ') '



                let orderbyField = false
                if (data.recentlyViewed) {
                    condition.push(parseInt(data.owner_id))
                    orderbyField = " recently_viewed.creation_date DESC "
                    sql += " INNER JOIN recently_viewed ON movies.movie_id = recently_viewed.id AND recently_viewed.owner_id = ? AND recently_viewed.type='movies' "
                }
                if (data.myrated) {
                    orderbyField = " ratings.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN ratings ON movies.movie_id = ratings.id AND ratings.owner_id = ? AND ratings.type='movies' "
                }
                if (data.myfav) {
                    orderbyField = " f.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN favourites as f ON movies.movie_id = f.id AND f.owner_id = ? AND f.type='movies' "
                }
                if (data.mylike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON movies.movie_id = l.id AND l.owner_id = ? AND l.type='movies' AND l.like_dislike = 'like' "
                }
                if (data.mydislike) {
                    orderbyField = " l.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN likes as l ON movies.movie_id = l.id AND l.owner_id = ? AND l.type='movies' AND l.like_dislike = 'dislike' "
                }
                if (data.mywatchlater) {
                    orderbyField = " wtl.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN watchlaters as wtl ON movies.movie_id = wtl.id AND wtl.owner_id = ? "
                }

                if (data.mycommented) {
                    orderbyField = " comments.creation_date DESC "
                    condition.push(parseInt(data.owner_id))
                    sql += " INNER JOIN comments ON movies.movie_id = comments.id AND comments.owner_id = ? AND comments.type='movies' "
                }

                if(data.purchaseMovie){
                    sql += " INNER JOIN transactions ON movies.movie_id = transactions.id "
                }

                sql += ' WHERE 1=1 '
                sql += " AND users.active = 1 AND users.approve = 1 "

                if(data.pageType){
                    if(data.pageType == "trending"){
                        var d = new Date();
                        d.setDate(d.getDate() - 7);
                        condition.push(dateTime.create(d).format("Y-m-d H:M:S"))
                        condition.push(dateTime.create().format("Y-m-d H:M:S"))
                        sql += " AND movies.creation_date between ? AND ?"
                        data.orderby = "view_count DESC"
                    }else if(data.pageType == "top"){
                        data.orderby = "view_count DESC"
                    }
                }

                if(data.purchaseMovie){
                    condition.push(data.purchase_user_id)
                    sql+= " AND (transactions.state = 'completed' || transactions.state = 'approved') AND transactions.owner_id = ? AND transactions.type = 'video_purchase'"
                }
                if (!data.myContent) {

                    condition.push(dateTime.create().format("Y-m-d H:M:S"))
                    

                    if (data.movieview) {
                        if(!req.user || req.levelPermissions['movie.view'] != 2)
                            sql += " AND movies.approve = 1 "
                    } else if(!data.purchaseMovie) {
                        if (!req.session.adult_allow && req.appSettings['movie_adult'] == 1) {
                            //sql += " AND movies.adult = 0 "
                        }
                        sql += ' AND movies.completed = 1 AND movies.search = 1 AND movies.approve = 1 '
                    }else{
                        sql += " AND movies.approve = 1 "
                    }
                }
                if (parseInt(data.channel_id)) {
                    if(!data.search){
                        sql += " AND channelmovies.movie_id IS NOT NULL "
                    }else{
                        sql += " AND channelmovies.movie_id IS NULL "
                    }
                }
                
                if (data.movie_id) {
                    condition.push(parseInt(data.movie_id))
                    sql += " AND movies.movie_id = ? "
                }
                if (data.not_movie_id) {
                    condition.push(parseInt(data.not_movie_id))
                    sql += " AND movies.movie_id != ?"
                }
                if(data.not_movies_id && data.not_movies_id.length){
                    const movie_ids = []
                    data.not_movies_id.forEach(item => {
                        movie_ids.push(item.movie_id)
                    })
                    sql += " AND movies.movie_id NOT IN ("+movie_ids.join(",")+")"
                }
                //

                if (data.title) {
                    condition.push(data.title.toLowerCase())
                    sql += " AND LOWER(movies.title) LIKE CONCAT('%', ?,  '%')"
                }
                if (data.artist_id) {
                    condition.push(data.artist_id)
                    sql += " AND FIND_IN_SET(?,movies.artists)"
                }
                if (parseInt(data.owner_id) && !data.myCustom) {
                    condition.push(parseInt(data.owner_id))
                    sql += " AND movies.owner_id = ?"
                }
                
                if (data.is_featured) {
                    condition.push(parseInt(data.is_featured))
                    sql += " AND movies.is_featured = ?"
                }
                if (data.is_not_hot) {
                    condition.push(1)
                    sql += " AND movies.is_hot != ?"
                }
                if (data.is_not_featured) {
                    condition.push(1)
                    sql += " AND movies.is_featured != ?"
                }
                if (data.is_not_sponsored) {
                    condition.push(1)
                    sql += " AND movies.is_sponsored != ?"
                }
                if (data.is_hot) {
                    condition.push(parseInt(data.is_hot))
                    sql += " AND movies.is_hot = ?"
                }
                if (data.is_sponsored) {
                    condition.push(parseInt(data.is_sponsored))
                    sql += " AND movies.is_sponsored = ?"
                }
                if (data.offtheday) {
                    condition.push(data.offtheday)
                    sql += " AND movies.offtheday = ?"
                }
                if (data.category_id) {
                    let customBraces = ""
                    if (data.tags && data.related) {
                        customBraces = " ( "
                    }
                    condition.push(parseInt(data.category_id))
                    sql += " AND " + customBraces + " movies.category_id = ?"
                }

                //related channels
                if (data.tags) {
                    if (data.related && data.category_id)
                        sql += " OR ( "
                    else {
                        sql += " AND ( "
                    }
                    const splitVal = data.tags.split(',')
                    let counter = 1
                    splitVal.forEach(tag => {
                        condition.push(tag)
                        sql += " CONCAT(',', tags, ',') like CONCAT('%,', ?,  ',%') "
                        if (counter != splitVal.length) {
                            sql += " OR "
                        }
                        counter = counter + 1
                    });
                    sql += " ) "
                    if (data.related && data.category_id) {
                        sql += "  ) "
                    }
                }
                if (data.subcategory_id) {
                    condition.push(parseInt(data.subcategory_id))
                    sql += " AND movies.subcategory_id = ?"
                }
                if (data.subsubcategory_id) {
                    condition.push(parseInt(data.subsubcategory_id))
                    sql += " AND movies.subsubcategory_id = ?"
                }
                if (data.rating) {
                    condition.push(data.rating)
                    sql += " AND movies.rating = ?"
                }

                if (data.custom_url) {
                    condition.push(data.custom_url)
                    sql += " AND movies.custom_url =?"
                }

                await privacyModel.checkSQL(req,'movie','movies','movie_id').then(result => {
                    if(result){
                        sql += " AND ( "+result+" )"
                    }
                })


                if (data.mycommented) {
                    sql += " GROUP BY movies.movie_id "
                }
                if(data.purchaseVideo) {
                    sql += " ORDER BY transactions.creation_date DESC "
                }else if (data.orderby == "random") {
                    sql += " ORDER BY randomSelect DESC "
                } else if (data.orderby) {
                    sql += " ORDER BY " + data.orderby
                } else if (orderbyField) {
                    sql += " ORDER BY " + orderbyField
                } else if (parseInt(data.channel_id)) {
                    sql += " ORDER BY channelmovies.creation_date DESC "
                } else if (data.playlist_id) {
                    sql += " ORDER BY playlistmovies.creation_date DESC "
                } else {
                    sql += " ORDER BY movies.creation_date DESC "
                }

                if (data.limit) {
                    condition.push(data.limit)
                    sql += " LIMIT ?"
                }

                if (data.offset) {
                    condition.push(data.offset)
                    sql += " OFFSET ?"
                }
                connection.query(sql, condition, function (err, results) {
                    if (err)
                        resolve(false)
                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        const movies = []
                        if(level && level.length){
                            level.forEach(video => {
                                delete video.password
                                movies.push(video)
                            })
                            resolve(movies)
                        }else
                            resolve(level);
                    } else {
                        resolve(false);
                    }
                })
            })
        })
    },
    userMovieUploadCount: function (req) {
        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT COUNT(movie_id) as totalmovies FROM movies WHERE owner_id = ?', [parseInt(req.user.user_id)], function (err, results) {
                    if (err)
                        reject(err)

                    if (results) {
                        const level = JSON.parse(JSON.stringify(results));
                        resolve(level[0]);
                    } else {
                        resolve("");
                    }
                })
            })
        });
    },
    findByCustomUrl: function (id, req, res, allowData = false) {
        return new Promise(function (resolve) {
            req.getConnection(function (err, connection) {
                connection.query('SELECT * FROM movies WHERE custom_url = ?', [id], function (err, results) {
                    if (err)
                        resolve(false)

                    if (results) {
                        const movies = JSON.parse(JSON.stringify(results));
                        let video = movies[0]
                        if (!allowData && video) {
                            delete video['password']
                            delete video['purchase_count']
                            delete video['total_purchase_amount']
                        }
                        resolve(video);
                    } else {
                        resolve(false);
                    }
                })
            })
        });
    },
}
