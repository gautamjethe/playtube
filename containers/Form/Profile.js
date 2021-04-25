import React, { Component } from "react"

import Form from '../../components/DynamicForm/Index'

import { connect } from 'react-redux';

import Validator from '../../validators';
import axios from "../../axios-orders"

import general from '../../store/actions/general';
import Translate from "../../components/Translate/Index";


class Profile extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "Profile Settings",
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

        formData.append("user_id", this.state.member.user_id)

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        formData.append("profile",1);
        let url = '/members/edit';

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
            key: "first_name",
            validations: [
                {
                    "validator": Validator.required,
                    "message": "First Name is required field"
                }
            ]
        })
        let formFields = []

        
        formFields.push(
            { key: "first_name", label: "First Name", value: this.state.member.first_name ? this.state.member.first_name : "",isRequired:true },
            { key: "last_name", label: "Last Name", value: this.state.member.last_name ? this.state.member.last_name : "" },
            { key: "about", label: "About", value: this.state.member.about ? this.state.member.about : "",type:"textarea" },
            { key: "facebook", label: "Facebook", value: this.state.member.facebook ? this.state.member.facebook : "" },

            { key: "instagram", label: "Instagram", value: this.state.member.instagram ? this.state.member.instagram : "" },
            { key: "pinterest", label: "Pinterest", value: this.state.member.pinterest ? this.state.member.pinterest : "" },
            { key: "twitter", label: "Twitter", value: this.state.member.twitter ? this.state.member.twitter : "" },
            
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
                    {...this.props}
                    submitText={!this.state.submitting ? "Save Changes" : "Saving Changes..."}
                    model={formFields}
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

export default connect(null, mapDispatchToProps)(Profile);