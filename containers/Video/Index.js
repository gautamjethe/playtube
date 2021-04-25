import React, { Component } from "react"
import { connect } from "react-redux"

import Form from '../../components/DynamicForm/Index'

import Validator from '../../validators'

import axios from "../../axios-orders"
import Player from "./Player"

import OutsidePlayer from "./OutsidePlayer"
import AdsIndex from "../Ads/Index"
import Image from "../Image/Index"
import Artists from "../Artist/Artists";
import ShortNumber from "short-number"

import Link from "../../components/Link/index";
import SocialShare from "../SocialShare/Index"
import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import WatchLater from "../WatchLater/Index"
import Timeago from "../Common/Timeago"
import Rating from "../Rating/Index"
import playlist from '../../store/actions/general';
import swal from 'sweetalert'
import StartLiveStreaming from "../LiveStreaming/StartLiveStreaming"
import MediaStreaming from "../LiveStreaming/MediaLiveStreaming"
import Comment from "../../containers/Comments/Index"

import MemberFollow from "../User/Follow"
import  Chat from "../LiveStreaming/Chat"
import RelatedVideos from "./RelatedVideos"
import Router from "next/router"
import Translate from "../../components/Translate/Index"
import CensorWord from "../CensoredWords/Index"
import Donation from "../Donation/Index"
import config from "../../config"
import Members from "../User/Browse"

const { BroadcastChannel } = require('broadcast-channel');

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
            let height = (($(".videoPlayerHeight").outerWidth(true) /  1.77176216) - 20) + "px";
            $(".player-wrapper, .video-js").css("height",height);
            $("#background_theater").css("height",(($(".videoPlayerHeight").outerWidth(true) /  1.77176216) + 46) + "px");
            if(this.state.fullWidth){
                $(".videoPlayerHeight").css("height",(($(".videoPlayerHeight").outerWidth(true) /  1.77176216) + 46) + "px");
            }else{
                $(".videoPlayerHeight").css("height","auto");
            }
            if(this.state.fullWidth){
                $(".header-wrap").addClass("theater-mode")
            }else{
                $(".header-wrap").removeClass("theater-mode")
            }
            $('video, iframe').css('height', '100%');
        }
        if($(".videoPlayerHeight").length){
         let height =  $(".videoPlayerHeight").outerHeight(true);
         if(this.state.video && this.state.video.status == 2){
             //height = 420;
         }
         this.setState({localUpdate:true,height:`-${height}px`})
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
        let deleteMessage = Translate(this.props, "Are you sure you want to close the player?")
        let deleteTitle = Translate(this.props, "Queue will be cleared")
        if (this.props.pageInfoData.appSettings['video_miniplayer'] == 1 && this.props.pageInfoData.appSettings['enable_iframely'] == 0 && this.state.video && this.state.video.approve == 1 &&  this.state.video.status == 1 && this.state.width > 992 && !this.state.logout) {
            if (this.state.playlistVideos) {
                this.props.updatePlayerData([], this.state.playlistVideos, this.state.video, deleteMessage, deleteTitle,this.props.pageInfoData.liveStreamingURL)
            } else if (this.state.relatedVideos) {
                this.props.updatePlayerData(this.state.relatedVideos, [], this.state.video, deleteMessage, deleteTitle,this.props.pageInfoData.liveStreamingURL)
            } else {
                this.props.updatePlayerData([], [], this.state.video, deleteMessage, deleteTitle,this.props.pageInfoData.liveStreamingURL)
            }
        }
    }
    componentDidMount() {
        if(this.props.pageInfoData.appSettings["fixed_header"] == 1 && this.props.hideSmallMenu && !this.props.menuOpen){
           this.props.setMenuOpen(true)
        }
        const userChannel = new BroadcastChannel('user');
        userChannel.onmessage = channelData => { 
            if(channelData.payload && channelData.payload.type && channelData.payload.type == "LOGOUT"){
                this.setState({localUpdate:true,logout:true})
            }else if(channelData.data && channelData.data.data && channelData.data.data.payload && channelData.data.data.payload.type == "LOGOUT"){
                this.setState({localUpdate:true,logout:true})
            }
         }
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
        this.getHeight();
        var _ = this
        _.props.updatePlayerData([], [])
        if (this.state.video && this.state.video.videoPaymentStatus) {
            if (this.state.video.videoPaymentStatus == "success") {
                swal("Success", Translate(this.props, "Video purchased successfully.", "success"));
            } else if (this.state.video.videoPaymentStatus == "fail") {
                swal("Error", Translate(this.props, "Something went wrong, please try again later", "error"));
            } else if (this.state.video.videoPaymentStatus == "cancel") {
                swal("Error", Translate(this.props, "You have cancelled the payment.", "error"));
            }
        }

        this.props.socket.on('videoCreated', data => {
            let videoId = data.videoId;
            if (this.state.video && this.state.video.custom_url == videoId) {
                // axiosSite.get("/watch/" + videoId + "?data=1").then(pageData => {
                //     _.props.setPageInfoData(pageData.data.data)
                // });
                Router.push(`/watch?videoId=${videoId}`, `/watch/${videoId}`)
            }
        });
        this.props.socket.on('unwatchlater', data => {
            let id = data.itemId
            let ownerId = data.ownerId
            if (this.state.video && this.state.video.video_id == id) {
                const video = { ...this.state.video }
                if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    video.watchlater_id = null
                    this.setState({localUpdate:true, video: video })
                }
            }
        });
        this.props.socket.on('watchlater', data => {
            let id = data.itemId
            let ownerId = data.ownerId
            if (this.state.video && this.state.video.video_id == id) {
                const video = { ...this.state.video }
                if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    video.watchlater_id = 1
                    this.setState({localUpdate:true, video: video })
                }
            }
        });

        this.props.socket.on('unfollowUser', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (this.state.video && id == this.state.video.owner.user_id && type == "members") {
                if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    const data = { ...this.state.video }
                    const owner = data.owner
                    owner.follower_id = null
                    this.setState({localUpdate:true, video: data })
                }
            }
        });
        this.props.socket.on('followUser', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (this.state.video && id == this.state.video.owner.user_id && type == "members") {
                if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    const data = { ...this.state.video }
                    const owner = data.owner
                    owner.follower_id = 1
                    this.setState({localUpdate:true, video: data })
                }
            }
        });
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            if (this.state.video && id == this.state.video.video_id && type == "videos") {
                const data = { ...this.state.video }
                data.rating = rating
                this.setState({localUpdate:true, video: data })
            }
        });
        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (this.state.video && id == this.state.video.video_id && type == "videos") {
                if (this.state.video.video_id == id) {
                    const data = { ...this.state.video }
                    data.favourite_count = data.favourite_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        data.favourite_id = null
                    }
                    this.setState({localUpdate:true, video: data })
                }
            }
        });
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (this.state.video && id == this.state.video.video_id && type == "videos") {
                if (this.state.video.video_id == id) {
                    const data = { ...this.state.video }
                    data.favourite_count = data.favourite_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        data.favourite_id = 1
                    }
                    this.setState({localUpdate:true, video: data })
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
            if (this.state.video && itemType == "videos" && this.state.video.video_id == itemId) {
                const item = { ...this.state.video }
                let loggedInUserDetails = {}
                if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
                    loggedInUserDetails = this.props.pageInfoData.loggedInUserDetails
                }
                if (removeLike) {
                    if (loggedInUserDetails.user_id == ownerId)
                        item['like_dislike'] = null
                    item['like_count'] = parseInt(item['like_count']) - 1
                }
                if (removeDislike) {
                    if (loggedInUserDetails.user_id == ownerId)
                        item['like_dislike'] = null
                    item['dislike_count'] = parseInt(item['dislike_count']) - 1
                }
                if (insertLike) {
                    if (loggedInUserDetails.user_id == ownerId)
                        item['like_dislike'] = "like"
                    item['like_count'] = parseInt(item['like_count']) + 1
                }
                if (insertDislike) {
                    if (loggedInUserDetails.user_id == ownerId)
                        item['like_dislike'] = "dislike"
                    item['dislike_count'] = parseInt(item['dislike_count']) + 1
                }
                this.setState({localUpdate:true, video: item })
            }
        });
        var _ = this
        $(document).ready(function () {
            if (_.state.video) {
                if ($('#VideoDetailsDescp').height() > 110) {
                    _.setState({ showMore: true, styles: { visibility: "visible", overflow: "hidden", height: "100px" }, collapse: true })
                } else {
                    _.setState({ showMore: false, styles: { visibility: "visible", height: "auto" } })
                }
            }
        })
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
                    Router.push(`/watch?videoId=${this.props.pageInfoData.videoId}`, `/watch/${this.props.pageInfoData.videoId}`)
                }
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });
    }
    playlistOpen = (e) => {
        e.preventDefault()
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            this.props.openPlaylist(true, this.state.video.video_id)
        }
    }
    showMore = (e) => {
        e.preventDefault()
        let showMoreText = ""
        let styles = {}
        if (this.state.collapse) {
            showMoreText = Translate(this.props, "Show less")
            styles = { visibility: "visible", overflow: "visible" }
        } else {
            showMoreText = Translate(this.props, "Show more")
            styles = { visibility: "visible", overflow: "hidden", height: "100px" }
        }
        this.setState({localUpdate:true, styles: styles, showMoreText: showMoreText, collapse: !this.state.collapse })
    }
    embedPlayer = (e) => {
        e.preventDefault()
    }
    miniPlayer = (e) => {
        e.preventDefault()
        Router.back()
        //this.props.openPlayer(this.state.video.video_id, this.state.relatedVideos)
    }
    openReport = (e) => {
        e.preventDefault()
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            this.props.openReport(true, this.state.video.custom_url, 'videos')
        }
    }
    deleteVideo = (e) => {
        e.preventDefault()
        swal({
            title: Translate(this.props, "Are you sure?"),
            text: Translate(this.props, "Once deleted, you will not be able to recover this video!"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()
                    formData.append('video_id', this.state.video.video_id)
                    const url = "/videos/delete"
                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) {
                                swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
                            } else {
                                this.props.openToast(Translate(this.props, response.data.message), "success");
                                this.setState({localUpdate:true,logout:true},() => {
                                    Router.push(`/dashboard?type=videos`, `/dashboard/videos`)
                                })
                            }
                        }).catch(err => {
                            swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
                        });
                    //delete
                } else {

                }
            });
    }
    fullWidth = (e) => {
        e.preventDefault()
        this.setState({localUpdate:true, fullWidth: !this.state.fullWidth },() => {
            this.getHeight();
        })
    }
    donationFunction = () => {
        window.location.href = `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=${this.state.video.paypal_email}&lc=US&item_name=${`Donation+to+` + encodeURI(this.state.video.displayname)}&no_note=0&cn=&currency_code=${this.props.pageInfoData.appSettings['payment_default_currency']}&bn=PP-DonationsBF:btn_donateCC_LG.gif:NonHosted'`
    }
    getItemIndex(item_id) {
        const videos = [...this.state.playlistVideos];
        const itemIndex = videos.findIndex(p => p["video_id"] == item_id);
        return itemIndex;
    }
    getRelatedVideosIndex(item_id){
        const videos = [...this.state.relatedVideos];
        const itemIndex = videos.findIndex(p => p["video_id"] == item_id);
        return itemIndex;
    }
    videoEnd = () => {

        let video_id = this.state.video.video_id
        let itemIndex = 0
        if(this.state.playlistVideos && this.state.playlistVideos.length){
            itemIndex = this.getItemIndex(video_id)
            if (itemIndex > -1) {
                const items = [...this.state.playlistVideos]
                if(itemIndex+2 <= this.state.playlistVideos.length){
                    itemIndex = itemIndex + 1
                }else{
                    itemIndex = 0
                }
                Router.push(`/watch?videoId=${items[itemIndex]['custom_url']}&list=${this.state.playlist.custom_url}`, `/watch/${items[itemIndex]['custom_url']}?list=${this.state.playlist.custom_url}`)
            }
        }else if(this.state.relatedVideos.length){
            const isAutoplay = localStorage.getItem("autoplay")
            if(isAutoplay && this.props.pageInfoData.appSettings['video_autoplay'] == 1 && this.props.pageInfoData.appSettings['enable_iframely'] == 0){
                itemIndex = this.getRelatedVideosIndex(video_id)
                //first video played
                if (this.state.relatedVideos && this.state.relatedVideos.length) {
                    const items = [...this.state.relatedVideos]
                    Router.push(`/watch?videoId=${items[0]['custom_url']}`, `/watch/${items[0]['custom_url']}`)
                }
            }
        }
    }
    mouseOut = () => {
        $(".expand").hide()
        $(".watermarkLogo").hide()
    }
    mouseEnter = () => {
        if(this.state.video && this.state.video.status == 1){
            $(".watermarkLogo").show()
            $(".expand").show()
        }
    }
    componentDecorator = (href, text, key) => (
        <a href={href} key={key} target="_blank" rel="nofollow">
          {text}
        </a>
     );
    linkify(inputText) {
        inputText = inputText.replace(/&lt;br\/&gt;/g, ' <br/>')
        inputText = inputText.replace(/&lt;br \/&gt;/g, ' <br/>')
        inputText = inputText.replace(/&lt;br&gt;/g, ' <br/>')
        var replacedText, replacePattern1, replacePattern2, replacePattern3;
    
        //URLs starting with http://, https://, or ftp://
        replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank" rel="nofollow">$1</a>');
    
        //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
        replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank" rel="nofollow">$2</a>');
    
        //Change email addresses to mailto:: links.
        replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
        replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1" rel="nofollow">$1</a>');
    
        return replacedText;
    }
    render() {
        let currentPlaying = 0
        if (this.state.playlistVideos) {
            currentPlaying = this.state.playlistVideos.findIndex(p => p["video_id"] == this.state.video.video_id);
            currentPlaying = currentPlaying + 1
        }
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
                    <div className="details-video-wrap">
                        <div className="container">
                            <div className="row">
                                {
                                    this.state.adult ?
                                        <div className={`col-xl-9 col-lg-8`}>
                                            <div className="adult-wrapper">
                                                {Translate(this.props, 'This video contains adult content.To view this video, Turn on adult content setting from site footer.')}
                                            </div>
                                        </div>
                                        :
                                        <React.Fragment>
                                            {
                                             this.state.video && this.state.video.approve != 1 ? 
                                                 <div className="col-xl-9 col-lg-8">
                                                     <div className="generalErrors">
                                                         <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                                             {Translate(this.props,'This video still waiting for admin approval.')}
                                                         </div>
                                                    </div>
                                                </div>
                                            : null
                                            }
                                            <div id="background_theater" style={{display:this.state.fullWidth ? "block" : "none"}}></div>
                                            <div className={`${this.state.fullWidth ? "col-lg-12" : "col-xl-9 col-lg-8"} videoPlayerHeight`}>
                                                <div onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseOut} >
                                                    <div className="videoPlayer">
                                                        <React.Fragment>
                                                        {
                                                            this.state.video.is_livestreaming && this.state.video.type == 11 ?
                                                                <MediaStreaming {...this.props} viewer={this.state.video.total_viewer} height={this.state.width > 992 ? "500px" : "500px"}   custom_url={this.state.video.custom_url} streamingId={this.state.video.mediaserver_stream_id} currentTime={this.props.pageInfoData.currentTime} role="audience" imageSuffix={this.props.pageInfoData.imageSuffix} video={this.props.pageInfoData.video} {...this.props.pageInfoData.video} />
                                                            :
                                                            this.state.video.is_livestreaming ?
                                                                <StartLiveStreaming {...this.props} viewer={this.state.video.total_viewer} height={this.state.width > 992 ? "500px" : "500px"}   custom_url={this.state.video.custom_url} channel={this.state.video.channel_name} currentTime={this.props.pageInfoData.currentTime} role="audience" imageSuffix={this.props.pageInfoData.imageSuffix} video={this.props.pageInfoData.video} {...this.props.pageInfoData.video} />
                                                                :
                                                            this.state.video.type == 3 || this.state.video.type == 11 ?
                                                                <Player {...this.props} getHeight={this.getHeight} ended={this.videoEnd} height={this.state.width > 992 ? "500px" : "500px"} userAdVideo={this.state.userAdVideo} adminAdVideo={this.state.adminAdVideo}  playlistVideos={this.state.playlistVideos} currentPlaying={this.state.currentPlaying} imageSuffix={this.props.pageInfoData.imageSuffix} video={this.props.pageInfoData.video} {...this.props.pageInfoData.video} />
                                                                :
                                                                <OutsidePlayer {...this.props} liveStreamingURL={this.props.pageInfoData.liveStreamingURL} ended={this.videoEnd}  height={this.state.width > 992 ? "500px" : "500px"}  playlistVideos={this.state.playlistVideos} currentPlaying={this.state.currentPlaying} imageSuffix={this.props.pageInfoData.imageSuffix} video={this.props.pageInfoData.video}  {...this.props.pageInfoData.video} />
                                                        }
                                                        
                                                        </React.Fragment>
                                                    </div>
                                                    {
                                                        this.state.width > 992 ?
                                                            <div className="expand" onClick={this.fullWidth.bind(this)}>
                                                                <span className="home-theater">
                                                                    <i className="fa fa-expand"></i>
                                                                </span>
                                                            </div>
                                                            : null
                                                    }
                                                </div>
                                                {
                                                 this.state.video.approve == 1 ? 
                                                <div className="bntfullWidht video-options" style={{display:"none"}}>
                                                    {/* <a href="#" onClick={this.miniPlayer.bind(this)}>
                                                        <i className="fas fa-compress"></i> {Translate(this.props,'Mini Player')}
                                                    </a> */}
                                                    <a href="#" onClick={this.embedPlayer.bind(this)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z"></path></svg> {Translate(this.props, "Embed")}
                                                    </a>
                                                </div>
                                                : null
                                                }
                                            </div>
                                            {
                                            this.state.width <= 992 && this.state.video && this.state.video.approve == 1 && this.state.video.enable_chat == 1 && this.state.video.is_livestreaming == 1 && (this.state.video.channel_name || this.state.video.mediaserver_stream_id) ? 
                                                    <div className="col-lg-8 col-xl-9">
                                                        <div className="ls_sidbar top_video_chat">
                                                            <Chat {...this.props} channel={this.state.video.channel_name} streamId={this.state.video.mediaserver_stream_id} custom_url={this.state.video.custom_url} comments={this.state.video.chatcomments ? this.state.video.chatcomments : []} />
                                                        </div>    
                                                    </div>
                                                : null
                                            }
                                            <div className="col-lg-8 col-xl-9">
                                                <div className="videoDetailsWrap-content">
                                                    <a className="videoName" href="#" onClick={(e) => e.preventDefault()}>{<CensorWord {...this.props} text={this.state.video.title} />}</a>

                                                    <div className="videoDetailsLikeWatch">
                                                        <div className="watchBox">
                                                            <span title={Translate(this.props, "Views")}>{this.state.video.view_count + " "} {this.props.t("view_count", { count: this.state.video.view_count ? this.state.video.view_count : 0 })} </span>
                                                        </div>
                                                        
                                                        <div className="vLDetailLikeShare">
                                                            <div className="LikeDislikeWrap">
                                                                <ul className="LikeDislikeList">
                                                                
                                                                
                                                                    {
                                                                    this.state.video.approve == 1 ? 
                                                                    <React.Fragment>
                                                                    <li>
                                                                        <Like icon={true} {...this.props} like_count={this.state.video.like_count} item={this.state.video} type="video" id={this.state.video.video_id} />{"  "}
                                                                    </li>
                                                                    <li>
                                                                        <Dislike icon={true} {...this.props} dislike_count={this.state.video.dislike_count} item={this.state.video} type="video" id={this.state.video.video_id} />{"  "}
                                                                    </li>
                                                                    <li>
                                                                        <Favourite icon={true} {...this.props} favourite_count={this.state.video.favourite_count} item={this.state.video} type="video" id={this.state.video.video_id} />{"  "}
                                                                    </li>
                                                                    </React.Fragment>
                                                                    : null
                                                                    }
                                                                    {
                                                                    this.state.video.approve == 1 ? 
                                                                    
                                                                        this.props.pageInfoData.appSettings["enable_playlist"] == 1 && (!this.props.pageInfoData.loggedInUserDetails || this.props.pageInfoData.levelPermissions['playlist.create'] == 1) ?
                                                                        <li>
                                                                            <a className="addPlaylist" title={Translate(this.props, "Save to playlist")} onClick={this.playlistOpen} href="#">
                                                                                    <span className="material-icons">playlist_add</span>
                                                                            </a>                                                                                
                                                                        </li>
                                                                        : null
                                                                     : null
                                                                    }
                                                                    {
                                                                    this.state.video.approve == 1 && this.props.pageInfoData.appSettings['video_embed_code'] ? 
                                                                        <li>
                                                                            <a className="embedvideo" title={Translate(this.props, "Embed")} onClick={(e) => {e.preventDefault();this.setState({localUpdate:true,"embed":this.state.embed ? false : true})}} href="#">
                                                                                    <span className="material-icons">code</span>
                                                                            </a>                                                                                
                                                                        </li>
                                                                        : null
                                                                    }
                                                                    {
                                                                    this.state.video.approve == 1 ? 
                                                                        <SocialShare {...this.props} hideTitle={true} className="video_share" buttonHeightWidth="30" tags={this.state.video.tags} url={`/watch/${this.state.video.custom_url}`} title={this.state.video.title} imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.video.image} />
                                                                        : null
                                                                    }
                                                                    <li>
                                                                        <div className="dropdown TitleRightDropdown">
                                                                            <a href="#" data-toggle="dropdown"><span className="material-icons">more_horiz</span></a>
                                                                                <ul className="dropdown-menu dropdown-menu-right edit-options">
                                                                                {
                                                                                    this.state.video.canEdit ?
                                                                                        <li>
                                                                                            <Link href="/create-video" customParam={`videoId=${this.state.video.custom_url}`} as={`/create-video/${this.state.video.custom_url}`}>
                                                                                                <a href={`/create-video/${this.state.video.custom_url}`}><span className="material-icons">edit</span>{Translate(this.props, "Edit")}</a>
                                                                                            </Link>
                                                                                        </li>
                                                                                        : null
                                                                                }
                                                                                {
                                                                                    this.state.video.canDelete ?
                                                                                        <li>
                                                                                            <a onClick={this.deleteVideo.bind(this)} href="#"><span className="material-icons">delete</span>{Translate(this.props, "Delete")}</a>
                                                                                        </li>
                                                                                        : null
                                                                                }
                                                                                {
                                                                                this.state.video.approve == 1 ? 
                                                                                <li>
                                                                                    <a href="#" onClick={this.openReport.bind(this)}>
                                                                                    <span className="material-icons">flag</span>
                                                                                        {Translate(this.props, "Report")}
                                                                                    </a>
                                                                                </li>
                                                                                : null
                                                                             }
                                                                            </ul>
                                                                        </div>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>                

                                                    {
                                                        this.state.embed ? 
                                                        <div class="videoEmbed" >
                                                            <textarea name="embed" class="form-control" value={`<iframe src="${config.app_server}/embed/${this.state.video.custom_url}" frameborder="0" width="700" height="400" allowfullscreen><iframe>`}>
                                                                
                                                            </textarea> 
                                                        </div>
                                                    : null
                                                    }

                                                    {
                                                        this.props.pageInfoData.appSettings['video_tip'] == 1 && (this.state.video && this.state.video.tips) ?
                                                            <Donation {...this.props} item={this.state.video} item_id={this.state.video.video_id} item_type="video" />                          
                                                    : null
                                                    }
                                                    
                                                    <div className="videoDetailsUserInfo">
                                                        <div className="userInfoSubs">
                                                            <div className="UserInfo">
                                                                <div className="img">
                                                                    <Link href="/member" customParam={`memberId=${this.state.video.owner.username}`} as={`/${this.state.video.owner.username}`}>
                                                                        <a href={`/${this.state.video.owner.username}`}>
                                                                            <Image title={this.state.video.owner.displayname} image={this.state.video.owner.avtar} imageSuffix={this.props.pageInfoData.imageSuffix} />
                                                                        </a>
                                                                    </Link>
                                                                </div>
                                                                <div className="content">

                                                                    <Link href="/member" customParam={`memberId=${this.state.video.owner.username}`} as={`/${this.state.video.owner.username}`}>
                                                                        <a className="UserName" href={`/${this.state.video.owner.username}`}>
                                                                            <React.Fragment>
                                                                                {this.state.video.owner.displayname}
                                                                                {
                                                                                    this.props.pageInfoData.appSettings['member_verification'] == 1 && this.state.video.owner.verified ?
                                                                                        <span className="verifiedUser" title="verified"><span className="material-icons">check</span></span>
                                                                                        : null
                                                                                }
                                                                            </React.Fragment>
                                                                        </a>
                                                                    </Link>
                                                                    <span><Timeago {...this.props}>{this.state.video.creation_date}</Timeago></span>
                                                                </div>
                                                            </div>
                                                            <div className="userSubs">
                                                                <MemberFollow  {...this.props} type="members" user={this.state.video.owner} user_id={this.state.video.owner.follower_id} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="details-tab">
                                                        <ul className="nav nav-tabs" id="myTab" role="tablist">
                                                            <li className="nav-item">
                                                                <a className="nav-link active" data-toggle="tab" href="#about" role="tab" aria-controls="about" aria-selected="true">{Translate(this.props, "About")}</a>
                                                            </li>
                                                            {
                                                                this.props.pageInfoData.video.donors && this.props.pageInfoData.video.donors.results.length ?
                                                                    <li className="nav-item">
                                                                        <a className="nav-link" data-toggle="tab" href="#donors" role="tab" aria-controls="donors" aria-selected="true">{Translate(this.props, "Donors")}</a>
                                                                    </li>
                                                                    : null
                                                            }
                                                            {
                                                                this.props.pageInfoData.video.artists && this.props.pageInfoData.video.artists.results.length ?
                                                                    <li className="nav-item">
                                                                        <a className="nav-link" data-toggle="tab" href="#artists" role="tab" aria-controls="artists" aria-selected="true">{Translate(this.props, "Artists")}</a>
                                                                    </li>
                                                                    : null
                                                            }
                                                            {
                                                                this.props.pageInfoData.appSettings[`${"video_comment"}`] == 1 && this.state.video.approve == 1?
                                                                    <li className="nav-item">
                                                                        <a className="nav-link" data-toggle="tab" href="#comments" role="tab" aria-controls="comments" aria-selected="true">{`${ShortNumber(this.state.video.comment_count ? this.state.video.comment_count : 0)}`}{" "}{Translate(this.props, "Comments")}</a>
                                                                    </li>
                                                                    : null
                                                            }
                                                        </ul>
                                                        <div className="tab-content" id="myTabContent">
                                                            <div className="tab-pane fade active show" id="about" role="tabpanel">
                                                                <div className="details-tab-box">
                                                                    {
                                                                        this.props.pageInfoData.appSettings[`${"video_rating"}`] == 1 && this.state.video.approve == 1 ?
                                                                            <div className="animated-rater">
                                                                                 <div className="tabInTitle"><h6>{Translate(this.props,'Rating')}</h6>
                                                                                    <div className="channel_description">
                                                                                     <Rating {...this.props}  rating={this.state.video.rating} type="video" id={this.state.video.video_id} />
                                                                                    </div>
                                                                                 </div>                                                                                 
                                                                            </div>
                                                                            : null
                                                                    }
                                                                    {
                                                                        this.props.pageInfoData.appSettings['video_donation'] && this.state.video.approve == 1 && this.state.video.donation && this.state.video.paypal_email && (!this.props.pageInfoData.loggedInUserDetails || (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id != this.state.video.owner_id)) ?
                                                                            <div className="animated-rater">
                                                                                <div className="tabInTitle"><h6>{Translate(this.props,'Donate')}</h6></div>
                                                                                <div className="channel_description">
                                                                                    <button onClick={this.donationFunction} >{Translate(this.props, 'Donate')}</button>
                                                                                </div>
                                                                            </div>
                                                                        : null
                                                                    }
                                                                    {
                                                                        this.state.video.description ?
                                                                            <React.Fragment>
                                                                                <div className="tabInTitle"><h6>{Translate(this.props, "Description")}</h6></div>
                                                                                <div className="channel_description" id="VideoDetailsDescp" style={{ ...this.state.styles, whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{__html:this.linkify(this.state.video.description)}}>
                                                                                    {/* <Linkify componentDecorator={this.componentDecorator}>{this.state.video.description}</Linkify> */}
                                                                                </div>
                                                                                {
                                                                                    this.state.showMore ?
                                                                                        <div className="VideoDetailsDescpBtn text-center">
                                                                                            <a href="#" onClick={this.showMore.bind(this)} className="morelink">{Translate(this.props, this.state.showMoreText)}</a>
                                                                                        </div>
                                                                                        : null
                                                                                }
                                                                            </React.Fragment>
                                                                            : null
                                                                    }

                                                                    {
                                                                        this.state.video.category ?
                                                                            <React.Fragment>
                                                                                <div className="tabInTitle categories_cnt"><h6>{Translate(this.props, "Category")}</h6>
                                                                                <div className="boxInLink">
                                                                                    {
                                                                                        <Link href={`/category`} customParam={`type=video&categoryId=` + this.state.video.category.slug} as={`/video/category/` + this.state.video.category.slug}>
                                                                                            <a>
                                                                                                {<CensorWord {...this.props} text={this.state.video.category.title} />}
                                                                                            </a>
                                                                                        </Link>
                                                                                    }
                                                                                </div>
                                                                                {
                                                                                    this.state.video.subcategory ?
                                                                                        <React.Fragment>
                                                                                            {/* <span> >> </span> */}
                                                                                            <div className="boxInLink">
                                                                                                <Link href={`/category`} customParam={`type=video&categoryId=` + this.state.video.subcategory.slug} as={`/video/category/` + this.state.video.subcategory.slug}>
                                                                                                    <a >
                                                                                                        {<CensorWord {...this.props} text={this.state.video.subcategory.title} />}

                                                                                                    </a>
                                                                                                </Link>
                                                                                            </div>
                                                                                            {
                                                                                                this.state.video.subsubcategory ?
                                                                                                    <React.Fragment>
                                                                                                        {/* <span> >> </span> */}
                                                                                                        <div className="boxInLink">
                                                                                                            <Link href={`/category`} customParam={`type=video&categoryId=` + this.state.video.subsubcategory.slug} as={`/video/category/` + this.state.video.subsubcategory.slug}>
                                                                                                                <a>
                                                                                                                    {<CensorWord {...this.props} text={this.state.video.subsubcategory.title} />}

                                                                                                                </a>
                                                                                                            </Link>
                                                                                                        </div>
                                                                                                    </React.Fragment>
                                                                                                    : null
                                                                                            }
                                                                                        </React.Fragment>
                                                                                        : null
                                                                                }
                                                                                </div>
                                                                            </React.Fragment>
                                                                            : null
                                                                    }

                                                                    {
                                                                        this.state.video.tags && this.state.video.tags != "" ?
                                                                            <div className="blogtagListWrap">
                                                                                <div className="tabInTitle">
                                                                                    <h6>{Translate(this.props, "Tags")}</h6>
                                                                                    <ul className="TabTagList clearfix">
                                                                                        {
                                                                                            this.state.video.tags.split(',').map(tag => {
                                                                                                return (
                                                                                                    <li key={tag}>
                                                                                                        <Link href="/videos" customParam={`tag=${tag}`} as={`/videos?tag=${tag}`}>
                                                                                                            <a>{<CensorWord {...this.props} text={tag} />}</a>
                                                                                                        </Link>
                                                                                                    </li>
                                                                                                )
                                                                                            })
                                                                                        }
                                                                                    </ul>
                                                                                </div>
                                                                                
                                                                            </div>
                                                                            : null
                                                                    }

                                                                </div>


                                                            </div>
                                                            {
                                                                this.props.pageInfoData.video.donors && this.props.pageInfoData.video.donors.results.length ?
                                                                    <div className="tab-pane fade" id="donors" role="tabpanel">
                                                                        <div className="details-tab-box">
                                                                            <Members  {...this.props} globalSearch={true}  channel_members={this.props.pageInfoData.video.donors.results} channel_pagging={this.props.pageInfoData.video.donors.pagging} video_id={this.props.pageInfoData.video.video_id} />
                                                                        </div>
                                                                    </div>
                                                                    : null
                                                            }
                                                            {
                                                                this.props.pageInfoData.appSettings[`${"video_comment"}`] == 1 && this.state.video.approve == 1 ?
                                                                    <div className="tab-pane fade" id="comments" role="tabpanel">
                                                                        <div className="details-tab-box">
                                                                            <Comment  {...this.props}  owner_id={this.state.video.owner_id} hideTitle={true} appSettings={this.props.pageInfoData.appSettings} commentType="video" type="videos" id={this.state.video.video_id} />
                                                                        </div>
                                                                    </div>
                                                                    : null
                                                            }
                                                            {
                                                                this.props.pageInfoData.video.artists && this.props.pageInfoData.video.artists.results.length ?
                                                                    <div className="tab-pane fade" id="artists" role="tabpanel">
                                                                        <div className="details-tab-box">
                                                                            <Artists showData={4} className="artist_img" fromVideo={true} canDelete={this.props.pageInfoData.video.canDelete}  {...this.props}  artists={this.props.pageInfoData.video.artists.results} pagging={this.props.pageInfoData.video.artists.pagging} video_id={this.props.pageInfoData.video.video_id} />
                                                                        </div>
                                                                    </div>
                                                                    : null
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                }
                                <div className="col-xl-3 col-lg-4 videoSidebar" style={{ marginTop: !this.state.fullWidth && !this.state.adult ? this.state.height : "0px" }}>
                                    {
                                        this.state.playlistVideos ?
                                            <div className="PlaylistSidebar">
                                                <div className="playlist_name">
                                                        <p>{<CensorWord {...this.props} text={this.state.playlist.title} />}</p>
                                                        <p>
                                                            <Link href="/member" customParam={`memberId=${this.state.playlist.owner.username}`} as={`/${this.state.playlist.owner.username}`}>
                                                                <a>
                                                                    {this.state.playlist.owner.displayname}
                                                                </a>
                                                            </Link>
                                                            {
                                                                " - " + currentPlaying + " / " + this.state.playlistVideos.length
                                                            }
                                                        </p>
                                                    </div>
                                                <div className="playlist_videos_list">
                                                    
                                                    <div className="playlist_videos">
                                                        {
                                                            this.state.playlistVideos.map((video, index) => {
                                                                return (
                                                                    <div className={`playlistscroll playlistGroup${currentPlaying == index+1 ? " active" : ""}`} key={index}>
                                                                        <div>
                                                                            {index + 1}
                                                                        </div>
                                                                        <div className="sidevideoWrap">
                                                                            <div className="videoImg">
                                                                                <Link href="/watch" customParam={`videoId=${video.custom_url}&list=${this.state.playlist.custom_url}`} as={`/watch/${video.custom_url}?list=${this.state.playlist.custom_url}`}>
                                                                                    <a>
                                                                                        <Image title={video.title} image={video.image} imageSuffix={this.props.pageInfoData.imageSuffix} />
                                                                                    </a>
                                                                                </Link>
                                                                                <span className="time">{
                                                                                    video.duration ?
                                                                                        video.duration
                                                                                        : null
                                                                                }</span>
                                                                                <span className="watchPlayBtn" style={{display:"none"}}>
                                                                                    <WatchLater className="watchLater" icon={true} {...this.props} item={video} id={video.video_id} />
                                                                                    <Link href="/watch" customParam={`videoId=${video.custom_url}&list=${this.state.playlist.custom_url}`} as={`/watch/${video.custom_url}?list=${this.state.playlist.custom_url}`}>
                                                                                        <a>
                                                                                            <span className="material-icons">play_arrow</span>
                                                                                        </a>
                                                                                    </Link>
                                                                                </span>
                                                                            </div>
                                                                            <div className="sideVideoContent">
                                                                                <Link href="/watch" customParam={`videoId=${video.custom_url}&list=${this.state.playlist.custom_url}`} as={`/watch/${video.custom_url}?list=${this.state.playlist.custom_url}`}>
                                                                                    <a className="videoTitle">{<CensorWord {...this.props} text={video.title} />}</a>
                                                                                </Link>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                    </div>

                                                </div>
                                            </div>
                                            : null
                                    }

                                    {
                                       this.state.width > 992 && this.state.video && this.state.video.approve == 1 && this.state.video.enable_chat == 1 && this.state.video.is_livestreaming == 1 && (this.state.video.channel_name || this.state.video.mediaserver_stream_id) ? 
                                            <div className="ls_sidbar" style={{ height: !this.state.fullWidth && !this.state.adult ? this.state.height.replace("-",'') : "0px" }}>
                                                <Chat {...this.props} channel={this.state.video.channel_name} streamId={this.state.video.mediaserver_stream_id} custom_url={this.state.video.custom_url} comments={this.state.video.chatcomments ? this.state.video.chatcomments : []} />
                                            </div>    
                                        : null
                                    }

                                    {
                                        this.props.pageInfoData.appSettings['sidebar_video'] ?
                                            <AdsIndex paddingTop="20px" className="sidebar_video" ads={this.props.pageInfoData.appSettings['sidebar_video']} />
                                            : null
                                    }
                                    {
                                        this.state.relatedVideos && this.state.relatedVideos.length > 0 ?
                                            <RelatedVideos {...this.props} playlist={this.state.playlistVideos}  videos={this.state.relatedVideos} />
                                            : null
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData,
        menuOpen:state.search.menuOpen
    };
};
const mapDispatchToProps = dispatch => {
    return {
        setMenuOpen: (status) => dispatch(playlist.setMenuOpen(status)),
        setPageInfoData: (data) => dispatch(playlist.setPageInfoData(data)),
        openPlaylist: (open, video_id) => dispatch(playlist.openPlaylist(open, video_id)),
        openToast: (message, typeMessage) => dispatch(playlist.openToast(message, typeMessage)),
        openReport: (status, contentId, contentType) => dispatch(playlist.openReport(status, contentId, contentType)),
        updatePlayerData: (relatedVideos, playlistVideos, currentVideo, deleteMessage, deleteTitle,liveStreamingURL) => dispatch(playlist.updatePlayerData(relatedVideos, playlistVideos, currentVideo, deleteMessage, deleteTitle,liveStreamingURL))
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Index);