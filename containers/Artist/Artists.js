import React from "react"

import axios from "../../axios-orders"
import { connect } from "react-redux";


import InfiniteScroll from "react-infinite-scroll-component";
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import Item from "../Artist/Item"
import Translate from "../../components/Translate/Index"

class  Artists extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            page:2,
            artists:props.artists,
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
        }else if (nextProps.artists && nextProps.artists != prevState.artists) {
            return { artists: nextProps.artists, pagging: nextProps.pagging, page: 2 }
        } else{
            return null
        }
    }
    getItemIndex(item_id){
        if(this.state.artists){
            const artists = [...this.state.artists];
            const itemIndex = artists.findIndex(p => p["artist_id"] == item_id);
            return itemIndex;
        }else{
            return -1;
        }
    }
    componentDidMount(){
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == "artists") {
                const items = [...this.state.artists]
                const changedItem = items[itemIndex]
                changedItem.rating = rating
                this.setState({localUpdate:true, artists: items })
            }
        });
        this.props.socket.on('unfavouriteItem',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == "artists"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.artists]
                    const changedItem = items[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = null
                    }
                    this.setState({localUpdate:true,artists:items})
                }
            }
        });
        this.props.socket.on('favouriteItem',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == "artists"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.artists]
                    const changedItem = items[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = 1
                    }
                    this.setState({localUpdate:true,artists:items})
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
            if(itemType == "artists"){
                const itemIndex = this.getItemIndex(itemId)
                if(itemIndex > -1){
                    const items = [...this.state.artists]
                    const changedItem = items[itemIndex]
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
                    this.setState({localUpdate:true,artists:items})
                }
            }
        });
    }
    refreshContent(){
        this.setState({localUpdate:true,page:1,artists:[]})
        this.loadMoreContent()
    }
    loadMoreContent(){
        this.getContent()
    }
    // eslint-disable-next-line no-dupe-class-members
    loadMoreContent(){
        this.setState({localUpdate:true,loading:true})
        let formData = new FormData();        
        formData.append('page',this.state.page)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = "/videos/artists"
        if(this.props.channel_id){
            formData.append('channel_id',this.props.channel_id)
            url = `/channels/artists`;
        }else{
            formData.append('video_id',this.props.video_id)
        }
        axios.post(url, formData ,config)
        .then(response => {
            if(response.data.artists){
                let pagging = response.data.pagging
                this.setState({localUpdate:true,page:this.state.page+1,pagging:pagging,artists:[...this.state.artists,...response.data.artists],loading:false})
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
                        dataLength={this.state.artists.length}
                        next={this.loadMoreContent}
                        hasMore={this.state.pagging}
                        loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.artists.length} />}
                        endMessage={
                            <EndContent {...this.props} text={this.props.channel_id ? Translate(this.props,"No artist found for this channel.") : Translate(this.props,"No artist found for this video.")} itemCount={this.state.artists.length} />
                        }
                        pullDownToRefresh={false}
                        pullDownToRefreshContent={<Release release={false} {...this.props} />}
                        releaseToRefreshContent={<Release release={true} {...this.props} />}
                        refreshFunction={this.refreshContent}
                    >
                        <div className="row mob2col">
                        {
                            this.state.artists.map(artist => {
                                return (
                                    <div key={artist.artist_id} className={!this.props.fromVideo ? 'col-lg-3 col-md-4 col-sm-6 ' : 'col-xl-4 col-sm-6 '}>
                                        <Item {...this.props} artists={artist} {...artist}  />
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
  
export default connect(mapStateToProps,null)(Artists)