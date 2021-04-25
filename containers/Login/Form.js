import React, { Component } from "react"

import axios from "../../axios-orders"
import Router from 'next/router'
import SocialLogin from "../SocialLogin/Index"
import {withRouter} from 'next/router';
import Link from "next/link"
import Translate from "../../components/Translate/Index"
const { BroadcastChannel } = require('broadcast-channel');

class Form extends Component{
    constructor(props){
        super(props)
        this.state = {
            email:"",
            password:"",
            passwordError:null,
            emailError:null,
            isSubmit:false,
            previousUrl:typeof window != "undefined" ? Router.asPath : "",
            verifyAgain:false,
            verifyEmail:""
        }
    }
    componentWillUnmount(){
        if($('.modal-backdrop').length)
            $(".modal-backdrop").remove()
    }
    onChange = (type,e) => {
         (type == "email" ? this.setState({"email":e.target.value}) : this.setState({"password":e.target.value}))
    }
    componentDidMount(){
        $("#signupbtn").click(function(e){
            setTimeout(() => {
                $("body").addClass("modal-open")
            }, 1000);
        })
        $("#forgot-btn").click(function(e){
            $("body").removeClass("modal-open")
        })
        $(document).on('click','.verificationLink',function(e){
            e.preventDefault();
            Router.push(`/verify-account`,`/verify-account`)
        })
    }
    onSubmit = (e) => {
        e.preventDefault();
        if(this.state.isSubmit){
            return false;
        }
        let valid = true
        let emailError = null
        if(!this.state.email){
            //email error
            emailError = Translate(this.props,"Please enter valid Email ID or Username/Password.")
            valid  = false
        }else if(this.state.email){
            // const pattern =  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            // if(!pattern.test( this.state.email )){
            //     //invalid email
            //     emailError = Translate(this.props,"Please enter valid Email ID or Username/Password.")
            //     valid  = false
            // }
        }

        if(!this.state.password){
            //email error
            emailError = Translate(this.props,"Please enter valid Email ID or Username/Password.")
            valid  = false
        }
        
        this.setState({emailError:emailError,verifyEmail:this.state.email,verifyAgain:false})

        if(valid){
            this.setState({isSubmit:true})
           //SEND FORM REQUEST
            const querystring = new FormData();
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
            querystring.append("email",this.state.email);
            querystring.append("password",this.state.password);
            
            axios.post("/login", querystring,config)
                .then(response => {
                    this.setState({isSubmit:false})
                    if(response.data.error){
                        //error
                        try{
                        this.setState({emailError:Translate(this.props,response.data.error[0].message),verifyAgain:response.data.verifyAgain})
                        }catch(err){
                            this.setState({emailError:Translate(this.props,"Please enter valid Email ID or Username/Password.")})
                        }
                    }else{
                        const currentPath = Router.pathname;
                        const userChannel = new BroadcastChannel('user');
                        userChannel.postMessage({
                            payload: {
                                type: "LOGIN"
                            }
                        });
                        //success   
                        $('.loginRgtrBoxPopup').find('button').eq(0).trigger('click')
                        if(currentPath == "/" || currentPath == "/login")
                            Router.push('/')
                        else{
                            Router.push( this.state.previousUrl ? this.state.previousUrl : Router.pathname)
                        }
                    }
                })
                .catch(err => {
                    this.setState({emailError:Translate(this.props,"Please enter valid Email ID or Username/Password.")})
                   //error
                });
        }

        return false
    }
    verification = (e) => {
        e.preventDefault();
        if(this.state.verificationResend){
            return
        }
        this.setState({verificationResend:true})
        //SEND FORM REQUEST
        const querystring = new FormData();
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        querystring.append("email",this.state.verifyEmail);
        
        axios.post("/resendVerification", querystring,config)
            .then(response => {
                this.setState({verificationResend:false})
                if(response.data.success){
                    //error
                    try{
                        this.setState({successVerification:Translate(this.props,response.data.success[0].message),verifyAgain:false,emailError:null})
                    }catch(err){
                        
                    }
                }else{
                    
                }
            })
            .catch(err => {
                
                //error
            });
    }
    render(){
        return (
            <React.Fragment>
                {
                        this.props.pageData.appSettings['member_registeration'] == 1 ? 
                <SocialLogin {...this.props} />
                : null
                }
                <div className="form loginBox">
                     {
                        this.state.successVerification ? 
                            <p className="form_error" style={{color: "green",margin: "0px",fontSize: "16px"}}>{this.state.successVerification}</p>
                        : null
                    }
                    {
                        this.state.emailError ? 
                        <p className="form_error" style={{color: "red",margin: "0px",fontSize: "16px"}}>{this.state.emailError}</p>
                    : null
                    }
                    {
                        this.state.verifyAgain ? 
                            <p className="form_error" style={{color: "green",margin: "0px",fontSize: "16px"}}>
                                {
                                    <a href="#" onClick={this.verification}>
                                        {
                                            this.props.t("Click here")
                                        }
                                    </a>
                                    
                                }
                                {
                                    this.props.t(" to resend verification email.")
                                }
                            </p>
                        : null
                    }
                    <form onSubmit={this.onSubmit.bind(this)}>
                        <div className="input-group">
                            <input className="form-control" type="text" onChange={this.onChange.bind(this,'email')} value={this.state.email} placeholder={Translate(this.props,"Email / Username")} name="email" />
                            
                        </div>
                        <div className="input-group">
                            <input className="form-control" autoComplete="off" type="password" onChange={this.onChange.bind(this,'password')} value={this.state.password} placeholder={Translate(this.props,"Password")}
                                name="password" />
                                
                        </div>
                        <div className="input-group">
                            <button className="btn btn-default btn-login" type="submit">
                                {
                                    this.state.isSubmit ? 
                                    Translate(this.props,"Login ...")
                                        : Translate(this.props,"Login")
                                }
                            </button>
                        </div>
                    </form>
                </div>
                <div className="forgot">
                    {
                        this.props.pageData.appSettings['member_registeration'] == 1 ? 
                        this.props.router.pathname == "/login" || this.props.router.pathname == "/signup" ? 
                            <Link href="/signup">
                                <a>{Translate(this.props,"create an account?")}</a>
                            </Link>
                        : 
                        <a href="/signup" data-dismiss="modal" data-target="#registerpop" data-toggle="modal" id="signupbtn">{Translate(this.props,"create an account?")}</a>
                        : null
                    }
                    <Link href="/forgot">
                        <a className="forgot-btn">{Translate(this.props,"forgot password?")}</a>
                    </Link>
                </div>
            </React.Fragment>
        )
    }
}
export default withRouter(Form)