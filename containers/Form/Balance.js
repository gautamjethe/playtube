import React, { Component } from "react"
import Form from '../../components/DynamicForm/Index'
import { connect } from 'react-redux';
import axios from "../../axios-orders"
import Currency from "../Upgrade/Currency"
import general from '../../store/actions/general';
import ReactDOMServer from "react-dom/server"
import Validator from '../../validators';
import Router from "next/router"
import Translate from "../../components/Translate/Index";
import swal from 'sweetalert'

class Balance extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "Withdraw Balance",
            success: false,
            error: null, 
            loading: true,
            member: props.member,
            monetization_threshold_amount:props.monetization_threshold_amount,
            submitting: false,
            firstLoaded: true,
            member: props.member,
            user:props.pageInfoData.user ? true : false,
            adsPaymentStatus: props.pageData.adsPaymentStatus,
        }
        this.myRef = React.createRef();
    }
    componentDidMount(){
        var that = this
        $(document).on("click",'.open_withdraw',function(e) {
            e.preventDefault();
            let user = that.props.pageInfoData.user ? `&user=${that.props.pageInfoData.user}` : "";
            let userAs = that.props.pageInfoData.user ? `?user=${that.props.pageInfoData.user}` : "";
            Router.push(
                `/dashboard?type=withdraw${user}`,
                `/dashboard/withdraw${userAs}`,
            )
        })
        if (this.state.adsPaymentStatus) {
            if (this.state.adsPaymentStatus == "success") {
                swal("Success", Translate(this.props, "Wallet recharge successfully.", "success"));
            } else if (this.state.adsPaymentStatus == "fail") {
                swal("Error", Translate(this.props, "Something went wrong, please try again later", "error"));
            } else if (this.state.adsPaymentStatus == "cancel") {
                swal("Error", Translate(this.props, "You have cancelled the payment.", "error"));
            }
        }
    }
    onSubmit = model => {
        if (this.state.submitting) {
            return
        }
        var that = this;
        let user = that.props.pageInfoData.user ? `&user=${that.props.pageInfoData.user}` : "";
        let userAs = that.props.pageInfoData.user ? `?user=${that.props.pageInfoData.user}` : "";
        let price = this.props.pageInfoData.levelPermissions['member.monetization_threshold_amount']
        if(this.state.monetization_threshold_amount){
            price = this.state.monetization_threshold_amount
        }
        if(parseFloat(this.state.member.balance) >= parseFloat(model['amount']) && parseFloat(price) <= parseFloat(model['amount'])){
            let formData = new FormData();
            for (var key in model) {
                if (model[key])
                    formData.append(key, model[key]);
            }
            formData.append("owner_id", this.state.member.user_id)
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
            let url = '/members/balance-withdraw';
            this.setState({ submitting: true, error: null });
            axios.post(url, formData, config)
                .then(response => {
                    if (response.data.error) {
                        window.scrollTo(0, this.myRef.current.offsetTop);
                        this.setState({ error: response.data.error, submitting: false });
                    } else {
                        this.setState({ submitting: false });
                        
                        this.props.openToast(Translate(this.props,response.data.message), "success");
                        setTimeout(() => {
                            Router.push(
                                `/dashboard?type=withdraw${user}`,
                                `/dashboard/withdraw${userAs}`,
                            )
                        },1000);
                    }
                }).catch(err => {
                    this.setState({ submitting: false, error: err });
                });
        }else{
            if(parseFloat(this.state.member.balance) < parseFloat(model['amount'])){
                this.setState({ error: [{"field":"amount","message":"Enter amount must be less than available balance."}], submitting: false });
            }else if( parseFloat(price) > parseFloat(model['amount'])){
                this.setState({ error: [{"field":"amount","message":"Enter amount must be greater than minimum withdraw amount."}], submitting: false });
            }
        }
    };
    recharge = (e) => {
        this.setState({localUpdate:true, adsWallet: true })
    }
    walletFormSubmit = (e) => {
        e.preventDefault()
        if (!this.state.walletAmount) {
            return
        }
        this.setState({localUpdate:true, adsWallet: false })
        swal("Success", Translate(this.props, "Redirecting you to payment gateway...", "success"));
        window.location.href = "/ads/recharge?fromBalance=1&amount=" + encodeURI(this.state.walletAmount)
    }
    closeWalletPopup = (e) => {
        this.setState({localUpdate:true, adsWallet: false, walletAmount: 0 })
    }
    walletValue = (e) => {
        if (isNaN(e.target.value) || e.target.value < 1) {
            this.setState({localUpdate:true, walletAmount: parseFloat(e.target.value) })
        } else {
            this.setState({localUpdate:true, walletAmount: e.target.value })
        }
    }
    render() {
        let adsWallet = null
        if (this.state.adsWallet && !this.state.user) {
            adsWallet = <div className="popup_wrapper_cnt">
                <div className="popup_cnt">
                    <div className="comments">
                        <div className="VideoDetails-commentWrap">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{Translate(this.props, "Recharge Wallet")}</h2>
                                <a onClick={this.closeWalletPopup} className="_close"><i></i></a>
                            </div>
                            <div className="user_wallet">
                                <div className="row">
                                    <form onSubmit={this.walletFormSubmit}>
                                        <div className="form-group">
                                            <label htmlFor="name" className="control-label">{Translate(this.props, "Enter Amount :")}</label>
                                            <input type="text" className="form-control" value={this.state.walletAmount ? this.state.walletAmount : ""} onChange={this.walletValue} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="name" className="control-label"></label>
                                            <button type="submit">{Translate(this.props, "Submit")}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        } 
        let validator = [
            {
            key: "paypal_email", 
                validations: [
                    {
                    "validator": Validator.required,
                    "message": "Paypal Email is required field"
                    }
                ]
            },
            {
                key: "paypal_email", 
                    validations: [
                        {
                        "validator": Validator.email,
                        "message": "Please provide valid email"
                        }
                    ]
                },
            {
            key: "amount", 
                validations: [
                    {
                    "validator": Validator.required,
                    "message": "Amount is required field"
                    }
                ]
            },
            {
            key: "amount", 
                validations: [
                    {
                    "validator": Validator.price,
                    "message": "Please provide valid amount"
                    }
                ]
            }
        ]
        let fields = []
        let perclick = {}
        
        let price = this.props.pageInfoData.levelPermissions['member.monetization_threshold_amount']
        if(this.state.monetization_threshold_amount){
            price = this.state.monetization_threshold_amount
        }
        perclick['package'] = { price: parseFloat(price) }        
        fields.push({ value: "1", key: "1sss", label: this.props.t("Enable Monetization") })
        
        let wallet = {}
        wallet['package'] = { price: this.state.member ? this.state.member.wallet : this.props.pageInfoData.loggedInUserDetails.wallet }

        let userBalance = {}
         userBalance['package'] = { price: parseFloat(this.state.member.balance ? this.state.member.balance : 0) }  
        let formFields = [
            { key: "wallet", label: "Wallet Total",props: { readOnly: true }, value: ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...wallet} />) },
            { key: "balance", label: "Available Balance",props: { readOnly: true }, value: ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...userBalance} />) },
            { key: "paypal_email", label: "Paypal Email", value: this.state.member.email,isRequired:true },
            { key: "amount", label: "Amount", type: "text", value: "", placeholder:"00.00",isRequired:true },
            {
                key: "res_type_1",
                type: "content",
                content: '<h6 class="custom-control minimum_amount_cnt">' + this.props.t("Minimum withdraw amount should be greater than or equal to {{data}}.",{data:"("+ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } { ...perclick} />)+")"}) + '</h6>'
            }
        ]


        let initalValues = {}

        //get current values of fields

        formFields.forEach(item => {
            initalValues[item.key] = item.value
        })

        return (
            <React.Fragment>
                {
                    adsWallet
                }
                <button className="custom-control open_withdraw floatR" href="#">{this.props.t("Withdrawal Requests")}</button>
                <button className="floatR balance_recharge" onClick={this.recharge.bind(this)}>{Translate(this.props, "Recharge Wallet")}</button>
                <div ref={this.myRef}>
                <Form
                    className="form"
                    title={this.state.title}
                    initalValues={initalValues}
                    validators={validator}
                    submitText={!this.state.submitting ? "Submit Request" : "Submitting Request..."}
                    model={formFields}
                    {...this.props}
                    generalError={this.state.error}
                    onSubmit={model => {
                        this.onSubmit(model);
                    }}
                />
                </div>
            </React.Fragment>
        )
    }
}




const mapDispatchToProps = dispatch => {
    return {
        openToast: (message, typeMessage) => dispatch(general.openToast(message, typeMessage)),
    };
};

export default connect(null, mapDispatchToProps)(Balance);