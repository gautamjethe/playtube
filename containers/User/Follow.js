import React from "react"
import { connect } from "react-redux";
import axios from "../../axios-orders"
import ShortNumber from "short-number"
class Follow extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            item: props.user
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }

        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.user.follower_id != prevState.item.follower_id) {
            return { item: nextProps.user }
        } else{
            return null
        }

    }
    onChange = (e) => {
        e.preventDefault()
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            const formData = new FormData()
            if (!this.props.user.channel_id)
                formData.append('id', this.props.user.user_id)
            else if (this.props.user.channel_id)
                formData.append('id', this.props.user.channel_id)
            formData.append('type', this.props.type)
            let url = '/follow'
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
    render() {
        if(this.props.pageInfoData.appSettings['user_follow'] != 1 && this.props.type != "channels"){
           return null;
        }
        let onChange = this.onChange
        if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == (this.state.item.user_id ? this.state.item.user_id : this.state.item.owner_id)) {
            onChange = null
            if(!this.props.fromView){
                return  <a className={this.props.className ? this.props.className : "follow"} style={{ opacity: "0" }}  href="#">{this.props.title ? this.props.title : this.props.t("Followed")}</a>
            }else{
                return null
            }
        }
        return (
            this.props.pageInfoData.loggedInUserDetails && this.state.item.follower_id ?
                    !this.props.button ?
                        <a className={this.props.className ? this.props.className + " active" : "follow active"} onClick={onChange}  href="#">{this.props.title ? this.props.title : this.props.t("Followed")}</a>
                        :
                        <a className="follow active" onClick={onChange} href="#">{this.props.title ? this.props.title : this.props.t("Followed")}</a>
                :
                    !this.props.button ?
                        <a className={this.props.className ? this.props.className : "follow"} onClick={onChange} href="#">{this.props.title ? this.props.title : this.props.t("Follow")}</a>
                        :
                        <a className="follow" onClick={onChange} href="#">{this.props.title ? this.props.title : this.props.t("Follow")}</a>
        )
    }
}
const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};

export default connect(mapStateToProps, null)(Follow)