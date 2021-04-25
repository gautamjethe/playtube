import React from "react"
import { connect } from "react-redux";

import ShortNumber from "short-number"

import axios from "../../axios-orders"
import Translate from "../../components/Translate/Index"

class Index extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            item: props.item
        }
    }
   
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.item.like_dislike != prevState.item.like_dislike) {
            return { item: nextProps.item }
        }else{
            return null
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
            formData.append('action', 'dislike')
            let url = '/likes'
            axios.post(url, formData)
                .then(response => {

                }).catch(err => {
                    //this.setState({submitting:false,error:err});
                });
        }
    }
    render() {
        if (this.props.type != "channel_post" && (typeof this.props.dislike_count == "undefined" || this.props.pageInfoData.appSettings[`${(this.props.parentType ? this.props.parentType + "_" : "") + this.props.type + "_dislike"}`] != 1)) {
            return null
        }
        return (
            this.props.pageInfoData.loggedInUserDetails && this.state.item.like_dislike == "dislike" ?
                    <span onClick={this.onChange} className="active" title={Translate(this.props,'Dislike')}><span className="material-icons-outlined md-18">thumb_down</span>{" " + `${ShortNumber(this.props.dislike_count ? this.props.dislike_count : 0)}`}</span>                    
                :
                    <span onClick={this.onChange} title={Translate(this.props,'Dislike')}><span className="material-icons-outlined md-18">thumb_down</span>{" " + `${ShortNumber(this.props.dislike_count ? this.props.dislike_count : 0)}`}</span>
                    
        )
    }
}
const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};


export default connect(mapStateToProps, null)(Index)
