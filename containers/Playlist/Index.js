import React from "react"

import axios from "../../axios-orders"
import { connect } from "react-redux";

import playlist from '../../store/actions/general';

import InfiniteScroll from "react-infinite-scroll-component";
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import VideoItem from "../Video/Item"
import TopView from "./TopView"
import Linkify from "react-linkify"
import Comment from "../Comments/Index"
import Link from "../../components/Link/index"
import Date from "../Date"
import swal from 'sweetalert'
import Router from "next/router"
import Translate from "../../components/Translate/Index";
import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'
import ShortNumber from "short-number"
import Rating from "../Rating/Index"

import asyncComponent from '../../hoc/asyncComponent/asyncComponent';
const CarouselPlaylists = asyncComponent(() => {
    return import('./CarouselPlaylist');
});

 
class Playlist extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            page: 2,
            playlist: props.pageInfoData.playlist,
            items: props.pageInfoData.playlist ? props.pageInfoData.playlist.videos.results : null,
            pagging: props.pageInfoData.playlist ? props.pageInfoData.playlist.videos.pagging : null,
            adult:props.pageInfoData.adultPlaylist,
            relatedPlaylists:props.pageInfoData.relatedPlaylists
        }
        this.refreshContent = this.refreshContent.bind(this)
        this.loadMoreContent = this.loadMoreContent.bind(this)
        this.deletePlaylist = this.deletePlaylist.bind(this)
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.pageInfoData.playlist != prevState.playlist) {
            return {
                page:2, 
                playlist: nextProps.pageInfoData.playlist, 
                items: nextProps.pageInfoData.playlist ? nextProps.pageInfoData.playlist.videos.results : null,
                pagging: nextProps.pageInfoData.playlist ? nextProps.pageInfoData.playlist.videos.pagging : null,
                adult:nextProps.pageInfoData.adultPlaylis,
                relatedPlaylists:nextProps.pageInfoData.relatedPlaylists 
            }
        } else{
            return null
        }
    }


    getItemIndex(item_id) {
        if(!this.state.items){
            return -1
        }
        const items = [...this.state.items];
        const itemIndex = items.findIndex(p => p["video_id"] == item_id);
        return itemIndex;
    }
    componentDidMount() {
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (this.state.playlist && itemIndex > -1 && type == "videos") {
                const items = [...this.state.items]
                const changedItem = {...items[itemIndex]}
                changedItem.rating = rating
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, items: items })
            }
        });
        this.props.socket.on('videoDeleted', data => {
            let id = data.video_id
            const itemIndex = this.getItemIndex(id)
            if (this.state.playlist && itemIndex > -1) {
                const items = [...this.state.items]
                items.splice(itemIndex, 1);
                this.setState({localUpdate:true, items: items })
            }
        });
        this.props.socket.on('unwatchlater', data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if (this.state.playlist && itemIndex > -1) {
                const items = [...this.state.items]
                const changedItem = {...items[itemIndex]}
                if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    changedItem.watchlater_id = null
                }
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, items: items })
            }
        });
        this.props.socket.on('watchlater', data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if (this.state.playlist && itemIndex > -1) {
                const items = [...this.state.items]
                const changedItem = {...items[itemIndex]}
                if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    changedItem.watchlater_id = 1
                }
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, items: items })
            }
        });

        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (this.state.playlist && type == "videos") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.items]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, items: items })
                }
            }
        }); 
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (this.state.playlist && type == "videos") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.items]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, items: items })
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
            if (this.state.playlist && itemType == "videos") {
                const itemIndex = this.getItemIndex(itemId)
                if (itemIndex > -1) {
                    const items = [...this.state.items]
                    const changedItem = {...items[itemIndex]}
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
                    this.setState({localUpdate:true, items: items })
                }
            }
        });
    }
    refreshContent() {
        this.setState({localUpdate:true, page: 1, items: [] })
        this.loadMoreContent()
    }
    loadMoreContent() {
        this.getContent()
    }
    loadMoreContent() {
        this.setState({localUpdate:true, loading: true })
        let formData = new FormData();
        formData.append('page', this.state.page)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = "/playlist-view"
        formData.append("id", this.state.playlist.playlist_id)
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.items) {
                    let pagging = response.data.pagging
                    this.setState({localUpdate:true, page: this.state.page + 1, pagging: pagging, items: [...this.state.items, ...response.data.items], loading: false })
                } else {
                    this.setState({localUpdate:true, loading: false })
                }
            }).catch(err => {
                this.setState({localUpdate:true, loading: false })
            });

    }
    deletePlaylist = (e) => {
        e.preventDefault()
        swal({
            title: Translate(this.props, "Are you sure?"),
            text: Translate(this.props, "Once deleted, you will not be able to recover this playlist!"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()
                    formData.append('id', this.state.playlist.custom_url)
                    const url = "/playlists/delete"
                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) {
                                swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
                            } else {
                                Router.push(`/dashboard?type=playlists`, `/dashboard/playlists`)
                            }
                        }).catch(err => {
                            swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
                        });
                    //delete
                } else {

                }
            });
    }
    render() {
        return (
            <React.Fragment>
                {
                this.state.playlist && this.state.playlist.approve != 1 ? 
                    <div className="col-md-12">
                        <div className="generalErrors">
                            <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                {Translate(this.props,'This playlist still waiting for admin approval.')}
                            </div>
                        </div>
                    </div>
                : null
                }
                {
                    !this.state.adult ? 
                <TopView {...this.props} deletePlaylist={this.deletePlaylist}  playlist={this.state.playlist} />
                : null
                }
                
                            <div className="userDetailsWraps">
                                <div className="container">
                                    <div className="row">
                                        <div className="col-md-12">
                                        {
                                        this.state.adult ?
                                            <div className="adult-wrapper">
                                                {Translate(this.props,'This playlist contains adult content.To view this playlist, Turn on adult content setting from site footer.')}
                                            </div>
                                        :
                                            <div className="details-tab">
                                                <ul className="nav nav-tabs" id="myTab" role="tablist">
                                                <li className="nav-item">
                                                        <a className="nav-link active" data-toggle="tab" href="#about" role="tab" aria-controls="about" aria-selected="true">{Translate(this.props, "About")}</a>
                                                    </li>
                                                    <li className="nav-item">
                                                        <a className="nav-link" data-toggle="tab" href="#videos" role="tab" aria-controls="videos" aria-selected="true">{Translate(this.props, "Videos")}</a>
                                                    </li>
                                                    
                                                    {
                                                        this.props.pageInfoData.appSettings[`${"playlist_comment"}`] == 1 && this.state.playlist.approve == 1 ?
                                                            <li className="nav-item">
                                                                <a className="nav-link" data-toggle="tab" href="#comments" role="tab" aria-controls="comments" aria-selected="true">{`${ShortNumber(this.state.playlist.comment_count ? this.state.playlist.comment_count : 0)}`}{" "}{Translate(this.props, "Comments")}</a>
                                                            </li>
                                                            : null
                                                    }
                                                </ul>
                                                <div className="tab-content" id="myTabContent">
                                                <div className="tab-pane fade active show" id="about" role="tabpanel">
                                                        <div className="details-tab-box">
                                                        {
                                                            this.props.pageInfoData.appSettings[`${"playlist_rating"}`] == 1 && this.state.playlist.approve == 1 ?
                                                            <React.Fragment>
                                                                <div className="tabInTitle">
                                                                    <h6>{Translate(this.props, "Rating")}</h6>
                                                                    <div className="rating">
                                                                        <div className="animated-rater rating">
                                                                            <Rating {...this.props} rating={this.state.playlist.rating} type="playlist" id={this.state.playlist.playlist_id} />
                                                                        </div>                                                                        
                                                                    </div>
                                                                </div>
                                                                
                                                            </React.Fragment>
                                                                : null
                                                            }
                                                            <React.Fragment>
                                                                <div className="tabInTitle">
                                                                    <h6>{Translate(this.props, "Owner")}</h6>
                                                                    <div className="owner_name">
                                                                        <Link href="/member" customParam={`memberId=${this.state.playlist.owner.username}`} as={`/${this.state.playlist.owner.username}`}>
                                                                            <a className="name">
                                                                                <React.Fragment>
                                                                                    {this.state.playlist.owner.displayname}
                                                                                    {
                                                                                        this.props.pageInfoData.appSettings['member_verification'] == 1 &&  this.state.playlist.owner.verified ?
                                                                                            <span className="verifiedUser" title={Translate(this.props, "verified")}><span className="material-icons">check</span></span>
                                                                                            : null
                                                                                    }
                                                                                </React.Fragment>
                                                                            </a>
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                
                                                            </React.Fragment>
                                                            <React.Fragment>
                                                                <div className="tabInTitle">
                                                                    <h6>{Translate(this.props, "Created On")}</h6>
                                                                    <div className="creation_date">
                                                                        <Date {...this.props} initialLanguage={this.props.initialLanguage} creation_date={this.state.playlist.creation_date} format={'dddd, MMMM Do YYYY'} defaultTimezone={this.props.pageInfoData.defaultTimezone} />
                                                                        
                                                                    </div>
                                                                </div>
                                                                
                                                            </React.Fragment>
                                                            {
                                                                this.state.playlist.description ?
                                                                    <React.Fragment>
                                                                        <div className="tabInTitle">
                                                                            <h6>{Translate(this.props, "Description")}</h6>
                                                                            <div className="channel_description">
                                                                                <Linkify properties={{ target: '_blank' }}>{renderToString(<CensorWord {...this.props} text={this.state.playlist.description} />)}</Linkify>
                                                                            </div>
                                                                        </div>
                                                                    </React.Fragment>
                                                                    : null
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="tab-pane fade" id="videos" role="tabpanel">
                                                        <div className="details-tab-box">
                                                            <InfiniteScroll
                                                                dataLength={this.state.items.length}
                                                                next={this.loadMoreContent}
                                                                hasMore={this.state.pagging}
                                                                loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.items.length} />}
                                                                endMessage={
                                                                    <EndContent {...this.props} text={Translate(this.props,'No video created in this playlist yet.')} itemCount={this.state.items.length} />
                                                                }
                                                                pullDownToRefresh={false}
                                                                pullDownToRefreshContent={<Release release={false} {...this.props} />}
                                                                releaseToRefreshContent={<Release release={true} {...this.props} />}
                                                                refreshFunction={this.refreshContent}
                                                            >
                                                                <div className="container">
                                                                    <div className="row">
                                                                        {
                                                                            this.state.items.map(video => {
                                                                                return (
                                                                                    <div key={video.video_id} className="col-md-4 col-sm-6">
                                                                                        <VideoItem  playlist_id={this.state.playlist.custom_url} {...this.props} video={video} {...video} />
                                                                                    </div>
                                                                                )
                                                                            })
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </InfiniteScroll>
                                                        </div>
                                                    </div>
                                                    
                                                    {
                                                        this.props.pageInfoData.appSettings[`${"playlist_comment"}`] == 1 && this.state.playlist.approve == 1 ?
                                                            <div className="tab-pane fade" id="comments" role="tabpanel">
                                                                <div className="details-tab-box">
                                                                    <Comment  {...this.props}  owner_id={this.state.playlist.owner_id} hideTitle={true} appSettings={this.props.pageInfoData.appSettings} commentType="playlist" type="playlists" id={this.state.playlist.playlist_id} />
                                                                </div>
                                                            </div>
                                                            : null
                                                    }
                                                </div>
                                            </div>
                                        }
                                       </div>
                                    </div>
                                </div>
                            </div>
                {
                  this.state.relatedPlaylists && this.state.relatedPlaylists.length ?
                  <React.Fragment>
                    <div className="container"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                    <CarouselPlaylists {...this.props}  {...this.props} playlists={this.state.relatedPlaylists} />
                    </React.Fragment>
                    : null
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
        openPlaylist: (open, video_id) => dispatch(playlist.openPlaylist(open, video_id)),
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Playlist)