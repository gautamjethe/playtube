const transactionModel = require("../models/transactions")
const orderModel = require("../models/orders")
const subscriptionModel = require("../models/subscriptions")
const globalModel = require("../models/globalModel")
const nodeDate = require("node-datetime")
const paypal = require("paypal-rest-sdk")

exports.verifyIPN = async (headers,body) => {
  return new Promise((resolve, reject) => {
     paypal.notification.webhookEvent.verify(headers,body,body.id, function (error, response) {
      if (!error) {
          resolve(true)
          console.log(response,'===========  IPN SUCCESS ==============');
          //throw error;
      } else {
        resolve(false)
        console.log(error,' =========== ERROR IPN ==============');
      }
    });
  });
}

exports.index = async (req, res, next) => {
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
  // Send 200 status back to PayPal
  res.status(200).send('OK');

  const body = req.body || {};
  console.log("IPN BODY MESSAGE ======== ")
  console.log(body)
  console.log(' =========REQ HEADERS======== ',JSON.stringify(req.headers))
  // Validate IPN message with PayPal
  let isValid = true
    await exports.verifyIPN(req.headers,req.body).then(result => {
      //isValid = result
    })
  
  if(!isValid){
    return
  }
  let order = null;
  
  const event_type = body.event_type
  //for recurring plans
  const resource = body.resource
  let params = {}
  params['summary'] = body.summary
  params['event_type'] = event_type
  switch(event_type) {
    case "PAYMENT.AUTHORIZATION.CREATED":
      // A payment authorization is created, approved, executed, or a future payment authorization is created.
      //silence
      break
    case "PAYMENT.AUTHORIZATION.VOIDED":
      // A payment authorization is voided.
      //silence
      break
    case "PAYMENT.CAPTURE.DENIED":
    case "PAYMENT.CAPTURE.PENDING":
    case "PAYMENT.CAPTURE.REVERSED":
    case "PAYMENT.CAPTURE.COMPLETED":
      case "PAYMENT.CAPTURE.REFUNDED":
      params['state'] =  resource.state.toLowerCase()
      await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: resource.parent_payment }).then(result => {
        if (result) {
          order = result[0]
        }
      })
      break
    case "BILLING.SUBSCRIPTION.CANCELLED":
      params['state'] = resource.state
      //A billing agreement is canceled.
      params['billing_agreement_id'] = resource.id
      params['state'] = resource.state.toLowerCase()
      await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: params['billing_agreement_id'] }).then(result => {
        if (result && result.length) {
          order = result[0]
        }
      })
      break
    case "BILLING.SUBSCRIPTION.CREATED":
      //A billing agreement is created.	
      params['billing_agreement_id'] = resource.id
      params['state'] = resource.state.toLowerCase()
      await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: params['billing_agreement_id'] }).then(result => {
        if (result && result.length) {
          order = result[0]
        }
      })
      break
    case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
      //A billing agreement is re-activated.	
      params['billing_agreement_id'] = resource.id
      params['state'] = resource.state.toLowerCase()
      await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: params['billing_agreement_id'] }).then(result => {
        if (result && result.length) {
          order = result[0]
        }
      })
      break
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      //A billing agreement is suspended.	
      params['billing_agreement_id'] = resource.id
      params['state'] = resource.state.toLowerCase()
      await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: params['billing_agreement_id'] }).then(result => {
        if (result && result.length) {
          order = result[0]
        }
      })
      break
    case "BILLING.SUBSCRIPTION.UPDATED":
      //A billing agreement is updated.	
      params['billing_agreement_id'] = resource.id
      params['state'] = resource.state.toLowerCase()
      await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: params['billing_agreement_id'] }).then(result => {
        if (result && result.length) {
          order = result[0]
        }
      })
      break
    case "CUSTOMER.DISPUTE.CREATED":
      //A dispute is created.	
      params['type'] = "dispute"
      params['billing_agreement_id'] = resource.id
      params['state']  = resource.status
      params['transaction_id'] = resource.disputed_transactions.seller_transaction_id
      params['disputed_message_buyer'] = resource.messages[resource.messages.length - 1].content
      //send email of dispute
      break
    case "CUSTOMER.DISPUTE.RESOLVED":
      //A dispute is resolved.	
      params['type'] = "dispute"
      params['billing_agreement_id'] = resource.id
      params['state']  = resource.status
      params['transaction_id'] = resource.disputed_transactions.seller_transaction_id
      params['disputed_message_buyer'] = resource.messages[resource.messages.length - 1].content
      //send email of dispute resolved
      break
    case "CUSTOMER.DISPUTE.UPDATED":
      //A dispute is updated.	
      params['type'] = "dispute"
      params['billing_agreement_id'] = resource.id
      params['state']  = resource.status
      params['transaction_id'] = resource.disputed_transactions.seller_transaction_id
      params['disputed_message_buyer'] = resource.messages[resource.messages.length - 1].content
      //send email of dispute updated
      break
    case "PAYMENT.SALE.PENDING":
      // The state of a sale changes to pending.
      params['billing_agreement_id'] = resource.billing_agreement_id
      params['state'] = resource.state
      await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: params['billing_agreement_id'] }).then(result => {
        if (result && result.length) {
          order = result[0]
        }
      })
      break
    case "PAYMENT.SALE.DENIED":
      // The state of a sale changes from pending to denied.
      params['billing_agreement_id'] = resource.billing_agreement_id
      params['state'] = resource.state
      await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: params['billing_agreement_id'] }).then(result => {
        if (result && result.length) {
          order = result[0]
        }
      })
      break
    case "PAYMENT.SALE.REFUNDED":
    case "PAYMENT.SALE.REVERSED":
      // A merchant refunds a sale
      // or PayPal reverses a sale.
      params['billing_agreement_id'] = resource.billing_agreement_id
      params['state'] = resource.state
      await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: params['billing_agreement_id'] }).then(result => {
        if (result && result.length) {
          order = result[0]
        }
      })
      break
    case "PAYMENT.SALE.COMPLETED":
      // A sale completes.
      params['billing_agreement_id'] = resource.billing_agreement_id
      params['state'] = resource.state
      await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: params['billing_agreement_id'] }).then(result => {
        if (result && result.length) {
          order = result[0]
        }
      })
      if(resource.state !== "completed") {
        //'Forbidden: Payment is not completed yet.'
      }
      if(order){
        let subscription = null
        //get subscription
        await subscriptionModel.findAll(req, { gateway_id: 1, order_id: order.order_id }).then(result => {
          if (result && result.length) {
            subscription = result[0]
          }
        })
        if(subscription){
          let state = await exports.paymentState(req,resource.state)
          //create transaction
          let amount = resource.amount.total
          let insertData = {state:state,order_id:order.order_id,type:order.source_type,id:order.source_id,owner_id:order.owner_id,subscription_id:subscription.subscription_id,gateway_id:1,gateway_transaction_id:resource.id,price:amount,currency:resource.amount.currency,creation_date:nodeDate.create().format("Y-m-d H:M:S"),modified_date:nodeDate.create().format("Y-m-d H:M:S")}
          if(subscription.type == "channel_support"){
            let commission_amount = 0
            let commissionType = parseFloat(req.appSettings['channel_support_commission_type'])
            let commissionTypeValue = parseFloat(req.appSettings['channel_support_commission_value'])
            //calculate admin commission
            if(commissionType == 2 && commissionTypeValue > 0){
                commission_amount = ((amount).toFixed(2) * (commissionTypeValue/100)).toFixed(2);
            }else if(commissionType == 1 && commissionTypeValue > 0){
                commission_amount = commissionTypeValue;
            }
            let totalAmount = amount
            if(commission_amount > parseFloat(amount).toFixed(2)){
                commission_amount = 0
            }else{
              totalAmount = (totalAmount - commission_amount).toFixed(2);
            }
            insertData['admin_commission'] = commission_amount
            insertData['price'] = totalAmount
          }
          globalModel.custom(req,'INSERT INTO transactions SET ? ON DUPLICATE KEY UPDATE state = ?',[insertData,state]).then(result => {

          })
        }
      }
    break;
    default:
      //silence
    break   
  }
  if(Object.keys(params).length > 1){
    let subscription = null
    let transaction = null
    //get order transaction
    if(params['type'] == "dispute"){
      await transactionModel.findAll(req,{gateway_transaction_id:params.transaction_id}).then(result => {
        if (result && result.length) {
          transaction = result[0]
        }
      })
      if(transaction){
        if(transaction.subscription_id){
          await globalModel.custom(req,"SELECT * FROM transactions WHERE subscription_id = ?",[transaction.subscription_id]).then(result => {
            if (result && result.length) {
              transaction = JSON.parse(JSON.stringify(result))[0]
            }
          })
        }
        await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: transaction['order_id'] }).then(result => {
          if (result && result.length) {
            order = result[0]
          }
        })
      }
    }else if(params.transaction_id){
      await transactionModel.findAll(req,{gateway_transaction_id:params.transaction_id}).then(result => {
        if (result && result.length) {
          transaction = result[0]
        }
      })
      if(transaction){
        if(transaction.subscription_id){
          await globalModel.custom(req,"SELECT * FROM transactions WHERE subscription_id = ?",[transaction.subscription_id]).then(result => {
            if (result && result.length) {
              transaction = result[0]
            }
          })
        }
        await orderModel.findAll(req, { gateway_id: 1, gateway_transaction_id: transaction['order_id'] }).then(result => {
          if (result && result.length) {
            order = result[0]
          }
        })
      }
    }else if(order){      
        //get subscription
        await subscriptionModel.findAll(req, { gateway_id: 1, order_id: order.order_id }).then(result => {
          if (result && result.length) {
            subscription = result[0]
          }
        })
        if(subscription){
          //get latest transaction
          await globalModel.custom(req,"SELECT * FROM transactions WHERE subscription_id = ?",[subscription.subscription_id]).then(result => {
            if (result && result.length) {
              const transactionResult = JSON.parse(JSON.stringify(result));
              transaction = transactionResult[0]
            }
          })
          
        }
    }
    //valid ipn
    if(order && order.source_type == "subscription" && subscription && subscription.type == "member_subscription"){
      const memberSubscription = require("../functions/ipnsFunctions/memberSubscriptions")
      await memberSubscription.onSubscriptionTransactionIpn(req, params,order,subscription,transaction).then(res => {
        if (res) {
          console.log("=========== MEMBER SUBSCRIPTION IPN Processed successfully. =========== ")
        }else{
          console.log(" ====== ERROR EXECUTING MEMBER SUBSCRIPTION IPN. ======")
        }
      });
    }if(order && order.source_type == "channel_support" && subscription && subscription.type == "channel_support"){
      const channelSupportSubscription = require("../functions/ipnsFunctions/channelSupportSubscriptions")
      await channelSupportSubscription.onSubscriptionTransactionIpn(req, params,order,subscription,transaction).then(res => {
        if (res) {
          console.log("=========== Channel Support IPN Processed successfully. =========== ")
        }else{
          console.log(" ====== ERROR EXECUTING Channel Support IPN. ======")
        }
      });
    }else if(order && order.source_type == "video_purchase" && subscription && subscription.type == "video_purchase"){
      const videoSubscription = require("../functions/ipnsFunctions/videoPurchaseSubscriptions")
      await videoSubscription.onPurchaseTransactionIpn(req, params,order,subscription,transaction).then(res => {
        if (res) {
          console.log("=========== VIDEO IPN Processed successfully. =========== ")
        }else{
          console.log(" ====== ERROR EXECUTING VIDEO IPN. ======")
        }
      });
    }else{
      console.log(" ====== UNKNOWN EXECUTING IPN. ======")
    }
  }
}

exports.paymentState = async (req,data) => {
  return new Promise(async function (resolve, reject) {
    let state = "pending"
    switch (data.toLowerCase()) {
      case 'completed':
      case 'created':
      case 'processed':
      case 'approbed':
        state = 'completed';
        break;
      case 'denied':
      case 'expired':
      case 'failed':
      case 'voided':
        state = 'failed';
        break;

      case 'pending':
        state = 'pending';
        break;

      case 'refunded':
        state = 'redund';
        break;
      case 'reversed':
        state = 'reversed';
        break;

      default:
        state = 'unknown';
        break;
    }
    resolve(state)
  })
}

