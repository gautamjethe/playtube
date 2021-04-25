import React, { Component } from "react"
import Breadcrum from "../../components/Breadcrumb/Form"
import Form from '../../components/DynamicForm/Index'
import { connect } from 'react-redux';
import Validator from '../../validators';
import axios from "../../axios-orders"
import Router from "next/router"
import { AudioContext,decodeAudioData } from 'standardized-audio-context';

class Audio extends Component {
    constructor(props) {
        super(props)

        this.state = {
            editItem: props.pageInfoData.editItem,
            title: props.pageInfoData.editItem ? "Edit Audio" : "Create Audio",
            privacy: props.pageInfoData.editItem ? props.pageInfoData.editItem.view_privacy : "everyone",
            chooseType:props.pageInfoData.editItem ? "audio" : null,
            success: false,
            error: null,
        }
        this.myRef = React.createRef();
    }
    

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else {
            return { 
                editItem: nextProps.pageInfoData.editItem,
                title: nextProps.pageInfoData.editItem ? "Edit Audio" : "Create Audio",
                privacy: nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.view_privacy : "everyone",
                success: false,
                error: null,
            }
        }
    }
    componentDidUpdate(prevProps,prevState){
        if(this.props.editItem != prevProps.editItem){
            this.empty = true
            this.firstLoaded = false
            this.myRef = React.createRef();
        }
    }

    uploadMedia = (e) => {
        let res_field = e.name
       var extension = res_field.substr(res_field.lastIndexOf('.') + 1).toLowerCase();
       var allowedExtensions = ['mp3'];
        if (allowedExtensions.indexOf(extension) === -1) 
        {
            alert(this.props.t('Invalid file Format. Only {{data}} are allowed.',{data:allowedExtensions.join(', ')}));
            return false;
        }
        this.onSubmitUploadImport({ "upload": e })
    }
    onChangePrivacy = (value) => {
        this.setState({localUpdate:true, privacy: value })
    }
    onSubmitUploadImport = (model) => {
        if (this.state.validating) {
            return
        }
        const formData = new FormData();
        for (var key in model) {
            
                formData.append(key, model[key]);
        }
        

        var config = {};

        if(key == "upload"){
            config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
                    this.setState({localUpdate:true,percentCompleted:percentCompleted,processing:percentCompleted == 100 ? true : false})
                }
            };
        }else{
            config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
        }

        let url = '/audio/upload';
        if (this.state.isEdit) {
            url = "/audio/create/" + this.state.isEdit;
        }
        this.setState({localUpdate:true, validating: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({localUpdate:true, error: response.data.error, validating: false });
                } else {
                    
                    this.setState({localUpdate:true, validating: false, audioId: response.data.audioId, success: true, audioTitle: response.data.name,chooseType:"audio",audio_url:response.data.audio_url },() => {
                        this.createPeakForm()
                    });
                    
                }
            }).catch(err => {
                this.setState({localUpdate:true, validating: false, error: err });
            });
    }
    
    async createPeakForm(){
        let request = new XMLHttpRequest();
        request.open('GET', this.state.audio_url, true);
        request.responseType = 'arraybuffer';

        request.addEventListener('load',async  () => {
            let nativeAudioContext = new AudioContext();
            const audioBuffer = await decodeAudioData(nativeAudioContext, request.response);
            let channelData = audioBuffer.getChannelData(0);
            let peaks = this.extractPeaks(channelData);
            this.setState({localUpdate:true,peaks: peaks })
        });
        request.send();
    }
    extractPeaks (channelData) {
        let peaks = [];
        const step = Math.ceil(channelData.length / 700);
        for (let i = 0; i < 700; i += 2) {
          let min = 1.0;
          let max = -1.0;
    
          for (let j = 0; j < step; j += 500) {
            let peak = channelData[(i * j) + j];
            if (peak < min) {
              min = peak;
            } else if (peak > max) {
              max = peak;
            }
    
            peaks.push([i, (1 + min) * 50, 1, Math.max(1, (max - min) * 50)]);
          }
        }    
        return JSON.stringify(peaks);
      }
    onSubmit = model => {
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
            return false;
        }
        if (this.state.submitting) {
            return
        }
        let formData = new FormData();
        for (var key in model) {
            if(key == "release_date"){
                if(model[key]){
                    formData.append(key, new Date(model[key]).toJSON().slice(0,10));
                }
            }else
                formData.append(key, model[key]);
        }

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };

        let url = '/audio/create'; 
        if (this.state.editItem) {
            formData.append("fromEdit", 1)
            formData.append("audio_id", this.state.editItem.audio_id)
        }
        if(this.state.audioId){
            formData.append("audio_id",this.state.audioId)
        }
        if(this.state.peaks){
            //formData.append("peaks",this.state.peaks);
        }
        this.setState({localUpdate:true,localUpdate:true, submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({localUpdate:true,localUpdate:true, error: response.data.error, submitting: false });
                } else {
                    if(!this.state.editItem && this.state.peaks){
                        let formData = new FormData();
                        const config = {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            }
                        };
                        formData.append("audio_id",this.state.audioId)
                        formData.append("peaks",this.state.peaks);
                        axios.post("/audio/peak-data", formData, config)
                        .then(response1 => {
                            Router.push(`/audio?audioId=${response.data.custom_url}`, `/audio/${response.data.custom_url}`)
                        })
                    }else{
                        Router.push(`/audio?audioId=${response.data.custom_url}`, `/audio/${response.data.custom_url}`)
                    }
                    
                }
            }).catch(err => {
                this.setState({localUpdate:true,localUpdate:true, submitting: false, error: err });
            });
    };
    
    render() {
        
        let validator = [
            {
                key: "title",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Title is required field"
                    }
                ]
            }
        ]

        let formFields = [
            { key: "title", label: "Title", value: this.state.editItem ? this.state.editItem.title : "" },
            { key: "description", label: "Description", type: "textarea", value: this.state.editItem ? this.state.editItem.description : "" },
            { key: "release_date",type:"date", label: "Relase Date", value: this.state.editItem && this.state.editItem.release_date && this.state.editItem.release_date != "" ? new Date(this.state.editItem.release_date.toString()) : "" },
        ]

        let imageUrl = null
        if(this.state.editItem && this.state.editItem.image){
            if(this.state.editItem.image.indexOf("http://") == 0 || this.state.editItem.image.indexOf("https://") == 0){
                imageUrl = this.state.editItem.image
            }else{
                imageUrl = this.props.pageInfoData.imageSuffix+this.state.editItem.image
            }
        }
        validator.push(
            {
                key: "image",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Image is required field"
                    }
                ]
            }
        )
        formFields.push({ key: "image", label: "Upload Audio Image", type: "file", value: imageUrl })
        
        let validatorUploadImport = []
        let fieldUploadImport = []
        if(!this.state.editItem) {
            
            validatorUploadImport.push({
                key: "audio",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Upload audio is required field."
                    }
                ]
            })
            fieldUploadImport.push({ key: "audio", label: "", type: "audio", defaultText: "Drag & Drop Audio File Here", onChangeFunction: this.uploadMedia })
        }


        let privacyOptions = [
            {
                value: "everyone", label: "Anyone", key: "everyone"
            },
            {
                value: "onlyme", label: "Only me", key: "onlyme"
            },
            {
                value: "password", label: "Only people with password", key: "password"
            },
            {
                value: "link", label: "Only to people who have video link", key: "link"
            }
        ]

        if (this.props.pageInfoData.appSettings.user_follow == "1") {
            privacyOptions.push({
                value: "follow", label: "Only people I follow", key: "follow"
            })
        }

        formFields.push({
            key: "privacy",
            label: "Privacy",
            type: "select",
            value: this.state.editItem ? this.state.editItem.view_privacy : "everyone",
            onChangeFunction: this.onChangePrivacy,
            options: privacyOptions
        })
        if (this.state.privacy == "password") {
            formFields.push({
                key: "password", label: "Password", 'type': "password", value: this.state.editItem ? this.state.editItem.password : "",isRequired:true
            })
            validator.push({
                key: "password",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Password is required field"
                    }
                ]
            })
        }

        let defaultValues = {}
        if (!this.firstLoaded) {
            formFields.forEach((elem) => {
                if (elem.value)
                    defaultValues[elem.key] = elem.value
                else
                    defaultValues[elem.key] = ""
            })

            if(this.state.audioTitle) {
                if (this.state.videoTitle) {
                    defaultValues['title'] = this.state.audioTitle
                }               
            }
            this.firstLoaded = true
        }

        var empty = false
        if(this.empty){
            empty = true
            this.empty = false
        }
        return (
            <React.Fragment>
                {
                    this.state.chooseType ? 
                        <React.Fragment>
                            <Breadcrum {...this.props}  image={this.props.pageData['pageInfo']['banner'] ? this.props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"} title={`${this.state.editItem ? "Edit" : "Create"} Audio`} />          
                            <div className="mainContentWrap">
                                <div className="container">
                                <div className="row">
                                    <div className="col-md-12">
                                    <div className="formBoxtop loginp content-form" ref={this.myRef}>
                                        <Form
                                            empty={empty}
                                            //key={this.state.current.id}
                                            className="form"
                                            {...this.props}
                                            //title={this.state.title}
                                            defaultValues={defaultValues}
                                            validators={validator}
                                            generalError={this.state.error}
                                            submitText={!this.state.submitting ? "Submit" : "Submit..."}
                                            model={formFields}
                                            onSubmit={model => {
                                                this.onSubmit(model);
                                            }}
                                        />
                                    </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                        </React.Fragment>
                : <div className="videoBgWrap" ref={this.myRef}>
                    <React.Fragment>
                        <Form
                            className="form"
                            videoKey="audio"
                            generalError={this.state.error}
                            title="Upload Audio"
                            validators={validatorUploadImport}
                            model={fieldUploadImport}
                            empty={empty}
                            submitText={!this.state.submitting ? "Submit" : "Submit..."}
                            {...this.props}
                            percentCompleted={this.state.percentCompleted}
                            processing={this.state.processing}
                            textProgress="Audio is processing, this may take few minutes."
                            submitHide={true}
                            loading={this.state.validating ? true : false}
                        />
                    </React.Fragment>

                </div>
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


export default connect(mapStateToProps, null)(Audio);