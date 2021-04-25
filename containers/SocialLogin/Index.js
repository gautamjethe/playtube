import React from "react";
import TwitterLogin from 'react-twitter-auth';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'
import { GoogleLogin } from 'react-google-login';
import AppleLogin from 'react-apple-login'

import config from "../../config"
import { connect } from "react-redux"
import Router from 'next/router'
import general from '../../store/actions/general';
import axios from "../../axios-site"
import Translate from "../../components/Translate/Index";
import email from "../../validators/email";
const { BroadcastChannel } = require('broadcast-channel');

class SocialLogin extends React.Component {
    constructor(props) {
        super(props)
        this.googleResponse = this.googleResponse.bind(this)
        this.twitterResponse = this.twitterResponse.bind(this)
        this.facebookResponse = this.facebookResponse.bind(this)
    }
    twitterResponse = (response) => {
        response.json().then(user => {
            if (user) {
                if (user.error) {
                    this.props.openToast(Translate(this.props,user.error), "error");
                } else {
                    const userChannel = new BroadcastChannel('user');
                    userChannel.postMessage({
                        payload: {
                            type: "LOGIN"
                        }
                    });
                    const currentPath = Router.pathname;
                    $('.loginRgtrBoxPopup').find('button').eq(0).trigger('click')
                    if (currentPath == "/" || currentPath == "/login")
                        Router.push('/')
                    else {
                        Router.push(this.state.previousUrl ? this.state.previousUrl : currentPath)
                    }
                }
            }
        });
    };
    facebookResponse = (response) => {
        const querystring = new FormData();
        let url = 'auth/facebook';
        querystring.append("access_token", response.accessToken);
        axios.post(url, querystring)
            .then(response => {
                if (response.data.error) {
                    this.props.openToast(Translate(this.props,response.data.error), "error");
                } else {
                    const currentPath = Router.pathname;
                    $('.loginRgtrBoxPopup').find('button').eq(0).trigger('click')
                    const userChannel = new BroadcastChannel('user');
                    userChannel.postMessage({
                        payload: {
                            type: "LOGIN"
                        }
                    });
                    if (currentPath == "/" || currentPath == "/login")
                        Router.push('/')
                    else {
                        Router.push(this.state.previousUrl ? this.state.previousUrl : currentPath)
                    }
                }
            }).catch(err => {
                this.props.openToast(Translate(this.props,err.message), "error");
            });
    }

    googleResponse = (response) => {
        const querystring = new FormData()
        let url = 'auth/google'
        querystring.append("access_token", response.accessToken);
        axios.post(url, querystring)
            .then(response => {
                if (response.data.error) {
                    this.props.openToast(Translate(this.props,response.data.error), "error");
                } else {
                    const currentPath = Router.pathname;
                    $('.loginRgtrBoxPopup').find('button').eq(0).trigger('click')
                    const userChannel = new BroadcastChannel('user');
                    userChannel.postMessage({
                        payload: {
                            type: "LOGIN"
                        }
                    });
                    if (currentPath == "/" || currentPath == "/login")
                        Router.push('/')
                    else {
                        Router.push(this.state.previousUrl ? this.state.previousUrl : currentPath)
                    }
                }
            }).catch(err => {
                this.props.openToast(Translate(this.props,err.message), "error");
            });
    };
    onFailure = (error) => {
    };
    appleLoginRender = (data) => {
        return (
            <a id="apple_login" onClick={data.onClick} className="circle apple" href="#"><i className="fab fa-apple"></i></a>
        );
    }
    render() {
       
        if( this.props.pageInfoData.appSettings['social_login_twitter'] != 1 && this.props.pageInfoData.appSettings['social_login_fb'] != 1  && this.props.pageInfoData.appSettings['social_login_google'] != 1 && this.props.pageInfoData.appSettings['social_login_apple'] != 1 )
            return null
            
        return (
            <React.Fragment>
                <div className="socialLogin">
                    {
                        this.props.pageInfoData.appSettings['social_login_twitter'] == 1 ? 
                    <TwitterLogin loginUrl={config.app_server + "/auth/twitter"}
                        onFailure={this.onFailure}
                        onSuccess={this.twitterResponse}
                        showIcon={false}
                        //tag="li"
                        className="menu_twitter"
                        requestTokenUrl={config.app_server + "/auth/twitter/reverse"} >
                        <a id="twitter_login" className="circle twitter" href="#">
                            <i className="fab fa-twitter"></i>
                        </a>
                    </TwitterLogin>
                    : null
                    }
                    {
                        this.props.pageInfoData.appSettings['social_login_fb'] == 1? 
                    <FacebookLogin
                        appId={this.props.pageInfoData.appSettings["fid"]}
                        autoLoad={false}
                        fields="name,email,picture,gender"
                        callback={this.facebookResponse}
                        render={renderProps => (
                            <a id="facebook_login" onClick={renderProps.onClick} className="circle facebook" href="#">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                        )} />
                        : null
                    }
                        {
                            this.props.pageInfoData.appSettings['social_login_google'] == 1 ? 
                    <GoogleLogin
                        clientId={this.props.pageInfoData.appSettings["gid"]}
                        redirectUri={`${config.app_server}/auth/google`}
                        render={renderProps => (
                            <a id="google_login" onClick={renderProps.onClick} disabled={renderProps.disabled} className="circle google" href="#">
                                <i className="fab fa-google"></i>
                            </a>
                        )}
                        onSuccess={this.googleResponse}
                        onFailure={this.onFailure}
                    />
                    : null
                    }
                    {
                        this.props.pageInfoData.appSettings['social_login_apple'] == 1 ? 
                            <AppleLogin render={this.appleLoginRender} responseType="code id_token" responseMode="form_post"  scope="name email" clientId={this.props.pageInfoData.appSettings["aid"]} redirectURI={`${config.app_server}/auth/apple`} />
                    : null
                    }


                </div>
                <div className="division">
                    <div className="line l"></div>
                    <span>or</span>
                    <div className="line r"></div>
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

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData,
    };
};

export default connect(mapStateToProps, mapDispatchToProps, null)(SocialLogin);