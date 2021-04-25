const paypal = require("paypal-rest-sdk")
var url = require('url');

exports.init = (req, res, data) => {
    return new Promise(function (resolve, reject) {
        // paypal auth configuration
        var config = {
            "api": {
                'mode': req.appSettings.payment_paypal_sanbox == "0" ? "sandbox" : "live", //sandbox or live
                'client_id': req.appSettings.payment_client_id,
                'client_secret': req.appSettings.payment_client_secret,
                'headers': {
                    'custom': 'header'
                }
            }
        }
        paypal.configure(config.api);

        var create_payment_json = {
            "intent": "authorize",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": data.returnUrl,
                "cancel_url": data.cancelUrl
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": data.title,
                        "sku": data.sku ? data.sku : "package_" + data.id,
                        "price": data.amount,
                        "currency": req.appSettings.payment_default_currency,
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": req.appSettings.payment_default_currency,
                    "total": data.amount
                },
                //'invoice_number' : data.invoice_number,
                "description": data.description && data.description.length > 127 ? data.description.substr(0, 124)+'...': data.description,
            }]
        };

        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                console.log(error);
            } else {
                for (var index = 0; index < payment.links.length; index++) {
                    if (payment.links[index].rel === 'approval_url') {
                        var approval_url = payment.links[index].href;
                        req.session.paypalData = payment
                        resolve({ url: approval_url, token: url.parse(approval_url, true).query.token })
                    }
                }
            }
        });
    })
}

exports.execute = (req, res, PayerID, packageObj) => {
    return new Promise(function (resolve, reject) {

        // paypal auth configuration
        var config = {
            "api": {
                'mode': req.appSettings.payment_paypal_sanbox == "0" ? "sandbox" : "live", //sandbox or live
                'client_id': req.appSettings.payment_client_id,
                'client_secret': req.appSettings.payment_client_secret,
                'headers': {
                    'custom': 'header'
                }
            }
        }
        paypal.configure(config.api);
        const serverAmount = parseFloat(req.session.paypalData.transactions[0].amount.total);
        const clientAmount = parseFloat(packageObj.price);
        const paymentId = req.session.paypalData.id;
        if (serverAmount !== clientAmount) {
            reject("Payment amount doesn't matched.")
        }
        const details = {
            "payer_id": PayerID,
            "transactions": [{
                "amount": {
                    "currency": req.appSettings.payment_default_currency,
                    "total": serverAmount
                }
            }]
        };

        paypal.payment.execute(paymentId, details, function (error, payment) {
            if (error) {
                reject(error.response.details && error.response.details.length > -1 ? error.response.details[0].issue : "")
            } else {
                var capture_details = {
                    "amount": {
                        "currency": req.appSettings.payment_default_currency,
                        "total": serverAmount
                    },
                    "is_final_capture": true
                };
                paypal.authorization.capture(payment.transactions[0].related_resources[0].authorization.id,capture_details,function(error,capture) {
                    if(error){
                        reject(error.response.details && error.response.details.length > -1 ? error.response.details[0].issue : "")
                    }else{
                        resolve({ create_time: payment.create_time, state: capture.state,transaction_id:capture.id })
                    }
                })
            }
        });
    })
}