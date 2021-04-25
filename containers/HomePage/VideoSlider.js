import React from "react"
import { connect } from "react-redux";
import TinySlider from 'tiny-slider-react';

import Translate from "../../components/Translate/Index"
import Link from "../../components/Link"
import CensorWord from "../CensoredWords/Index"
import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import SocialShare from "../SocialShare/Index"
import Timeago from "../Common/Timeago"
import Rater from 'react-rater'
import WatchLater from "../WatchLater/Index"

import ShortNumber from "short-number"
import { renderToString } from 'react-dom/server'

class VideoSlider extends React.Component {
    constructor(props) {
        super(props)
        let propsData = {...props}
        this.state = {
            videos: props.videos,
            id: 1,
            language:propsData.i18n.language,
            menuOpen:props.menuOpen
        }
        this.slider = null
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if(nextProps.videos != prevState.videos || nextProps.i18n.language != prevState.language){
            return {videos:nextProps.videos,language:nextProps.i18n.language}
        } else{
            return null
        }
    }
    componentDidMount() {
        this.props.socket.on('videoDeleted', data => {
            let id = data.video_id
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1) {
                const videos = [...this.state.videos]
                videos.splice(itemIndex, 1);
                this.setState({localUpdate:true, videos: videos })
            }
        })
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == "videos") {
                const items = [...this.state.videos]
                const changedItem = items[itemIndex]
                changedItem.rating = rating
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
                    const changedItem = items[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
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
                    const changedItem = items[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
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
                    const changedItem = items[itemIndex]
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
                    this.setState({localUpdate:true, videos: items })
                }
            }
        });
    }
    getItemIndex(item_id) {
        if (this.state.videos) {
            const items = [...this.state.videos];
            const itemIndex = items.findIndex(p => p.video_id == item_id);
            return itemIndex;
        } else {
            return -1;
        }
    }
    
    render() {
        if (!this.state.videos || !this.state.videos.length) {
            return null
        }
        
        const settings = {
            lazyload: false,
            nav: false,
            loop:false,
            mouseDrag: true,
            controlsText:["<span class='material-icons'>keyboard_arrow_left</span>", "<span class='material-icons'>keyboard_arrow_right</span>"],
          };
        return (
            
            <div className="SlideAdsWrap">
                <div id="snglFullWdth" className="snglFullWdth">
                <TinySlider ref={(el) => { this.slider = el; }} className="" settings={settings} >
                {
                   this.state.videos.map(item => {
                    
                        let isS3 = true
                        let background  = ""
                        let avtar = ""
                        if (item.image) {
                            const splitVal = item.image.split('/')
                            if (splitVal[0] == "http:" || splitVal[0] == "https:") {
                                isS3 = false
                            }
                        }
                        background = (isS3 ? this.props.pageInfoData.imageSuffix : "") + item.image
                        let isS3Avtar = true
                        if (item.avtar) {
                            const splitVal = item.avtar.split('/')
                            if (splitVal[0] == "http:" || splitVal[0] == "https:") {
                                isS3Avtar = false
                            }
                        }
                        avtar = (isS3Avtar ? this.props.pageInfoData.imageSuffix : "") + item.avtar
                        return(
                            <div className="item" key={item.video_id}>
                                <div className="ptvBannerWrap">
                                    <div className="ptvBanner_blur_img">
                                        <div style={{background:`url(${background})`}}></div>
                                    </div>
                                    <div className="container">
                                        <div className="row">
                                            <div className="ptvBanner_Content">
                                            {
                                                    this.props.pageInfoData.appSettings['videos_featuredlabel'] == 1 && this.props.pageInfoData.appSettings['video_featured'] == 1 && item.is_featured == 1 ?
                                                <h4 title={Translate(this.props,'Featured Videos')}>
                                                    <span className="lbl-Featured">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                                    </span>
                                                </h4>
                                                :null
                                            }
                                                <div className="ptvBanner_VideoInfo">
                                                    <Link href="/watch" customParam={`videoId=${item.custom_url}`} as={`/watch/${item.custom_url}`}>
                                                        <a>
                                                            <div className="BnnrThumb">
                                                                <img src={background} />
                                                            </div>
                                                        </a>
                                                    </Link>
                                                    <div className="video-title">
                                                        <div className="video_title_combo">
                                                            <div className="video-big-title">
                                                                <Link href="/watch" customParam={`videoId=${item.custom_url}`} as={`/watch/${item.custom_url}`}>
                                                                    <a>{<CensorWord {...this.props} text={item.title} />}</a>
                                                                </Link>
                                                            </div>

                                                            <div className="pvtBannerLike">
                                                                <ul className="LikeDislikeList">                                                            
                                                                {
                                                                     this.props.pageInfoData.appSettings["videos_like"] == 1  ? 
                                                                    <li>
                                                                        <Like icon={true} {...this.props} like_count={item.like_count} item={item} type="video" id={item.video_id} />{"  "}
                                                                    </li>
                                                                    : null
                                                                }
                                                                {
                                                                        this.props.pageInfoData.appSettings["videos_dislike"] == 1  ? 
                                                                    <li>
                                                                        <Dislike icon={true} {...this.props} dislike_count={item.dislike_count} item={item} type="video" id={item.video_id} />{"  "}
                                                                    </li>
                                                                    : null
                                                                }
                                                                    {
                                                                        this.props.pageInfoData.appSettings["videos_favourite"] == 1  ? 
                                                                    <li>
                                                                        <Favourite icon={true} {...this.props} favourite_count={item.favourite_count} item={item} type="video" id={item.video_id} />{"  "}
                                                                    </li>
                                                                    : null
                                                                }
                                                                    {
                                                                        this.props.pageInfoData.appSettings["videos_views"] == 1  ? 
                                                                    <li>
                                                                        <span title="Views"><span className="material-icons">visibility</span> {" " + `${ShortNumber(item.view_count ? item.view_count : 0)}`}</span>
                                                                    </li>
                                                                    : null
                                                                }         
                                                                {
                                                                    this.props.pageInfoData.appSettings['videos_watchlater'] == 1 && false ?
                                                                    <li>
                                                                        <WatchLater className="watchLater" icon={true} {...this.props} item={item} id={item.video_id} />
                                                                    </li>
                                                                : null
                                                                }                                                 
                                                                </ul>

                                                            </div>
                                                            <div className="VideoDtaeTime" style={{display:"none"}}>
                                                            {
                                                                item.duration ?
                                                                    <p className="duration">{item.duration}</p>
                                                                    : null
                                                            }
                                                            
                                                            {
                                                                this.props.pageInfoData.appSettings["videos_datetime"] == 1  ? 
                                                            <p className="date"><Timeago {...this.props}>{item.creation_date}</Timeago></p>
                                                            : null
                                                            }
                                                            </div>
                                                            {
                                                                this.props.pageInfoData.appSettings["videos_username"] == 1  ? 
                                                                    <div className="pvtBanner_userInfo">
                                                                        <div className="pvtBanner_userInfo_img">
                                                                            <Link className="username" href="/member" customParam={`memberId=${item.username}`} as={`/${item.username}`}>
                                                                                <a><img src={avtar} alt={item.username} /></a>
                                                                            </Link>
                                                                        </div>
                                                                        <div className="publisher-name">
                                                                            <Link className="username" href="/member" customParam={`memberId=${item.username}`} as={`/${item.username}`}>
                                                                                <a className="UserName">                                                                                   
                                                                                    <span className="username">{item.displayname} <span className="verifiedUser"><span className="material-icons">check</span></span></span>
                                                                                </a>
                                                                            </Link>
                                                                        </div>
                                                                        <div className="clear"></div>
                                                                    </div>
                                                            : null
                                                            }
                                                            <div className="videoBnrShare" style={{display:"none"}}>
                                                            {
                                                                this.props.pageInfoData.appSettings["videos_rating"] == 1 && this.props.pageInfoData.appSettings["video_rating"] == "1" ?
                                                                    <div className="rating">
                                                                        <Rater rating={item.rating} fractions={2} total={5} interactive={false} />
                                                                    </div>
                                                                    : null
                                                            }
                                                            {
                                                                    this.props.pageInfoData.appSettings["videos_share"] == 1  ? 
                                                                <SocialShare {...this.props} buttonHeightWidth="30" tags={item.tags} url={`/watch/${item.custom_url}`} title={renderToString(<CensorWord {...this.props} text={item.title} />)} imageSuffix={this.props.pageInfoData.imageSuffix} media={item.image} />
                                                                : null
                                                            }
                                                            </div>
                                                            
                                                        </div>
                                                        <div className="clear"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
               </TinySlider>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        menuOpen:state.search.menuOpen,
        pageInfoData: state.general.pageInfoData
    };
};

export default connect(mapStateToProps, null, null)(VideoSlider)