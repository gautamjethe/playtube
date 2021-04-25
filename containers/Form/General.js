import React, { Component } from "react"

import Form from '../../components/DynamicForm/Index'

import { connect } from 'react-redux';

import Validator from '../../validators';
import axios from "../../axios-orders"

import general from '../../store/actions/general';
import Translate from "../../components/Translate/Index";
import timezones  from "../../utils/timezone";


class General extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "General Settings",
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

        validator.push(
        {
            key: "email",
            validations: [
                {
                    "validator": Validator.required,
                    "message": "Email is required field"
                }
            ]
        })
        let formFields = []

        let ages = []
        ages.push({ key: 0, value: 0, label: "Select Age" })
        for (let j = 1; j < 100; j++) {
            ages.push({ key: j, label: j, value: j })
        }

        let timezone = []

        timezones.timezones.forEach(item => {
            timezone.push({ key: item.value, label: item.label, value: item.value })
        })

        if (this.props.pageInfoData.levelPermissions['member.username'] == 1) {
            validator.push({
                key: "username",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Username is required field"
                    }
                ]
            })
            formFields.push({ key: "username", label: "Username", value: this.state.member.username,isRequired:true })
        }

        formFields.push(
            
            { key: "email", label: "Email", value: this.state.member.email,isRequired:true },
            {
                key: "gender", label: "Gender", type: "select", options: [
                    {
                        value: "male", label: "Male", key: "gender_1"
                    },
                    {
                        value: "female", label: "Female", key: "gender_2"
                    }
                ],
                value: this.state.member.gender
            },
            {
                key: "age", label: "Age", type: "select", options: ages,
                value: this.state.member.age ? this.state.member.age : 0
            }
        )
            
        formFields.push(
            {
                key: "timezone", label: "Timezone", type: "select", options: timezone,
                value: this.state.member.timezone ? this.state.member.timezone : this.props.pageInfoData.appSettings["member_default_timezone"]
            }
        )
        
        

        if(this.props.pageInfoData.appSettings['video_donation'] && this.props.pageInfoData.levelPermissions['video.donation']){
            formFields.push({ key: "paypal_email", label: "Donation PayPal Email", value: this.state.member.paypal_email })
        }
        if (this.props.pageInfoData.levels && this.props.pageInfoData.loggedInUserDetails.level_id == 1 && this.state.member.level_id != 1) {
            let levels = []

            this.props.pageInfoData.levels.forEach(level => {
                levels.push({
                    value: level.level_id, label: level.title, key: "level_" + level.level_id
                })
            })

            formFields.push({
                key: "level_id", label: "Level", type: "select", options: levels,
                value: this.state.member.level_id
            })
        }
        if (this.props.pageInfoData.loggedInUserDetails.level_id == 1 && this.state.member.verificationFunctionality) {
            formFields.push({
                key: "verified", label: "Verification", type: "select", options: [
                    {
                        value: "1", label: "Verified", key: "verify_1"
                    },
                    {
                        value: "0", label: "Not Verified", key: "verify_2"
                    }
                ],
                value: this.state.member.verified
            })
        }
        if (this.props.pageInfoData.appSettings['whitelist_domain'] == 1) {
            formFields.push({ key: "whitelist_domain", type:"textarea", label: "Whitelist Domain for Privacy(enter comman seprated domain name only eg:www.xyz.com)", value: this.state.member.whitelist_domain })
        }
        formFields.push({
            key: "search",
            label: "",
            type: "checkbox",
            subtype:"single",
            options: [
                {
                    value: "1", label: "Do not display me in searches.", key: "search_1"
                }
            ],
            value: [this.state.member.search.toString()]
        })
        if(this.props.pageInfoData.appSettings['enable_comment_approve'] == 1){
            let comments = []
            comments.push({ value: "1", key: "comment_1", label: "Display automatically" })
            comments.push({ value: "0", key: "comment_0", label: "Don't display until approved" })
            formFields.push({
                key: "comments",
                label: "Comments Setting",
                type: "select",
                value:  this.state.member.autoapprove_comments.toString(),
                options: comments
            })
        }

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

export default connect(null, mapDispatchToProps)(General);