import React from "react"

import axios from "../../axios-orders"
import { connect } from "react-redux";

import config from "../../config";
import playlist from '../../store/actions/general';

import InfiniteScroll from "react-infinite-scroll-component";
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import VideoItem from "../Video/Item"
import ShortNumber from "short-number"
import Rating from "../Rating/Index"

import ChannelItem from "../Channel/Item"
import TopView from "./TopView"
import Linkify from "react-linkify"
import Comment from "../Comments/Index"
import Translate from "../../components/Translate/Index"
import CensorWord from "../CensoredWords/Index"

import Photos from "./Photos"

class Artist extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            page: 2,
            artist: props.pageInfoData.artist,
            items: props.pageInfoData.items.results,
            pagging: props.pageInfoData.items.pagging,
            photos:props.pageInfoData.photos
        }
        this.refreshContent = this.refreshContent.bind(this)
        this.loadMoreContent = this.loadMoreContent.bind(this)
    }
    getItemIndex(item_id) {
        const items = [...this.state.items];
        const itemIndex = items.findIndex(p => p[this.state.artist.type == "video" ? "video_id" : "channel_id"] == item_id);
        return itemIndex;
    }
    componentDidMount() {
        
        this.props.socket.on('unfollowUser', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.artist.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {

                    const items = [...this.state.items]
                    const changedItem = items[itemIndex]
                    changedItem.follow_count = changedItem.follow_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.follower_id = null
                    }
                    this.setState({ localUpdate:true, items: items })
                }
            }
        });
        this.props.socket.on('followUser', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.artist.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.items]
                    const changedItem = items[itemIndex]
                    changedItem.follow_count = data.follow_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.follower_id = 1
                    }
                    this.setState({ localUpdate:true, items: items })
                }
            }
        });
        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.artist.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.items]
                    const changedItem = items[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    this.setState({ localUpdate:true, items: items })
                }
            }
        });
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.artist.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.items]
                    const changedItem = items[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    this.setState({ localUpdate:true, items: items })
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
            if (itemType == this.state.artist.type + "s") {
                const itemIndex = this.getItemIndex(itemId)
                if (itemIndex > -1) {
                    const items = [...this.state.items]
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
                    this.setState({ localUpdate:true, items: items })
                }
            }
        });
    }
    refreshContent() {
        this.setState({ localUpdate:true, page: 1, items: [] })
        this.loadMoreContent()
    }

    loadMoreContent() {
        this.setState({ localUpdate:true, loading: true })
        let formData = new FormData();
        formData.append('page', this.state.page)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = "/artist-view"
        formData.append("id", this.state.artist.custom_url)
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.items) {
                    let pagging = response.data.pagging
                    this.setState({ localUpdate:true, page: this.state.page + 1, pagging: pagging, items: [...this.state.items, ...response.data.items], loading: false })
                } else {
                    this.setState({ localUpdate:true, loading: false })
                }
            }).catch(err => {
                this.setState({ localUpdate:true, loading: false })
            });

    }
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
        let content = null
        if (this.state.artist.type == "video") {
            content = this.state.items.map(video => {
                return (
                    <div key={video.video_id} className="col-md-4 col-sm-6 ">
                        <VideoItem  {...this.props} video={video} {...video} />
                    </div>
                )
            })
        } else {
            content = this.state.items.map(channel => {
                return (
                    <div key={channel.channel_id} className="col-md-4 col-sm-6 ">
                        <ChannelItem  {...this.props} channel={channel} {...channel} />
                    </div>
                )
            })
        }
        return (
            <React.Fragment>
                <TopView {...this.props}  type={this.state.artist.type} artist={this.state.artist} />


                <div className="userDetailsWraps">
                    <div className="container">
                        <div className="row">
                            <div className="col-md-12">
                                <div className="details-tab">
                                    <ul className="nav nav-tabs" id="myTab" role="tablist">
                                    <li className="nav-item">
                                            <a className="nav-link active" data-toggle="tab" href="#about" role="tab" aria-controls="about" aria-selected="true">{Translate(this.props, "About")}</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link" data-toggle="tab" href="#items" role="tab" aria-controls="items" aria-selected="true">{Translate(this.props, this.state.artist.type == "video" ? "Videos" : "Channels")}</a>
                                        </li>
                                       
                                        {
                                            this.props.pageInfoData.appSettings[`${this.state.artist.type + "_artist_comment"}`] == 1 ?
                                                <li className="nav-item">
                                                    <a className="nav-link" data-toggle="tab" href="#comments" role="tab" aria-controls="comments" aria-selected="true">{`${ShortNumber(this.state.artist.comment_count ? this.state.artist.comment_count : 0)}`}{" "}{Translate(this.props, "Comments")}</a>
                                                </li>
                                                : null
                                        }
                                         {
                                            this.state.photos && this.state.photos.results.length > 0 ?
                                                <li className="nav-item">
                                                    <a className="nav-link" data-toggle="tab" href="#photos" role="tab" aria-controls="photos" aria-selected="true">{Translate(this.props, "Photos")}</a>
                                                </li>
                                                : null
                                        }
                                    </ul>
                                    <div className="tab-content" id="myTabContent">
                                    <div className="tab-pane fade active show" id="about" role="tabpanel">
                                            <div className="details-tab-box">
                                                <React.Fragment>
                                                {
                                                    this.props.pageInfoData.appSettings[`${this.state.artist.type + "_artist_rating"}`] == 1 ?
                                                <div className="tabInTitle">
                                                    <h6>{Translate(this.props,'Rating')}</h6>
                                                    <div className="owner_name">
                                                        <React.Fragment>
                                                                <div className="animated-rater rating">
                                                                    <Rating {...this.props} rating={this.state.artist.rating} type="artist" id={this.state.artist.artist_id} />
                                                                </div>
                                                                
                                                        </React.Fragment>
                                                    </div>
                                                </div>
                                                    : null
                                                }
                                                <div className="tabInTitle">
                                                    <h6>{this.props.t("view_count", { count: this.state.artist.view_count ? this.state.artist.view_count : 0 })}</h6>
                                                    <div className="owner_name">
                                                        <React.Fragment>
                                                        {`${ShortNumber(this.state.artist.view_count ? this.state.artist.view_count : 0)}`}{" "}{this.props.t("view_count", { count: this.state.artist.view_count ? this.state.artist.view_count : 0 })}
                                                        </React.Fragment>
                                                    </div>
                                                </div>
                                                {
                                                    this.state.artist.age ? 
                                                <div className="tabInTitle">
                                                    <h6>{Translate(this.props,"Age")}</h6>
                                                    <div className="owner_name">
                                                        {this.state.artist.age}
                                                    </div>
                                                </div>
                                                : null
                                                }
                                                 {
                                                    this.state.artist.gender ? 
                                                <div className="tabInTitle">
                                                    <h6>{Translate(this.props,"Gender")}</h6>
                                                    <div className="owner_name">
                                                        {this.state.artist.gender}
                                                    </div>
                                                </div>
                                                : null
                                                }
                                                 {
                                                    this.state.artist.birthplace ? 
                                                <div className="tabInTitle">
                                                    <h6>{Translate(this.props,"Birth Place")}</h6>
                                                    <div className="owner_name">
                                                        {this.state.artist.birthplace}
                                                    </div>
                                                </div>
                                                : null
                                                }
                                                    <div className="tabInTitle">
                                                        <h6>{Translate(this.props, "Description")}</h6>
                                                        <div className="channel_description">
                                                        <div className="channel_description" id="VideoDetailsDescp" style={{ ...this.state.styles, whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{__html:this.linkify(this.state.artist.description)}}></div>
                                                            {/* <Linkify properties={{ target: '_blank' }}>{<CensorWord {...this.props} text={this.state.artist.description} />}</Linkify> */}
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            </div>
                                        </div>
                                        <div className="tab-pane fade" id="items" role="tabpanel">
                                            <div className="details-tab-box">
                                                <InfiniteScroll
                                                    dataLength={this.state.items.length}
                                                    next={this.loadMoreContent}
                                                    hasMore={this.state.pagging}
                                                    loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.items.length} />}
                                                    endMessage={
                                                        <EndContent {...this.props} text={this.state.artist.type == "channel" ? Translate(this.props, "No channel created for this artist.") : Translate(this.props, "No video created for this artist.")} itemCount={this.state.items.length} />
                                                    }
                                                    pullDownToRefresh={false}
                                                    pullDownToRefreshContent={<Release release={false} {...this.props} />}
                                                    releaseToRefreshContent={<Release release={true} {...this.props} />}
                                                    refreshFunction={this.refreshContent}
                                                >
                                                    <div className="row mob2col">
                                                        {content}
                                                    </div>
                                                </InfiniteScroll>
                                            </div>
                                        </div>
                                        
                                        {
                                            this.props.pageInfoData.appSettings[`${this.state.artist.type + "_artist_comment"}`] == 1 ?
                                                <div className="tab-pane fade" id="comments" role="tabpanel">
                                                    <div className="details-tab-box">
                                                        <Comment  {...this.props}  owner_id="artist" hideTitle={true} subtype={this.state.artist.type + "_"} appSettings={this.props.pageInfoData.appSettings} commentType="artist" type="artists" id={this.state.artist.artist_id} />
                                                    </div>
                                                </div>
                                                : null
                                        }
                                        {
                                            this.state.photos && this.state.photos.results.length > 0 ?
                                                <div className="tab-pane fade" id="photos" role="tabpanel">
                                                    <div className="details-tab-box">
                                                        <Photos  {...this.props}  photos={this.state.photos} artist={this.state.artist} />
                                                    </div>
                                                </div>
                                            : null
                                        }
                                    </div>
                                </div>
                            </div>
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

const mapDispatchToProps = dispatch => {
    return {
        openPlaylist: (open, video_id) => dispatch(playlist.openPlaylist(open, video_id)),
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Artist)