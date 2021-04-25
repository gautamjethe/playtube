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
        }else if (nextProps.item.favourite_id != prevState.item.favourite_id) {
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
    render() {
        if (typeof this.props.favourite_count == "undefined" || this.props.pageInfoData.appSettings[`${(this.props.parentType ? this.props.parentType + "_" : "") + this.props.type + "_favourite"}`] != 1) {
            return null
        }

        return (
            this.props.pageInfoData.loggedInUserDetails && this.state.item.favourite_id ?
                    <span onClick={this.onChange} className="active" title={Translate(this.props,'Favourite')}><span className="material-icons md-18">favorite_border</span>{" " + `${ShortNumber(this.props.favourite_count ? this.props.favourite_count : 0)}`}</span>                    
                :
                    <span onClick={this.onChange} title={Translate(this.props,'Favourite')}><span className="material-icons md-18">favorite_border</span>{" " + `${ShortNumber(this.props.favourite_count ? this.props.favourite_count : 0)}`}</span>
        )
    }
}
const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};


export default connect(mapStateToProps, null)(Index)
