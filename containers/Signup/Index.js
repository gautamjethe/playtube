import React, { Component } from "react"

import Form from "./Form"

const Signup = (props) => {
    return (
        <React.Fragment>
                <div className="titleBarTop">
                    <div className="titleBarTopBg">
                        <img src={props.pageData['pageInfo']['banner'] ? props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"} alt={props.t("Signup")} />
                    </div>
                    <div className="overlay">
                        <div className="container">
                            <div className="row">
                                <div className="col-md-8 offset-md-2">
                                    <div className="titleHeadng">
                                        <h1>{props.t("Signup")} <i className="fas fa-sign-in-alt"></i></h1>
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
                                <div className="formBoxtop registerp">
                                <div className="loginformwd">
                                    <Form {...props} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        </React.Fragment>
    )
}

export default Signup