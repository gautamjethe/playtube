import React, { Component } from "react"

import Form from '../../components/DynamicForm/Index'

import { connect } from 'react-redux';

import Validator from '../../validators';

import axios from "../../axios-orders"


import general from '../../store/actions/general';
import Translate from "../../components/Translate/Index" 
import imageCompression from 'browser-image-compression';

class Playlist extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: props.editItem ? "" : "",
            editItem: props.editItem,
            success: false,
            error: null,
            loading: props.editItem ? false : true,
            channel_id: "",
            submitting: false
        }
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
        //image
        if(model['image']){
            let image =   typeof model['image'] == "string" ? model['image'] : false
            if(image){
                formData.append('postImage',image)
            }
        }
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/post/create';
        if (this.state.editItem) {
            url = "/post/create";
            formData.append("post_id", this.state.editItem.post_id)
        } else {
            formData.append("channel_id", this.props.channel_id)
        }
        
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({ error: response.data.error, submitting: false });
                } else {
                    this.props.openToast(Translate(this.props,response.data.message), "success")
                    this.props.closePOst(response.data.postData)                    
                }
            }).catch(err => {
                this.setState({ submitting: false, error: err });
            });
    };

  
    render() {
        
        let validator = []

        if (!this.state.playlist_id) {
            validator.push({
                key: "title",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Message is required field"
                    }
                ]
            },
            {
                key: "image",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Upload Image is required field"
                    }
                ]
            })
        }
        let formFields = []
        
            formFields.push(
                { key: "title", label: "Message",type:"textarea", value: this.props.editItem ? this.props.editItem.title : "",isRequired:true },
                { key: "image", label: "Upload Image", type: "file", value: this.props.editItem && this.props.editItem.image ? this.props.imageSuffix+this.props.editItem.image : "",isRequired:true })

           
        let defaultValues = {}
        if (!this.firstLoaded) {
            formFields.forEach((elem) => {
                if (elem.value)
                    defaultValues[elem.key] = elem.value
            })
            this.firstLoaded = true
        }
        return (
            <React.Fragment>
                {
                    <Form
                        className="form"
                        title={this.state.title}
                        defaultValues={defaultValues}
                        validators={validator}
                        {...this.props}
                        generalError={this.state.error}
                        submitText={!this.state.submitting ? "Submit" : "Submit..."}
                        model={formFields}
                        onSubmit={model => {
                            this.onSubmit(model);
                        }}
                    />
                }
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

export default connect(mapStateToProps, mapDispatchToProps)(Playlist);