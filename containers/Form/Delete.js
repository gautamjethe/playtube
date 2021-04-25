import React, { Component } from "react"

import Form from '../../components/DynamicForm/Index'

import { connect } from 'react-redux';

import Validator from '../../validators';
import axios from "../../axios-orders"

import general from '../../store/actions/general';

import Router from "next/router"
import Translate from "../../components/Translate/Index";

class General extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "Delete Account",
            success: false,
            error: null,
            loading: true,
            member: props.member,
            submitting: false,
            firstLoaded: true
        }
        this.myRef = React.createRef();
    }

    componentDidMount(){
        this.props.socket.on('userDeleted',data => {
             let id = data.user_id;
             let message = data.message
             if(id == this.state.member.user_id){
                 this.props.openToast(Translate(this.props,message), "success");
                 Router.push(`/index`,`/`)
             }
        });
    }
    onSubmit = model => {
        if (this.state.submitting) {
            return
        }
        let formData = new FormData();
        for (var key in model) {
            if (model[key])
                formData.append(key, model[key]);
        }

        formData.append("user_id", this.state.member.user_id)

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/members/delete';

        this.setState({ submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({ error: response.data.error, submitting: false });
                } else {
                    
                }
            }).catch(err => {
                this.setState({ submitting: false, error: err });
            });
    };



    render() {

        let validator = []

        validator.push({
            key: "password",
            validations: [
                {
                    "validator": Validator.required,
                    "message": "Password is required field"
                }
            ]
        })
        let formFields = []

        

        formFields.push(
            { key: "password", label: "Current Password",type:"password",isRequired:true },
            
        )
        
        let initalValues = {}

        return (
            <React.Fragment>
                <div ref={this.myRef}>
                <Form
                    //key={this.state.current.id}
                    className="form"
                    title={this.state.title}
                    initalValues={initalValues}
                    validators={validator}
                    submitText={!this.state.submitting ? "Delete" : "Deleting..."}
                    model={formFields}
                    {...this.props}
                    generalError={this.state.error}
                    onSubmit={model => {
                        this.onSubmit(model);
                    }}
                />
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

export default connect(null, mapDispatchToProps)(General);