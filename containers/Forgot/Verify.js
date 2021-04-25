import React, { Component } from "react"
import general from '../../store/actions/general';

import axios from "../../axios-orders"
import Router from 'next/router'
import Link from "next/link"
import { connect } from 'react-redux';
import Translate from "../../components/Translate/Index"

class Form extends Component {
    constructor(props) {
        super(props)
        this.state = {
            password: "",
            error: null,
            confirmPassword: "",
            isSubmit: false,
        }
    }
    onChange = (type, e) => {
        if (type == "password")
            this.setState({ "password": e.target.value })
        else
            this.setState({ "confirmPassword": e.target.value })
    }
    onSubmit = (e) => {
        e.preventDefault()
        if (this.state.isSubmit) {
            return
        }
        let formData = new FormData();
        if (!this.state.password) {
            return
        }

        if (this.state.password != this.state.confirmPassword) {
            this.setState({ error: Translate(this.props, "New Password and New Confirm Password should match.") })
            return
        }

        formData.append("password", this.state.confirmPassword)
        formData.append("code", this.props.pageInfoData.code)

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/reset';

        this.setState({ isSubmit: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({ error: response.data.error, isSubmit: false });
                } else {
                    this.props.openToast(Translate(this.props, "Password Changed successfully."), "success")
                    Router.push("/")
                }
            }).catch(err => {
                this.setState({ isSubmit: false, error: "error" });
            });
    };

    render() {
        return (
            <React.Fragment>
                    <div className="titleBarTop">
                        <div className="titleBarTopBg">
                            <img src={this.props.pageData['pageInfo']['banner'] ? this.props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"} alt={this.props.t("Reset Password")} />
                        </div>
                        <div className="overlay">
                            <div className="container">
                                <div className="row">
                                    <div className="col-md-10 offset-md-1">
                                        <div className="titleHeadng">
                                            <h1>{this.props.t("Reset Password")} <i className="fas fa-sign-in-alt"></i></h1>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mainContentWrap">
                        <div className="container">
                            <div className="row">
                                <div className="col-md-10 offset-md-1">
                                    <div className="formBoxtop loginp">
                                        {
                                            <React.Fragment>
                                                <div className="form loginBox">
                                                    {
                                                        this.state.error ?
                                                            <p className="form_error" style={{ color: "red", margin: "0px", fontSize: "16px" }}>{this.state.error}</p>
                                                            : null
                                                    }
                                                    <form onSubmit={this.onSubmit.bind(this)}>
                                                        <div className="input-group">
                                                            <input className="form-control" type="password" autoComplete="off" onChange={this.onChange.bind(this, 'password')} value={this.state.password} placeholder={Translate(this.props, "New Password")} name="password" />
                                                        </div>
                                                        <div className="input-group">
                                                            <input className="form-control" type="password" autoComplete="off" onChange={this.onChange.bind(this, 'confirmPassword')} value={this.state.confirmPassword} placeholder={Translate(this.props, "Confirm Password")} name="confirmPassword" />
                                                        </div>
                                                       
                                                        <div className="input-group forgotBtnBlock">
                                                                <button className="btn btn-default btn-login" type="submit">
                                                                {
                                                                    this.state.isSubmit ?
                                                                        Translate(this.props, "Changing Password ...")
                                                                        : Translate(this.props, "Change Password")
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
            </React.Fragment>
        )
    }
}
const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};


const mapDispatchToProps = dispatch => {
    return {
        openToast: (message, typeMessage) => dispatch(general.openToast(message, typeMessage)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);
