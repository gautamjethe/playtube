import React, { Component } from "react"
import { connect } from "react-redux";
import action from '../../store/actions/general'
import axios from "../../axios-orders"

import Translate from "../../components/Translate/Index"

class Newsletter extends Component {
    constructor(props){
        super(props)
        this.state = {
            email:""
        }
    }
    submitForm = (e) => {
        e.preventDefault()
        if(this.state.submitting || !this.state.email){
            return
        }
        const pattern =  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!pattern.test( this.state.email )){
            //invalid email
            this.props.openToast(this.props.t("Please enter valid email."),'error')
           return
        }
        let formData = new FormData();
        formData.append("email", this.state.email)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/members/newsletter';
        this.setState({ submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({ error: response.data.error, submitting: false });
                } else {
                    this.setState({ submitting: false,email:"" });
                    this.props.openToast(Translate(this.props,response.data.message), "success");
                }
            }).catch(err => {
                this.setState({ submitting: false, error: err });
            });
    }
    
    render() {
        if(this.props.pageInfoData.appSettings['enable_newsletter'] != 1){
            return null
        }
        let image = "/static/images/newsletter-bg.jpg";
        if(this.props.pageInfoData.appSettings['newsletter_background_image']){
            image = this.props.pageInfoData.imageSuffix+this.props.pageInfoData.appSettings['newsletter_background_image']
        }
        return (
            <div className="newsletter-wrap newsletter-overlay" style={{ backgroundImage: "url('" + image + "')" }}>
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8 offset-lg-2 col-12">
                            <div className="newsletter">
                                <h2 className="title">{Translate(this.props,"We move fast")}</h2>
                                <p className="text">{Translate(this.props,"Send us your email, we'll make sure you never miss a thing!")}</p>
                                    <form onSubmit={this.submitForm}>
                                        <div className="newsleter-input-box">
                                            <input type="text" value={this.state.email} onChange={(e) => {this.setState({email:e.target.value})}} placeholder={Translate(this.props,"Enter your email .......")} />
                                            <button type="submit">
                                                <i className="far fa-paper-plane"></i>
                                            </button>
                                        </div>
                                    </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )

    }

}

const mapDispatchToProps = dispatch => {
    return {
        openToast: (message, typeMessage) => dispatch(action.openToast(message, typeMessage)),
    };
};

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData,
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Newsletter)