import React, { Component } from "react"

import Form from '../../components/DynamicForm/Index'

import { connect } from 'react-redux';

import Validator from '../../validators';
import axios from "../../axios-orders"

import general from '../../store/actions/general';
import Translate from "../../components/Translate/Index";
import imageCompression from 'browser-image-compression';


class Verification extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "Verification Request",
            success: false,
            error: null,
            loading: true,
            member: props.member,
            submitting: false,
            requestSend:props.member.verificationRequestSend ? props.member.verificationRequestSend : null
        }
        this.myRef = React.createRef();
    }

    onSubmit = async model => {
        if (this.state.submitting) {
            return
        }
        this.setState({ submitting: true, error: null });
        let formData = new FormData();
        for (var key in model) {
            if(key == "image" && model[key] && typeof model[key] != "string"){
                var ext = model[key].name.substring(model[key].name.lastIndexOf('.') + 1).toLowerCase();
                const options = {
                  maxSizeMB: 1,
                  maxWidthOrHeight: 1200,
                  useWebWorker: true
                }
                let compressedFile = model[key]
                if(ext != 'gif' && ext != 'GIF'){
                    try {
                    compressedFile = await imageCompression(model[key], options);
                    } catch (error) { }
                }
                formData.append(key, compressedFile,model[key].name);
              }else if(model[key] != null && typeof model[key] != "undefined")
                formData.append(key, model[key]);
        }

        formData.append("user_id", this.state.member.user_id)

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/members/verification';

        
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({ error: response.data.error, submitting: false });
                } else {
                    this.setState({ submitting: false,requestSend:response.data.message });
                    this.props.openToast(Translate(this.props,response.data.message), "success");
                }
            }).catch(err => {
                this.setState({ submitting: false, error: err });
            });
    };



    render() {
        if(this.state.requestSend){
            return (
                <div className="alert alert-success" role="alert">
                {this.props.t(this.state.requestSend)}
                </div>
            )
        }
        let validator = []
        validator.push({
            key: "image",
            validations: [
                {
                    "validator": Validator.required,
                    "message": "Image is required field"
                }
            ]
        },
            {
                key: "description",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Description is required field"
                    } 
                ]
            })
        let formFields = []




       let content = Translate(this.props,"* Please upload a copy of your valid identification in PNG or JPEG format, no larger than 3mb in size.")+"<br>"+
       Translate(this.props,"* The image must be high quality, unobstructed and uncropped.")+"<br>"+
       Translate(this.props,"* The image must show a full document page or in case of national ID photocards, both sides of the card.")+"<br>";
        

        formFields.push(
            {
                key: "res_type_1",
                type: "content",
                content: '<h6 class="custom-control" style="padding-left:0px">' + content + '</h6>'
            },
            { key: "image", label: "Please select a recent picture of your passport or id", type: "file",isRequired:true },
            { key: "description", label: "Description", type: "textarea" ,isRequired:true}
        )

        let initalValues = {}

        return (
            <React.Fragment>
                <div ref={this.myRef}>
                <Form
                    //key={this.state.current.id}
                    className="form"
                    {...this.props}
                    title={this.state.title}
                    initalValues={initalValues}
                    validators={validator}
                    submitText={!this.state.submitting ? "Submit Request" : "Submitting Request..."}
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

export default connect(null, mapDispatchToProps)(Verification);