import React from "react"
import Image from "../Image/Index"
import { connect } from "react-redux";

import UserTitle from "../User/Title"
import Link from "../../components/Link/index";

import SocialShare from "../SocialShare/Index"
import ShortNumber from "short-number"

import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import WatchLater from "../WatchLater/Index"
import Timeago from "../Common/Timeago"
import axios from "../../axios-orders"
import swal from 'sweetalert'
import Translate from "../../components/Translate/Index";
 
import Analytics from "../Dashboard/StatsAnalytics"

import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'

import Player from "./Player"

import OutsidePlayer from "./OutsidePlayer"

class Item extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            video: props.video,
            hover:false
        }
    }
    componentDidMount(){
        this.width = window.innerWidth
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (prevState.video != nextProps.video || prevState.hover != nextProps.hover) {
           return { video: nextProps.video }
        } else{
            return null
        }

    }
    shouldComponentUpdate(nextProps,nextState){
        if(nextProps.video != this.props.video || this.state.hover != nextProps.hover || this.state.analytics != nextState.analytics){
            return true
        }
        return false
    }
    playlistOpen = (e) => {
        e.preventDefault()
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {    
            this.props.openPlaylist(true, this.state.video.video_id)
        }
    }
    deleteVideo = (e) => {
        e.preventDefault()
        let message = !this.props.contentType ? Translate(this.props, "Once deleted, you will have to again add the video.") : Translate(this.props, "Once deleted, you will not be able to recover this!")
        swal({
            title: Translate(this.props, "Are you sure?"),
            text: message,
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()

                    let url = "/channels/delete-video"
                    formData.append('video_id', this.state.video.video_id)
                    if (!this.props.contentType) {
                        formData.append('channel_id', this.props.channel_id)
                    } else {
                        url = "/videos/delete"
                    }
                    axios.post(url, formData)
                        .then(response => {
                        }).catch(err => {
                            swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
                        });
                    //delete
                } else {

                }
            });
    }
    analytics = ( e) => {
        e.preventDefault()
        this.setState({localUpdate:true, analytics: true })
    }
    closePopup = (e) => {
        this.setState({localUpdate:true, analytics: false })
    }
    hoverOn = () => {
        if(!this.props.canDelete && !this.props.canEdit && this.width > 992 && this.props.pageInfoData.appSettings['video_preview'] == 1 && this.state.video.is_livestreaming != "1"){
           if(!this.state.video.password && (!this.state.video.adult || (this.state.video.adult && this.props.pageInfoData.adultAllowed)))
            this.setState({localUpdate:true,hover:true})
        }
    }
    hoverOff = () => {
        this.setState({localUpdate:true,hover:false})
    }
    render() {
        let playlist_id = null
        let stringId = ""
        let customParams = ""
        if (this.props.playlist_id) {
            playlist_id = this.props.playlist_id
            stringId = "?list=" + playlist_id
            customParams = "&list=" + playlist_id
        }

        let analyticsData = null
        if (this.state.analytics) { 
            analyticsData = <div className="popup_wrapper_cnt">
                <div className="popup_cnt" style={{ maxWidth: "60%" }}>
                    <div className="comments">
                        <div className="VideoDetails-commentWrap">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{Translate(this.props, "Analytics")}</h2>
                                <a onClick={this.closePopup} className="_close"><i></i></a>
                            </div>
                            <Analytics {...this.props} id={this.state.video.video_id} type="videos" />
                        </div>
                    </div>
                </div>
            </div>
        }


        let videoImage = this.state.video.image
        
        if(this.props.pageInfoData.livestreamingtype == 0 && this.state.video.mediaserver_stream_id &&  !this.state.video.orgImage && this.state.video.is_livestreaming == 1){
            videoImage = `${this.props.pageInfoData.liveStreamingServerURL}:5443/LiveApp/previews/${this.state.video.mediaserver_stream_id}.png`
        }else  if(this.state.video.mediaserver_stream_id &&  this.state.video.image && this.state.video.image.indexOf('LiveApp/previews') > -1){
            videoImage = `${this.props.pageInfoData.liveStreamingServerURL}:5443${this.state.video.image}`
        }

        return (
            
            <React.Fragment>
                {analyticsData}

                <div className="ptv_videoList_wrap">
                    <div className="videoList_thumb" onMouseEnter={() => this.hoverOn()} onMouseLeave={() => this.hoverOff()} >
                        <Link href="/watch" onClick={this.props.closePopUp} customParam={`videoId=${this.state.video.custom_url}${customParams}`} as={`/watch/${this.state.video.custom_url}${stringId}`}>
                            <a>
                                {
                                    this.state.hover && this.state.video.type == 3 ?
                                            <Player showControls={false} updateTime={false} muted={true} {...this.props} height="188px" imageSuffix={this.props.pageInfoData.imageSuffix} video={this.state.video} {...this.state.video} />
                                : this.state.hover  ?
                                            <OutsidePlayer muted={true} updateTime={false} showControls={false} {...this.props} height="188px" imageSuffix={this.props.pageInfoData.imageSuffix} video={this.state.video}  {...this.state.video} />
                                    :
                                            <Image title={renderToString(<CensorWord {...this.props} text={this.state.video.title} />)} image={videoImage} imageSuffix={this.props.pageInfoData.imageSuffix} />
                                }
                            </a>
                        </Link>
                        {
                            this.state.video.duration ?
                                <span className="videoTime">{this.state.video.duration}</span>
                                : null
                        }
                        {
                            this.state.video.is_livestreaming && (this.state.video.channel_name || this.state.video.mediaserver_stream_id) ? 
                                <span className="videoTime live_now_cnt">
                                    {Translate(this.props,'LIVE NOW')}
                                </span>
                            : null
                        }
                        <div className="playBtn">
                            <Link href="/watch" customParam={`videoId=${this.state.video.custom_url}${customParams}`} as={`/watch/${this.state.video.custom_url}${stringId}`}>
                                <a onClick={this.props.closePopUp}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                        fill="white" width="36px" height="36px" className="playicon">
                                        <path d="M0 0h24v24H0z" fill="none" />
                                        <path
                                            d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                                    </svg>
                                </a>
                            </Link>
                        </div>
                        <div className="btnBoxHover">
                        {
                            this.props.pageInfoData.appSettings['videos_watchlater'] == 1 ?
                                <WatchLater className="watchlater" icon={true} {...this.props} item={this.state.video} id={this.state.video.video_id} />
                            : null
                        }
                        {
                            this.props.pageInfoData.appSettings["videos_playlist"] == 1 && this.props.pageInfoData.appSettings["enable_playlist"] == 1 && (!this.props.pageInfoData.levelPermissions || this.props.pageInfoData.levelPermissions['playlist.create'] == 1) && !playlist_id ?
                                <a className="playlist" title={Translate(this.props, "Save to playlist")} onClick={this.playlistOpen} href="#">
                                    <span className="material-icons">playlist_add</span>
                                </a>
                                : null
                        }
                        </div>
                             <div className="labelBtn">
                             {
                                this.props.pageInfoData.appSettings['videos_featuredlabel'] == 1 && this.props.pageInfoData.appSettings['video_featured'] == 1 && this.state.video.is_featured == 1 ?
                                <span className="lbl-Featured" title={Translate(this.props, "Featured Video")}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                </span>
                                : null
                            }
                                    {
                            this.props.pageInfoData.appSettings['videos_sponsoredLabel'] == 1 && this.props.pageInfoData.appSettings['video_sponsored'] == 1 && this.state.video.is_sponsored == 1 ?
                                <span className="lbl-Sponsored" title={Translate(this.props, "Sponsored Video")}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                </span>
                                : null
                        }
                        {
                            this.props.pageInfoData.appSettings['videos_hotLabel'] == 1 && this.props.pageInfoData.appSettings['video_hot'] == 1 && this.state.video.is_hot == 1 ?
                                <span className="lbl-Hot" title={Translate(this.props, "Hot Video")}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                </span>
                                : null
                        }
                                </div>
                             
                        
                        
                    </div>
                    <div className="videoList_content">
                        <div className={`videoTitle${this.props.canDelete || this.props.canEdit  || this.props.pageInfoData.appSettings["videos_share"] == 1 ? " edit-video-btn" : ""}`}>
                            <Link href="/watch" customParam={`videoId=${this.state.video.custom_url}${customParams}`} as={`/watch/${this.state.video.custom_url}${stringId}`}>
                                <a  onClick={this.props.closePopUp}>
                                    <h4>{<CensorWord {...this.props} text={this.state.video.title} />}</h4>
                                </a>
                            </Link>

                            {
                                this.props.canDelete || this.props.canEdit || this.props.pageInfoData.appSettings["videos_share"] == 1 ? 
                            <div className="dropdown TitleRightDropdown">
                                <a href="#" data-toggle="dropdown"><span className="material-icons">more_vert</span></a>
                                <ul className="dropdown-menu dropdown-menu-right edit-options">
                                    {
                                        this.props.canEdit ?
                                            <li>
                                                <Link href="/create-video" customParam={`videoId=${this.state.video.custom_url}`} as={`/create-video/${this.state.video.custom_url}`}>
                                                    <a className="addPlaylist addEdit"  title={Translate(this.props, "Edit")}>
                                                    <span className="material-icons">edit</span>
                                                    {Translate(this.props, "Edit")}
                                                    </a>
                                                </Link>
                                            </li>
                                            : null
                                    }
                                     {
                                            this.props.canDelete ?
                                            <li>
                                                <a className="addPlaylist addDelete" title={Translate(this.props, "Delete")} href="#" onClick={this.deleteVideo}>
                                                <span className="material-icons">delete</span>
                                                {Translate(this.props, "Delete")}
                                                </a>
                                            </li>
                                            : null
                                    }
                                    {
                                        this.props.canEdit ?
                                                <li>
                                                    <a href="#" className="addPlaylist addEdit" onClick={this.analytics} title={Translate(this.props, "Analytics")}>
                                                    <span className="material-icons">show_chart</span>
                                                    {Translate(this.props, "Analytics")}
                                                    </a>
                                                </li>
                                            : null
                                    }
                                    {
                                        this.props.pageInfoData.appSettings["videos_share"] == 1 ?
                                    <SocialShare {...this.props} buttonHeightWidth="30" tags={this.state.video.tags} url={`/watch/${this.state.video.custom_url}`} title={renderToString(<CensorWord {...this.props} text={this.state.video.title} />)} imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.video.image} />
                                    : null
                                    }
                                    {
                                        this.props.pageInfoData.appSettings["videos_playlist"] == 1 && this.props.pageInfoData.appSettings["enable_playlist"] == 1 && (!this.props.pageInfoData.levelPermissions || this.props.pageInfoData.levelPermissions['playlist.create'] == 1) && !playlist_id ?
                                            <li>
                                            <a className="playlist" title={Translate(this.props, "Save to playlist")} onClick={this.playlistOpen} href="#">
                                                <span className="material-icons">playlist_add</span>
                                                {Translate(this.props, "Save to playlist")}
                                            </a>
                                            </li>
                                            : null
                                    }
                                </ul>
                            </div>
                            : null
                            }
                        </div>
                        
                        <div className="videoInfo">
                            <span className="username">
                                {
                                this.props.pageInfoData.appSettings["videos_username"] == 1  ? 
                                    <UserTitle className=""  onClick={this.props.closePopUp} {...this.props} data={this.state.video} />
                                : null
                                }
                            </span>
                            
                            <span className="videoViewDate">
                                {
                                    this.props.pageInfoData.appSettings["videos_views"] == 1  ? 
                                <span>{`${ShortNumber(this.state.video.view_count ? this.state.video.view_count : 0)}`}{" "}{this.props.t("view_count", { count: this.state.video.view_count ? this.state.video.view_count : 0 })}</span>
                                : null
                                }

                                {
                            this.props.pageInfoData.appSettings["videos_views"] == "1" && this.props.pageInfoData.appSettings["videos_datetime"] == "1" ?
                                <span className="seprater">|</span>
                            : null
                            }
                                {
                                    this.props.pageInfoData.appSettings["videos_datetime"] == 1  ? 
                                        <span><Timeago {...this.props}>{this.state.video.creation_date}</Timeago></span>
                                    : null
                                }
                            </span>
                        </div>
                        {
                            this.state.video.is_livestreaming == 1 && this.state.video.channel_name ? 
                                <div className="videoInfo">
                                    <span className="videoViewDate">
                                        <span>{`${ShortNumber(this.state.video.total_viewer ? this.state.video.total_viewer : 0)}`}{" "}{this.props.t("viewer_watching_count", { count: this.state.video.total_viewer ? this.state.video.total_viewer : 0 })}</span>
                                    </span>
                                </div>
                            : null
                        }
                        <div className="LikeDislikeWrap">
                            <ul className="LikeDislikeList">
                                {
                                    this.props.pageInfoData.appSettings["videos_like"] == 1  ? 
                                <li>
                                    <Like icon={true} {...this.props} like_count={this.state.video.like_count} item={this.state.video} type="video" id={this.state.video.video_id} />{"  "}
                                </li>
                                : null
                                }
                                {
                                    this.props.pageInfoData.appSettings["videos_dislike"] == 1  ? 
                                <li>
                                    <Dislike icon={true} {...this.props} dislike_count={this.state.video.dislike_count} item={this.state.video} type="video" id={this.state.video.video_id} />{"  "}
                                </li>
                                : null
                                    }
                                {
                                    this.props.pageInfoData.appSettings["videos_favourite"] == 1  ? 
                                <li>
                                    <Favourite icon={true} {...this.props} favourite_count={this.state.video.favourite_count} item={this.state.video} type="video" id={this.state.video.video_id} />{"  "}
                                </li>
                                : null
                            }
                            </ul>
                        </div>
                        
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};
export default connect(mapStateToProps)(Item)
