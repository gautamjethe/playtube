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
    adsModel = require("../../models/userAds"),
    socketio = require("../../socket"),
    notifications = require("../../models/notifications"),
    privacyModel = require("../../models/privacy"),
    adsTransactionModel = require("../../models/adsTransactions")


exports.stats = async (req,res) => {
    if (!req.item) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.invalid }).end();
    }
    await adsTransactionModel.getStats(req,{ad_id:req.item.ad_id,criteria:req.body.type ? req.body.type : "today",type:req.item.type == 1 ? "click" : "view"}).then(result => {
        res.send({stats:result})
    })
}

exports.status = async (req, res) => {
    if (!req.item) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.invalid }).end();
    }
    let item = req.item
    await globalModel.update(req, { status: !item.status }, "advertisements_user", "ad_id", req.item.ad_id).then(result => {
        res.send({ status: !item.status })
    })
}
exports.delete = async (req, res) => {
    if (!req.item) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.general.PERMISSION_ERROR }], true), status: errorCodes.invalid }).end();
    }
    await globalModel.delete(req, "advertisements_user", "ad_id", req.item.ad_id).then(result => {
        if (result) {
            commonFunction.deleteImage(req, res, req.item.media, "ads")
            res.send({ "message": constant.ads.DELETED })
        } else {
            res.send({})
        }
    })

}


exports.create = async (req, res) => {
    if (req.quotaLimitError) {
        return res.send({ error: fieldErrors.errors([{ msg: constant.ads.LIMITERRROR }], true), status: errorCodes.invalid }).end();
    }
    await commonFunction.getGeneralInfo(req, res, "", true);
    if (req.imageError) {
        return res.send({ error: fieldErrors.errors([{ msg: req.imageError }], true), status: errorCodes.invalid }).end();
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ error: fieldErrors.errors(errors), status: errorCodes.invalid }).end();
    }
    // all set now
    let insertObject = {}
    let ad_id = req.body.ad_id
    if (!req.body.fromEdit) {
        insertObject['completed'] = 2;
        if (!req.fileName) {
            return res.send({ error: fieldErrors.errors([{ "upload": "Please select video." }], true), status: errorCodes.invalid }).end();
        }
    }
    let adObject = {}
    if (ad_id) {
        //uploaded
        await globalModel.custom(req, "SELECT * FROM advertisements_user WHERE ad_id = ?", ad_id).then(async result => {
            if (result && result.length) {
                adObject = JSON.parse(JSON.stringify(result))[0];
                await privacyModel.permission(req, 'member', 'editads', adObject).then(result => {
                    if (!result) {
                        ad_id = null
                        adObject = null
                    }
                }).catch(err => {
                    ad_id = null
                })
            } else {
                ad_id = null
            }
        }).catch(err => {

        })
    } else {
        insertObject["owner_id"] = req.user.user_id;
    }
    insertObject["name"] = req.body.name
    insertObject["title"] = req.body.title
    insertObject["description"] = req.body.description
    insertObject["category_id"] = req.body.category_id ? req.body.category_id : 0
    insertObject["subcategory_id"] = req.body.subcategory_id ? req.body.subcategory_id : 0
    insertObject["subsubcategory_id"] = req.body.subsubcategory_id ? req.body.subsubcategory_id : 0
    if(req.body.adult)
        insertObject["adult"] = req.body.adult

    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');

    if (!Object.keys(adObject).length || !adObject.custom_url) {
        if (req.levelPermissions["member.addsapprove"] && req.levelPermissions["member.addsapprove"] == "1")
            insertObject["approve"] = 1
        else
            insertObject["approve"] = 0
        insertObject["creation_date"] = formatted
    }
    insertObject["modified_date"] = formatted


    if (ad_id) {
        //update existing ad
        await globalModel.update(req, insertObject, "advertisements_user", 'ad_id', ad_id).then(result => {
            res.send({ ad_id: ad_id, message: constant.ads.EDIT });
            if (req.body.fromEdit) {
                ad_id = null
                res.end()
                return
            }
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    } else {
        //create new ad
        await globalModel.create(req, insertObject, "advertisements_user").then(result => {
            if (result) {
                ad_id = result.insertId
                res.send({ message: constant.ads.SUCCESS });
            } else {
                return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
            }
        }).catch(err => {
            return res.send({ error: fieldErrors.errors([{ msg: constant.general.DATABSE }], true), status: errorCodes.invalid }).end();
        })
    }

    if (!req.body.fromEdit && req.appSettings.video_ffmpeg_path) {

        let videoResolution = false
        const videoLocation = "/upload/videos/ads/" + req.file.filename
        const FFMPEGpath = req.appSettings.video_ffmpeg_path
        await exports.resolutions(videoLocation, req).then(result => {
            if (result) {
                videoResolution = result.videoWidth
            }
        })

        if (!videoResolution) {
            let updatedObject = {}
            updatedObject['completed'] = 3
            await globalModel.update(req, updatedObject, "advertisements_user", "ad_id", ad_id).then(result => {
            }).catch(error => {
            })

            if (req.fileName)
                commonFunction.deleteImage(req, res, req.serverDirectoryPath + "/public" + req.fileName, "locale")

            return
        }
        //convert videos
        var orgPath = req.serverDirectoryPath + "/public" + videoLocation
        let command = ffmpeg(orgPath)
            //.audioCodec('libfaac')
            .videoCodec('libx264')
            .format('mp4');
        const videoName = uniqid.process('v')
        const videoFilePath = "/public/upload/videos/ads/" + videoName + ".mp4"

        let is_uploaded = false
        if ((videoResolution >= 3840 || videoResolution == 0) && !is_uploaded) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + videoFilePath, 3840, orgPath, FFMPEGpath, "").then(async result => {
                //upate video
                if (req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + videoFilePath, videoFilePath.replace("/public", '')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, videoFilePath, 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                is_uploaded = true
                updatedObject['completed'] = 1
                updatedObject["media"] = videoFilePath.replace('/public', '')
                await globalModel.update(req, updatedObject, "advertisements_user", "ad_id", ad_id).then(result => {
                }).catch(error => {
                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 2048 || videoResolution == 0) && !is_uploaded) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + videoFilePath, 2048, orgPath, FFMPEGpath, "").then(async result => {
                //upate video
                if (req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + videoFilePath, videoFilePath.replace("/public", '')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, videoFilePath, 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                is_uploaded = true
                updatedObject['completed'] = 1
                updatedObject["media"] = videoFilePath.replace('/public', '')
                await globalModel.update(req, updatedObject, "advertisements_user", "ad_id", ad_id).then(result => {
                }).catch(error => {
                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 1920 || videoResolution == 0) && !is_uploaded) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + videoFilePath, 1920, orgPath, FFMPEGpath, "").then(async result => {
                //upate video
                if (req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + videoFilePath, videoFilePath.replace("/public", '')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, videoFilePath, 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                is_uploaded = true
                updatedObject['completed'] = 1
                updatedObject["media"] = videoFilePath.replace('/public', '')
                await globalModel.update(req, updatedObject, "advertisements_user", "ad_id", ad_id).then(result => {
                }).catch(error => {
                })
            }).catch(err => {
            })
        } 
        if ((videoResolution >= 1280 || videoResolution == 0) && !is_uploaded) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + videoFilePath, 1280, orgPath, FFMPEGpath, "").then(async result => {
                //upate video
                if (req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + videoFilePath, videoFilePath.replace("/public", '')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, videoFilePath, 'locale')
                    }).catch(err => {
                    })
                }
                const updatedObject = {}
                is_uploaded = true
                updatedObject['completed'] = 1
                updatedObject["media"] = videoFilePath.replace('/public', '')
                await globalModel.update(req, updatedObject, "advertisements_user", "ad_id", ad_id).then(result => {
                }).catch(error => {
                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 854 || videoResolution == 0) && !is_uploaded) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + videoFilePath, 854, orgPath, FFMPEGpath, "").then(async result => {
                //upate video
                if (req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + videoFilePath, videoFilePath.replace("/public", '')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, videoFilePath, 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                is_uploaded = true
                updatedObject['completed'] = 1
                updatedObject["media"] = videoFilePath.replace('/public', '')
                await globalModel.update(req, updatedObject, "advertisements_user", "ad_id", ad_id).then(result => {
                }).catch(error => {
                })
            }).catch(err => {
            })
        }

        if ((videoResolution >= 640 || videoResolution == 0) && !is_uploaded) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + videoFilePath, 640, orgPath, FFMPEGpath, "").then(async result => {
                //upate video 
                if (req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + videoFilePath, videoFilePath.replace("/public", '')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, videoFilePath, 'locale')
                    }).catch(err => {

                    })
                }
                const updatedObject = {}
                is_uploaded = true
                updatedObject['completed'] = 1
                updatedObject["media"] = videoFilePath.replace('/public', '')
                is_uploaded = true
                await globalModel.update(req, updatedObject, "advertisements_user", "ad_id", ad_id).then(result => {
                }).catch(error => {
                })
            }).catch(err => {
            })
        }

        if (!is_uploaded) {
            await module.exports.executeFFMPEG(command, req.serverDirectoryPath + videoFilePath, 240, orgPath, FFMPEGpath, "").then(async result => {
                //upate video 
                if (req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi") {
                    await s3Upload(req, req.serverDirectoryPath + videoFilePath, videoFilePath.replace("/public", '')).then(result => {
                        //remove local file
                        commonFunction.deleteImage(req, res, videoFilePath, 'locale')
                    }).catch(err => {
                    })
                }
                const updatedObject = {}
                updatedObject['completed'] = 1
                updatedObject["media"] = videoFilePath.replace('/public', '')
                is_uploaded = true
                await globalModel.update(req, updatedObject, "advertisements_user", "ad_id", ad_id).then(result => {
                }).catch(error => {
                })
            }).catch(err => {
            })
        }

        if (!is_uploaded) {
            const updatedObject = {}
            updatedObject['completed'] = 3
            //unlink org file
            await globalModel.update(req, updatedObject, "advertisements_user", "ad_id", ad_id).then(async result => {

            }).catch(error => {

            })
        } else {

        }

        if (videoLocation)
            commonFunction.deleteImage(req, res, videoLocation, "locale")
        if (videoFilePath && (req.appSettings.upload_system == "s3" || req.appSettings.upload_system == "wisabi"))
            commonFunction.deleteImage(req, res, videoFilePath.replace("/public", ''), "locale")
        socketio.getIO().emit('adCreated', {
            "ad_id": ad_id,
            status: is_uploaded ? 1 : 0
        });
    }
}

exports.resolutions = (filePath, req) => {
    return new Promise((resolve, reject) => {
        let basePath = req.serverDirectoryPath + "/public"
        ffmpeg.ffprobe(basePath + filePath, function (err, metadata) {
            if (err) {
                resolve(false)
            }
            videoWidth = metadata.streams[0].width
            videoHeight = metadata.streams[0].height
            size = metadata.format.size
            resolve({ videoWidth: videoWidth, size: size, videoHeight: videoHeight })
        })
    });
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
                "-preset", "ultrafast",
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
                //console.log(err,"errrrr")
                reject(false);
            })
            .on('end', () => {
                //console.log("resolved",filePath)
                resolve(true);
            }).save(filePath)
    })
}
