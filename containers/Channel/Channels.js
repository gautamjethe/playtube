import React from "react"

import axios from "../../axios-orders"
import { connect } from "react-redux";

import InfiniteScroll from "react-infinite-scroll-component";
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import Item from "../Channel/Item"
import Translate from "../../components/Translate/Index"

class  Channels extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            page:2,
            channels:props.channels,
            pagging:props.pagging,
            search:props.search ? props.search : []
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
        }else if (nextProps.channels && nextProps.channels != prevState.channels) {
            return { channels: nextProps.channels, pagging: nextProps.pagging, page: 2,search:nextProps.search ? nextProps.search : []}
        } else{
            return null
        }
    }
    getItemIndex(item_id){
        if(this.state.channels){
            const channels = [...this.state.channels];
            const itemIndex = channels.findIndex(p => p["channel_id"] == item_id);
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
            if (itemIndex > -1 && type == "channels") {
                const items = [...this.state.channels]
                const changedItem = {...items[itemIndex]}
                changedItem.rating = rating
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, channels: items })
            }
        });
        this.props.socket.on('channelDeleted',data => {
            let id = data.channel_id
            const itemIndex = this.getItemIndex(id)
            if(itemIndex > -1){
                const channels = [...this.state.channels]
                channels.splice(itemIndex, 1);
                this.setState({localUpdate:true,channels:channels})
            }
        })

        this.props.socket.on('unfollowUser',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == "channels"){   
                const itemIndex = this.getItemIndex(id)  
                if(itemIndex > -1){
                    const channels = [...this.state.channels]
                    const changedItem = {...channels[itemIndex]}
                    changedItem.follow_count = changedItem.follow_count - 1
                    if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.follower_id = null
                    }
                    channels[itemIndex]  = changedItem
                    this.setState({localUpdate:true,channels:channels})
                }
            }
       });
       this.props.socket.on('followUser',data => {
           let id = data.itemId
           let type = data.itemType
           let ownerId = data.ownerId
           if(type == "channels"){
              const itemIndex = this.getItemIndex(id)
              if(itemIndex > -1){
                const channels = [...this.state.channels]
                const changedItem = {...channels[itemIndex]}
                changedItem.follow_count = data.follow_count + 1
                if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                    changedItem.follower_id = 1
                }
                channels[itemIndex] = changedItem
                this.setState({localUpdate:true,channels:channels})
              }
           }
      });

        this.props.socket.on('unfavouriteItem',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == "channels"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.channels]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true,channels:items})
                }
            }
        });
        this.props.socket.on('favouriteItem',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == "channels"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.channels]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true,channels:items})
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
            if(itemType == "channels"){
                const itemIndex = this.getItemIndex(itemId)
                if(itemIndex > -1){
                    const items = [...this.state.channels]
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
                    this.setState({localUpdate:true,channels:items})
                }
            }
        });

    }
    refreshContent(){
        this.setState({localUpdate:true,page:1,channels:[]})
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
            url = `/dashboard/channels/${this.props.contentType}`;
        }else if(this.props.channel_id){
            formData.append('channel_id',this.props.channel_id)
            url = `/channels`;
        }else if(this.props.user_id){
            formData.append('owner_id',this.props.user_id)
            url = `/members/channels`;
        }else if(this.props.globalSearch){
           let queryString = Object.keys(this.state.search).map(key => key + '=' + this.state.search[key]).join('&');
            url = `/search/channel?${queryString}`
        }
        axios.post(url, formData ,config)
        .then(response => {
            if(response.data.channels){
                let pagging = response.data.pagging
                this.setState({localUpdate:true,page:this.state.page+1,pagging:pagging,channels:[...this.state.channels,...response.data.channels],loading:false})
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
                        dataLength={this.state.channels.length}
                        next={this.loadMoreContent}
                        hasMore={this.state.pagging}
                        loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.channels.length} />}
                        endMessage={
                            <EndContent {...this.props} text={this.props.contentType == "my" ? Translate(this.props,'No channel created yet.') : (this.props.contentType || this.props.globalSearch ? Translate(this.props,'No channel found with your matching criteria.') : (this.props.user_id ? Translate(this.props,'No channel created by this user yet.') : Translate(this.props,'No channel found.')))} itemCount={this.state.channels.length} />
                        }
                        pullDownToRefresh={false}
                        pullDownToRefreshContent={<Release release={false} {...this.props} />}
                        releaseToRefreshContent={<Release release={true} {...this.props} />}
                        refreshFunction={this.refreshContent}
                    >
                        <div className="row mob2col">
                                {
                                this.state.channels.map(channel => {
                                    return (
                                        <div key={channel.channel_id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6">
                                            <Item canDelete={this.props.canDelete} canEdit={this.props.canEdit} {...this.props} {...channel} channel={channel}   />
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
  
export default connect(mapStateToProps,null)(Channels)