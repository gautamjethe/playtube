import React, { Component } from "react"
import { connect } from "react-redux"
import Form from '../../components/DynamicForm/Index'
import Validator from '../../validators'
import axios from "../../axios-orders"
import Player from "./Player"
import OutsidePlayer from "./OutsidePlayer"
import StartLiveStreaming from "../LiveStreaming/StartLiveStreaming"
import MediaStreaming from "../LiveStreaming/MediaLiveStreaming"
import Router from "next/router"
import Translate from "../../components/Translate/Index"

class Index extends Component {
    constructor(props) {
        super(props)
        this.state = {
            styles: {
                visibility: "hidden",
                overflow: "hidden"
            },
            fullWidth: false,
            playlist: this.props.pageInfoData.playlist,
            playlistVideos: this.props.pageInfoData.playlistVideos,
            submitting: false,
            relatedVideos: this.props.pageInfoData.relatedVideos,
            showMore: false,
            showMoreText: "See more",
            collapse: true,
            width:props.isMobile ? props.isMobile : 993,
            height:"-550px",
            adult: this.props.pageInfoData.adultVideo,
            video: this.props.pageInfoData.video,
            userAdVideo: this.props.pageInfoData.userAdVideo,
            adminAdVideo: this.props.pageInfoData.adminAdVideo,
            password: this.props.pageInfoData.password,
            logout:false
        }
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
        this.getHeight = this.getHeight.bind(this)
    }
    updateWindowDimensions() {
        this.setState({localUpdate:true, width: window.innerWidth },() => {
            this.getHeight();
        });
    }
    getHeight(){
        if($('.videoPlayer').length && $(".videoPlayerHeight").length){
            let height = (($(".videoPlayerHeight").outerWidth(true) /  1.77176216)) + "px";
            $(".player-wrapper, .video-js").css("height",height);
           
           
            $('video, iframe').css('height', height);
        }
        
    } 

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }

        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.pageInfoData.video != prevState.video || (prevState.video && nextProps.pageInfoData.video.status != prevState.video.status) || 
        (nextProps.pageInfoData.password != prevState.password) || nextProps.pageInfoData.adultVideo != prevState.adult) {
           return {
                video: nextProps.pageInfoData.video, 
                relatedVideos: nextProps.pageInfoData.relatedVideos, 
                userAdVideo: nextProps.pageInfoData.userAdVideo,
                adminAdVideo: nextProps.pageInfoData.adminAdVideo, 
                playlist: nextProps.pageInfoData.playlist, 
                playlistVideos: nextProps.pageInfoData.playlistVideos,
                password: nextProps.pageInfoData.password,
                adult: nextProps.pageInfoData.adultVideo,
                logout:false,
                changeHeight:true
            }
        } else{
            return null
        }

    }
    componentDidUpdate(prevProps,prevState){
        if(this.state.changeHeight){
            this.getHeight();
            this.setState({changeHeight:false,localUpdate:true})
        }
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
    }
    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
        this.getHeight();
        var _ = this
    }
    
    checkPassword = model => {
        if (this.state.submitting) {
            return
        }
        const formData = new FormData();
        for (var key in model) {
            formData.append(key, model[key]);
        }
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/videos/password/' + this.props.pageInfoData.videoId;
        this.setState({localUpdate:true, submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({localUpdate:true, error: response.data.error, submitting: false });
                } else {
                    this.setState({localUpdate:true, submitting: false, error: null })
                    Router.push(`/embed?videoId=${this.props.pageInfoData.videoId}`, `/embed/${this.props.pageInfoData.videoId}`)
                }
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });
    }
    mouseOut = () => {
        $(".watermarkLogo").hide()
    }
    mouseEnter = () => {
        if(this.state.video && this.state.video.status == 1){
            $(".watermarkLogo").show()
        }
    }
    
    render() {
       
        let validatorUploadImport = []
        let fieldUploadImport = []
        validatorUploadImport.push({
            key: "password",
            validations: [
                {
                    "validator": Validator.required,
                    "message": "Password is required field"
                }
            ]
        })
        fieldUploadImport.push({ key: "password", label: "", type: "password" })
        return (
            this.state.password ?
                    <Form
                        className="form"
                        generalError={this.state.error}
                        title={"Enter Password"}
                        validators={validatorUploadImport}
                        model={fieldUploadImport}
                        {...this.props}
                        submitText={this.state.submitting ? "Submit..." : "Submit"}
                        onSubmit={model => {
                            this.checkPassword(model);
                        }}
                    />
                :
                this.state.adult ?
                        <div className="adult-wrapper">
                            {Translate(this.props, 'This video contains adult content.To view this video, Turn on adult content setting from site footer.')}
                        </div>
                    :
                    <React.Fragment>
                        {
                            this.state.video && this.state.video.approve != 1 ? 
                                    <div className="generalErrors">
                                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                            {Translate(this.props,'This video still waiting for admin approval.')}
                                        </div>
                                </div>
                        : null
                        }
                        <div className="videoPlayerHeight">
                            <div className="videoPlayer" onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseOut} >
                                <React.Fragment>
                                {
                                    this.state.video.is_livestreaming && this.state.video.type == 11 ?
                                        <MediaStreaming watermarkLogoParams={{target:"_blank"}} {...this.props} viewer={this.state.video.total_viewer} height={this.state.width > 992 ? "500px" : "500px"}   custom_url={this.state.video.custom_url} streamingId={this.state.video.mediaserver_stream_id} currentTime={this.props.pageInfoData.currentTime} role="audience" imageSuffix={this.props.pageInfoData.imageSuffix} video={this.props.pageInfoData.video} {...this.props.pageInfoData.video} />
                                    :
                                    this.state.video.is_livestreaming ?
                                        <StartLiveStreaming watermarkLogoParams={{target:"_blank"}} {...this.props} viewer={this.state.video.total_viewer} height={this.state.width > 992 ? "500px" : "500px"}   custom_url={this.state.video.custom_url} channel={this.state.video.channel_name} currentTime={this.props.pageInfoData.currentTime} role="audience" imageSuffix={this.props.pageInfoData.imageSuffix} video={this.props.pageInfoData.video} {...this.props.pageInfoData.video} />
                                        :
                                    this.state.video.type == 3 || this.state.video.type == 11 ?
                                        <Player watermarkLogoParams={{target:"_blank"}} {...this.props} getHeight={this.getHeight} ended={this.videoEnd} height={this.state.width > 992 ? "500px" : "500px"} userAdVideo={this.state.userAdVideo} adminAdVideo={this.state.adminAdVideo}  playlistVideos={this.state.playlistVideos} currentPlaying={this.state.currentPlaying} imageSuffix={this.props.pageInfoData.imageSuffix} video={this.props.pageInfoData.video} {...this.props.pageInfoData.video} />
                                        :
                                        <OutsidePlayer watermarkLogoParams={{target:"_blank"}} {...this.props} liveStreamingURL={this.props.pageInfoData.liveStreamingURL} ended={this.videoEnd}  height={this.state.width > 992 ? "500px" : "500px"}  playlistVideos={this.state.playlistVideos} currentPlaying={this.state.currentPlaying} imageSuffix={this.props.pageInfoData.imageSuffix} video={this.props.pageInfoData.video}  {...this.props.pageInfoData.video} />
                                }
                                
                                </React.Fragment>
                            </div>  
                        </div>      
                    </React.Fragment>
                    
        )
    }
}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData,
    };
};

export default connect(mapStateToProps, null)(Index);