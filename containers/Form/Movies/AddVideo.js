import React, { Component } from "react"
import Form from '../../../components/DynamicForm/Index'
import { connect } from 'react-redux';
import Validator from '../../../validators';
import axios from "../../../axios-orders"
import ReactDOMServer from "react-dom/server"
import Router from "next/router"
import Translate from "../../../components/Translate/Index";

class AddVideo extends Component {
    constructor(props) {
        super(props)

        this.state = {
            editItem: props.editItem,
            title: props.editItem ? "Edit Video" : "Create Video",
            season_id: props.editItem ? props.editItem.season_id : "",
            episode_id: props.editItem ? props.editItem.episode_id : "",
            success: false,
            error: null,
            seasons:props.seasons ? props.seasons : [],
            type:props.editItem ? props.editItem.type : "upload",
        }
    }
    

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else {
            return { 
                seasons:nextProps.seasons ? nextProps.seasons : [],
                editItem: nextProps.editItem,
                title: nextProps.editItem ? "Edit Video" : "Create Video",
                season_id: nextProps.editItem ? nextProps.editItem.season_id : "",
                episode_id: nextProps.editItem ? nextProps.editItem.episode_id : "",
                success: false,
                error: null,
                type:nextProps.editItem ? nextProps.editItem.type : "upload",
            }
        }
    }
    componentDidUpdate(prevProps,prevState){
        if(this.props.editItem != prevProps.editItem){
            this.empty = true
            this.firstLoaded = false
        }
    }
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
    
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
        const i = Math.floor(Math.log(bytes) / Math.log(k));
    
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    uploadMedia = (e) => {
        let res_field = e.name
       var extension = res_field.substr(res_field.lastIndexOf('.') + 1).toLowerCase();
       var allowedExtensions = ['mp4','mov','webm','mpeg','3gp','avi','flv','ogg','mkv','mk3d','mks','wmv'];
        if (allowedExtensions.indexOf(extension) === -1) 
        {
            alert(this.props.t('Invalid file Format. Only {{data}} are allowed.',{data:allowedExtensions.join(', ')}));
            return false;
        }else if( this.props.pageInfoData.appSettings['movie_upload_limit'] == 1 && e.size > parseInt(this.props.pageInfoData.appSettings['movie_upload_limit'])*1000000){
            alert(this.props.t('Maximum upload limit is {{upload_limit}}',{upload_limit:this.formatBytes(parseInt(this.props.pageInfoData.appSettings['movie_upload_limit'])*1000000)}));
            return false;
        }
        this.onSubmitUploadImport({ "upload": e })
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

        let url = '/movies/videos/' + key;
        
        this.setState({localUpdate:true, validating: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({localUpdate:true, error: response.data.error, validating: false });
                } else {
                    
                    this.setState({localUpdate:true, videoWidth: response.data.videoWidth, validating: false, videoId: response.data.videoId, success: true, videoTitle: response.data.name, videoImage: response.data.images[0] });
                    
                }
            }).catch(err => {
                this.setState({localUpdate:true, validating: false, error: err });
            });
    }
    onSubmit = model => {
        
        if (this.state.submitting || this.state.validating) {
            return
        }
        let formData = new FormData();
        for (var key in model) {
            formData.append(key, model[key]);
        }

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };

        let url = '/movies/video/create';
        if (this.state.editItem) {
            formData.append("fromEdit", 1)
            formData.append("video_id", this.state.editItem.video_id)
        }
        this.setState({localUpdate:true, submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({localUpdate:true, error: response.data.error, submitting: false });
                } else {
                    Router.push(`/dashboard?type=ads`, `/dashboard/ads`)
                }
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });
    };

    onTypeChange = (value) => {
        this.setState({localUpdate:true, type:value })
    }
    onEpisodChange = (value) => {
        this.setState({localUpdate:true, episode_id:value })
    }
    onSeasonChange = (value) => {
        this.setState({localUpdate:true, season_id:value,episode_id:"" })
    }
    imageUpload = (value) => {
        
        this.setState({imageExists:true,localUpdate:true,videoImage:null});
        
    }
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
            },
            {
                key: "type",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Type is required field"
                    }
                ]
            },

        ]

        let imageUrl = null
        if(this.state.editItem && this.state.editItem.image){
            if(this.state.editItem.image.indexOf("http://") == 0 || this.state.editItem.image.indexOf("https://") == 0){
                imageUrl = this.state.editItem.image
            }else{
                imageUrl = this.props.pageInfoData.imageSuffix+this.state.editItem.image
            }
        }

        let formFields = [
            { key: "title", label: "Title", value: this.state.editItem ? this.state.editItem.title : "" },
        ]

        let types = []
        types.push({ key: 0, value: "", label: "Please Select Video Type" })
        types.push({ key: 1, value: "embed", label: "Embed" })
        types.push({ key: 2, value: 'upload', label: "Upload Video" })
        types.push({ key: 3, value: 'direct', label: "Adaptive Stream (hls, mp4 url)" })
        types.push({ key: 4, value: 'external', label: "Outside URL" })
        
        formFields.push({
            key: "type",
            label: "Video Type",
            type: "select",
            value: this.state.type,
            onChangeFunction: this.onTypeChange,
            isRequired:true,
            options: types
        },
        
        )

        if(this.state.type == "embed"){
            validator.push({
                key: "embed_code",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Embed Code is required field"
                    }
                ]
            })
            formFields.push({
                key: "embed_code", label: "Embed Code",type:"textarea", value: this.state.editItem ? this.state.editItem.code : "",isRequired:true
            })
        }else if(this.state.type == "upload"){
            validator.push({
                key: "upload",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Video File is required field"
                    }
                ]
            })
            formFields.push({ key: "upload", label: "", type: "video", defaultText: "Drag & Drop Video File Here", onChangeFunction: this.uploadMedia,isRequired:true })
        }else if(this.state.type == "direct"){
            validator.push({
                key: "direct_url",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "URL is required field"
                    }
                ]
            })
            formFields.push({
                key: "direct_url", label: "URL", value: this.state.editItem ? this.state.editItem.code : "",isRequired:true
            })
        }else if(this.state.type == "external"){
            validator.push({
                key: "external",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "URL is required field"
                    }
                ]
            })
            formFields.push({
                key: "external", label: "URL", value: this.state.editItem ? this.state.editItem.code : "",isRequired:true
            })
        }

        validator.push({
            key: "season_id",
            validations: [
                {
                    "validator": Validator.required,
                    "message": "Season Number is required field"
                }
            ]
        })

        formFields.push({ key: "image", label: "Upload Image", type: "file", value: imageUrl,onChangeFunction:this.imageUpload })
        
        let seasons = []
        let episodes = []
        seasons.push({ key: 0, value: "", label: "Please Select Season" })
        episodes.push({ key: 0, value: "", label: "Please Select Episode" })

        this.state.seasons.forEach((item,index) => {
            seasons.push({key: item.season_id, value: item.season_id, label: `${index+1}`.length < 2 ? "S0"+(index+1) : "S"+(index+1)})
            if(item.season_id == this.state.season_id && item.episodes.length > 0){
                item.episodes.forEach((item,index) => {
                    episodes.push({key: item.episode_id, value: item.episode_id, label: `${index+1}`.length < 2 ? "E0"+(index+1) : "E"+(index+1)})
                })
            }
        })

        formFields.push({
            key: "season_id",
            label: "Season Number",
            type: "select",
            value: this.state.season_id,
            onChangeFunction: this.onSeasonChange,
            isRequired:true,
            options: seasons
        })

        validator.push({
            key: "episode_id",
            validations: [
                {
                    "validator": Validator.required,
                    "message": "Episode Number is required field"
                }
            ]
        })
        
        
        formFields.push({
            key: "episode_id",
            label: "Episod Number",
            type: "select",
            value: this.state.episode_id,
            onChangeFunction: this.onEpisodChange,
            isRequired:true,
            options: episodes
        })



        let defaultValues = {}
        if (!this.firstLoaded) {
            formFields.forEach((elem) => {
                if (elem.value)
                    defaultValues[elem.key] = elem.value
                else
                    defaultValues[elem.key] = ""
            })
            this.firstLoaded = true
        }

        if(this.state.episode_id){
            defaultValues['episode_id'] = this.state.episode_id
        }else{
            defaultValues['episode_id'] = ""
        }
        if(this.state.season_id){
            defaultValues['season_id'] = this.state.season_id
        }else{
            defaultValues['season_id'] = ""
        }
        if(this.state.type){
            defaultValues['type'] = this.state.type
        }else{
            defaultValues['type'] = 2
        }
        if(this.state.videoImage){
            defaultValues['image'] = this.state.videoImage
        }
        
        var empty = false
        if(this.empty){
            empty = true
            this.empty = false
        }
        return (
            <React.Fragment>
                
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
                    percentCompleted={this.state.percentCompleted}
                    processing={this.state.processing}
                    textProgress="Video is processing, this may take few minutes."
                    onSubmit={model => {
                        this.onSubmit(model);
                    }}
                />
                      
            </React.Fragment>
        )
    }
}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};


export default connect(mapStateToProps, null)(AddVideo);