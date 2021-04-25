import React, { Component } from "react"
import { connect } from "react-redux";

import ReactPlayer from 'react-player'

import actions from '../../store/actions/general';
import config from "../../config"

class OutsidePlayer extends Component {
    constructor(props) {
        super(props)
        this.state = {
            playing: false,
            video:props.video,
            currentVideoTime:props.currentVideoTime,
            showOverlay:false
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if(nextProps.video != prevState.video){
            return {video:nextProps.video,currentVideoTime:nextProps.currentVideoTime}
        } else{
            return null
        }
    }
    componentDidUpdate(prevProps,prevState){
        if(prevState.video != this.state.video){
            this.componentDidMount()
        }
    }
    handleEnded = () => {
        if(this.props.ended){
            this.props.ended();
        }
        console.log('onEnded')
    }
    onProgress = (stats) => {
        if(typeof this.props.updateTime == "undefined"){
            this.props.upatePlayerTime(stats.playedSeconds)
        }
        
    }
    changePlayPause = () => {
        this.setState({localUpdate:true,playing:!this.state.playing})
    }
    handleOnReady = () => {
        setTimeout(() => this.setState({localUpdate:true, playing: true }), 1);
    }
    componentDidMount = () => {
        window.iframely && iframely.load();
        if(this.state.currentVideoTime && this.player){
            this.player.seekTo(this.state.currentVideoTime ? this.state.currentVideoTime : 0)
        }
    }
    getIframelyHtml = () => {
        if (this.props.type != 20) {
            return
        }
        return { __html: this.props.code };
    }
   
    render() {
        if (typeof window == "undefined")
            return null
        let url = ""

        if (this.state.video.type == 1) {
            url = `https://www.youtube.com/watch?v=${this.props.code}`
        } else if (this.state.video.type == 2) {
            url = `https://vimeo.com/${this.props.code}`
        } else if (this.state.video.type == 4) {
            url = `https://www.dailymotion.com/video/${this.props.code}`
        } else if (this.state.video.type == 5) {
            url = `https://www.twitch.tv/videos/${this.state.video.code}`
        } else if (this.state.video.type == 6) {
            const videoData = this.state.video.code.split(',')
            url = `https://clips.twitch.tv/embed?clip=${videoData[1]}`
            let code = <iframe
                            src={url}
                            height={this.props.height ? this.props.height : "600px"}
                            width="100%"
                            frameBorder="none"
                            allowFullScreen={true}>
                        </iframe>
            return <div className="player-wrapper">{code}</div>
        }else if (this.state.video.type == 8) {
            url = `https://www.twitch.tv/${this.state.video.code}`
        } else if (this.state.video.type == 7) {
            //fb video
            url = this.state.video.code
        }else if (this.state.video.type == 9) {
            url = this.state.video.code
        }else if (this.state.video.type == 10) {
            url = this.props.liveStreamingURL+"/"+this.state.video.code
        }else if (this.state.video.type == 22) {
            let code = this.state.video.code
            return <div className="player-wrapper embed_video" dangerouslySetInnerHTML={{ __html: code }}></div>
        } else {
            return <div className="player-wrapper" dangerouslySetInnerHTML={this.getIframelyHtml()} />
        }
        return <div className="player-wrapper" style={{width:"100%",height:this.props.height ? this.props.height : "600px"}}>
            { 
                this.state.video.watermark ? 
                <div className="watermarkLogo">
                    <a href={config.app_server} {...this.props.watermarkLogoParams}>
                        <img src={this.props.imageSuffix+this.state.video.watermark} />
                    </a>
                </div>
                : null
            }
            <div className="player-overlay" onClick={this.changePlayPause}></div>
            <ReactPlayer
            url={url}
            ref={p => { this.player = p }}
            width='100%'
            playsinline={true}
            muted={typeof this.props.muted != "undefined" ? this.props.muted : false}
            height={"100%"}
            onProgress={this.onProgress}
            playing={this.state.playing}
            pip={false}
            controls={typeof this.props.showControls != "undefined" ? this.props.showControls : true }
            onReady={this.handleOnReady}
            onEnded={this.handleEnded}
        />
        </div>
    }

}

const mapDispatchToProps = dispatch => {
    return {
        upatePlayerTime: (time) => dispatch(actions.upatePlayerTime(time)),
    };
};
export default connect(null,mapDispatchToProps)(OutsidePlayer)