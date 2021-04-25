import React, { Component } from "react"
import { connect } from "react-redux";

import videojs from "video.js"
import "video.js/dist/video-js.min.css"
import "videojs-contrib-ads/dist/videojs.ads.css"
import "videojs-ima-player/dist/videojs.ima.css"
import "videojs-ads/src/videojs.ads.css"
import "video.js/dist/video.min.js"
import "videojs-contrib-ads/dist/videojs.ads.min.js"
import "videojs-ima-player/dist/videojs.ima.js"
import "videojs-ima-player"
import Currency from "../Upgrade/Currency"
import ReactDOMServer from "react-dom/server"
import Translate from "../../components/Translate/Index.js"
import config from "../../config"

import actions from '../../store/actions/general';


var Ads = function (player, vastAdUrl) {
    this.player = player;
    // Set up UI stuff.
    var options = { debug: false, adTagUrl: vastAdUrl };
    this.player.ima(options);
};


if (typeof window != "undefined") {
    window.videojs = videojs
    require("../../public/static/scripts/videojs-resolution-switcher").default
    require("../../public/static/scripts/videojs-skip-ads/dist/videojs-skip-ads.js")
}


class Player extends Component {
    constructor(props) {
        super(props)
        this.state = {
            purchased:false,
            video:props.video,
            userAdVideo:props.userAdVideo,
            adminAdVideo:props.adminAdVideo,
            updateCount: 0,
            paused:false,
            currentVideoTime:props.currentVideoTime
        }
    }
    setup() {
        let updateCount = this.state.updateCount;
        this.setState({
          localUpdate:true,
          updateCount: updateCount + 1
        });
      }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.video != prevState.video || prevState.currentVideoTime  != nextProps.currentVideoTime){
            if(typeof nextProps.getHeight == "function")
                nextProps.getHeight();
            return {video:nextProps.video,currentVideoTime:nextProps.currentVideoTime,purchased:false}
        } else{
            return null
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if(this.state.updateCount !== prevState.updateCount) {
          // If it has a player, dispose
          if(this.player) {
            this.player.dispose();
          }
          // Create new player
          this.initiatePlayer()
        }
        if (this.props.video != prevState.video || prevState.currentVideoTime  != this.props.currentVideoTime){
            this.setup();
        }
      }
    handleEnded = () => {
        if(this.state.video.sell_videos && this.state.video.price > 0 && !this.state.video.videoPurchased ){
            this.setState({localUpdate:true,purchased:true})
        }else if(this.props.ended){
            this.props.ended();
        }
        console.log('onEnded')
    }
    initiatePlayer = () => {
        if (this.state.video.status != 1 || (this.state.video.type != 3 && this.state.video.type != 11))
            return
        let resolutionsVideo = []
        let videoJsOptions = {}
        let resolution = "";
        
        if(this.state.video.type == 3){
            let splitName = this.state.video.video_location.split('/')
            let fullName = splitName[splitName.length - 1]
            let videoName = fullName.split('_')[0]
            let suffix = this.props.imageSuffix
            let path = "/upload/videos/video/"
            
            if(this.state.video.price <= 0 || this.state.video.videoPurchased || !this.state.video.sell_videos){
                if (this.state.video['4096p'] == 1) {
                    resolutionsVideo.push({
                        src: suffix + path + videoName + "_4096p.mp4",
                        type: 'video/mp4',
                        label: '4K',
                        res: 4096
                    })
                    resolution = "4096"
                }
                if (this.state.video['2048p'] == 1) {
                    resolutionsVideo.push({
                        src: suffix + path + videoName + "_2048p.mp4",
                        type: 'video/mp4',
                        label: '2K',
                        res: 2048
                    })
                    resolution = "2048"
                }
                if (this.state.video['1080p'] == 1) {
                    resolutionsVideo.push({
                        src: suffix + path + videoName + "_1080p.mp4",
                        type: 'video/mp4',
                        label: '1080p',
                        res: 1080
                    })
                    resolution = "1080"
                }
                if (this.state.video['720p'] == 1) {
                    resolutionsVideo.push({
                        src: suffix + path + videoName + "_720p.mp4",
                        type: 'video/mp4',
                        label: '720p',
                        res: 720
                    })
                    resolution = "720"
                }
                if (this.state.video['480p'] == 1) {
                    resolutionsVideo.push({
                        src: suffix + path + videoName + "_480p.mp4",
                        type: 'video/mp4',
                        label: '480p',
                        res: 480
                    })
                    if(!resolution)
                    resolution = "480"
                }
                if (this.state.video['360p'] == 1) {
                    resolutionsVideo.push({
                        src: suffix + path + videoName + "_360p.mp4",
                        type: 'video/mp4',
                        label: '360p',
                        res: 360
                    })
                    if(!resolution)
                    resolution = "360"
                }
                if (this.state.video['240p'] == 1) {
                    resolutionsVideo.push({
                        src: suffix + path + videoName + "_240p.mp4",
                        type: 'video/mp4',
                        label: '240p',
                        res: 240
                    })
                    if(!resolution)
                    resolution = "240"
                }
                if (this.state.video.video_location) {
                    resolutionsVideo.push({
                        src: suffix + path + videoName + "_240p.mp4",
                        type: 'video/mp4',
                        label: '360p',
                        res: 360
                    })
                    if(!resolution)
                    resolution = "360"
                }
            }else{
                resolutionsVideo.push({
                    src: suffix + path + videoName + "_sample.mp4",
                    type: 'video/mp4',
                    label: '360p',
                    res: 360
                })
                if(!resolution)
                    resolution = "360" 
            }
            videoJsOptions = {
                autoplay: true,
                muted:typeof this.props.muted != "undefined" ? this.props.muted : false,
                controls: typeof this.props.showControls != "undefined" ? this.props.showControls : true,
                preload: "auto",
                plugins: {
                    videoJsResolutionSwitcher: {
                        default: resolution, // Default resolution [{Number}, 'low', 'high'],
                        dynamicLabel: true
                    }
                },
                sources: resolutionsVideo
            }
        }else{

            let videos = this.state.video.code.split(',')
            let videoPath = this.props.pageInfoData.liveStreamingServerURL+":5443/LiveApp/streams/"
            if(videos.length > 1){
                if (this.state.video['4096p'] == 1) {
                    let url = videos.filter(function(item) {
                        return item.indexOf('_4096p') > -1;
                    });
                    if(url){
                        resolutionsVideo.push({
                            src: videoPath + url,
                            type: 'video/mp4',
                            label: '4K',
                            res: 4096
                        })
                        if(!resolution)
                            resolution = "4096"
                    }
                }
                if (this.state.video['2048p'] == 1) {
                    let url = videos.filter(function(item) {
                        return item.indexOf('_2048p') > -1;
                    });
                    if(url){
                        resolutionsVideo.push({
                            src: videoPath + url,
                            type: 'video/mp4',
                            label: '2K',
                            res: 2048
                        })
                        if(!resolution)
                            resolution = "2048"
                    }
                }
                if (this.state.video['1080p'] == 1) {
                    let url = videos.filter(function(item) {
                        return item.indexOf('1080p') > -1;
                    });
                    if(url){
                        resolutionsVideo.push({
                            src: videoPath + url,
                            type: 'video/mp4',
                            label: '1080p',
                            res: 1080
                        })
                        if(!resolution)
                            resolution = "1080"
                    }
                }
                if (this.state.video['720p'] == 1) {
                    let url = videos.filter(function(item) {
                        return item.indexOf('720p') > -1;
                    });
                    if(url){
                        resolutionsVideo.push({
                            src: videoPath + url,
                            type: 'video/mp4',
                            label: '720p',
                            res: 720
                        })
                        if(!resolution)
                            resolution = "720"
                    }
                }
                if (this.state.video['480p'] == 1) {
                    let url = videos.filter(function(item) {
                        return item.indexOf('480p') > -1;
                    });
                    if(url){
                        resolutionsVideo.push({
                            src: videoPath +url,
                            type: 'video/mp4',
                            label: '480p',
                            res: 480
                        })
                        if(!resolution)
                            resolution = "480"
                    }
                }
                if (this.state.video['360p'] == 1) {
                    let url = videos.filter(function(item) {
                        return item.indexOf('360p') > -1;
                    });
                    if(url){
                        resolutionsVideo.push({
                            src: videoPath + url,
                            type: 'video/mp4',
                            label: '360p',
                            res: 360
                        })
                        if(!resolution)
                            resolution = "360"
                    }
                }
                if (this.state.video['240p'] == 1) {
                    let url = videos.filter(function(item) {
                        return item.indexOf('240p') > -1;
                    });
                    if(url){
                        resolutionsVideo.push({
                            src: videoPath + url,
                            type: 'video/mp4',
                            label: '240p',
                            res: 240
                        })
                        if(!resolution)
                            resolution = "240"
                    }
                }
                videoJsOptions = {
                    autoplay: true,
                    muted:typeof this.props.muted != "undefined" ? this.props.muted : false,
                    controls: typeof this.props.showControls != "undefined" ? this.props.showControls : true,
                    preload: "auto",
                    plugins: {
                        videoJsResolutionSwitcher: {
                            default: resolution, // Default resolution [{Number}, 'low', 'high'],
                            dynamicLabel: true
                        }
                    },
                    sources: resolutionsVideo
                }
            }else{
                resolutionsVideo.push({
                    src: this.props.pageInfoData.liveStreamingServerURL+":5443/LiveApp/streams/"+this.state.video.code,
                    type: 'video/mp4',
                    label: '480p',
                    res: 480
                })
                videoJsOptions = {
                    autoplay: true,
                    muted:typeof this.props.muted != "undefined" ? this.props.muted : false,
                    controls: typeof this.props.showControls != "undefined" ? this.props.showControls : true,
                    preload: "auto",
                    sources: resolutionsVideo
                }
            }
        }
        
        var _ = this;
        // instantiate Video.js        
            this.player = videojs(this.videoNode, videoJsOptions, function onPlayerReady() {
                var player = this;
                if(_.props.getHeight)
                 _.props.getHeight();
                 if(_.state.video.type == 3 || resolution){
                    player.updateSrc(resolutionsVideo)
                 }
                if(_.state.currentVideoTime){
                    player.currentTime(_.state.currentVideoTime)
                }
                player.skipAds({
                    delayInSeconds: _.state.adminAdVideo && _.state.adminAdVideo.skip > 0 ? _.state.adminAdVideo.skip : 0
                }); 
                // request ads whenever there's new video content
                player.on('contentchanged', function () {
                    // in a real plugin, you might fetch new ad inventory here
                    player.trigger('adsready');
                });
                if(typeof _.props.updateTime == "undefined"){
                  player.on('timeupdate', function() {
                    _.props.upatePlayerTime(this.currentTime())
                  });
                }
                player.on('ended', function() {
                    _.handleEnded()
                });
                if(_.state.userAdVideo || (_.state.adminAdVideo && _.state.adminAdVideo.type == 1)){
                    player.ads()
                    player.on('readyforpreroll', function () {
                        if (!this.loadPreLoadAds) {
                            this.loadPreLoadAds = true
                            player.ads.startLinearAdMode();
                            let adVideoLink = ""
                            if(_.state.adminAdVideo){
                                adVideoLink = _.props.imageSuffix+_.state.adminAdVideo.link
                            }else{
                                adVideoLink = _.props.imageSuffix+_.state.userAdVideo.media
                            }
                            if(adVideoLink){
                                // play your linear ad content
                                player.src(adVideoLink);
                                // send event when ad is playing to remove loading spinner
                                player.one('adplaying', function () {
                                    if(_.state.adminAdVideo && _.state.adminAdVideo.type == 1 && _.state.adminAdVideo.click_link){
                                        let url =  window.location.protocol+"//"+window.location.host+"/ad-clicked/admin/"+_.state.adminAdVideo.ad_id+"?url="+encodeURI(_.state.adminAdVideo.click_link)
                                        $('[data-vjs-player=true]').find("video.vjs-tech").attr("onClick",'window.open("'+url+'");');
                                    }else if(_.state.userAdVideo && _.state.userAdVideo.url){
                                        let url =  window.location.protocol+"//"+window.location.host+"/ad-clicked/user/"+_.state.userAdVideo.ad_id+"?url="+encodeURI(_.state.userAdVideo.url)
                                        $('[data-vjs-player=true]').find("video.vjs-tech").attr("onClick",'window.open("'+url+'");');
                                    }
                                    if(_.state.userAdVideo){
                                        let url =  window.location.protocol+"//"+window.location.host+"/ad-clicked/user/"+_.state.userAdVideo.ad_id+"?url="+encodeURI(_.state.userAdVideo.url)
                                        $('<div class="userad_cnt"></div>').insertBefore($('[data-vjs-player=true]').find(".videojs-ads-info"))
                                        $('.userad_cnt').attr("onClick",'window.open("'+url+'");');
                                        if(_.state.userAdVideo && _.state.userAdVideo.title){
                                            $(".userad_cnt").append("<div class='userad_title'>"+_.state.userAdVideo.title+"</div>")
                                        }
                                        if(_.state.userAdVideo && _.state.userAdVideo.description){
                                            $(".userad_cnt").append("<div class='userad_description'>"+_.state.userAdVideo.description+"</div>")
                                        }
                                    }
                                    player.trigger('ads-ad-started');
                                });
                                // resume content when all your linear ads have finished
                                player.one('adended', function () {
                                    if(_.state.adminAdVideo && _.state.adminAdVideo.type == 1 && _.state.adminAdVideo.click_link){
                                        $('[data-vjs-player=true]').find("video.vjs-tech").removeAttr("onClick",'');
                                    }
                                    player.ads.endLinearAdMode();
                                });
                            }
                        }
                    });
                    // in a real plugin, you might fetch ad inventory here
                    player.trigger('adsready');
                }
            });
        if(this.state.adminAdVideo && this.state.adminAdVideo.type == 2){
            let tag = this.state.adminAdVideo.link
            this.ads = new Ads(this.player,tag);
        }
    }
    componentDidMount() {
        this.setup();
        
    }

    // destroy player on unmount
    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
        //this.props.upatePlayerTime(0)
    }
    
    purchaseClicked = () => {
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        }else{
            //redirect to payment page
            window.location.href = `/videos/purchase/${this.state.video.video_id}`
        }
    }
    render() {

        let htmlPrice = null
        let userBalance = {}
        userBalance['package'] = { price: parseInt(this.state.video.price) }  
        if(this.state.purchased &&  !this.props.miniplayer){
            htmlPrice = <div className="purchase_video_content video_purchase" style={{ width: "100%", "height": this.props.height ? this.props.height : "100%"}}>
                            <div className="purchase_video_content_background"></div>
                            <h5>
                                {
                                    Translate(this.props,"More to watch! to continue watching this video, you have to purchase it.")
                                }<br /><br />
                                <button className="btn btn-main" onClick={this.purchaseClicked}>{Translate(this.props,'Purchase ')+" "+ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props} {...userBalance} />)} </button>
                            </h5>
                        </div>
        }


        let key = `${this.state.video.custom_url || ''}-${this.state.updateCount}`;
        return (
            <div key={key} >
                <div data-vjs-player className="video_player_cnt player-wrapper" style={{ width: "100%", position: "relative" }} >
                    {
                        this.state.video.status == 1 ?
                            <React.Fragment>
                                {
                                    this.state.video.sell_videos && this.state.video.price > 0 && !this.state.video.videoPurchased &&  !this.props.miniplayer ? 
                                        <button className="video_purchase_btn" onClick={this.purchaseClicked}>{Translate(this.props,'Purchase ')+" "+ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...userBalance} />)} </button>
                                    : null
                                }
                                {
                                    this.state.video.watermark ? 
                                    <div className="watermarkLogo">
                                        <a href={config.app_server} {...this.props.watermarkLogoParams}>
                                            <img src={this.props.imageSuffix+this.state.video.watermark} />
                                        </a>
                                    </div>
                                    : null
                                }
                                {
                                    htmlPrice ? 
                                        htmlPrice : 
                                        null
                                }
                                <video onContextMenu={(e) => {e.preventDefault();}} disablePictureInPicture playsInline style={{ width: "100%", "height": this.props.height ? this.props.height : "100%", position: "relative" }} ref={node => (this.videoNode = node)} className="video-js" />
                                
                            </React.Fragment>
                            :
                            <div className="purchase_video_content video_processing_cnt" style={{ width: "100%", "height": this.props.height ? this.props.height : "100%"}}>
                                {
                                    this.state.video.status == 2 ?
                                        <h5>{this.props.t("Video is processing, please wait...")}</h5>
                                        :
                                        <h5>{this.props.t("Video failed processing, please upload new video.")}</h5>
                                }
                            </div>
                    }
                </div>
            </div>
        )
    }
}


  const mapDispatchToProps = dispatch => {
    return {
        upatePlayerTime: (time) => dispatch(actions.upatePlayerTime(time)),
    };
};
export default connect(null,mapDispatchToProps)(Player)