import React, { Component } from "react"

import Form from '../../components/DynamicForm/Index'

import { connect } from 'react-redux';

import Validator from '../../validators';

import axios from "../../axios-orders"


import LoadMore from "../LoadMore/Index"
import general from '../../store/actions/general';
import Breadcrum from "../../components/Breadcrumb/Form"
import Router from "next/router"
import Translate from "../../components/Translate/Index" 
import imageCompression from 'browser-image-compression';

class Playlist extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: props.pageInfoData.editItem ? "Edit Playlist" : "",
            editItem: props.pageInfoData.editItem,
            success: false,
            error: null,
            loading: props.pageInfoData.editItem ? false : true,
            playlists: [],
            playlist_id: "",
            submitting: false
        }
        this.myRef = React.createRef();
        this.onPlaylistChange = this.onPlaylistChange.bind(this)
    }
    componentDidMount() {
        if (this.state.editItem) {
            return
        }
        this.setState({ loading: true })
        const formData = new FormData()
        formData.append('video_id', this.props.video_id)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        axios.post("/playlist-video-check", formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({ loading: false, error: response.data.error });
                } else {
                    this.setState({ loading: false, playlists: response.data.playlists })
                }
            }).catch(err => {
                this.setState({ loading: false, error: err });
            });
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
                formData.append('playlistImage',image)
            }
        }
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/playlists/create';
        if (this.state.editItem) {
            url = "/playlists/create";
            formData.append("playlist_id", this.state.editItem.playlist_id)
        } else {
            formData.append("video_id", this.props.video_id)
        }
        
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({ error: response.data.error, submitting: false });
                } else {
                    
                    if (this.state.editItem) {
                        Router.push(`/playlist?playlistId=${response.data.custom_url}`,`/playlist/${response.data.custom_url}`)
                        this.props.openToast(Translate(this.props,response.data.message), "success");
                    } else{
                        this.props.openPlaylist(false)
                        this.props.openToast(Translate(this.props,response.data.message), "success")
                    }
                }
            }).catch(err => {
                this.setState({ submitting: false, error: err });
            });
    };

    onPlaylistChange = (id) => {
        this.setState({ playlist_id: id })
    }

    render() {
        if (this.state.loading) {
            return <LoadMore loading={true} />
        }
        let validator = []

        if (!this.state.playlist_id) {
            validator.push({
                key: "title",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Title is required field"
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
        }
        let formFields = []
        if (!this.state.editItem) {
            let playlists = [{ key: "0", label: "Create New Playlist", value: "" }]
            this.state.playlists.forEach(res => {
                playlists.push({ key: res.playlist_id, label: res.title, value: res.playlist_id })
            })
            formFields.push({
                key: "playlist_id",
                label: "Playlist",
                type: "select",
                onChangeFunction: this.onPlaylistChange,
                options: playlists
            })
        }
        if (!this.state.playlist_id) {
            formFields.push(
                { key: "title", label: "Title", value: this.props.pageInfoData.editItem ? this.props.pageInfoData.editItem.title : "",isRequired:true },
                { key: "description", label: "Description", type: "textarea", value: this.props.pageInfoData.editItem ? this.props.pageInfoData.editItem.description : "",isRequired:true },
                { key: "image", label: "Upload Image", type: "file", value: this.props.pageInfoData.editItem && this.props.pageInfoData.editItem.image ? this.props.pageInfoData.imageSuffix+this.props.pageInfoData.editItem.image : "" })

            if (this.props.pageInfoData.appSettings.playlist_adult == "1") {
                formFields.push({
                    key: "adult",
                    subtype:"single",
                    label: "",
                    value: [this.props.pageInfoData.editItem && this.props.pageInfoData.editItem.adult == 1 ? "1" : "0"],
                    type: "checkbox",
                    options: [
                        {
                            value: "1", label: "Mark Playlist as Adult", key: "adult_1"
                        }
                    ]
                })
            }
            if(this.props.pageInfoData.appSettings['enable_comment_approve'] == 1){
                let comments = []
                comments.push({ value: "1", key: "comment_1", label: "Display automatically" })
                comments.push({ value: "0", key: "comment_0", label: "Don't display until approved" })
                formFields.push({
                    key: "comments",
                    label: "Comments Setting",
                    type: "select",
                    value: this.props.pageInfoData.editItem ? this.props.pageInfoData.editItem.autoapprove_comments.toString() : "1",
                    options: comments
                })
            }
            formFields.push({
                key: "private",
                label: "",
                subtype:"single",
                value: [this.props.pageInfoData.editItem && this.props.pageInfoData.editItem.private == 1 ? "1" : "0"],
                type: "checkbox",
                options: [
                    {
                        value: "1", label: "Mark Playlist as Private", key: "private_1"
                    }
                ]
            })
        }
        let defaultValues = {}
        if (!this.firstLoaded) {
            formFields.forEach((elem) => {
                if (elem.value)
                    defaultValues[elem.key] = elem.value
            })
            this.firstLoaded = true
        }
        if(!this.state.editItem)
            defaultValues["playlist_id"] = this.state.playlist_id
        return (
            <React.Fragment>
                {
                    this.state.editItem ?
                    <React.Fragment>
                        <Breadcrum {...this.props}  image={this.props.pageData['pageInfo']['banner'] ? this.props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"} title={Translate(this.props,`${this.state.editItem ? "Edit" : ""} Playlist`)} />
                        <div className="mainContentWrap">
                            <div className="container">
                            <div className="row">
                                <div className="col-md-12">
                                <div className="formBoxtop loginp content-form" ref={this.myRef}>
                                    <Form
                                        className="form"
                                        //title={this.state.title}
                                        defaultValues={defaultValues}
                                        validators={validator}
                                        {...this.props}
                                        submitText={!this.state.submitting ? "Submit" : "Submitting..."}
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
                    :
                    <div ref={this.myRef}>
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
const mapDispatchToProps = dispatch => {
    return {
        openPlaylist: (open) => dispatch(general.openPlaylist(open, 0)),
        openToast: (message, typeMessage) => dispatch(general.openToast(message, typeMessage)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Playlist);