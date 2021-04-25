const globalModel = require("../models/globalModel")
const emailFunction = require("../functions/emails")


exports.onPurchaseTransactionIpn = async (req,params, order,subscription,transaction ) => {

    return new Promise(async function (resolve, reject) {
    let user = null
  
      await globalModel.custom(req, "SELECT * FROM users LEFT JOIN userdetails ON userdetails.user_id = users.user_id WHERE users.user_id = ?", [order.owner_id]).then(result => {
        if (result) {
          const res = JSON.parse(JSON.stringify(result));
          user = res[0]
        } else {
          resolve(false)
        }
      })
      if (!Object.keys(user).length) {
        resolve(false)
      }
   
    switch(params.event_type) {
      case "CUSTOMER.DISPUTE.CREATED":
        //A dispute is created.	
        //send email of dispute
        exports.onPaymentDispute(req, order,subscription, transaction,params['disputed_message_buyer']).then(result => {
          if (result) {
            exports.sendEmail(req, { type: "payment_video_disputecreate", owner: user })
          }
        });
        break
      case "CUSTOMER.DISPUTE.RESOLVED":
        //A dispute is resolved.	
        //send email of dispute resolved
        exports.onPaymentSuccess(req, order,subscription, transaction).then(result => {
          if (result) {
            exports.sendEmail(req, { type: "payment_video_disputeclear", owner: user })
          }
        });
        break
      case "CUSTOMER.DISPUTE.UPDATED":
        //A dispute is updated.	
        if(transaction)
            globalModel.update(req, {state:"dispute",note:"concat(ifnull(note,''), "+params['disputed_message_buyer']+")"}, "transactions", 'transaction_id', transaction.transaction_id).then(result => {}).catch(err => {})
        //send email of dispute updated
        break
      case "PAYMENT.SALE.PENDING":
        // The state of a sale changes to pending.
        exports.onPaymentPending(req, order,subscription, transaction).then(result => {
          if (result) {
            exports.sendEmail(req, { type: "payment_video_pending", owner: user })
          }
        });
        break
      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED":
      case "PAYMENT.SALE.REVERSED":
        // A merchant refunds a sale
        // or PayPal reverses a sale.
        exports.onPaymentFailure(req, order,subscription, transaction).then(result => {
          if (result) {
            exports.sendEmail(req, { type: "payment_video_overdue", owner: user })
          }
        });
        break
      case "PAYMENT.SALE.COMPLETED":
        // A sale completes.
        
        if(resource.state !== "completed") {
          //'Forbidden: Payment is not completed yet.'
        }
        
        switch (params['state'].toLowerCase()) {
          case 'created': // Not sure about this one
          case 'pending':
            // @todo this might be redundant
            exports.onPaymentSuccess(req,order, subscription, transaction);
            break;
          case 'completed':
          case 'processed':
          case 'approved':
            exports.onPaymentSuccess(req,order, subscription, transaction).then(result => {
              if (result) {
                exports.sendEmail(req, { type: "payment_video_completed", owner: user })
              }
            });
            // send notification
            break;
          case 'denied':
          case 'failed':
          case 'voided':
          case 'reversed':
            exports.onPaymentFailure(req,order, subscription, transaction).then(result => {
              if (result) {
                exports.sendEmail(req, { type: "payment_video_failed", owner: user })
              }
            });
            break;
          case 'refunded':
            exports.onRefund(req,order, subscription, transaction).then(result => {
              if (result) {
                exports.sendEmail(req, { type: "payment_video_refunded", owner: user })
              }
            });
            break;
          default:
            console.log('Unknown IPN payment status ' + rawData['payment_status']);
            resolve(false)
            break;
        }
      break;
      default:
        //silence
      break   
    }
    resolve(true)
  });
  
  }
  
  exports.paymentState = async (req,data) => {
    return new Promise(async function (resolve, reject) {
      let state = "pending"
      switch (rawData['state'].toLowerCase()) {
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
  
  
  exports.sendEmail = async (req, data) => {
    globalModel.custom(req, "SELECT vars,type FROM emailtemplates WHERE type = ?", [data.type]).then(resultsType => {
      if (resultsType) {
        const typeData = JSON.parse(JSON.stringify(resultsType))[0];
        let result = {}
        result.vars = typeData.vars
        result.type = typeData["type"]
        result.ownerEmail = data.owner
        result.toName = data.owner.displayname
        result.toEmail = data.owner.email
        emailFunction.sendMessage(req, result)
      }
    });
  }
  exports.getSubscription = async (req, order) => {
    // Check that gateways match
    return new Promise(async function (resolve, reject) {
      if (order.source_type == "member_subscription") {
        globalModel.custom(req, "SELECT * FROM subscriptions WHERE subscription_id = ?", [order.source_id]).then(result => {
          if (result) {
            const res = JSON.parse(JSON.stringify(result));
            resolve(res[0])
          } else {
            resolve(false)
          }
        })
      } else {
        resolve(false)
      }
    })
  }
  
  exports.onPaymentSuccess = async (req,order, subscription, transaction) => {
    return new Promise(async function (resolve, reject) {
      let changedData = false;
      if ((subscription && (subscription['status'] == "initial" || subscription['status'] == "suspend" || subscription['status'] == "dispute" ||  subscription['status'] == "trial" || subscription['status'] == "pending" || subscription['status'] == "completed") || (transaction || (transaction['status'] == "initial" || transaction['status'] == "suspend" || transaction['status'] == "dispute" ||  transaction['status'] == "trial" || transaction['status'] == "pending" || transaction['status'] == "completed")))) {
        
        let updatedData = {}
        // Update expiration to expiration + recurrence or to now + recurrence?
        
        // Change status
        if (subscription['status'] != 'completed') {
          updatedData['status'] = 'completed';
          changedData = true;
          if(transaction)
            globalModel.update(req, {state:"completed"}, "transactions", 'transaction_id', transaction.transaction_id).then(result => {}).catch(err => {})
          globalModel.update(req, {state:"completed"}, "orders", 'order_id', order.order_id).then(result => {}).catch(err => {})
          if(subscription)
            globalModel.update(req, updatedData, "subscriptions", 'subscription_id', subscription.subscription_id).then(result => {}).catch(err => {})
        }
        // Update user if active
        
      }
      resolve(changedData)
    });
  }
  
  
  exports.onPaymentPending = async (req,order, subscription, transaction) => {
    return new Promise(async function (resolve, reject) {
      let changedData = false;
      if ((subscription && (subscription['status'] == "initial" || subscription['status'] == "suspend" || subscription['status'] == "dispute" ||  subscription['status'] == "trial" || subscription['status'] == "pending" || subscription['status'] == "completed") || (transaction && (transaction['status'] == "initial" || transaction['status'] == "suspend" || transaction['status'] == "dispute" ||  transaction['status'] == "trial" || transaction['status'] == "pending" || transaction['status'] == "completed")))) {
        
        let updatedData = {}
        if ((subscription && subscription['status'] != "pending") || (transaction && transaction['status'] != "pending")) {
          
          updatedData['status'] = "pending"
          changedData = true
          if(transaction)
            globalModel.update(req, {state:"pending"}, "transactions", 'transaction_id', transaction.transaction_id).then(result => {}).catch(err => {})
          globalModel.update(req, {state:"pending"}, "orders", 'order_id', order.order_id).then(result => {}).catch(err => {})
          if(subscription)
            globalModel.update(req, updatedData, "subscriptions", 'subscription_id', subscription.subscription_id).then(result => {}).catch(err => {})
          
        }
        
      }
      resolve(changedData)
    });
  }
  
  exports.onPaymentFailure = async (req,order, subscription, transaction) => {
    return new Promise(async function (resolve, reject) {
      let changedData = false;
      if ((subscription && (subscription['status'] == "initial" || subscription['status'] == "suspend" || subscription['status'] == "dispute" ||  subscription['status'] == "trial" || subscription['status'] == "pending" || subscription['status'] == "completed" || subscription['status'] == "overdue") || (transaction && (transaction['status'] == "initial" || transaction['status'] == "suspend" || transaction['status'] == "dispute" ||  transaction['status'] == "trial" || transaction['status'] == "pending" || transaction['status'] == "completed" || transaction['status'] == "overdue")))) {
        
        let updatedData = {}
        if ((subscription && subscription['status'] != "overdue") || (transaction && transaction['status'] != "overdue")) {
          
          updatedData['status'] = "overdue"
          changedData = true
          if(transaction)
            globalModel.update(req, {state:"overdue"}, "transactions", 'transaction_id', transaction.transaction_id).then(result => {}).catch(err => {})
          globalModel.update(req, {state:"overdue"}, "orders", 'order_id', order.order_id).then(result => {}).catch(err => {})
          if(subscription)
            globalModel.update(req, updatedData, "subscriptions", 'subscription_id', subscription.subscription_id).then(result => {}).catch(err => {})                  
       }
        
      }
      resolve(changedData)
    });
  }
  
  
  exports.onExpiration = async (req,order, subscription, transaction) => {
    return new Promise(async function (resolve, reject) {
      let changedData = false;
      if ((subscription && (subscription['status'] == "initial" || subscription['status'] == "suspend" || subscription['status'] == "dispute" ||  subscription['status'] == "trial" || subscription['status'] == "pending" || subscription['status'] == "completed" || subscription['status'] == "overdue" || subscription['status'] == "expired")) || (transaction && (transaction['status'] == "initial" || transaction['status'] == "suspend" || transaction['status'] == "dispute" ||  transaction['status'] == "trial" || transaction['status'] == "pending" || transaction['status'] == "completed" || transaction['status'] == "overdue" || transaction['status'] == "expired"))) {
        
        let updatedData = {}
        if ((subscription && subscription['status'] != "expired") || (transaction && transaction['status'] != "expired")) {
          
          updatedData['status'] = "expired"
          changedData = true
          if(transaction)
            globalModel.update(req, {state:"expired"}, "transactions", 'transaction_id', transaction.transaction_id).then(result => {}).catch(err => {})
          globalModel.update(req, {state:"expired"}, "orders", 'order_id', order.order_id).then(result => {}).catch(err => {})
          if(subscription)
            globalModel.update(req, updatedData, "subscriptions", 'subscription_id', subscription.subscription_id).then(result => {}).catch(err => {})   
        }
        
      }
      resolve(changedData)
    });
  }
  exports.onRefund = async (req,order, subscription, transaction) => {
    return new Promise(async function (resolve, reject) {
      let changedData = false;
      if ((subscription && (subscription['status'] == "initial" || subscription['status'] == "suspend" || subscription['status'] == "dispute" ||  subscription['status'] == "trial" || subscription['status'] == "pending" || subscription['status'] == "completed" || subscription['status'] == "refunded")) || (transaction && (transaction['status'] == "initial" || transaction['status'] == "suspend" || transaction['status'] == "dispute" ||  transaction['status'] == "trial" || transaction['status'] == "pending" || transaction['status'] == "completed" || transaction['status'] == "refunded")) ) {
        
        let updatedData = {}
        if ((subscription && subscription['status'] != "refunded") || (transaction && transaction['status'] != "refunded")) {
          
          updatedData['status'] = "refunded"
          changedData = true
          if(transaction)
            globalModel.update(req, {state:"refunded"}, "transactions", 'transaction_id', transaction.transaction_id).then(result => {}).catch(err => {})
          globalModel.update(req, {state:"refunded"}, "orders", 'order_id', order.order_id).then(result => {}).catch(err => {})
          if(subscription)
            globalModel.update(req, updatedData, "subscriptions", 'subscription_id', subscription.subscription_id).then(result => {}).catch(err => {})   
        }
        
      }
      resolve(changedData)
    });
  }

  
  exports.onPaymentDispute = async(req, order,subscription, transaction, message) => {
    return new Promise(async function (resolve, reject) {
      let changedData = false;
      if ((subscription && (subscription['status'] == "initial" || subscription['status'] == "suspend" ||  subscription['status'] == "trial" || subscription['status'] == "pending" || subscription['status'] == "completed" || subscription['status'] == "refunded")) || (transaction && (transaction['status'] == "initial" || transaction['status'] == "suspend" ||  transaction['status'] == "trial" || transaction['status'] == "pending" || transaction['status'] == "completed" || transaction['status'] == "refunded")) ) {
        
        let updatedData = {}
        if ((subscription && subscription['status'] != "dispute") || (transaction && transaction['status'] != "dispute")) {
          
          updatedData['status'] = "dispute"
          changedData = true
          if(transaction)
            globalModel.update(req, {state:"dispute",note:"concat(ifnull(note,''), "+message+")"}, "transactions", 'transaction_id', transaction.transaction_id).then(result => {}).catch(err => {})
          globalModel.update(req, {state:"dispute"}, "orders", 'order_id', order.order_id).then(result => {}).catch(err => {})
          if(subscription)
            globalModel.update(req, updatedData, "subscriptions", 'subscription_id', subscription.subscription_id).then(result => {}).catch(err => {})   
        }
        
      }
      resolve(changedData)
    });
  }