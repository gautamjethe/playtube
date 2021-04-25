import React, { Component } from "react"

import Form from '../../components/DynamicForm/Index'

import { connect } from 'react-redux';

import Validator from '../../validators';
import axios from "../../axios-orders"

import general from '../../store/actions/general';
import Translate from "../../components/Translate/Index";


class Password extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "Change Password",
            success: false,
            error: null,
            loading: true,
            member: props.member,
            submitting: false,
            firstLoaded: true
        }
        this.myRef = React.createRef();
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

        if(model['new_password'] != model['new_confirm_password']){
            this.setState({error:"New Password and New Confirm Password should match."})
            return
        }

        formData.append("user_id", this.state.member.user_id)

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/members/password';

        this.setState({ submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({ error: response.data.error, submitting: false });
                } else {
                    this.setState({ submitting: false });
                    this.props.openToast(Translate(this.props,response.data.message), "success");
                }
            }).catch(err => {
                this.setState({ submitting: false, error: err });
            });
    };



    render() {

        let validator = []

        validator.push({
            key: "old_password",
            validations: [
                {
                    "validator": Validator.required,
                    "message": "Old Password is required field"
                }
            ]
        },
            {
                key: "new_password",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "New Password is required field"
                    }
                ]
            },
            {
                key: "new_confirm_password",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "New Confirm Password is required field"
                    }
                ]
            })
        let formFields = []

        
        formFields.push(
            { key: "old_password", label: "Old Password", type:"password",isRequired:true },
            { key: "new_password", label: "New Password",type:"password" ,isRequired:true },
            { key: "new_confirm_password", label: "New Confirm Password",type:"password" ,isRequired:true},
        )
       
        let initalValues = {}

        //get current values of fields

        formFields.forEach(item => {
            initalValues[item.key] = item.value
        })

        return (
            <React.Fragment>
                <div ref={this.myRef}>
                <Form
                    //key={this.state.current.id}
                    className="form"
                    title={this.state.title}
                    initalValues={initalValues}
                    validators={validator}
                    submitText={!this.state.submitting ? "Save Changes" : "Saving Changes..."}
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

export default connect(null, mapDispatchToProps)(Password);