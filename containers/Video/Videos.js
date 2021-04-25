import React from "react"

import axios from "../../axios-orders"
import { connect } from "react-redux";
import * as actions from '../../store/actions/general';

import InfiniteScroll from "react-infinite-scroll-component";
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import VideoItem from "../Video/Item"
import Translate from "../../components/Translate/Index";

class  Videos extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            page:2,
            videos:props.videos,
            pagging:props.pagging
        }
        this.refreshContent = this.refreshContent.bind(this)
        this.loadMoreContent = this.loadMoreContent.bind(this)
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if(nextProps.videos != prevState.videos){
            return {videos:nextProps.videos,pagging:nextProps.pagging,page:2}
        } else{
            return null
        }
    }
    getItemIndex(item_id){
        if(this.state.videos){
            const videos = [...this.state.videos];
            const itemIndex = videos.findIndex(p => p["video_id"] == item_id);
            return itemIndex;
        }
        return -1;
    }
    componentDidMount(){
        
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == "videos") {
                const items = [...this.state.videos]
                const changedItem = {...items[itemIndex]}
                changedItem.rating = rating
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, videos: items })
            }
        });
        this.props.socket.on('videoDeleted',data => {
            let id = data.video_id
            const itemIndex = this.getItemIndex(id)
            if(itemIndex > -1){
                const items = [...this.state.videos]
                items.splice(itemIndex, 1);
                this.setState({localUpdate:true,videos:items})
            }
        });
        this.props.socket.on('unwatchlater',data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if(itemIndex > -1){
                const items = [...this.state.videos]
                const changedItem = {...items[itemIndex]}
                if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                    changedItem.watchlater_id = null
                }
                items[itemIndex] = changedItem
                this.setState({localUpdate:true,videos:items})
            }
        });
        this.props.socket.on('watchlater',data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if(itemIndex > -1){
                const items = [...this.state.videos]
                const changedItem = {...items[itemIndex]}
                if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                    changedItem.watchlater_id = 1
                }
                items[itemIndex] = changedItem
                this.setState({localUpdate:true,videos:items})
            }
        });


        this.props.socket.on('unfavouriteItem',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == "videos"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.videos]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true,videos:items})
                }
            }
        });
        this.props.socket.on('favouriteItem',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == "videos"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.videos]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true,videos:items})
                }
            }
        });


        this.props.socket.on('likeDislike',data => {
            let itemId = data.itemId
            let itemType = data.itemType
            let ownerId =  data.ownerId
            let removeLike  = data.removeLike
            let removeDislike  = data.removeDislike
            let insertLike = data.insertLike
            let insertDislike =  data.insertDislike
            if(itemType == "videos"){
                const itemIndex = this.getItemIndex(itemId)
                if(itemIndex > -1){
                    const items = [...this.state.videos]
                    const changedItem = {...items[itemIndex]}
                    let loggedInUserDetails = {}
                    if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails){
                        loggedInUserDetails = this.props.pageInfoData.loggedInUserDetails
                    }
                    if(removeLike){
                        if(loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = null
                        changedItem['like_count'] = parseInt(changedItem['like_count']) - 1
                    }
                    if(removeDislike){
                        if(loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = null
                        changedItem['dislike_count'] = parseInt(changedItem['dislike_count']) - 1
                    }
                    if(insertLike){
                        if(loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = "like"
                        changedItem['like_count'] = parseInt(changedItem['like_count']) + 1
                    }
                    if(insertDislike){
                        if(loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = "dislike"
                        changedItem['dislike_count'] = parseInt(changedItem['dislike_count']) + 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true,videos:items})
                }
            }
        });

       

    }
    refreshContent(){
        this.setState({localUpdate:true,page:1,videos:[]})
        this.loadMoreContent()
    }
    
    loadMoreContent(){
        this.setState({localUpdate:true,loading:true})
        let formData = new FormData();         
        formData.append('page',this.state.page)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = ""
        if(this.props.contentType){
            url = `/dashboard/videos/${this.props.contentType}`;
        }else if(this.props.user_id){
            formData.append('owner_id',this.props.user_id)
             url = `/members/videos`;
        }
        axios.post(url, formData ,config)
        .then(response => {
            if(response.data.videos){
                let pagging = response.data.pagging
                this.setState({localUpdate:true,page:this.state.page+1,pagging:pagging,videos:[...this.state.videos,...response.data.videos],loading:false})
            }else{
                this.setState({localUpdate:true,loading:false})
            }
        }).catch(err => {
            this.setState({localUpdate:true,loading:false})
        });

    }
    render(){
        return (
            <InfiniteScroll
                        dataLength={this.state.videos.length}
                        next={this.loadMoreContent}
                        hasMore={this.state.pagging}
                        loader={<LoadMore {...this.props} loading={true} page={this.state.page} itemCount={this.state.videos.length} />}
                        endMessage={
                            <EndContent {...this.props} text={this.props.contentType == "my" ? Translate(this.props,'No video created yet.') : (this.props.contentType ? Translate(this.props,'No video found with your matching criteria.') : Translate(this.props,'No video created by this user yet.'))} itemCount={this.state.videos.length} />
                        }
                        pullDownToRefresh={false}
                        pullDownToRefreshContent={<Release release={false} {...this.props} />}
                        releaseToRefreshContent={<Release release={true} {...this.props} />}
                        refreshFunction={this.refreshContent}
                    >
                        <div className="row mob2col">
                        {
                            this.state.videos.map(video => {
                                return (
                                    <div key={video.video_id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6">
                                        <VideoItem  contentType={this.props.contentType} channel_id={this.props.channel_id} canDelete={this.props.canDelete} canEdit={this.props.canEdit} {...this.props} video={video} {...video}  />
                                    </div>
                                )
                            })
                        }
                        </div>
                    
            </InfiniteScroll>
        )
    }
} 

const mapStateToProps = state => {
    return {
        pageInfoData:state.general.pageInfoData
    };
  };
  const mapDispatchToProps = dispatch => {
    return {
        openToast: (message,typeMessage) => dispatch( actions.openToast(message,typeMessage) ),
        openPlaylist: (open, video_id) => dispatch(actions.openPlaylist(open, video_id)),

    };
};
export default connect(mapStateToProps,mapDispatchToProps)(Videos)