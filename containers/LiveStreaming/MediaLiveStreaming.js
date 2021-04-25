import React from "react"
import * as actions from '../../store/actions/general';
import Translate from "../../components/Translate/Index"
import axios from "../../axios-orders"
import ShortNumber from "short-number"
import SocialShare from "../SocialShare/Index"
import { connect } from 'react-redux';
import Chat from "./Chat"
import Link from "../../components/Link"
import ToastMessage from "../ToastMessage/Index"
import ToastContainer from "../ToastMessage/Container"
import Router from "next/router"
import config from "../../config"

class Index extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            streamingId:props.streamingId,
            allow_chat:props.allow_chat ? props.allow_chat : 1,
            like:props.like_count ? props.like_count : 0,
            dislike:props.dislike_count ? props.dislike_count : 0,
            randNumber:Math.floor( Math.random() * (99999999 - 9999) + 9999 ),
            user_id:props.pageInfoData.loggedInUserDetails ? props.pageInfoData.loggedInUserDetails.user_id : 0,
            title:props.title,
            image:props.image,
            allowedTime: props.allowedTime ? props.allowedTime : 0,
            currentTime: props.currentTime ? props.currentTime : 0,
            channel:props.channel,
            role:props.role, 
            custom_url:props.custom_url,
            video:props.video,
            video_id:props.video_id,
            streamleave:false,
            viewer:props.viewer ? props.viewer : 0,           
            comments:[],
            videoMuted:false,
            audioMuted:false,
            streamType:props.streamType,
            streamToken:props.streamToken,
            iframeSRC:""
        }
        this.timer = this.timer.bind(this)
        this.finish = this.finish.bind(this)
        this.onUnload = this.onUnload.bind(this)
        // this.CameraAudio = this.CameraAudio.bind(this)
        // this.changeCamera = this.changeCamera.bind(this)
        this.iframeLoaded = this.iframeLoaded.bind(this)
        this.receiveMessage = this.receiveMessage.bind(this)
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.streamId && nextProps.streamId != prevState.streamId) {
            return {streamToken:nextProps.streamToken,streamType:nextProps.streamType,streamingId:nextProps.streamingId, currentTime: nextProps.currentTime,  role: nextProps.role, custom_url: nextProps.custom_url,video:nextProps.video,video_id:nextProps.video_id,viewer:nextProps.viewer,comments:nextProps.comments }
        } else{
            return null
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if(this.props.streamId != prevProps.streamId){
            if(this.timerID)
                clearInterval(this.timerID);
            if(this.timerHostUpdate)
                clearInterval(this.timerHostUpdate)
           
            this.createAuthToken()
            this.updateViewer("delete",prevProps.custom_url)
        }
    }
    onUnload = () => {
        this.props.socket.emit('leaveRoom', {streamId:this.state.streamingId,custom_url:this.state.custom_url})
        this.props.socket.disconnect();
        if(this.state.role == "host"){
            this.finish()
        }
    }
    createAuthToken = () => {
        this.createVideoStreaming();
    }
    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.onUnload);
        if(this.timerID)
            clearInterval(this.timerID);
        if(this.timerHostUpdate)
            clearInterval(this.timerHostUpdate)
        if(this.state.role == "host"){
            this.finish()
        }
        this.props.socket.disconnect();
    }
    
    createVideoStreaming = async () => {
        if(this.state.role == "host"){
            if(parseInt(this.props.pageInfoData.levelPermissions['livestreaming.duration'],10) != 0){
                this.props.openToast(this.props.t("You can go live for {{duration}} minutes.",{duration:parseInt(this.props.pageInfoData.levelPermissions['livestreaming.duration'])}), "success")
            }
            this.timerHostUpdate = setInterval(
                () => this.updateHostLiveTime(),
                30000
            );
            this.timerID = setInterval(
                () => this.timer(),
                1000
            );
        }else{
            this.updateViewer('add');
            this.timerID = setInterval(
                () => this.timer(),
                1000
            );
        }
    }
    componentDidMount(){
        Router.events.on("routeChangeStart", url => {
            this.onUnload();
        });
        this.setState({iframeSRC:`${this.getURL()}/media-streaming/play.html`})
        window.addEventListener("beforeunload", this.onUnload);  
        this.props.socket.on('liveStreamingViewerDelete', data => {
            let videoId = data.custom_url;
            if (this.state.custom_url == videoId) {
                let viewer = parseInt(this.state.viewer,10) - 1
                this.setState({localUpdate:true,viewer:viewer < 0 ? 0 : viewer})
            }
        });
        this.props.socket.on('liveStreamingViewerAdded', data => {
            let videoId = data.custom_url;
            if (this.state.custom_url == videoId) {
                let viewer = parseInt(this.state.viewer,10) + 1
                this.setState({localUpdate:true,viewer:viewer < 0 ? 0 : viewer})
            }
        });
        
        this.props.socket.on('liveStreamStatus', data => {
            let id = data.id;
            if (this.state.streamingId == id) {
                if(data.action == "liveStreamEnded"){
                    this.finish();
                }
            }
        });
        this.props.socket.on('likeDislike', data => {
            let itemId = data.itemId
            let itemType = data.itemType
            let ownerId = data.ownerId
            let removeLike = data.removeLike
            let removeDislike = data.removeDislike
            let insertLike = data.insertLike
            let insertDislike = data.insertDislike
            if (itemType == "videos" && this.state.video_id == itemId) {
                const item = { ...this.state }
                
                if (removeLike) {
                    item['like'] = parseInt(item['like']) - 1
                }
                if (removeDislike) {
                    item['dislike'] = parseInt(item['dislike']) - 1
                }
                if (insertLike) {                    
                    item['like'] = parseInt(item['like']) + 1
                }
                if (insertDislike) { 
                    item['dislike'] = parseInt(item['dislike']) + 1
                }
                this.setState({localUpdate:true, ...item })
            }
        });
        if (window.addEventListener) {
            window.addEventListener("message", this.receiveMessage);
        } else {
            window.attachEvent("onmessage", this.receiveMessage);
        }        
    }
    postMessage(data){
        if(document.getElementById("media_treaming_iframe"))
            document.getElementById("media_treaming_iframe").contentWindow.postMessage(data, '*');
    }
    iframeLoaded = () => {
        var orgName = this.props.pageInfoData.liveStreamingServerURL
        var path =  (this.props.pageInfoData.liveStreamingServerURL.replace("https://",'').replace("http://",''));
        var websocketURL =  "ws://" + path+":5080/LiveApp/websocket?rtmpForward=";
        if (orgName.startsWith("https")) {
            websocketURL = "wss://" + path+":5443/LiveApp/websocket?rtmpForward=";
        }
        let values = {orgName:orgName,streamId:this.state.streamingId,url:websocketURL,connecting:this.props.t("Connecting..."),networkWarning:this.props.t("Your connection isn't fast enough to play this stream!")}
        values['videosource'] = this.props.t("Video Source");
        if(parseInt(this.props.pageInfoData.appSettings['antserver_media_hlssupported']) == 1)
        values['playOrder'] = parseInt(this.props.pageInfoData.appSettings['antserver_media_hlssupported']) == 1 ? "hls,webrtc" : "";
        values['screen'] = this.props.t("Screen");
        values['screenwithcamera'] = this.props.t("Screen with Camera");
        values['audiosource'] = this.props.t("Audio Source");
        values['token'] = this.props.streamToken
        values['browser_screen_share_doesnt_support'] = this.props.t("Your browser doesn't support screen share. You can see supported browsers in this link");
        this.postMessage({message:"getData","value":values});
    }
    receiveMessage = (event) => {
        const message = event.data.message;
        switch (message) {
          case 'finished':
            this.finish();
            break;
          case 'playStarted':
            this.startRecording();
            this.createAuthToken()
            break;
        }
    }

    updateViewer(data,customURL){
        let formData = new FormData();
        formData.append("custom_url",customURL ? customURL : this.state.custom_url)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/live-streaming/'+data+'-viewer';
        
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    
                } else {
                    
                }
            }).catch(err => {
                
            });
    }
    
    startRecording(){
        if(this.state.role == "host"){
            let formData = new FormData();
            formData.append("streamID",this.state.streamingId)
            
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
            let url = '/live-streaming/media-stream/recording';
            
            axios.post(url, formData, config)
                .then(response => {
                    if (response.data.error) {
                        
                    } else {
                        
                    }
                }).catch(err => {
                    
                });
        }
    }
    finishStreaming = () => {
        let formData = new FormData();
        formData.append("streamID",this.state.streamingId)
        
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/live-streaming/media-stream/finish';
        
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    
                } else {
                    
                }
            }).catch(err => {
                
            });
    }
    finish = () => {
        if(this.state.role == "host"){
            this.postMessage({message:"stop"});
            this.finishStreaming();
        }
        if(this.timerID)
            clearInterval(this.timerID);
        if(this.timerHostUpdate)
            clearInterval(this.timerHostUpdate)
        this.setState({localUpdate:true,streamleave:true,confirm:false,hostleave:this.state.role != "host" ? true : false})
    }
    changeTimeStamp(){
        let currentTime = this.state.currentTime
        var seconds = parseInt(currentTime, 10); // don't forget the second param
        var hours   = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds - (hours * 3600)) / 60);
        seconds = seconds - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        var time    = hours+':'+minutes+':'+seconds;
        return time;
    }
    timer = () => {

        let allowedTime = 0
        if(this.state.role == "host"){
            if(this.props.pageInfoData.levelPermissions && parseInt(this.props.pageInfoData.levelPermissions['livestreaming.duration'],10) != 0){
                allowedTime = parseInt(this.props.pageInfoData.levelPermissions['livestreaming.duration'],10)
            }
        }

        if(allowedTime == 0 || (allowedTime * 60) >= (this.state.currentTime - 1)){
            let currentTime = parseInt(this.state.currentTime, 10)
            this.setState({localUpdate:true,currentTime:currentTime+1})
        }else{
            this.finish()
        }
    }
    updateHostLiveTime = () => {
        if(this.state.role == "host"){
            //update host time
            let data = {}
            data.custom_url = this.state.custom_url
            this.props.socket.emit('updateLiveHostTime', data)
        }
    }
    confirmfinish = () => {
        this.setState({confirm:true})
    }
   
    getURL(){
       return this.props.pageInfoData.siteURL
    }
    render(){
        if(this.state.role != "host"){
            return (
                <div className="video_player_cnt player-wrapper" style={{ width: "100%", position: "relative" }} >
                    {
                        <React.Fragment>
                            {
                                !this.state.hostleave ? 
                                <React.Fragment>
                                    <div className="lsVideoTop">
                                        <div className="liveTimeWrap">
                                            <span className="liveText">{Translate(this.props,'LIVE')}</span>
                                            <span className="liveTime">{this.changeTimeStamp()}</span>
                                        </div>
                                        <div className="participentNo">
                                            <i className="fa fa-users" aria-hidden="true"></i> {`${ShortNumber(this.state.viewer ? this.state.viewer : 0)}`}
                                        </div>
                                    </div>
                                    {
                                        this.state.video.watermark ? 
                                            <div className="watermarkLogo">
                                                <a href={config.app_server} {...this.props.watermarkLogoParams}>
                                                    <img src={this.props.imageSuffix+this.state.video.watermark} />
                                                </a>
                                            </div>
                                            : null
                                    }
                                    <div className="videoWrapCnt" id="video_container" style={{ width: "100%", "height": "100%", position: "relative" }} >
                                        <iframe id="media_treaming_iframe" onLoad={this.iframeLoaded.bind(this)} className="media_treaming_iframe" src={this.state.iframeSRC}></iframe>
                                    </div>
                                </React.Fragment>
                                :
                                    <div className="purchase_video_content video_processing_cnt livestreaming_end">
                                        <h5>{this.props.t("Thanks For Watching!")}</h5>
                                        <p>{this.props.t("Live Video has been Ended")}</p>
                                    </div>
                            }
                        </React.Fragment>                                
                    }
                </div>
            )
        }
        return (
            <React.Fragment>
                {
                    this.props.isSharePopup ? 
                        <SocialShare {...this.props} buttonHeightWidth="30" url={`/watch/${this.state.custom_url}`} title={this.state.title} imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.image} countItems="all" checkcode={true} />
                : null
                }
                {
                    <React.Fragment>
                        <ToastContainer {...this.props} />
                        <ToastMessage {...this.props} />
                    </React.Fragment>
                }
            <div className="videoSection2">
                <div className={`videoWrap${this.state.allow_chat != 1 ? " nochat" : ""}`}>
                    {
                        this.state.confirm ? 
                        <div className="popup_wrapper_cnt livestreaming_end">
                            <div className="popup_cnt">
                                <div className="comments">
                                    <div className="VideoDetails-commentWrap">
                                        <div className="popup_wrapper_cnt_header">
                                            <h2>{Translate(this.props,'Are you sure you want to end your stream?')}</h2>
                                            <a className="_close" href="#" onClick={(e) => {e.preventDefault(); this.setState({confirm:false})}}><i></i></a>
                                            <div className="footer">
                                                <a href="#" onClick={(e) => {e.preventDefault(); this.setState({confirm:false})}}>
                                                    {Translate(this.props,'NOT YET')}
                                                </a>
                                                <button onClick={this.finish}>
                                                    {Translate(this.props,'END')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        : null
                    }
                    <div className="lsVideoTop">
                        <div className="liveTimeWrap">
                            <span className="liveText">{Translate(this.props,'LIVE')}</span>
                            <span className="liveTime">{this.changeTimeStamp()}</span>
                        </div>
                        <div className="participentNo">
                            <i className="fa fa-users" aria-hidden="true"></i> {`${ShortNumber(this.state.viewer ? this.state.viewer : 0)}`}
                        </div>
                        {
                            this.props.pageInfoData.appSettings["video_like"] ? 
                                <div className="likebtn">
                                    <i className="fa fa-thumbs-up" aria-hidden="true"></i> {`${ShortNumber(this.state.like ? this.state.like : 0)}`}
                                </div>
                        : null
                        }
                        {
                            this.props.pageInfoData.appSettings["video_dislike"] ? 
                                <div className="likebtn">
                                    <i className="fa fa-thumbs-down" aria-hidden="true"></i> {`${ShortNumber(this.state.dislike ? this.state.dislike : 0)}`}
                                </div>
                         : null
                        }
                    </div>
                    {
                        !this.state.streamleave ? 
                            <div className="videoWrapCnt" id="video">
                                <div id="local_stream" className={`video-placeholder${this.state.role == "host" ? "" : " remote_audience"}`}>
                                    {
                                        this.state.streamType == "rtmp" ?
                                        <iframe id="media_treaming_iframe" onLoad={this.iframeLoaded.bind(this)} className="media_treaming_iframe" src={`${this.getURL()}/media-streaming/play.html`}></iframe>
                                    :
                                        <iframe id="media_treaming_iframe" onLoad={this.iframeLoaded.bind(this)} className="media_treaming_iframe" src={`${this.getURL()}/media-streaming/live.html`}></iframe>
                                    }
                                </div>
                            </div>
                            : 
                            <div className="videoWrapCnt live_host_end" id="video">
                                <div className="centeredForm">
                                    <div className="finishedStream">
                                        <div className="head">
                                            {Translate(this.props,'Stream Finished')}
                                        </div>
                                        <div className="thumbStream">
                                            <img src={this.props.pageInfoData.imageSuffix+this.props.pageInfoData.loggedInUserDetails.avtar} />

                                            <div className="overlay">
                                                <div className="nameThumb">
                                                    <span className="big">{this.state.title}</span>
                                                    <span className="namesmall">{this.props.pageInfoData.loggedInUserDetails.displayname}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="foot">
                                            <Link href="/">
                                                <a className="editbtn">{Translate(this.props,'Go back to site')}</a>
                                            </Link>
                                        </div>
                                    </div>                        
                                </div>
                            </div>
                    }
                    {
                        !this.state.streamleave ? 
                            <div className="ls_footer">
                                <div className="ls_footerOption">
                                {
                                      this.state.streamType != "rtmp" && this.state.cameraList && this.state.cameraList.length > 1 ?
                                    <div className="icon shareLinks">                                    
                                        <span className="material-icons" onClick={this.changeCamera.bind(this)}>
                                            flip_camera_android
                                        </span>
                                         {/* <select value={this.state.cameraId} onChange={this.changeCamera.bind(this)}>
                                            <option>{this.props.t("Select Camera Option")}</option>
                                            {
                                                this.state.cameraList.map(item => {
                                                    return (
                                                        <option value={item.value} key={item.value}>{item.label}</option>
                                                    )
                                                })
                                            }
                                        </select> */}
                                    </div>
                                    : null
                                }
                                {
                                    this.state.streamType != "rtmp" && false ? 
                                        <React.Fragment>
                                            <div className="icon valumeBtn" onClick={this.CameraAudio.bind(this,'video')}>
                                                {
                                                    this.state.videoMuted ? 
                                                        <span className="material-icons">
                                                            videocam_off
                                                        </span>
                                                    : 
                                                        <span className="material-icons">
                                                            videocam
                                                        </span>
                                                }
                                            </div>
                                            <div className="icon valumeBtn" onClick={this.CameraAudio.bind(this,"audio")}>
                                                {
                                                    this.state.audioMuted ? 
                                                        <i className="fas fa-microphone-slash"></i>
                                                : <i className="fas fa-microphone"></i>
                                                }
                                            </div>
                                        </React.Fragment>
                                    : null
                                    }
                                    <div className="icon shareLinks">
                                    {
                                        this.props.pageInfoData.appSettings["videos_share"] == 1 ?
                                        <ul className="social_share_livestreaming" style={{padding:"0px"}}>
                                            <SocialShare {...this.props} buttonHeightWidth="30" url={`/watch/${this.state.custom_url}`} title={this.state.title} imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.image} />
                                        </ul>
                                    : null
                                    }
                                    </div>
                                    <div className="icon endBtn" onClick={this.confirmfinish}><button>{Translate(this.props,'End Stream')}</button></div>
                                </div>
                            </div>
                        : null
                    }
                </div>
                {
                    this.state.allow_chat == 1 ? 
                        <div className="ls_sidbar">
                            <Chat {...this.props} finish={this.state.streamleave} deleteAll={true} streamId={this.state.streamingId} custom_url={this.state.custom_url} />
                        </div>    
                    : null
                }
            </div>
            </React.Fragment>
        )
    }

}

const mapStateToProps = state => {
    return {
        isSharePopup: state.sharepopup.status,
    };
};
const mapDispatchToProps = dispatch => {
    return {
        openToast: (message, typeMessage) => dispatch(actions.openToast(message, typeMessage))
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Index);