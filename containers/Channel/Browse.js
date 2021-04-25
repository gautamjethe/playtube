import React from "react"
import { connect } from "react-redux";
import Channel from '../Channel/Item';
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import axios from "../../axios-orders"
import InfiniteScroll from "react-infinite-scroll-component";
import Search from "../Search/Index"
import Translate from "../../components/Translate/Index";

class Browse extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            channels:props.pageData.channels,
            page:2,
            type:"channel",
            pagging:props.pageData.pagging,
            loading:false,
            searchType:"creation_date"
        }
        this.loadMoreContent = this.loadMoreContent.bind(this)
        this.refreshContent = this.refreshContent.bind(this)
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }

        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.pageInfoData.channels && nextProps.pageInfoData.channels != prevState.channels) {
            return {channels:nextProps.pageInfoData.channels,pagging:nextProps.pageInfoData.pagging,page:2}
        } else{
            return null
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
        this.props.socket.on('unfollowUser',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == this.state.type+"s"){   
                const itemIndex = this.getItemIndex(id)  
                if(itemIndex > -1){
                    const channels = [...this.state.channels]
                    const changedItem = {...channels[itemIndex]}
                    changedItem.follow_count = changedItem.follow_count - 1
                    if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.follower_id = null
                    }
                    channels[itemIndex] = changedItem
                    this.setState({localUpdate:true,channels:channels})
                }
            }
       });
       this.props.socket.on('followUser',data => {
           let id = data.itemId
           let type = data.itemType
           let ownerId = data.ownerId
           if(type == this.state.type+"s"){
              const itemIndex = this.getItemIndex(id)
              if(itemIndex > -1){
                const channels = [...this.state.channels]
                const changedItem = {...channels[itemIndex]}
                changedItem.follow_count =  changedItem.follow_count + 1
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
            if(type == this.state.type+"s"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const channels = [...this.state.channels]
                    const changedItem = {...channels[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = null
                    }
                    channels[itemIndex] = changedItem
                    this.setState({localUpdate:true,channels:channels})
                }
            }
        });
        this.props.socket.on('favouriteItem',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == this.state.type+"s"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const channels = [...this.state.channels]
                    const changedItem = {...channels[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = 1
                    }
                    channels[itemIndex] = changedItem
                    this.setState({localUpdate:true,channels:channels})
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
            if(itemType == this.state.type+"s"){
                const itemIndex = this.getItemIndex(itemId)
                if(itemIndex > -1){
                    const channels = [...this.state.channels]
                    const changedItem = {... channels[itemIndex]}
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
                    channels[itemIndex] = changedItem
                    this.setState({localUpdate:true,channels:channels})
                }
            }
        });
    }
    getItemIndex(item_id){
        if(this.state.channels){
            const channels = [...this.state.channels];
            const itemIndex = channels.findIndex(p => p["channel_id"] == item_id);
            return itemIndex;
        }
        return -1;
    }
    
    refreshContent(){
        this.setState({localUpdate:true,page:1,channels:[]})
        this.loadMoreContent()
    }
    searchResults(values){
        this.setState({localUpdate:true,page:1})
        this.loadMoreContent(values)
    }
    loadMoreContent(values){
        this.setState({localUpdate:true,loading:true})
        let formData = new FormData();        
        formData.append('page',this.state.page)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = `/channels-browse`;
        let queryString = ""
        if (this.props.pageInfoData.search) {
            queryString = Object.keys(this.props.pageInfoData.search).map(key => key + '=' + this.props.pageInfoData.search[key]).join('&');
            url = `${url}?${queryString}`
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
        let channels = this.state.channels.map(item => {
            return  <div key={item.channel_id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6">
                        <Channel  {...this.props}  key={item.channel_id} {...item} channel={item} />
                    </div>
        })
        return(
            <React.Fragment>
                    <div className="user-area">
                        <div className="container">
                            <Search {...this.props}  type="channel" />
                        </div>
                        <InfiniteScroll
                            dataLength={this.state.channels.length}
                            next={this.loadMoreContent}
                            hasMore={this.state.pagging}
                            loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.channels.length}  />}
                            endMessage={
                                <EndContent {...this.props} text={this.props.pageInfoData.search ?  Translate(this.props,'No channel found with your matching criteria.') : Translate(this.props,'No channel created yet.')} itemCount={this.state.channels.length} />
                            }
                            pullDownToRefresh={false}
                            pullDownToRefreshContent={<Release release={false} {...this.props} />}
                            releaseToRefreshContent={<Release release={true} {...this.props} />}
                            refreshFunction={this.refreshContent}
                        >
                            <div className="container">
                                <div className="row mob2col">
                                    {channels}
                                </div>
                            </div>
                        </InfiniteScroll>
                    </div>
            </React.Fragment>
        )
    }
}


const mapStateToProps = state => {
    return {
        pageInfoData:state.general.pageInfoData
    };
  };
  
export default connect(mapStateToProps,null,null,{pure:false})(Browse)