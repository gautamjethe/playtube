import React from "react"

import axios from "../../axios-orders"
import { connect } from "react-redux";

import InfiniteScroll from "react-infinite-scroll-component";
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import Item from "../Playlist/Item"
import Translate from "../../components/Translate/Index";

class  Playlists extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            page:2,
            playlists:props.playlists,
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
        }else if(prevState.playlists != nextProps.playlists){
            return {playlists:nextProps.playlists,pagging:nextProps.pagging,page:2}
        } else{
            return null
        }
    }
    getItemIndex(item_id){
        if(this.state.playlists){
            const playlists = [...this.state.playlists];
            const itemIndex = playlists.findIndex(p => p["playlist_id"] == item_id);
            return itemIndex;
        }
        return -1;
    }
    componentDidMount(){

        this.props.socket.on('playlistDeleted',data => {
            let id = data.playlist_id
            const itemIndex = this.getItemIndex(id)
            if(itemIndex > -1){
                const playlists = [...this.state.playlists]
                playlists.splice(itemIndex, 1);
                this.setState({localUpdate:true,playlists:playlists})
            }
        })
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == "playlists") {
                const items = [...this.state.playlists]
                const changedItem = {...items[itemIndex]}
                changedItem.rating = rating
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, playlists: items })
            }
        });
        this.props.socket.on('unwatchlater',data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if(itemIndex > -1){
                const items = [...this.state.playlists]
                const changedItem = {...items[itemIndex]}
                if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                    changedItem.watchlater_id = null
                }
                items[itemIndex] = changedItem
                this.setState({localUpdate:true,playlists:items})
            }
        });
        this.props.socket.on('watchlater',data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if(itemIndex > -1){
                const items = [...this.state.playlists]
                const changedItem = {...items[itemIndex]}
                if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                    changedItem.watchlater_id = 1
                }
                items[itemIndex] = changedItem
                this.setState({localUpdate:true,playlists:items})
            }
        });


        this.props.socket.on('unfavouriteItem',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == "playlists"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.playlists]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true,playlists:items})
                }
            }
        });
        this.props.socket.on('favouriteItem',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == "playlists"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.playlists]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if(this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true,playlists:items})
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
            if(itemType == "playlists"){
                const itemIndex = this.getItemIndex(itemId)
                if(itemIndex > -1){
                    const items = [...this.state.playlists]
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
                    this.setState({localUpdate:true,playlists:items})
                }
            }
        });

        if(this.props.channel_id){
            this.props.socket.on('channelPlaylistDeleted',data => {
                let channel_id = data.channel_id
                let message = data.message
                let playlist_id = data.playlist_id
                if(channel_id == this.props.channel_id){
                    const itemIndex = this.getItemIndex(playlist_id)
                    if(itemIndex > -1){
                        const playlists = [...this.state.playlists]
                        playlists.splice(itemIndex, 1);
                        this.setState({localUpdate:true,playlists:playlists})
                        this.props.openToast(Translate(this.props,message),'success')
                    }
                }
            });
        }

    }
    refreshContent(){
        this.setState({localUpdate:true,page:1,playlists:[]})
        this.loadMoreContent()
    }
    loadMoreContent(){
        this.getContent()
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
            url = `/dashboard/playlists/${this.props.contentType}`;
        }else if(this.props.channel_id){
            formData.append('channel_id',this.props.channel_id)
            url = `/channels/playlists`;
        }else if(this.props.user_id){
            formData.append('owner_id',this.props.user_id)
            url = `/members/playlists`;
        }
        axios.post(url, formData ,config)
        .then(response => {
            if(response.data.playlists){
                let pagging = response.data.pagging
                this.setState({localUpdate:true,page:this.state.page+1,pagging:pagging,playlists:[...this.state.playlists,...response.data.playlists],loading:false})
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
                        dataLength={this.state.playlists.length}
                        next={this.loadMoreContent}
                        hasMore={this.state.pagging}
                        loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.playlists.length} />}
                        endMessage={
                            <EndContent {...this.props} text={this.props.contentType == "my" ? Translate(this.props,'No playlist created yet.') : (this.props.contentType ? Translate(this.props,'No playlist found with your matching criteria.') : (this.props.channel_id ? Translate(this.props,'No playlist created in this channel yet.') : Translate(this.props,'No playlist created by this user yet.')))} itemCount={this.state.playlists.length} />
                        }
                        pullDownToRefresh={false}
                        pullDownToRefreshContent={<Release release={false} {...this.props} />}
                        releaseToRefreshContent={<Release release={true} {...this.props} />}
                        refreshFunction={this.refreshContent}
                    >
                        <div className="row mob2col">
                            {
                                this.state.playlists.map(playlist => {
                                    return (
                                        <div key={playlist.playlist_id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6">
                                            <Item canDelete={this.props.canDelete} {...this.props} {...playlist} playlist={playlist}   />
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
  
export default connect(mapStateToProps,null)(Playlists)