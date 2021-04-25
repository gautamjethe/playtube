import React from "react"
import { connect } from "react-redux";

import Video from '../Video/Item'
import playlist from '../../store/actions/general';

import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import axios from "../../axios-orders"
import InfiniteScroll from "react-infinite-scroll-component";
import Search from "../Search/Index"
import Translate from "../../components/Translate/Index";
class Browse extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            videos: props.pageData.videos ? props.pageData.videos : props.pageData.items.results,
            page: 2,
            pageType:props.pageInfoData.pageType && props.pageInfoData.pageType != "latest" ? props.pageInfoData.pageType : "",
            liveStreamingPage:props.pageInfoData.liveStreamingPage ? props.pageInfoData.liveStreamingPage : null,
            type: "video",
            pagging: typeof props.pageData.pagging != "undefined" ? props.pageData.pagging : props.pageData.items.pagging,
            loading: false,
            searchType: "creation_date",
            search: props.search ? props.search : [],
            contentType:props.contentType,
        }
        this.loadMoreContent = this.loadMoreContent.bind(this)
        this.refreshContent = this.refreshContent.bind(this)
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        
        if (prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.videos && nextProps.videos != prevState.videos) {
            return { videos: nextProps.videos, pagging: false, page: 2, search: nextProps.search ? nextProps.search : [],pageType:nextProps.pageType }
        }else if (nextProps.pageInfoData.videos && nextProps.pageInfoData.videos != prevState.videos) {
            return { videos: nextProps.pageInfoData.videos, pagging: nextProps.pageInfoData.pagging, page: 2, search: nextProps.search ? nextProps.search : [],pageType:nextProps.pageInfoData.pageType }
        } else if (nextProps.pageData.videos && nextProps.pageData.videos != prevState.videos) {
            return { videos: nextProps.pageData.videos, pagging: nextProps.pageData.pagging, page: 2, search: nextProps.search ? nextProps.search : [],pageType:nextProps.pageInfoData.pageType }
        } else {
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
            if (itemIndex > -1 && type == this.state.type + "s") {
                const items = [...this.state.videos]
                const changedItem = {...items[itemIndex]}
                changedItem.rating = rating
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, videos: items })
            }
        });
        this.props.socket.on('unwatchlater', data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1) {
                const items = [...this.state.videos]
                const changedItem = {...items[itemIndex]}
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
                const changedItem = {...items[itemIndex]}
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
            if (type == this.state.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const videos = [...this.state.videos]
                    const changedItem = {...videos[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    videos[itemIndex] = changedItem
                    this.setState({localUpdate:true, videos: videos })
                }
            }
        });
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const videos = [...this.state.videos]
                    const changedItem = {...videos[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    videos[itemIndex] = changedItem
                    this.setState({localUpdate:true, videos: videos })
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
            if (itemType == this.state.type + "s") {
                const itemIndex = this.getItemIndex(itemId)
                if (itemIndex > -1) {
                    const videos = [...this.state.videos]
                    const changedItem =  {...videos[itemIndex]};
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
                    videos[itemIndex] = changedItem
                    this.setState({localUpdate:true, videos: videos })
                }
            }
        });
    }
    getItemIndex(item_id) {
        const videos = [...this.state.videos];
        const itemIndex = videos.findIndex(p => p["video_id"] == item_id);
        return itemIndex;
    }

    refreshContent() {
        this.setState({localUpdate:true, page: 1, videos: [] })
        this.loadMoreContent()
    }
    searchResults(values) {
        this.setState({localUpdate:true, page: 1 })
        this.loadMoreContent(values)
    }
    loadMoreContent(values) {

        this.setState({localUpdate:true, loading: true })
        let formData = new FormData();
        formData.append('page', this.state.page)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = `/videos-browse`;
        let queryString = ""
        if(this.state.pageType){
            formData.append("pageType",this.state.pageType)
        }
        if(this.state.liveStreamingPage){
            formData.append("liveStreamingPage",1);
        }
        if (this.props.pageInfoData.search) {
            queryString = Object.keys(this.props.pageInfoData.search).map(key => key + '=' + this.props.pageInfoData.search[key]).join('&');
            url = `${url}?${queryString}`
        } else if (this.props.globalSearch) {
            queryString = Object.keys(this.state.search).map(key => key + '=' + this.state.search[key]).join('&');
            url = `/search?${queryString}`
        }else if(this.props.contentType){
            formData.append('videoPurchased','1')
            formData.append('video_user_id',this.props.member.user_id)            
        }
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.videos) {
                    let pagging = response.data.pagging
                    this.setState({localUpdate:true, page: this.state.page + 1, pagging: pagging, videos: [...this.state.videos, ...response.data.videos], loading: false })
                } else {
                    this.setState({localUpdate:true, loading: false })
                }
            }).catch(err => {
                this.setState({localUpdate:true, loading: false })
            });
    }
    
    render() {
        return (
            <React.Fragment>
                {
                    !this.props.globalSearch && !this.state.pageType ? 
                    <div className="user-area">
                        {
                            !this.props.globalSearch && !this.props.contentType ?
                                <div className="container">
                                    <Search {...this.props} liveStreamingPage={this.state.liveStreamingPage}  type="video" />
                                </div>
                                : null
                        }
                        <InfiniteScroll
                            dataLength={this.state.videos.length}
                            next={this.loadMoreContent}
                            hasMore={this.state.pagging}
                            loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.videos.length} />}
                            endMessage={
                                <EndContent {...this.props} text={this.props.pageInfoData.search || this.props.globalSearch ?  Translate(this.props,'No video found with your matching criteria.') : Translate(this.props,'No video found to display.')} itemCount={this.state.videos.length} />
                            }
                            pullDownToRefresh={false}
                            pullDownToRefreshContent={<Release release={false} {...this.props} />}
                            releaseToRefreshContent={<Release release={true} {...this.props} />}
                            refreshFunction={this.refreshContent}
                        >
                            <div className="container">
                                <div className="row mob2col">
                                    {
                                        this.state.videos.map(item => {
                                            return <div key={item.video_id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6 ">
                                                <Video {...this.props} key={item.video_id}  {...item} video={item}  />
                                            </div>
                                        })
                                    }
                                </div>
                            </div>
                        </InfiniteScroll>      
                    </div>
                :
                <div className="cnt-videos">
                    <InfiniteScroll
                            dataLength={this.state.videos.length}
                            next={this.loadMoreContent}
                            hasMore={this.state.pagging}
                            loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.videos.length} />}
                            endMessage={
                                <EndContent {...this.props} text={this.props.pageInfoData.search || this.props.globalSearch ?  Translate(this.props,'No video found with your matching criteria.') : Translate(this.props,'No video found to display.')} itemCount={this.state.videos.length} />
                            }
                            pullDownToRefresh={false}
                            pullDownToRefreshContent={<Release release={false} {...this.props} />}
                            releaseToRefreshContent={<Release release={true} {...this.props} />}
                            refreshFunction={this.refreshContent}
                        >
                            <div className="container">
                                <div className="row mob2col">
                                    {
                                        this.state.videos.map(item => {
                                            return <div key={item.video_id} className={this.props.fromSearch ? "col-lg-4 col-md-4 col-sm-6" : "col-lg-3 col-md-4 col-sm-6"}>
                                                <Video {...this.props} key={item.video_id}  {...item} video={item}  />
                                            </div>
                                        })
                                    }
                                </div>
                            </div>
                    </InfiniteScroll> 
                </div>
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
export default connect(mapStateToProps,mapDispatchToProps)(Browse)