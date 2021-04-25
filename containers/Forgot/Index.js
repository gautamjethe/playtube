import React, { Component } from "react"

import axios from "../../axios-orders"
import Router from 'next/router'
import { withRouter } from 'next/router';
import Link from "next/link"
import Translate from "../../components/Translate/Index"

class Form extends Component {
    constructor(props) {
        super(props)
        this.state = {
            email: "",
            emailError: null,
            isSubmit: false,
            previousUrl: typeof window != "undefined" ? Router.asPath : "",
            successMessage: null
        }
    }
    onChange = (e) => {
        this.setState({ "email": e.target.value })
    }
    onSubmit = (e) => {
        e.preventDefault();
        if (this.state.isSubmit) {
            return false;
        }
        let valid = true
        let emailError = null
        if (!this.state.email) {
            //email error
            emailError = Translate(this.props, "Please enter valid Email Address.")
            valid = false
        } else if (this.state.email) {
            const pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (!pattern.test(this.state.email)) {
                //invalid email
                emailError = Translate(this.props, "Please enter valid Email Address.")
                valid = false
            }
        }
        this.setState({ emailError: emailError })
        if (valid) {
            this.setState({ isSubmit: true })
            //SEND FORM REQUEST
            const querystring = new FormData();
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
            querystring.append("email", this.state.email);
            axios.post("/forgot", querystring, config)
                .then(response => {
                    this.setState({ isSubmit: false })
                    if (response.data.error) {
                        //error
                        this.setState({ emailError: Translate(this.props, "A user account with that email was not found.") })
                    } else {
                        this.setState({ emailError: null, successMessage: Translate(this.props, "You have been sent an email with instructions how to reset your password. If the email does not arrive within several minutes, be sure to check your spam or junk mail folders.") })
                    }
                })
                .catch(err => {
                    this.setState({ emailError: Translate(this.props, "A user account with that email was not found.") })
                    //error
                });
        }
        return false
    }
    render() {
        return (
            <React.Fragment>
                    <div className="titleBarTop">
                        <div className="titleBarTopBg">
                            <img src={this.props.pageData['pageInfo']['banner'] ? this.props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"} alt={this.props.t("Forgot Password")} />
                        </div>
                        <div className="overlay">
                            <div className="container">
                                <div className="row">
                                    <div className="col-md-8 offset-md-2">
                                        <div className="titleHeadng">
                                            <h1>{this.props.t("Forgot Password")} <i className="fas fa-sign-in-alt"></i></h1>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mainContentWrap">
                        <div className="container">
                            <div className="row">
                                <div className="col-md-8 offset-md-2">
                                    <div className="formBoxtop loginp">
                                    <div className="loginformwd">
                                        {
                                            this.state.successMessage ?
                                                <p className="form_error" style={{ color: "green", margin: "0px", fontSize: "16px" }}>{this.state.successMessage}</p>
                                                :
                                                <React.Fragment>
                                                    <div className="form loginBox">
                                                        <p>{Translate(this.props, "If you cannot login because you have forgotten your password, please enter your email address in the field below.")}</p>
                                                        {
                                                            this.state.emailError ?
                                                                <p className="form_error" style={{ color: "red", margin: "0px", fontSize: "16px" }}>{Translate(this.props,this.state.emailError)}</p>
                                                                : null
                                                        }
                                                        <form onSubmit={this.onSubmit.bind(this)}>
                                                            <div className="input-group">
                                                                <input className="form-control" type="text" onChange={this.onChange.bind('email')} value={this.state.email} placeholder={Translate(this.props, "Email Address")} name="email" />
                                                            </div>
                                                            <div className="input-group forgotBtnBlock">
                                                                <button className="btn btn-default btn-login" type="submit">
                                                                    {
                                                                        this.state.isSubmit ?
                                                                            Translate(this.props, "Sending Email ...")
                                                                            : Translate(this.props, "Send Email")
                                                                    }
                                                                </button> {this.props.t("or")} <Link href="/" ><a href="/">{Translate(this.props, "cancel")}</a></Link>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </React.Fragment>
                                        }
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </React.Fragment>
        )
    }
}
export default withRouter(Form)