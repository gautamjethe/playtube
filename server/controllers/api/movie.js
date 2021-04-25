const { data } = require('jquery')
const { default: next } = require('next')

const { validationResult } = require('express-validator'),
    fieldErrors = require('../../functions/error'),
    errorCodes = require("../../functions/statusCodes"),
    constant = require("../../functions/constant"),
    globalModel = require("../../models/globalModel"),
    commonFunction = require("../../functions/commonFunctions"),
    ffmpeg = require("fluent-ffmpeg"),
    s3Upload = require('../../functions/upload').uploadtoS3,
    resize = require("../../functions/resize"),
    dateTime = require('node-datetime'),
    path = require('path'),
    uniqid = require('uniqid'),
    movieModel = require("../../models/movies"),
    socketio = require("../../socket"),
    notifications = require("../../models/notifications"),
    privacyModel = require("../../models/privacy"),
    categoryModel = require("../../models/categories"),
    notificationModel = require("../../models/notifications"),
    castnCrewModel = require("../../models/castncrew"),
    axios = require("axios"),
    settingModel=require("../../models/settings"),
    countryModel = require("../../models/country")



exports.createComonGeneres = (tag,req) => {
    return new Promise(async function(resolve, reject) {
        await globalModel.custom(req, "SELECT * FROM genres WHERE slug = ?", [tag.key]).then(async result => {
            let genere = null
            if (result) {
                genere = JSON.parse(JSON.stringify(result))[0];
            }
            if(!genere){
                let insertObject = {}
                insertObject["title"] = tag.value
                insertObject['slug'] = tag.key
                if(req.item.type == "movies"){
                    insertObject['movie_count'] = 1
                }else{
                    insertObject['series_count'] = 1
                }
                await globalModel.create(req, insertObject, "genres").then(async result => {
                    insertObject['genre_id'] = result.insertId
                    resolve(insertObject)
                })
            }else{
                resolve(genere)
            }
        }).catch(err => {
            console.log(err)
            resolve(false)
        })
    });
}
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}
exports.insertGeners = (movie_id,tags,req) => {
    return new Promise(async function(resolve, reject) {
        await asyncForEach(tags, async (tag,i) => {
            await  exports.createComonGeneres(tag,req).then(async result => {
                if(result){
                    let insertObject = {}
                    insertObject['genre_id'] = result['genre_id']
                    insertObject['movie_id'] = movie_id
                    await globalModel.create(req, insertObject, "movie_genres").then(async result => {
                        req.generes.push(result.insertId)
                    })
                }
            })
            if(i == tags.length - 1){
                resolve(true)
            }
        })
    })
}
exports.createGeneres = async(req,res) => {
    let movie_id = req.body.movie_id
    let tags = JSON.parse(req.body.tags);
    req.generes = []
    await exports.insertGeners(movie_id,tags,req).then(async result => {
        if(result){
            if(req.generes){
                await movieModel.getGeneres(req,{movie_genre_ids:req.generes}).then(result => {
                    req.generes = null
                    return res.send({generes:result})
                })
            }
        }
    }).catch(err => {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
    })
}

exports.deleteGeneres = async(req,res) => {
    let movie_id = req.body.movie_id
    let genere_id = req.body.id
    
    if(parseInt(genere_id) == 0 || parseInt(movie_id) == 0){
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PARAMMISSING }], true), status: errorCodes.invalid }).end();
    }
    let isMovie = req.item.type == "movies" ? true : false;


    let genere = {}
    await globalModel.custom(req, "SELECT * FROM movie_genres WHERE movie_genre_id = ?", [genere_id]).then(async result => {
        if (result) {
            genere = JSON.parse(JSON.stringify(result))[0];
        }else{
            
        }
    }).catch(err => {

    })

    await globalModel.custom(req, "DELETE FROM movie_genres WHERE movie_genre_id = ?", [genere_id]).then(async result => {
        let column = "series_count = series_count - 1"
        if(isMovie){
            column = "movie_count = movie_count - 1"
        }

        await globalModel.custom(req, "UPDATE genres SET "+column+" WHERE genre_id = ?", [genere.genre_id]).then(async result => {})
        if (result) {
            return res.send({ message:constant.movie.DELETEDITEM , status: errorCodes.ok }).end();
        }else{
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        }
    }).catch(err => {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
    })


}
exports.insertCountries = (movie_id,countries,req) => {
    return new Promise(async function(resolve, reject) {
        await asyncForEach(countries, async (country,i) => {
            
                let insertObject = {}
                insertObject['country_id'] = country.key
                insertObject['movie_id'] = movie_id
                await globalModel.create(req, insertObject, "movie_countries").then(async result => {
                    req.countries.push(result.insertId)
                })
                
            if(i == countries.length - 1){
                resolve(true)
            }
        })
    })
}
exports.createCountry = async(req,res) => {
    let movie_id = req.body.movie_id
    let countries = JSON.parse(req.body.countries);
    req.countries = []
    await exports.insertCountries(movie_id,countries,req).then(async result => {
        if(result){
            if(req.countries){
                await countryModel.findAllMoviesCountries(req,{movie_country_ids:req.countries}).then(result => {
                    req.countries = null
                    return res.send({movie_countries:result})
                })
            }
        }
    }).catch(err => {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
    })
}

exports.deleteCountry = async(req,res) => {
    let movie_id = req.body.movie_id
    let country_id = req.body.id
    
    if(parseInt(country_id) == 0 || parseInt(movie_id) == 0){
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PARAMMISSING }], true), status: errorCodes.invalid }).end();
    }

    await globalModel.custom(req, "DELETE FROM movie_countries WHERE movie_country_id = ?", [country_id]).then(async result => {
        if (result) {
            return res.send({ message:constant.movie.DELETEDITEM , status: errorCodes.ok }).end();
        }else{
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        }
    }).catch(err => {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
    })


}

exports.castnCrew = async(req,res) => {

    let movieId = req.body.movie_id
    let movie = {}
    if (movieId) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM movies WHERE movie_id = ?", movieId).then(async result => {
            if (result && result.length) {
                movie = JSON.parse(JSON.stringify(result))[0];
            }else{
                movieId = null
            }
        }).catch(err => {

        })
    } else {
        return res.send({})
    }
    if(!movieId || !Object.keys(movie).length){
        return res.send({})
    }
    //fetch artists
    let LimitNumArtist = 17;
    let pageArtist = 1
    if (req.body.page == '') {
        pageArtist = 1;
    } else {
        //parse int Convert String to number 
        pageArtist = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }
    let offsetArtist = (pageArtist - 1) * LimitNumArtist
    if (movie.artists && movie.artist != "" && req.appSettings['video_artists'] == "1") {
        await castnCrewModel.findByIds(movie.artists, req, res, LimitNumArtist, offsetArtist).then(result => {
            let pagging = false
            if (result) {
                pagging = false
                if (result.length > LimitNumArtist - 1) {
                    result = result.splice(0, LimitNumArtist - 1);
                    pagging = true
                }
                res.send( {
                    'pagging': pagging,
                    artists: result
                })
            }
        }).catch(error => {
            console.log(error)
        })
    } else {
        res.send({
            'pagging': false,
            artists: []
        })
    }
}
exports.delete = async (req, res) => {
    if (!req.item) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.invalid }).end();
    }

    await movieModel.delete(req.item.movie_id, req).then(result => {
        if (result) {
            commonFunction.deleteImage(req, res, "", "movie", req.item)
            res.send({"message":constant.movie.DELETED})
            socketio.getIO().emit('movieDeleted', {
                "movie_id": req.item.movie_id,
                "message": constant.movie.DELETED,
            });
        }else{
            res.send({})
        }
    })

   

}
exports.category = async (req, res) => {
    req.query.categoryId = req.params.id
    req.query.type = "movie"
    let category = {}
    let send = false
    let limit = 13;
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (limit - 1)
    await categoryModel.findByCustomUrl({ id: req.query.categoryId, type: req.query.type }, req, res).then(async result => {
        if (result) {
            category = result
            const data = { limit: limit, offset: offset }
            if (category.subcategory_id == 0 && category.subsubcategory_id == 0) {
                data['category_id'] = category.category_id
            } else if (category.subcategory_id > 0) {
                data['subcategory_id'] = category.category_id
            } else if (category.subsubcategory_id > 0) {
                data['subsubcategory_id'] = category.category_id
            }
            //get all blogs as per categories
            await movieModel.getMovies(req, data).then(result => {
                if (result) {
                    let pagging = false
                    let items = result
                    if (result.length > limit - 1) {
                        items = result.splice(0, limit - 1);
                        pagging = true
                    }
                    send = true
                    res.send({ pagging: pagging, items: items })
                }
            })
        }
    }).catch(error => {
        res.send({ pagging: false, items: [] })
        return
    })
    if (!send)
        res.send({ pagging: false, items: [] })
}
exports.browse = async (req, res) => {
    const queryString = req.query
    let limit = 13
    let page = 1
    if(parseInt(req.body.limit)){
        limit = parseInt(req.body.limit)
    }
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (limit - 1)
    const data = { limit: limit, offset: offset }
    data['type'] = queryString.type
    if (queryString.q && !queryString.tag) {
        data['title'] = queryString.q
    }

    data['pageType'] = req.body.pageType
    if (queryString.type) {
        data['tags'] = queryString.tag
    }
    if (queryString.category_id) {
        data['category_id'] = queryString.category_id
    }
    if (queryString.subcategory_id) {
        data['subcategory_id'] = queryString.subcategory_id
    }
    if (queryString.subsubcategory_id) {
        data['subsubcategory_id'] = queryString.subsubcategory_id
    }
    if (queryString.sort == "latest") {
        data['orderby'] = "movies.movie_id desc"
    } else if (queryString.sort == "favourite" && req.appSettings['video_favourite'] == 1) {
        data['orderby'] = "movies.favourite_count desc"
    } else if (queryString.sort == "view") {
        data['orderby'] = "movies.view_count desc"
    } else if (queryString.sort == "like" && req.appSettings['video_like'] == "1") {
        data['orderby'] = "movies.like_count desc"
    } else if (queryString.sort == "dislike" && req.appSettings['video_dislike'] == "1") {
        data['orderby'] = "movies.dislike_count desc"
    } else if (queryString.sort == "rated" && req.appSettings['video_rating'] == "1") {
        data['orderby'] = "movies.rating desc"
    } else if (queryString.sort == "commented" && req.appSettings['video_comment'] == "1") {
        data['orderby'] = "movies.comment_count desc"
    }

    if (queryString.type == "featured" && req.appSettings['video_featured'] == 1) {
        data['is_featured'] = 1
    } else if (queryString.type == "sponsored" && req.appSettings['video_sponsored'] == 1) {
        data['is_sponsored'] = 1
    } else if (queryString.type == "hot" && req.appSettings['video_hot'] == 1) {
        data['is_hot'] = 1
    }

    if(req.body.moviePurchased){
        data.purchaseMovie = true
        data.purchase_user_id = req.body.purchase_user_id
    }

    
    //get all movies as per categories
    await movieModel.getMovies(req, data).then(result => {
        if (result) {
            let pagging = false
            let items = result
            if (result.length > limit - 1) {
                items = result.splice(0, limit - 1);
                pagging = true
            }
            res.send({ movies: items, pagging: pagging })
        }
    }).catch(err => {
        res.send({})
    })

}
exports.createSeason = async(req,res) => {
    let movie_id = parseInt(req.body.movie_id);
    if(movie_id == 0){
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PARAMMISSING }], true), status: errorCodes.invalid }).end();
    }

    await movieModel.createSeasons(req,{movie_id:movie_id}).then(result => {
        if(result){
            return res.send(result);
        }else{
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.PARAMMISSING }], true), status: errorCodes.invalid }).end();
        }
    })

}


exports.deleteEpisode = async (req,res,next) => {
    let id = parseInt(req.body.id)
    let movie_id = parseInt(req.body.movie_id)
    if(parseInt(id) == 0 || parseInt(movie_id) == 0){
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PARAMMISSING }], true), status: errorCodes.invalid }).end();
    }
    let episode = {}
    await globalModel.custom(req, "SELECT * FROM episodes WHERE episode_id = ?", id).then(async result => {
        if (result) {
            episode = JSON.parse(JSON.stringify(result))[0];
        }else{
            
        }
    }).catch(err => {

    })

    await movieModel.deleteEpisode(req,episode).then(result => {
        if (result) {
            commonFunction.deleteImage(req, res, episode.image, "episode")
            res.send({"message":constant.movie.DELETEDITEM,season_id:episode.season_id})
            
        }else{
            res.send({})
        }
    })

}
exports.uploadImage = async(req,res) => {
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    let insertObject = {}
    insertObject['image'] = "/upload/images/movies/images/" + req.fileName;
    insertObject['resource_id'] = req.params.movie_id
    insertObject['resource_type'] = "movies"

    await globalModel.create(req, insertObject, "photos").then(async result => {
        if (result) {
            let editItem = {}
            await  globalModel.custom(req,"SELECT * FROM photos where photo_id = ?",[result.insertId]).then(result => {
                if(result){
                    editItem = result[0];
                }
            })
            res.send({ message: constant.movie.PHOTOUPLOADED, item:editItem });
        } else {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        }
    }).catch(err => {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
    })
}
exports.deleteImage = async(req,res) => {
    let id = parseInt(req.body.id)
    let movie_id = parseInt(req.body.movie_id)
    if(parseInt(id) == 0 || parseInt(movie_id) == 0){
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PARAMMISSING }], true), status: errorCodes.invalid }).end();
    }
    let photo = {}
    await globalModel.custom(req, "SELECT * FROM photos WHERE photo_id = ?", [id]).then(async result => {
        if (result) {
            photo = JSON.parse(JSON.stringify(result))[0];
        }else{
            
        }
    }).catch(err => {

    })
    await globalModel.custom(req, "DELETE FROM photos WHERE photo_id = ?", [id]).then(async result => {
        if (result) {
            commonFunction.deleteImage(req, res, photo.image, "movie/photo")
            return res.send({ message:constant.movie.DELETEDITEM , status: errorCodes.ok }).end();
        }else{
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        }
    }).catch(err => {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
    })

}

exports.createCastCrew = async(req,res,next) => {
    let cast_id = req.body.cast_id
    let id = parseInt(req.body.cast_crew_member_id)
    let character = req.body.character
    let department = req.body.department
    let job = req.body.job

    let resource_type = req.body.resource_type
    let resource_id = req.body.resource_id

    //validate result
    let condition = []
    condition.push(resource_type)
    condition.push(resource_id)
    condition.push(id)
    let sql = "SELECT cast_crew_id FROM cast_crew WHERE resource_type = ? AND resource_id = ? AND cast_crew_member_id = ?"

    if(character){
        sql += " AND `character` IS NOT NULL"
        if(cast_id){
            condition.push(cast_id)
            sql += " AND cast_crew_id != ?"
        }
    }else{
        sql += " AND job IS NOT NULL"
        if(cast_id){
            condition.push(cast_id)
            sql += " AND cast_crew_id != ?"
        }
    }
    let valid = true;
    await globalModel.custom(req,sql,condition).then(result => {
        if(result && result.length){
            valid = false;
        }
    })

    if(!valid){
        return res.send({ error: constant.movie.ENTRYEXISTS, status: errorCodes.invalid }).end();
    }
    
    let insertObject = {}
    if(!cast_id){
        insertObject['cast_crew_member_id'] = id
        insertObject["resource_id"] = resource_id
        insertObject["resource_type"] = resource_type
    }
    if(character)
        insertObject["character"] = character
    if(job)
        insertObject["job"] = job
    if(department)
        insertObject["department"] = department
    if (cast_id) {
        await globalModel.update(req, insertObject, "cast_crew", 'cast_crew_id', cast_id).then(async result => {  
            let editItem = {}
            await castnCrewModel.getAllCrewMember(req,{cast_crew_id:cast_id}).then(result => {
                if(result){
                    editItem = result[0];
                }
            })
            res.send({  message:character ? constant.movie.CASTEDITED : constant.movie.CREWEDITED,item:editItem });
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    } else {
        await globalModel.create(req, insertObject, "cast_crew").then(async result => {
            if (result) {
                let editItem = {}
                await castnCrewModel.getAllCrewMember(req,{cast_crew_id:result.insertId}).then(result => {
                    if(result){
                        editItem = result[0];
                    }
                })
                res.send({ message: character ? constant.movie.CASTCREATED : constant.movie.CREWCREATED, item:editItem });
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }


}
exports.deleteCrew = async (req,res,next) => {
    let id = parseInt(req.body.id)
    let movie_id = parseInt(req.body.movie_id)
    if(parseInt(id) == 0 || parseInt(movie_id) == 0){
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PARAMMISSING }], true), status: errorCodes.invalid }).end();
    }
    let cast = {}
    await globalModel.custom(req, "SELECT * FROM cast_crew WHERE cast_crew_id = ?", [id]).then(async result => {
        if (result) {
            cast = JSON.parse(JSON.stringify(result))[0];
        }else{
            
        }
    }).catch(err => {

    })
    await globalModel.custom(req, "DELETE FROM cast_crew WHERE  cast_crew_id = ?", [id]).then(async result => {
        if (result) {
            return res.send({ message:constant.movie.DELETEDITEM ,season_id:cast.resource_id, status: errorCodes.ok }).end();
        }else{
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        }
    }).catch(err => {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
    })
}
exports.deleteSeason = async (req,res,next) => {
    let id = parseInt(req.body.id)
    let movie_id = parseInt(req.body.movie_id)
    if(parseInt(id) == 0 || parseInt(movie_id) == 0){
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PARAMMISSING }], true), status: errorCodes.invalid }).end();
    }
    
    let season = {}
    await globalModel.custom(req, "SELECT * FROM seasons WHERE season_id = ?", id).then(async result => {
        if (result && result.length) {
            season = JSON.parse(JSON.stringify(result))[0];
        }else{
            
        }
    }).catch(err => {

    })

    await movieModel.deleteSeason(req,season).then(result => {
        if (result) {
            commonFunction.deleteImage(req, res, season.image, "season")
            res.send({"message":constant.movie.DELETEDITEM})
            
        }else{
            res.send({})
        }
    })
}

exports.castAutosuggest = async(req,res) => {
    let value = req.query.s
   
    castnCrewModel.findAll(req,{name:value}).then(result => {
        if(result){
            res.send({result:result})
        }else{
            res.send({error:true})
        }
    })
    

}
exports.getMovies = async (req, res, next) => {
    const criteria = req.body.criteria
    const value = req.body.value

    let LimitNum = 13;
    let page = 1
    if (req.body.page == '') {
        page = 1;
    } else {
        //parse int Convert String to number 
        page = parseInt(req.body.page) ? parseInt(req.body.page) : 1;
    }

    let offset = (page - 1) * (LimitNum - 1)

    const data = {}
    if (criteria == "search") {
        data.title = value
    } else if (criteria == "my") { 
        data.owner_id = req.user ? req.user.user_id : "0"
    } else if (criteria == "url") {
        var final = value.substr(value.lastIndexOf('/') + 1);
        data.custom_url = final
        offset = null
        page = 1
    }
    if (req.body.channel_id) {
        data.channel_id = req.body.channel_id
    }
    data.limit = LimitNum
    data.offset = offset
    data.search = true;
    let send = false
    await movieModel.getMovies(req, data).then(result => {
        if (result && result.length > 0) {
            send = true
            let pagging = false
            if (result.length > LimitNum - 1) {
                result = result.splice(0, LimitNum - 1);
                pagging = true
            }
            return res.send({ pagging: pagging, movies: result })
        }
    }).catch(error => {

    })
    if (!req.headersSent && !send)
        res.send({ pagging: false, movies: [] })

}

exports.password = async (req, res) => {
    let password = req.body.password
    let id = req.params.id

    let movie = {}

    await movieModel.findByCustomUrl(id, req, res, true).then(result => {
        if (result)
            movie = result
    }).catch(error => {

    })
    
    if (movie.password == password) {
        req.session.password.push(movie.movie_id)
        res.send({})
        return
    }
    return res.send({ error: fieldErrors.errors([{ msg: "Password you entered is not correct." }], true), status: errorCodes.invalid }).end();

}
exports.episodeCreate = async (req,res) => {
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }

    // all set now
    let insertObject = {}
    let episodeId = req.body.episodeId
    let eposodeObject = {}
    if (episodeId) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM episodes WHERE episode_id = ?", episodeId).then(async result => {
            if (result && result.length) {
                eposodeObject = JSON.parse(JSON.stringify(result))[0];
            }else{
                episodeId = null
            }
        }).catch(err => {

        })
    } else {
        insertObject["owner_id"] = req.user.user_id;
    }
    if(typeof req.body.comments != "undefined"){
        insertObject['autoapprove_comments'] = parseInt(req.body.comments)
    }
    insertObject["title"] = req.body.title
    insertObject["description"] = req.body.description ? req.body.description : ""
    
    if (req.body.episodeImage) { 
        //insertObject['image'] = req.body.movieImage
    }else if (req.fileName) {
        insertObject['image'] = "/upload/images/movies/episode/" + req.fileName;
    }else{ 
        insertObject['image'] = "";
        if(Object.keys(eposodeObject).length && eposodeObject.image)
            commonFunction.deleteImage(req, res, eposodeObject.image, 'movie/image');
    }
    
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    
    if (!Object.keys(eposodeObject).length) {
        insertObject["custom_url"] = uniqid.process('v')
        insertObject["creation_date"] = formatted
        insertObject['season_id'] = req.body.season_id
        insertObject['movie_id'] = req.body.movie_id
    }
    insertObject["modified_date"] = formatted    
    insertObject['release_date'] = req.body.release_date;
    insertObject['episode_number'] = req.body.episode_number;
    if (episodeId) {
        //update existing movie
        await globalModel.update(req, insertObject, "episodes", 'episode_id', episodeId).then(async result => {  
            let editItem = {}
            await globalModel.custom(req, 'SELECT *,episodes.image as orgImage,IF(episodes.image IS NULL || episodes.image = "","' + req.appSettings['episode_default_photo'] + '",episodes.image) as image FROM episodes WHERE episode_id = ?', episodeId).then(async result => {
                if (result && result.length) {
                    editItem = JSON.parse(JSON.stringify(result))[0];
                }
            }).catch(err => {
                
            })   
            res.send({  message:constant.movie.EPISODEEDIT,image:insertObject["image"],item:editItem });
            
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    } else {
        //create new movie
        await globalModel.create(req, insertObject, "episodes").then(async result => {
            if (result) {
                let editItem = {}
                await globalModel.custom(req, 'SELECT *,episodes.image as orgImage,IF(episodes.image IS NULL || episodes.image = "","' + req.appSettings['episode_default_photo'] + '",episodes.image) as image FROM episodes WHERE episode_id = ?', result.insertId).then(async result => {
                    if (result && result.length) {
                        editItem = JSON.parse(JSON.stringify(result))[0];
                    }
                }).catch(err => {
                
                })
                res.send({ message: constant.movie.EPISODESUCCESS, image:insertObject["image"],item:editItem });
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            console.log(err)
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }

}
exports.create = async (req, res) => {
    await commonFunction.getGeneralInfo(req, res, "", true);
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    if (req.quotaLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.movie.QUOTAREACHED }], true), status: errorCodes.invalid }).end();
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }
    if(req.body.price){
        if(parseFloat(req.body.price) < 0){
            return res.send({ error: fieldErrors.errors([{ msg: "Please provide valid price." }], true), status: errorCodes.invalid }).end();
        }
    }
    if(req.body.rent_price){
        if(parseFloat(req.body.rent_price) < 0){
            return res.send({ error: fieldErrors.errors([{ msg: "Please provide valid rent price." }], true), status: errorCodes.invalid }).end();
        }
    }
    // all set now
    let insertObject = {}
    let movieId = req.body.movieId
    let movieObject = {}
    if (movieId) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM movies WHERE movie_id = ?", movieId).then(async result => {
            if (result && result.length) {
                movieObject = JSON.parse(JSON.stringify(result))[0];
            }else{
                movieId = null
            }
        }).catch(err => {

        })
    } else {
        insertObject["owner_id"] = req.user.user_id;
    }
    if(typeof req.body.comments != "undefined"){
        insertObject['autoapprove_comments'] = parseInt(req.body.comments)
    }
    insertObject["title"] = req.body.title
    insertObject["description"] = req.body.description ? req.body.description : ""
    insertObject["category_id"] = req.body.category_id ? req.body.category_id : 0
    insertObject["subcategory_id"] = req.body.subcategory_id ? req.body.subcategory_id : 0
    insertObject["subsubcategory_id"] = req.body.subsubcategory_id ? req.body.subsubcategory_id : 0
    insertObject["price"] = parseFloat(req.body.price) ? parseFloat(req.body.price) : 0
    insertObject["rent_price"] = parseFloat(req.body.rent_price) ? parseFloat(req.body.rent_price) : 0
    insertObject["adult"] = req.body.adult ? req.body.adult : 0
    insertObject["search"] = req.body.search ? req.body.search : 1
    insertObject["view_privacy"] = req.body.privacy ? req.body.privacy : 'everyone'
    if (insertObject['view_privacy'] == "password" && req.body.password && req.body.password != "") {
        insertObject['password'] = req.body.password
        insertObject['is_locked'] = 1
    } else {
        if (insertObject["view_privacy"] == "password")
            insertObject["view_privacy"] = "everyone"
        insertObject['password'] = ""
        insertObject['is_locked'] = 0
    }


    if (req.body.movieImage) {
        insertObject['image'] = req.body.movieImage
    }else if (req.fileName) {
            insertObject['image'] = "/upload/images/movies/movie/" + req.fileName;
    }else{
        insertObject['image'] = "";
        if(Object.keys(movieObject).length && movieObject.image)
            commonFunction.deleteImage(req, res, movieObject.image, 'movie/image');
    }
    
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    
    if (!Object.keys(movieObject).length || !movieObject.custom_url) {
        insertObject["custom_url"] = uniqid.process('v')
        insertObject["is_sponsored"] = req.levelPermissions['movie.sponsored'] == "1" ? 1 : 0
        insertObject["is_featured"] = req.levelPermissions['movie.featured'] == "1" ? 1 : 0
        insertObject["is_hot"] = req.levelPermissions['movie.hot'] == "1" ? 1 : 0
        if (req.levelPermissions["movie.auto_approve"] && req.levelPermissions["movie.auto_approve"] == "1")
            insertObject["approve"] = 1
        else
            insertObject["approve"] = 0
        insertObject["creation_date"] = formatted
    }
    insertObject["modified_date"] = formatted

    let tags = req.body.tags
    
    if (tags && tags.length > 0)
        insertObject["tags"] = tags
    else {
        insertObject['tags'] = null
    }

    if(parseFloat(req.body.budget) > 0){
        insertObject["budget"] = parseFloat(req.body.budget)
    }
    if(parseFloat(req.body.revenue) > 0){
        insertObject["revenue"] = parseFloat(req.body.revenue)
    }

    if(req.body.movie_release){
        insertObject["movie_release"] = req.body.movie_release
    }

    if(req.body.language){
        insertObject["language"] = req.body.language
    }

    

    insertObject['completed'] = 1;
    if (movieId) {
        //update existing movie
        await globalModel.update(req, insertObject, "movies", 'movie_id', movieId).then(result => {
            //update item count in categories if changed
            if (insertObject["category_id"] != movieObject.category_id) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + movieObject["category_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["subcategory_id"] != movieObject.subcategory_id || (insertObject["category_id"] == 0 && movieObject.subcategory_id)) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + movieObject["subcategory_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["subsubcategory_id"] != movieObject.subsubcategory_id || (insertObject["subcategory_id"] == 0 && movieObject.subsubcategory_id)) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count - 1 WHERE category_id = " + movieObject["subsubcategory_id"]).then(result => {
                }).catch(err => { })
            }
            if (insertObject["category_id"] != movieObject.category_id && insertObject["category_id"] > 0) {
                globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["category_id"]).then(result => {
                }).catch(err => { })
                if (insertObject["subcategory_id"] != movieObject.subcategory_id && insertObject["subcategory_id"] > 0) {
                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subcategory_id"]).then(result => {
                    }).catch(err => { })
                    if (insertObject["subsubcategory_id"] != movieObject.subsubcategory_id && insertObject["subsubcategory_id"] > 0) {
                        globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subsubcategory_id"]).then(result => {
                        }).catch(err => { })
                    }
                }
            }
            res.send({  message:constant.movie.EDIT });
            
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    } else {
        //create new movie
        await globalModel.create(req, insertObject, "movies").then(async result => {
            if (result) {
                //update category counts
                if (insertObject["category_id"] != 0) {
                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["category_id"]).then(result => {
                        if (insertObject["subcategory_id"] != 0) {
                            globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subcategory_id"]).then(result => {
                                if (insertObject["subsubcategory_id"] != 0) {
                                    globalModel.custom(req, "UPDATE categories SET item_count = item_count + 1 WHERE category_id = " + insertObject["subsubcategory_id"]).then(result => {
                                    }).catch(err => { })
                                }
                            }).catch(err => { })
                        }
                    }).catch(err => { })
                }
                let editItem = {}

                await movieModel.findById(result.insertId, req,false).then(async movie => {
                    editItem = movie
                }).catch(err => {
                    
                })

                res.send({ message: constant.movie.SUCCESS, editItem:editItem });
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            console.log(err)
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }
}

exports.convertVideo = async(req,movieObject) => {
    return new Promise(async (resolve,reject) =>  {
        const res = {}
        const videoResolution = movieObject.resolution
        const videoLocation = movieObject.video_location
        const FFMPEGpath = req.appSettings.video_ffmpeg_path
        const movieId = movieObject.movie_id
        //convert movies
        var orgPath = req.serverDirectoryPath + "/public" + videoLocation
        let command = ffmpeg(orgPath)
            //.audioCodec('libfaac')
            .videoCodec('libx264')
            .format('mp4');
        const videoName = uniqid.process('v')
        let watermarkImage = req.levelPermissions['movie.watermark'] != "" ? req.serverDirectoryPath + "/public" + req.levelPermissions["movie.watermark"] : "/public/upload/images/blank.png"
        const path_240 = "/public/upload/movies/movie/" + videoName + "_240p.mp4"
        const path_640 = "/public/upload/movies/movie/" + videoName + "_360p.mp4"
        const path_854 = "/public/upload/movies/movie/" + videoName + "_480p.mp4"
        const path_1280 = "/public/upload/movies/movie/" + videoName + "_720p.mp4"
        const path_1920 = "/public/upload/movies/movie/" + videoName + "_1080p.mp4"
        const path_2048 = "/public/upload/movies/movie/" + videoName + "_2048p.mp4"
        const path_3840 = "/public/upload/movies/movie/" + videoName + "_4096p.mp4"
        let is_validVideo = false
        const sample = "/public/upload/movies/movie/" + videoName + "_sample.mp4"
        await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_240, 240, orgPath, FFMPEGpath, watermarkImage).then(async result => {
            //upate movie 240
            if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                await s3Upload(req, req.serverDirectoryPath + path_240, path_240.replace("/public",'')).then(result => {
                    //remove local file
                    commonFunction.deleteImage(req, res, path_240.replace("/public",''), 'locale')
                }).catch(err => {
                })
            }
            const updatedObject = {}
            updatedObject["240p"] = 1
            updatedObject["video_location"] = path_240.replace('/public', '')
            await globalModel.update(req, updatedObject, "movies", "movie_id", movieId).then(result => {
            }).catch(error => {
            })
            is_validVideo = true
        }).catch(err => {
        })
        if(is_validVideo){
            const filePath = "/public" + "/upload/movies/movie/" + videoName+"_sample_same"+path.extname(videoLocation)
            //create sample movie
            await module.exports.createSample(orgPath,filePath,command,req,sample,FFMPEGpath,watermarkImage,res,movieId).then(result => {
                
            }).catch(err => {

            }) 
        }

        if ((videoResolution >= 640 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("360") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_640, 640, orgPath, FFMPEGpath, watermarkImage).then(async result => {
                //upate movie 
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_640, path_640.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_640.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["360p"] = 1
                await globalModel.update(req, updatedObject, "movies", "movie_id", movieId).then(async result => {
                }).catch(error => {

                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 854 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("480") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_854, 854, orgPath, FFMPEGpath, watermarkImage).then(async result => {
                //upate movie
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_854, path_854.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_854.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["480p"] = 1
                await globalModel.update(req, updatedObject, "movies", "movie_id", movieId).then(async result => {

                }).catch(error => {

                })
            }).catch(err => {
            })
        } 

        if ((videoResolution >= 1280 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("720") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_1280, 1280, orgPath, FFMPEGpath, watermarkImage).then(async result => {
                //upate movie
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_1280, path_1280.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_1280.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["720p"] = 1
                await globalModel.update(req, updatedObject, "movies", "movie_id", movieId).then(async result => {

                }).catch(error => {

                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 1920 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("1080") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_1920, 1920, orgPath, FFMPEGpath, watermarkImage).then(async result => {
                //upate movie
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_1920, path_1920.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_1920.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["1080p"] = 1
                await globalModel.update(req, updatedObject, "movies", "movie_id", movieId).then(async result => {

                }).catch(error => {

                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 2048 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("2048") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_2048, 2048, orgPath, FFMPEGpath, watermarkImage).then(async result => {
                //upate movie
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_2048, path_2048.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_2048.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["2048p"] = 1
                await globalModel.update(req, updatedObject, "movies", "movie_id", movieId).then(async result => {

                }).catch(error => {

                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 3840 || videoResolution == 0) && is_validVideo && req.appSettings["video_upload_videos_type"].indexOf("4096") > -1) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + path_3840, 3840, orgPath, FFMPEGpath, watermarkImage).then(async result => {
                //upate movie
                if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + path_3840, path_3840.replace("/public",'')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, path_3840.replace("/public",''), 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                updatedObject["4096p"] = 1
                await globalModel.update(req, updatedObject, "movies", "movie_id", movieId).then(async result => {

                }).catch(error => {

                })
            }).catch(err => {
            })
        }

        const updatedObject = {}
        if (is_validVideo)
            updatedObject["status"] = 1
        else
            updatedObject["status"] = 3
        updatedObject['completed'] = 1

        //unlink org file
        if (videoLocation)
            commonFunction.deleteImage(req, res, videoLocation.replace("/public",''), "movie/movie")

        await globalModel.update(req, updatedObject, "movies", "movie_id", movieId).then(async result => {
            //send socket data

        }).catch(error => {

        })
        if (is_validVideo) {
            notifications.insert(req, {owner_id:movieObject.owner_id,insert:true, type: "videos_processed_complete", subject_type: "users", subject_id: movieObject.owner_id, object_type: "movies", object_id: movieId,forceInsert:true }).then(result => {

            }).catch(err => {

            })
            notificationModel.insertFollowNotifications(req, { subject_type: "users", subject_id: movieObject.owner_id, object_type: "movies", object_id: movieId, type: "members_followed" }).then(result => {

            }).catch(err => {

            })
        } else {
            notifications.insert(req, {owner_id:movieObject.owner_id,insert:true, type: "videos_processed_failed", subject_type: "users", subject_id: movieObject.owner_id, object_type: "movies", object_id: movieId,forceInsert:true }).then(result => {

            }).catch(err => {

            })
        }
        socketio.getIO().emit('videoCreated', {
            "movieId":  movieObject.custom_url,
            status: is_validVideo ? 1 : 0
        });
        resolve(true)
    })
}

exports.createSample = async (orgPath,filePath,command,req,sample,FFMPEGpath,watermarkImage,res,movieId) => {
    return new Promise((resolve,reject) => {
        ffmpeg()
                .input(orgPath)
                .setStartTime('00:00:00')
                .setDuration('03')
                .output(req.serverDirectoryPath +filePath)
                .on('start', function(commandLine) {
                    //console.log('Started: ' + commandLine);
                })
                .on('end', async function(err) {   
                    if(!err)
                    {
                        let commandNew = ffmpeg(req.serverDirectoryPath +filePath)
                        //.audioCodec('libfaac')
                        .videoCodec('libx264')
                        .format('mp4');
                        await module.exports.executeFFMPEG(commandNew, req.serverDirectoryPath + sample, 640, req.serverDirectoryPath +filePath, FFMPEGpath, watermarkImage).then(async result => {
                            //upate movie 
                            if (req.appSettings.upload_system == "s3"  || req.appSettings.upload_system == "wisabi") {
                                await s3Upload(req, req.serverDirectoryPath + sample, sample.replace("/public",'')).then(result => {
                                    //remove local file
                                }).catch(err => {
            
                                })
                                commonFunction.deleteImage(req, res, sample.replace("/public",''), 'locale')
                            }
                            commonFunction.deleteImage(req, res, filePath.replace("/public",''), 'locale')
                            const updatedObject = {}
                            updatedObject["sample"] = 1
                            await globalModel.update(req, updatedObject, "movies", "movie_id", movieId).then(async result => {
            
                            }).catch(error => {
            
                            })
                            resolve(true)
                        }).catch(err => {
                            reject(false)
                        })
                        
                    }                 
                })
                .on('error', function(err){
                    console.log('error: ', +err);
                    reject(false)
                }).run();
    })
}
exports.executeFFMPEG = async (command, filePath, resolution, orgPath, FFMPEGpath, watermarkImage) => {
    return new Promise((resolve, reject) => {
        //let commandString = FFMPEGpath+" -y -i "+orgPath+" -vcodec libx264 -preset slow -filter:v scale="+resolution+":-2 -crf 26 "+filePath+" 2>&1"
        command.clone()
            //.input(watermarkImage)
            // .outputOption([
            //     "-preset" , "slow",
            //     "-filter:v","scale="+resolution+":-2"
            // ])
            // .complexFilter([
            //     "-filter:v scale="+resolution+":-2 -crf 26"
            // ])
            
            .outputOption([
                "-preset", "slow",
                "-filter:v", "scale=" + resolution + ":-2"
            ])
            // .complexFilter([
            //     "[0:v]scale=640:-1[bg];[bg][1:v]overlay=W-w-10:H-h-10"
            // ])
            .on('start', function (commandLine) {
                //console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('progress', (progress) => {
                //console.log(`[ffmpeg] ${JSON.stringify(progress)}`);
            })
            .on('error', (err) => {
                reject(false);
            })
            .on('end', () => {
                resolve(true);
            }).save(filePath)
    })
}

exports.upload = async (req, res) => {
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    if (req.uploadLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.movie.LIMITERRROR }], true), status: errorCodes.invalid }).end();
    }
    // validate upload limit
    // validate member role upload count limit
    if (req.quotaLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.movie.QUOTAREACHED }], true), status: errorCodes.invalid }).end();
    }
    let basePath = req.serverDirectoryPath + "/public"
    const filePath = basePath + "/upload/movies/movie/" + req.fileName
    let images = []
    let duration = 0
    let videoWidth = 0, videoHeight = 0, size = 0
    var command =
        ffmpeg.ffprobe(filePath, function (err, metadata) {
            
            duration = metadata.format.duration.toString()
            videoWidth = metadata.streams[0].width
            videoHeight = metadata.streams[0].height
            size = metadata.format.size
            ffmpeg(filePath)
                .on('filenames', function (filenames) {
                    images = filenames;
                }).on('end', function () {
                    //append base path in images
                    let uploadedImages = []
                    images.forEach(image => {
                        uploadedImages.push(req.APP_HOST + "/upload/images/movies/movie/" + image)
                    })

                    //create item movie in table
                    let movieObject = {}
                    movieObject["owner_id"] = req.user.user_id;
                    movieObject["completed"] = 0;
                    movieObject['image'] = "/upload/images/movies/movie/" + images[0];
                    movieObject["video_location"] = "/upload/movies/movie/" + req.fileName
                    movieObject['type'] = 3
                    movieObject['title'] = "Untitled"
                    movieObject['view_privacy'] = "everyone"
                    movieObject['custom_url'] = ""
                    movieObject['description'] = ""
                    var dt = dateTime.create();
                    var formatted = dt.format('Y-m-d H:M:S');
                    movieObject['creation_date'] = formatted
                    movieObject['modified_date'] = formatted
                    movieObject['status'] = 2
                    movieObject['size'] = size
                    var n = duration.indexOf('.');
                    duration = duration.substring(0, n != -1 ? n : duration.length)
                    let d = Number(duration);
                    var h = Math.floor(d / 3600).toString();
                    var m = Math.floor(d % 3600 / 60).toString();
                    var s = Math.floor(d % 3600 % 60).toString();

                    var hDisplay = h.length > 0 ? (h.length < 2 ? "0" + h : h) : "00"
                    var mDisplay = m.length > 0 ? ":" + (m.length < 2 ? "0" + m : m) : ":00"
                    var sDisplay = s.length > 0 ? ":" + (s.length < 2 ? "0" + s : s) : ":00"
                    const time = hDisplay + mDisplay + sDisplay
                    movieObject['duration'] = time

                    globalModel.create(req, movieObject, "movies").then(result => {
                        res.send({ videoWidth: videoWidth, videoHeight: videoHeight, movieId: result.insertId, images: uploadedImages, name: path.basename(metadata.format.filename, path.extname(metadata.format.filename)) })
                    })
                }).screenshots({
                    // Will take screens at 20%, 40%, 60% and 80% of the movie
                    count: 1,
                    folder: basePath + "/upload/images/movies/movie/",
                    filename: "%w_%h_%b_%i"
                });
        });

    // Kill ffmpeg after 5 minutes anyway
    setTimeout(function () {
        if (typeof command != "undefined") {
            command.on('error', function () {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.GENERAL }], true), status: errorCodes.serverError }).end();
            });
            command.kill();
        }
    }, 60 * 5 * 1000);

}
