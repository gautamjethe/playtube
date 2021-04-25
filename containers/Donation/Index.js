import React from "react"
import { connect } from "react-redux";
import action from '../../store/actions/general';
import axios from "../../axios-orders"
import Translate from "../../components/Translate/Index"
import ReactDOMServer from "react-dom/server"
import Currency from "../Upgrade/Currency"
import swal from 'sweetalert'
import asyncComponent from '../../hoc/asyncComponent/asyncComponent';
const Celebrate = asyncComponent(() => {
    return import('./Celebrate');
});

class Donation extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            adsPaymentStatus: props.pageData.adsPaymentStatus,
            item: props.item,
            item_id:props.item_id,
            item_type:props.item_type,
            balance:parseFloat(props.pageInfoData.loggedInUserDetails ? props.pageInfoData.loggedInUserDetails.wallet : 0)
        }
        this.chooseOption = this.chooseOption.bind(this)
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.item_id != prevState.item_id || nextProps.item_type != prevState.item_type) {
            return { 
                id:null,
                item: nextProps.item,
                item_id:nextProps.item_id,
                item_type:nextProps.item_type,
                balance:parseFloat(nextProps.pageInfoData.loggedInUserDetails ? nextProps.pageInfoData.loggedInUserDetails.wallet : 0)
            }
        }else{
            return null
        }
    }
    componentDidMount(){
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
    onChange = () => {
        if(this.props.disabled){
            return
        }
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            const formData = new FormData()
            formData.append('id', this.props.id)

            formData.append('type', this.props.type + "s")
            let url = '/favourites'
            axios.post(url, formData)
                .then(response => {
                    if (response.data.error) {

                    } else {

                    }
                }).catch(err => {
                    //this.setState({submitting:false,error:err});
                });
        }
    }
    submitType (){
        let id = this.state.id
        let item = this.state.item.tips[id];
        if(item){
            if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
                document.getElementById('loginFormPopup').click();
                return;
            }            
            let balance = parseFloat(this.state.balance)
            let amount = parseFloat(item.amount)
            if(parseFloat(amount) > parseFloat(balance)){
                //show error
                this.props.openToast(Translate(this.props, "Your balance is low, please recharge your account."), "error");
            }else{
                const formData = new FormData()
                formData.append('id', item.tip_id)
                let url = '/send-tip'
                axios.post(url, formData)
                    .then(response => {
                        if (response.data.error) {
                            this.props.openToast(Translate(this.props, response.data.message), "error");
                        } else {
                            //increase count
                            let item = {...this.state.item}
                            let tips = item.tips
                            tips[id]['purchaseCount'] = parseInt(tips[id]['purchaseCount']) + 1
                            var _ = this
                            setTimeout(() => {
                                _.setState({celebrate:false,localUpdate:true})
                            }, 10000);
                            this.setState({localUpdate:true,tips:tips,balance:parseFloat((balance - amount)),celebrate:true},() => {
                                this.props.openToast(Translate(this.props, response.data.message), "success");
                            })
                            
                        }
                    }).catch(err => {
                        this.props.openToast(Translate(this.props, "Something went wrong, please try again later"), "error");
                    });
            }
        }
    }
    chooseOption = (id,e) => {
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
            return;
        }   
        if(this.state.item.owner_id == this.props.pageInfoData.loggedInUserDetails.user_id){
            return;
        }
        this.setState({id:id});
        swal({
            title: Translate(this.props, "Are you sure?"),
            text: Translate(this.props, "Are you sure want to give tip!"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    this.submitType();
                } else {

                }
            });
    }
    recharge = (e) => {
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
            return;
        }   
        this.setState({localUpdate:true, adsWallet: true })
    }
    walletFormSubmit = (e) => {
        e.preventDefault()
        if (!this.state.walletAmount) {
            return
        }
        this.setState({localUpdate:true, adsWallet: false })
        swal("Success", Translate(this.props, "Redirecting you to payment gateway...", "success"));
        window.location.href = "/ads/recharge?fromVideo=1&amount=" + encodeURI(this.state.walletAmount)
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
        if (this.state.adsWallet) {
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
        let perprice = {}
        perprice['package'] = { price: this.state.balance }

         let celebrate = null
         if(this.state.celebrate){
            celebrate = <Celebrate />
        }

        return (
            <React.Fragment>
                {
                    celebrate
                }
                {adsWallet}
                <div className="donationWrap">
                    <div className="donationInnr">
                        <div>
                            <div className="totalDontn">
                                <div className="icon">
                                    <span className="material-icons f18">
                                        account_balance
                                    </span>
                                </div>
                                <div className="text">
                                    {this.props.t("Wallet Balance: {{price}}",{price:ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...perprice} />)})}
                                </div>
                            </div>
                            <div className="rechargebtn">
                                <button onClick={this.recharge}>{this.props.t("Recharge Wallet")}</button>
                            </div>
                        </div>
                        {
                            this.state.item.tips.map((item,i) => {
                                let perprice = {}
                                perprice['package'] = { price: item.amount }
                                return (
                                    <div className="tipBtn" key={item.tip_id}>
                                        <button className="d-flex" onClick={this.chooseOption.bind(this,i)}>
                                            <div className="icon"><span className="material-icons text-primary">
                                                    payments
                                                </span>
                                            </div>
                                        <span>{ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...perprice} />)}</span>
                                        </button>
                                        <div className="count">{item.purchaseCount ? item.purchaseCount : 0}</div>
                                    </div>
                                )
                            })
                        }
                        

                        

                    </div>
                </div>
            </React.Fragment>
        )
    }
}
const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData,
    };
};
const mapDispatchToProps = dispatch => {
    return {
        openToast: (message, typeMessage) => dispatch(action.openToast(message, typeMessage)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Donation)
