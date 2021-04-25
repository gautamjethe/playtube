import React, { Component } from "react"

import axios from "../../axios-orders"
import Router from 'next/router'

import SocialLogin from "../SocialLogin/Index"
import { withRouter } from 'next/router';

import { updateObject } from "../../shared/validate"
import Error from "../../containers/Error/Error";
import { connect } from 'react-redux';
import Link from "next/link"

import Translate from "../../components/Translate/Index"
const { BroadcastChannel } = require('broadcast-channel');

import LinkReact from "../../components/Link/index"
import imageCompression from 'browser-image-compression';
import timezones from '../../utils/timezone';


class Form extends Component {
    constructor(props) {
        super(props)
        this.state = {
            fields: {
                email: {
                    value: "",
                    error: null
                },
                timezone:{
                    value:props.pageInfoData.appSettings["member_default_timezone"],
                    error:null
                },
                username: {
                    value: "",
                    error: null
                },
                password: {
                    value: "",
                    error: null
                },
                first_name: {
                    value: "",
                    error: null
                },
                last_name: {
                    value: "",
                    error: null
                },
                gender: {
                    value: "male",
                    error: null
                },
                accept:{
                    value:"",
                    error:null,
                },
                subscribe:{
                    value:true,
                    error:null,
                },
                file: {
                    value: "",
                    error: null
                },
            },
            isSubmit: false,
            errors: null
        }
    }
    componentWillUnmount(){
        if($('.modal-backdrop').length)
            $(".modal-backdrop").remove()
    }
    componentDidMount(){
        $("body").removeClass("modal-open").removeClass("menu_open")
        $("#loginbtn").click(function(e){
            setTimeout(() => {
                $("body").addClass("modal-open")
            }, 1000);
        })
        $("#forgot-btn-signup").click(function(e){
            $("body").removeClass("modal-open")
        })
    }
    onChange = (e, key) => {
        const currentState = { ...this.state.fields }
        if (key == "file") {
            var url = e.target.value;
            var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
            if (e.target.files && e.target.files[0] && (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == 'PNG' || ext == 'JPEG' || ext == 'JPG' || ext == 'gif' || ext == 'GIF')) {
                this.setState({
                    fields: updateObject(this.state.fields, {
                        [key]: updateObject(this.state.fields[key], {
                            value: e.target.files[0],
                            error: null
                        })
                    })
                });
                return
            } else {
                this.setState({
                    fields: updateObject(this.state.fields, {
                        [key]: updateObject(this.state.fields[key], {
                            value: "",
                            error: Translate(this.props, "Please select png,jpeg or gif file only.")
                        })
                    })
                });

                return;
            }
        }
        this.setState({
            fields: updateObject(this.state.fields, {
                [key]: updateObject(this.state.fields[key], {
                    value: key == "subscribe" ? !this.state.fields.subscribe.value : ( key == "accept" ? !this.state.fields.accept.value : e.target.value),
                    error: null
                })
            })
        });
    };
    onSubmit = async (e) => {

        e.preventDefault()
        let isValid = true
        const currentState = { ...this.state.fields }
        if (!this.state.fields.first_name.value) {
            isValid = false
            currentState["first_name"]['error'] = Translate(this.props, "First Name should not be empty.")
        }
        if (!this.state.fields.accept.value) {
            isValid = false
            currentState["accept"]['error'] = Translate(this.props, "Please agree to the Terms of Service & Privacy Policy.")
        }
        if (!this.state.fields.email.value) {
            //email error
            currentState["email"]['error'] = Translate(this.props, "Email Id should not be empty.")
            isValid = false
        } else if (this.state.fields.email.value) {
            const pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (!pattern.test(this.state.fields.email.value)) {
                //invalid email
                currentState["email"]['error'] = Translate(this.props, "Please enter valid Email ID.")
                isValid = false
            }
        }
        if (!this.state.fields.password.value) {
            isValid = false
            currentState["password"]['error'] = Translate(this.props, "Password should not be empty.")
        }

        if (!isValid) {
            this.setState({ fields: currentState })
            return
        }

        this.setState({ isSubmit: true })

        //SEND FORM REQUEST
        const querystring = new FormData();
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };

        for (let controlName in currentState) {
            let value = currentState[controlName].value
            if (value) {
                if (controlName == "username") {
                    value = this.changedUsername(value)
                }
                if(controlName == "file"){
                    const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true 
                    }
                    var ext = value.name.substring(value.name.lastIndexOf('.') + 1).toLowerCase();
                    let compressedFile = value
                    if(ext != 'gif' && ext != 'GIF'){
                        try {
                        compressedFile = await imageCompression(value, options);
                        } catch (error) {
                        
                        }
                    }
                    querystring.append(controlName, compressedFile,value.name)
                }else{
                    querystring.append(controlName, value);
                }
            }
        }
        if(this.props.pageInfoData.code){
            querystring.append("code",this.props.pageInfoData.code);
        }
        axios.post("/signup", querystring, config)
            .then(response => {
                this.setState({ isSubmit: false })
                if (response.data.error) {
                    //error
                    this.setState({ errors: response.data.error })
                } else {
                    if(response.data.emailVerification){
                        Router.push(`/verify-account`,`/verify-account`)
                    }else{
                        const userChannel = new BroadcastChannel('user');
                        userChannel.postMessage({
                            payload: {
                                type: "LOGIN"
                            }
                        });
                        const currentPath = Router.pathname;
                        //success
                        $('#registerpop').find('.loginRgtrBoxPopup').find('button').eq(0).trigger('click')
                        if (currentPath == "/" || currentPath == "/signup")
                            Router.push('/')
                        else {
                            Router.push(Router.pathname)
                        }
                    }
                }
            }).catch(err => {
                this.setState({ errors: err })
                //error
            });
        return false
    }
    changedUsername(value) {
        value = value.replace(/[^a-z0-9]/gi, '')
        if (!value)
            value = "username"
        return value;
    }
    removeImage = (e, key) => {
        this.setState({
            fields: updateObject(this.state.fields, {
                ['file']: updateObject(this.state.fields["file"], {
                    value: "",
                    error: null
                })
            })
        });
        $("#signup_file").val("")
    }
    render() {
        let errorMessage = null;
        let errorDiv = null;
        if (this.state.errors) {
            errorMessage = this.state.errors.map((value, index, array) => {
                return <Error {...this.props} message={value.message} key={index}></Error>
            });
            errorDiv =
                <div className="form-error">
                    {errorMessage}
                </div>
        }

        var createObjectURL = (URL || webkitURL || {}).createObjectURL || function () { };
        return (
            <React.Fragment>
                {
                    this.props.pageInfoData.appSettings['member_registeration'] == 1 ?
                <SocialLogin {...this.props} />
                : null
                }   
                <div className="form loginBox">
                    <form onSubmit={e => { this.onSubmit(e); }}>
                        {
                            errorDiv
                        }
                        <div className="row">
                            <div className={`col-sm-${this.props.pageInfoData.appSettings['signup_form_lastname'] == 1 ? "6" : "12"}`}>
                                <div className="form-group">
                                    <input value={this.state.fields.first_name.value} onChange={e => { this.onChange(e, "first_name"); }} className="form-control" type="text" placeholder={Translate(this.props, "First Name")} name="first_name" />
                                    {
                                        this.state.fields.first_name.error ?
                                            <p className="form_error">{this.state.fields.first_name.error}</p>
                                            : null
                                    }
                                </div>
                            </div>
                            {
                                this.props.pageInfoData.appSettings['signup_form_lastname'] == 1 ? 
                                    <div className="col-sm-6">
                                        <div className="form-group">
                                            <input value={this.state.fields.last_name.value} onChange={e => { this.onChange(e, "last_name"); }} className="form-control" type="text" placeholder={Translate(this.props, "Last Name")} name="last_name" />
                                            {
                                                this.state.fields.last_name.error ?
                                                    <p className="form_error">{this.state.fields.last_name.error}</p>
                                                    : null
                                            }
                                        </div>
                                    </div>
                            : null
                            }
                        </div>
                        <div className="row"> 
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <input className="form-control" value={this.state.fields.email.value} type="text" onChange={e => { this.onChange(e, "email"); }} placeholder={Translate(this.props, "Email")} name="email" />
                                    {
                                        this.state.fields.email.error ?
                                            <p className="form_error">{this.state.fields.email.error}</p>
                                            : null
                                    }
                                </div>
                            </div>
                        </div>
                        {
                            this.props.pageInfoData.appSettings['signup_form_username'] == 1 ?  
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <input className="form-control" value={this.state.fields.username.value} type="text" onChange={e => { this.onChange(e, "username"); }} placeholder={Translate(this.props, "Username")} name="username" />
                                    <p className="website_signup_link">{Translate(this.props, "This will be the end of your profile link, for example:")} {`${process.env.PUBLIC_URL ? process.env.PUBLIC_URL : (window.location.protocol + "//" + window.location.host)}` + "/" + this.changedUsername(this.state.fields.username.value)}</p>
                                    {
                                        this.state.fields.username.error ?
                                            <p className="form_error">{this.state.fields.username.error}</p>
                                            : null
                                    }
                                </div>
                            </div>
                        </div>
                        : null
                        }
                        
                        {
                            this.props.pageInfoData.appSettings['signup_form_timezone'] == 1 ?  
                        <div className="row">
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <input className="form-control" value={this.state.fields.password.value} autoComplete="off" onChange={e => { this.onChange(e, "password"); }} type="password" placeholder={Translate(this.props, "Password")} name="password" />
                                        {
                                            this.state.fields.password.error ?
                                                <p className="form_error">{Translate(this.props, this.state.fields.password.error)}</p>
                                                : null
                                        }
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <select name="timezone" className="form-control" value={this.state.fields.timezone.value} onChange={e => { this.onChange(e, "timezone"); }}>
                                        {
                                            timezones.timezones.map(item => {
                                                return (
                                                    <option value={item.value} key={item.value}>{item.label}</option>
                                                )
                                            })
                                        }
                                    </select>
                                    {
                                        this.state.fields.password.error ?
                                            <p className="form_error">{Translate(this.props, this.state.fields.password.error)}</p>
                                            : null
                                    }
                                </div>
                            </div>
                        </div>
                        : 
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <input className="form-control" value={this.state.fields.password.value} autoComplete="off" onChange={e => { this.onChange(e, "password"); }} type="password" placeholder={Translate(this.props, "Password")} name="password" />
                                        {
                                            this.state.fields.password.error ?
                                                <p className="form_error">{Translate(this.props, this.state.fields.password.error)}</p>
                                                : null
                                        }
                                    </div>
                                </div>
                            </div>
                        }
                        {
                            this.props.pageInfoData.appSettings['signup_form_gender'] == 1 ?  
                        <div className="row">
                            <div className="col-sm-12">
                                <label htmlFor="file">{Translate(this.props, "Gender")}</label>
                            </div>
                                <div className="col-sm-12">
                                    <input className="genter_signup" type="radio" checked={this.state.fields.gender.value == "male"} onChange={e => { this.onChange(e, "gender"); }} id="male" value="male" /><label htmlFor="male">{Translate(this.props,'Male')}</label>
                                    <input className="genter_signup" type="radio" checked={this.state.fields.gender.value == "female"}  onChange={e => { this.onChange(e, "gender"); }} id="female" value="female" /><label htmlFor="female">{Translate(this.props,'Female')}</label>

                                </div>
                        </div>
                        : null
                        }
                        {
                            this.props.pageInfoData.appSettings['signup_form_image'] == 1 ?  
                        <div className="row">
                            <div className="col-sm-12">
                                <label htmlFor="file">{Translate(this.props, "")}</label>
                            </div>
                            {
                                !this.state.fields.file.value ?
                                <div className="col-sm-12">
                                    <input className="form-control" type="file" id="signup_file" onChange={e => { this.onChange(e, "file"); }} />

                                    {
                                        this.state.fields.file.error ?
                                            <p className="form_error">{Translate(this.props, this.state.fields.file.error)}</p>
                                            : null
                                    }
                                </div>
                                : null
                            }
                            {
                                this.state.fields.file.value ?
                                    <div className="col-sm-12">
                                        <div className="previewRgisterImg">
                                            <img src={createObjectURL(this.state.fields.file.value)} />
                                            <span className="close closePreviewImage" onClick={this.removeImage}>x</span>
                                        </div>
                                    </div>
                                    : null
                            }
                        </div>
                        : null
                        }
                        {
                            this.props.pageInfoData.appSettings['enable_newsletter'] != 2 ?
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <input id="subscribe" value={this.state.fields.subscribe.value} onChange={e => { this.onChange(e, "subscribe"); }} type="checkbox" name="subscribe" />
                                    <label htmlFor="subscribe">&nbsp;{Translate(this.props,"Subscribe to newsletter")}</label>
                                </div>
                            </div>
                        </div>
                        : null
                        }

                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <input id="accept" value={this.state.fields.accept.value} onChange={e => { this.onChange(e, "accept"); }} type="checkbox" name="accept" />
                                    <label className="signup_accept" htmlFor="accept">
		                            {Translate(this.props,'By creating your account, you agree to our ')}
                                        <LinkReact href="/terms">
                                        <a>{Translate(this.props,'Terms of Service')}</a> 
                                        </LinkReact>
                                        {" & "} <LinkReact href="/privacy"><a>{Translate(this.props,'Privacy Policy')}</a></LinkReact>
                                    </label>
                                    {
                                        this.state.fields.accept.error ?
                                            <p className="form_error">{Translate(this.props, this.state.fields.accept.error)}</p>
                                            : null
                                    }
                                </div>
                            </div>
                        </div>
                        
                        <div className="row">
                            <div className="col-sm-12">
                                <button className="btn btn-default btn-login" type="submit"
                                >
                                    {
                                        this.state.isSubmit ?
                                            Translate(this.props, "Registering ...") :
                                            Translate(this.props, "Register")
                                    }
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="forgot">
                    {
                        this.props.router.pathname == "/login" || this.props.router.pathname == "/signup"  ?
                            <Link href="/login">
                                <a >{Translate(this.props, "Already have an account login?")}</a>
                            </Link>
                            :
                            <a href="/login" id="loginbtn" data-dismiss="modal" data-target="#loginpop" data-toggle="modal">{Translate(this.props, "Already have an account login?")}</a>
                    }
                    <Link href="/forgot">
                        <a className="forgot-btn-signup">{Translate(this.props, "forgot password?")}</a>
                    </Link>
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



export default connect(mapStateToProps, null)(withRouter(Form));