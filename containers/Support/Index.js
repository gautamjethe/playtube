import React from "react"
import { connect } from "react-redux";
import Translate from "../../components/Translate/Index"
import ReactDOMServer from "react-dom/server"
import Currency from "../Upgrade/Currency"
import swal from 'sweetalert'

class Index extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            item: props.item,
            item_type:props.item_type,
            item_id:props.item_id,
            channelPaymentStatus: props.pageData.channelPaymentStatus,
            isSupported:props.pageInfoData.userSupportChannel
        }
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(nextProps.item != prevState.item){
            return {item:nextProps.item,item_type:nextProps.item_type}
        } else{
            return null
        }
    }
    componentDidMount(){
        if (this.state.channelPaymentStatus) {
            if (this.state.channelPaymentStatus == "success") {
                swal("Success", Translate(this.props, "Channel Support subscription done successfully.", "success"));
            } else if (this.state.channelPaymentStatus == "fail") {
                swal("Error", Translate(this.props, "Something went wrong, please try again later", "error"));
            } else if (this.state.channelPaymentStatus == "cancel") {
                swal("Error", Translate(this.props, "You have cancelled the Channel Support subscription.", "error"));
            }
        }
    }
    submitType = () => {
        swal("Success", Translate(this.props, "Redirecting you to payment gateway...", "success"));
        window.location.href = "/support/"+this.state.item_id+"/"+this.state.item_type;
    }
    openSupportForm = (e) => {
        e.preventDefault();
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        }else if(this.state.isSupported){
            swal("Success", Translate(this.props, "You are already supporting this channel.", "success"));
        } else {
            if(this.state.item.owner_id == this.props.pageInfoData.loggedInUserDetails.user_id){
                return;
            }
            swal({
                title: Translate(this.props, "Are you sure?"),
                text: Translate(this.props, "Are you sure want to support!"),
                icon: "warning",
                buttons: true,
                dangerMode: true,
            })
            .then((allowed) => {
                if (allowed) {
                    this.submitType();
                } else {

                }
            });
        }
    }
    render() {
        if(parseFloat(this.state.item.channel_subscription_amount) <= 0){
            return null
        }
        let perprice = {}
        perprice['package'] = { price: parseFloat(this.state.item.channel_subscription_amount).toFixed(2) }
        let amount = this.props.t("Support: Pay {{price}} per month",{price:ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...perprice} />)})
        return (
            <a className={"active follow fbold"}  href="#" onClick={this.openSupportForm}>{amount}</a>
        )
    }
}
const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};


export default connect(mapStateToProps, null)(Index)
