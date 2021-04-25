import React from "react"

import { connect } from "react-redux";
import * as actions from '../../store/actions/general';

import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import WatchLater from "../WatchLater/Index"
import Link from "../../components/Link/index"
import Image from "../Image/Index"
import ShortNumber from "short-number"
import Translate from "../../components/Translate/Index";
import { renderToString } from 'react-dom/server'
import CensorWord from "../CensoredWords/Index"
import UserTitle from "../User/Title"
import Timeago from "../Common/Timeago"

class Videos extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            videos: props.videos,
            playlist:props.playlist,
            autoPlay: typeof window != "undefined" && localStorage.getItem("autoplay") ?  true : false
        }
        this.playlistOpen = this.playlistOpen.bind(this)
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.videos != prevState.videos || nextProps.playlist != prevState.playlist) {
            return { videos: nextProps.videos,playlist:nextProps.playlist }
        } else{
            return null
        }
    }
    getItemIndex(item_id) {
        const videos = [...this.state.videos];
        const itemIndex = videos.findIndex(p => p["video_id"] == item_id);
        return itemIndex;
    }
    componentDidMount() {
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == "videos") {
                const items = [...this.state.videos]
                const changedItem = { ...items[itemIndex] }
                changedItem.rating = rating
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, videos: items })
            }
        });
        this.props.socket.on('videoDeleted', data => {
            let id = data.video_id
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1) {
                const items = [...this.state.videos]
                items.splice(itemIndex, 1);
                this.setState({localUpdate:true, videos: items })
            }
        });
        this.props.socket.on('unwatchlater', data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1) {
                const items = [...this.state.videos]
                const changedItem = { ...items[itemIndex] }
                if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    changedItem.watchlater_id = null
                }
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, videos: items })
            }
        });
        this.props.socket.on('watchlater', data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1) {
                const items = [...this.state.videos]
                const changedItem = { ...items[itemIndex] }
                if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    changedItem.watchlater_id = 1
                }
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, videos: items })
            }
        });


        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "videos") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.videos]
                    const changedItem = { ...items[itemIndex] }
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, videos: items })
                }
            }
        });
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "videos") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.videos]
                    const changedItem = { ...items[itemIndex] }
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, videos: items })
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
            if (itemType == "videos") {
                const itemIndex = this.getItemIndex(itemId)
                if (itemIndex > -1) {
                    const items = [...this.state.videos]
                    const changedItem = { ...items[itemIndex] }
                    let loggedInUserDetails = {}
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
                        loggedInUserDetails = this.props.pageInfoData.loggedInUserDetails
                    }
                    if (removeLike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = null
                        changedItem['like_count'] = parseInt(changedItem['like_count']) - 1
                    }
                    if (removeDislike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = null
                        changedItem['dislike_count'] = parseInt(changedItem['dislike_count']) - 1
                    }
                    if (insertLike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = "like"
                        changedItem['like_count'] = parseInt(changedItem['like_count']) + 1
                    }
                    if (insertDislike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = "dislike"
                        changedItem['dislike_count'] = parseInt(changedItem['dislike_count']) + 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, videos: items })
                }
            }
        });
    }
    autoPlay = () => {
        localStorage.setItem("autoplay",true)
        this.setState({localUpdate:true,autoPlay:!this.state.autoPlay})
    }
    playlistOpen = (video_id,e) => {
        e.preventDefault()
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {    
            this.props.openPlaylist(true, video_id)
        }
    }
    render() {
        if (!this.state.videos) {
            return null
        }
        return (
            <React.Fragment>
                {
                    !this.state.playlist && this.props.pageInfoData.appSettings['video_autoplay'] == 1 && this.props.pageInfoData.appSettings['enable_iframely'] == 0? 
                <div className="autoPlayWrap">
                    <div className="nextVideo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M16,18H18V6H16M6,18L14.5,12L6,6V18Z"></path></svg>
                     {Translate(this.props,'Up next')}</div>
                    <div className="autpplayBtnwrap">
                        <div className="custom-control custom-switch autoplayBtn">              
                            <input type="checkbox" className="custom-control-input" onChange={this.autoPlay} checked={this.state.autoPlay} id="Autoplay" />
                            <label className="custom-control-label" htmlFor="Autoplay">{Translate(this.props,'Autoplay')}</label>
                        </div>
                    </div>
                </div>
                : null
                }
                {
                    this.state.videos.map(video => {
                        let videoImage = video.image
        
                        if(this.props.pageInfoData.livestreamingtype == 0 && video.mediaserver_stream_id &&  !video.orgImage && video.is_livestreaming == 1){
                            videoImage = `${this.props.pageInfoData.liveStreamingServerURL}:5443/LiveApp/previews/${video.mediaserver_stream_id}.png`
                        }else  if(video.mediaserver_stream_id &&  video.image && video.image.indexOf('LiveApp/previews') > -1){
                            videoImage = `${this.props.pageInfoData.liveStreamingServerURL}:5443${video.image}`
                        }
                        return (
                            <div key={video.video_id} className="sidevideoWrapOutr">
                                <div key={video.video_id} className="ptv_videoList_wrap sidevideoWrap">
                                <div className="videoList_thumb" >
                                    <Link href="/watch" customParam={`videoId=${video.custom_url}`} as={`/watch/${video.custom_url}`}>
                                        <a>
                                            <Image title={renderToString(<CensorWord {...this.props} text={video.title} />)} image={videoImage} imageSuffix={this.props.pageInfoData.imageSuffix} />
                                        </a>
                                    </Link>
                                    {
                                        video.duration ?
                                            <span className="videoTime">{video.duration}</span>
                                            : null
                                    }
                                    <div className="playBtn">
                                        <Link href="/watch" customParam={`videoId=${video.custom_url}`} as={`/watch/${video.custom_url}`}>
                                            <a>
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
                                            <WatchLater className="watchlater" icon={true} {...this.props} item={video} id={video.video_id} />
                                        : null
                                    }
                                    {
                                        this.props.pageInfoData.appSettings["videos_playlist"] == 1 && this.props.pageInfoData.appSettings["enable_playlist"] == 1 && (!this.props.pageInfoData.levelPermissions || this.props.pageInfoData.levelPermissions['playlist.create'] == 1) ?
                                            <a className="playlist" title={Translate(this.props, "Save to playlist")} onClick={(e) => this.playlistOpen(video.video_id,e)} href="#">
                                                <span className="material-icons">playlist_add</span>
                                            </a>
                                            : null
                                    }
                                    </div>
                                </div>

                                    <div className="videoList_content">
                                        <div className={`videoTitle`}>
                                            <Link href="/watch" customParam={`videoId=${video.custom_url}`} as={`/watch/${video.custom_url}`}>
                                                <a>
                                                    <h4>{<CensorWord {...this.props} text={video.title} />}</h4>
                                                </a>
                                            </Link>
                                        </div>
                                    <div className="videoInfo">
                                        <span className="username">
                                            {
                                            this.props.pageInfoData.appSettings["videos_username"] == 1  ? 
                                                <UserTitle className="" {...this.props} data={video} />
                                            : null
                                            }
                                        </span>
                                        
                                        <span className="videoViewDate">
                                            {
                                                this.props.pageInfoData.appSettings["videos_views"] == 1  ? 
                                            <span>{`${ShortNumber(video.view_count ? video.view_count : 0)}`}{" "}{this.props.t("view_count", { count: video.view_count ? video.view_count : 0 })}</span>
                                            : null
                                            }

                                            {
                                        this.props.pageInfoData.appSettings["videos_views"] == "1" && this.props.pageInfoData.appSettings["videos_datetime"] == "1" ?
                                            <span className="seprater">|</span>
                                        : null
                                        }
                                            {
                                                this.props.pageInfoData.appSettings["videos_datetime"] == 1  ? 
                                                    <span><Timeago {...this.props}>{video.creation_date}</Timeago></span>
                                                : null
                                            }
                                        </span>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
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
        openToast: (message, typeMessage) => dispatch(actions.openToast(message, typeMessage)),
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Videos)