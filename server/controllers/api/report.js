const reportModel = require("../../models/reports")
constant = require("../../functions/constant")
const globalModel = require("../../models/globalModel")
exports.index = async (req, res, next) => {

    if (req.body.types) {
        await globalModel.custom(req, "SELECT * FROM reportmessages").then(result => {
            if (result) {
                return res.send({types:result})
            }
        })
    } else {
        let data = {}
        data['type'] = req.body.type
        data['id'] = req.body.id
        data['owner_id'] = req.user.user_id
        data['reportmessage_id'] = req.body.reportmessage_id
        data['description'] = req.body.description ? req.body.description : ""
        reportModel.insert(req, data).then(result => {

        })
        return res.send({ message: constant.report.SUCCESS })
    }
}