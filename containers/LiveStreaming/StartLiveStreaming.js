import React from "react"
import * as actions from '../../store/actions/general';
import RTCClient from './rtc-client'
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
            audioMuted:false
        }
        this.timer = this.timer.bind(this)
        this.finish = this.finish.bind(this)
        this.onUnload = this.onUnload.bind(this)
        this.CameraAudio = this.CameraAudio.bind(this)
        this.changeCamera = this.changeCamera.bind(this)
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.channel && nextProps.channel != prevState.channel) {
            return { currentTime: nextProps.currentTime, channel: nextProps.channel, role: nextProps.role, custom_url: nextProps.custom_url,video:nextProps.video,video_id:nextProps.video_id,viewer:nextProps.viewer,comments:nextProps.comments }
        } else{
            return null
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if(this.props.channel != prevProps.channel){
            if(this.timerID)
                clearInterval(this.timerID);
            if(this.timerHostUpdate)
                clearInterval(this.timerHostUpdate)
            if(this.props.role != "host"){
                $(".video-view").remove();
            }
            prevState.rtcClient.leave();
            this.createAuthToken()
            this.updateViewer("delete",prevProps.custom_url)
        }
    }
    onUnload = () => {
        this.props.socket.emit('leaveRoom', {room:this.state.role == "host" ? "ptv_"+this.state.user_id+this.state.randNumber : this.state.video.channel_name,custom_url:this.state.custom_url})
        this.props.socket.disconnect();
        if(this.state.role == "host"){
            this.finish()
        }
    }
    createAuthToken = () => {
        let formData = new FormData();
        
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/live-streaming/access_token?channelName='+(this.state.role == "host" ? "ptv_"+this.state.user_id+this.state.randNumber : this.state.video.channel_name)+'&role='+(this.state.role == "host" ? "publisher" : "subcriber");
        
        axios.post(url, formData, config)
            .then(response => {
                this.setState({token:response.data.token},() => {
                    this.createVideoStreaming();
                });
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });
        
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
        let client = new RTCClient()
        this.setState({localUpdate:true,rtcClient:client})
        if(!this.state.channel){
            this.setState({localUpdate:true,hostleave:true})
            return;
        }
        await client.getdevices().then(result => {
            this.setState({cameraList:result.cameraList,microphoneList:result.microphoneList})
        });
        client.init({role:this.state.role,appID:this.props.pageInfoData.agora_app_id,codec:"vp8"}).then((_) => {
            let data = {}
            data.role = this.state.role
            data.token = this.state.token
            data.channel = this.state.role == "host" ? "ptv_"+this.state.user_id+this.state.randNumber : this.state.video.channel_name
            client.join(data).then(data => {
                
                if(data){
                    if(this.state.role == "host"){
                        this.startRecording();

                        let dataPublish = {}
                        dataPublish["microphoneId"] = this.state.microphoneList && this.state.microphoneList[0] ? this.state.microphoneList[0].value : "";
                        dataPublish["cameraId"] = this.state.cameraList && this.state.cameraList[0] ? this.state.cameraList[0].value : "";
                        client.publish(dataPublish)
                        this.setState({cameraId:dataPublish["cameraId"]});
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
                        client.getClient().on('peer-leave', (evt) => {
                            var id = evt.uid
                            if (id != client.uid()) {
                                this.setState({localUpdate:true,hostleave:true})
                            }
                        })
                        this.updateViewer('add');
                    }
                    this.timerID = setInterval(
                        () => this.timer(),
                        1000
                    );
                }else{
                    this.setState({localUpdate:true,hostleave:true})
                }
            })
        })
    }
    componentDidMount(){
        Router.events.on("routeChangeStart", url => {
            this.onUnload();
        });
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
        
        this.createAuthToken()
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
            formData.append("channel","ptv_"+this.state.user_id+this.state.randNumber)
            formData.append("uid",this.state.rtcClient.uid())
            formData.append("custom_url",this.state.custom_url)

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
            let url = '/live-streaming/record/start';
            
            axios.post(url, formData, config)
                .then(response => {
                    if (response.data.error) {
                        
                    } else {
                        
                    }
                }).catch(err => {
                    
                });
        }
    }
    stopRecroding(){
        if(this.state.role == "host"){
            let formData = new FormData();
            formData.append("channel", "ptv_"+this.state.user_id+this.state.randNumber)
            formData.append("uid",this.state.rtcClient.uid())
            formData.append("custom_url",this.state.custom_url)

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
            let url = '/live-streaming/record/stop';
            
            axios.post(url, formData, config)
                .then(response => {
                    if (response.data.error) {
                        
                    } else {
                        
                    }
                }).catch(err => {
                    
                });
        }
    }
    finish = () => {
        this.state.rtcClient.leave();
        this.stopRecroding()
        if(this.timerID)
            clearInterval(this.timerID);
        if(this.timerHostUpdate)
            clearInterval(this.timerHostUpdate)
        this.setState({localUpdate:true,streamleave:true,confirm:false})
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
    CameraAudio = (value,e) => {
        if(value == "video"){
            !this.state.videoMuted
                ? this.state.rtcClient.getLocalStream().muteVideo()
                : this.state.rtcClient.getLocalStream().unmuteVideo()
            this.setState({videoMuted:!this.state.videoMuted})
        }else{
            !this.state.audioMuted
                ? this.state.rtcClient.getLocalStream().muteAudio()
                : this.state.rtcClient.getLocalStream().unmuteAudio()
            this.setState({audioMuted:!this.state.audioMuted})
        }
    }
    changeCamera = () => {
        let value = this.state.cameraId
        this.state.cameraList.forEach(item => {
            if(this.state.cameraId != item.value){
                value = item.value
            }
        })
        this.setState({cameraId:value,localUpdate:true})
        this.state.rtcClient.getLocalStream().getVideoTrack().stop();
        this.state.rtcClient.getLocalStream().switchDevice("video",value);
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
                                    <div className="videoWrapCnt" id="video" style={{ width: "100%", "height": "100%", position: "relative" }} >
                                        <div id="local_stream" className="video-placeholder remote_audience"></div>
                                        <div id="local_video_info" style={{ display: "none" }} className="video-profile hide"></div>
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
                                <div id="local_stream" className={`video-placeholder${this.state.role == "host" ? "" : " remote_audience"}`}></div>
                                <div id="local_video_info" style={{ display: "none" }} className="video-profile hide"></div>
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
                                        this.state.cameraList && this.state.cameraList.length > 1 ?
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
                            <Chat {...this.props} finish={this.state.streamleave} deleteAll={true} channel={this.state.role == "host" ? "ptv_"+this.state.user_id+this.state.randNumber : this.state.video.channel_name} custom_url={this.state.custom_url} />
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