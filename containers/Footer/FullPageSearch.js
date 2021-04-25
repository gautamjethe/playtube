 import React from "react"
 import { connect } from "react-redux";
 import action from '../../store/actions/general'

 import Translate from "../../components/Translate/Index";
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import axios from "../../axios-orders"
import axiosCancel from 'axios-cancel';
axiosCancel(axios, {
    debug: false // default
  });
   
import InfiniteScroll from "react-infinite-scroll-component";

import Video from "../Video/Item"
import Channel from "../Channel/Item"
import Playlist from "../Playlist/Item"
import Blog from "../Blog/Item"
import Member from "../User/Item"
import Router from "next/router"
 class fullPageSearch extends React.Component{
     constructor(props){
         super(props)
        this.state = {
            type:"video",
            items:null,
            pagging:false,
            page:1,
            textValue:"",
            previousValue:""
        }
        this.closeSearch = this.closeSearch.bind(this)
        this.typeChange = this.typeChange.bind(this)
        this.loadMoreContent = this.loadMoreContent.bind(this)
        this.closePopUp = this.closePopUp.bind(this)
        this.changeTextValue = this.changeTextValue.bind(this)
        this.getData = this.getData.bind(this)
        this.timmer = null
     }
     loadMoreContent = () => {
        this.getData(true)
     }
     changeTextValue = (e) => {
        this.setState({textValue:e.target.value}, () => {
            if(this.timmer){
                window.clearTimeout(this.timmer)
            }
            this.timmer = setTimeout(
                () =>  {
                    this.setState({page:1},() => {
                        this.getData()
                    })
                }, 
                500
              );
        })
        
     }
     getData = (fromLoading) => {
         if(!this.state.textValue){
             this.setState({page:1,items:null,pagging:false})
             return
         }
        const requestId = 'autosuggest-global-search'
        axios.cancel(requestId)
        let url = "/search/"+this.state.type+"?h="+this.state.textValue+"&sort=view"
        
        let formData = new FormData()
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            requestId: requestId
        }
        formData.append("page",this.state.page);
        formData.append("limit",21)
        axios.post(url, formData, config)
             .then(response => {
                if (response.data[this.state.type+"s"]) {
                    if(fromLoading){
                        this.setState({loader:false,pagging:response.data.pagging,page:this.state.page + 1, items: [...this.state.items,...response.data[this.state.type+"s"]]})
                    }else{
                        this.setState({loader:false,pagging:response.data.pagging,page:2, items: [...response.data[this.state.type+"s"]]})
                    }
                    
                } 
             }).catch(() => {
                //silence
             })
     }
     typeChange = (e) => {
         this.setState({items:[],type : e.target.value,page:1,loader:this.state.textValue ? true : false},() => {
             this.getData()
         })
     }
     closeSearch = () => {
         this.props.setSearchClicked(false)
     }
     getItemIndex(item_id) {
        const items = [...(this.state.items ? this.state.items : this.state.videoItems)];
        const itemIndex = items.findIndex(p => p[(this.state.type != "member" ? this.state.type : "user")  +"_id"] == item_id);
        return itemIndex;
    }
     componentDidMount(){
        //get latest videos
        $(document).ready(function(e) {
            $("#searchbox-text").focus();
        })
        this.getVideos()

        //register sockets
        this.props.socket.on('videoDeleted', data => {
            if(this.state.type == "video"){
                let id = data.video_id
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const videos = [...(this.state.items ? this.state.items : this.state.videoItems)];
                    videos.splice(itemIndex, 1);
                    let changedData = {}
                    changedData['localUpdate'] = true
                    changedData[this.state.items ? 'items' : 'videoItems'] = videos
                    this.setState(changedData)
                }
            }
        })
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType 
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == this.state.type + "s") {
                const items = [...(this.state.items ? this.state.items : this.state.videoItems)];
                const changedItem = {...items[itemIndex]}
                changedItem.rating = rating
                items[itemIndex] = changedItem
                let changedData = {}
                    changedData['localUpdate'] = true
                    changedData[this.state.items ? 'items' : 'videoItems'] = items
                    this.setState(changedData)
            }
        });
        this.props.socket.on('unwatchlater', data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && this.state.type == "video") {
                const items = [...(this.state.items ? this.state.items : this.state.videoItems)];
                const changedItem = {...items[itemIndex]}
                if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    changedItem.watchlater_id = null
                }
                items[itemIndex] = changedItem
                let changedData = {}
                changedData['localUpdate'] = true
                changedData[this.state.items ? 'items' : 'videoItems'] = items
                this.setState(changedData)
            }
        });
        this.props.socket.on('watchlater', data => {
            let id = data.itemId
            let ownerId = data.ownerId
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && this.state.type == "video") {
                const items = [...(this.state.items ? this.state.items : this.state.videoItems)];
                const changedItem = {...items[itemIndex]}
                if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    changedItem.watchlater_id = 1
                }
                items[itemIndex] = changedItem
                let changedData = {}
                changedData['localUpdate'] = true
                changedData[this.state.items ? 'items' : 'videoItems'] = items
                this.setState(changedData)
            }
        });

        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const videos = [...(this.state.items ? this.state.items : this.state.videoItems)];
                    const changedItem = {...videos[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    videos[itemIndex] = changedItem
                    let changedData = {}
                    changedData['localUpdate'] = true
                    changedData[this.state.items ? 'items' : 'videoItems'] = videos
                    this.setState(changedData)
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
                    const videos = [...(this.state.items ? this.state.items : this.state.videoItems)];
                    const changedItem = {...videos[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    videos[itemIndex] = changedItem
                    let changedData = {}
                    changedData['localUpdate'] = true
                    changedData[this.state.items ? 'items' : 'videoItems'] = videos
                    this.setState(changedData)
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
                    const videos = [...(this.state.items ? this.state.items : this.state.videoItems)];
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
                    let changedData = {}
                    changedData['localUpdate'] = true
                    changedData[this.state.items ? 'items' : 'videoItems'] = videos
                    this.setState(changedData)
                }
            }
        });
        this.props.socket.on('unfollowUser',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == this.state.type+"s"){   
                const itemIndex = this.getItemIndex(id)  
                if(itemIndex > -1){
                    const channels = [...this.state.items]
                    const changedItem = {...channels[itemIndex]}
                    changedItem.follow_count = changedItem.follow_count - 1
                    if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.follower_id = null
                    }
                    channels[itemIndex] = changedItem
                    this.setState({localUpdate:true,items:channels})
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
                const channels = [...this.state.items]
                const changedItem = {...channels[itemIndex]}
                changedItem.follow_count =  changedItem.follow_count + 1
                if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                    changedItem.follower_id = 1
                }
                channels[itemIndex] = changedItem
                this.setState({localUpdate:true,items:channels})
              }
           }
      });


     }
     getVideos(){
        let url = "/videos-browse"
        let formData = new FormData();
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        }
        formData.append("pageType","top")
        formData.append("limit",21);
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.videos) {
                    this.setState({ videoItems: [...response.data.videos]})
                } 
            }).catch(() => {
                //silence
            });
     }
     closePopUp = () => {
        this.props.setSearchClicked(false)
     }
     searchButtonClick = () => {
         if(!this.state.textValue){
             return
         }
         this.closePopUp()
         let queryString = "h="+this.state.textValue+"&sort=view"
         Router.push(
            `/search?type=${this.state.type}&${queryString}`,
            `/search/${this.state.type}?${queryString}`,
        )
     }
     render(){

        let items = null
        if(this.state.type == "video" && this.state.items && this.state.items.length){
            items = this.state.items.map(item => {
                return <div key={item.video_id} className={"col-lg-3 col-md-4 col-sm-6"}>
                    <Video {...this.props} openPlaylist={this.props.openPlaylist} key={item.video_id} closePopUp={this.closePopUp}  {...item} video={item}  />
                </div>
            })
        }else if(this.state.type == "channel" && this.state.items && this.state.items.length){
            items = this.state.items.map(item => {
                return <div key={item.channel_id} className={"col-lg-3 col-md-4 col-sm-6"}>
                    <Channel {...this.props} key={item.channel_id} closePopUp={this.closePopUp}  {...item} channel={item}  />
                </div>
            })
        }else if(this.state.type == "playlist" && this.state.items && this.state.items.length) {
            items = this.state.items.map(item => {
                return <div key={item.playlist_id} className={"col-lg-3 col-md-4 col-sm-6"}>
                    <Playlist {...this.props} key={item.playlist_id} closePopUp={this.closePopUp}  {...item} playlist={item}  />
                </div>
            })
        }else if(this.state.type == "blog" && this.state.items && this.state.items.length){
            items = this.state.items.map(item => {
                return <div key={item.blog_id} className={"col-lg-4 col-md-6 col-sm-6"}>
                    <Blog {...this.props} key={item.blog_id} closePopUp={this.closePopUp}  {...item} result={item}  />
                </div>
            })
        }else if(this.state.type == "member" && this.state.items && this.state.items.length){
            items = this.state.items.map(item => {
                return <div key={item.user_id} className={"col-lg-3 col-md-4 col-sm-6"}>
                    <Member {...this.props} key={item.user_id} closePopUp={this.closePopUp}  {...item} member={item}  />
                </div>
            })
        }else if(this.state.type == "video" && this.state.videoItems && this.state.videoItems.length && !this.state.textValue){
            items = this.state.videoItems.map(item => {
                return <div key={item.video_id} className={"col-lg-3 col-md-4 col-sm-6"}>
                    <Video {...this.props} openPlaylist={this.props.openPlaylist} key={item.video_id} closePopUp={this.closePopUp}  {...item} video={item}  />
                </div>
            })
            
        }

        let objItems = this.state.items ? this.state.items : this.state.videoItems
        return (
            <div id="searchBox" className="SearchBox-wrap" style={{width:"100%"}}>
                <div className="searchBox-content">
                    <div className="head-searchbox">
                        <div onClick={this.closeSearch} className="close-btn">{this.props.t("Close")}</div>
                        <div className="search-input">
                            <input type="text" name="searchbox" value={this.state.textValue} onChange={this.changeTextValue} id="searchbox-text" placeholder={this.props.t("Search")} />
                            <select name="type" value={this.state.type} onChange={(e) => this.typeChange(e)} >
                                <option value="video">{Translate(this.props,"Videos")}</option>
                                <option value="member">{Translate(this.props,"Members")}</option>
                                {
                                    this.props.pageData.appSettings["enable_channel"] == 1 ? 
                                <option value="channel">{Translate(this.props,"Channels")}</option>
                                : null
                                }
                                {
                                    this.props.pageData.appSettings["enable_blog"] == 1 ? 
                                <option value="blog">{Translate(this.props,"Blogs")}</option>
                                    : null
                                }
                                {
                                    this.props.pageData.appSettings["enable_playlist"] == 1 ? 
                                <option value="playlist">{Translate(this.props,"Playlists")}</option>
                                    : null
                                }
                            </select>
                            <button onClick={this.searchButtonClick}><span className="material-icons">search</span></button>
                        </div>
                    </div>
        
                    <div className="search-content-show">
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col-md-12">
                                    {
                                        this.state.loader ? 
                                        <LoadMore {...this.props} loading={true} />
                                        :
                                        !items && !this.state.textValue ?
                                            <React.Fragment></React.Fragment>
                                        :
                                        objItems ? 
                                        <InfiniteScroll
                                            scrollableTarget="searchBox"
                                            dataLength={objItems.length}
                                            next={this.loadMoreContent}
                                            hasMore={this.state.pagging}
                                            loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={objItems.length} />}
                                            endMessage={
                                                <EndContent {...this.props} text={!objItems.length ? Translate(this.props,'No '+this.state.type+' found with your matching criteria.') : ""} itemCount={objItems.length} />
                                            }
                                        >
                                            <div className="container-fluid">
                                                {
                                                    !this.state.items && this.state.type == "video" && !this.state.textValue ?
                                                        <h3 className="search-heading-title">{this.props.t("Popular Videos")}</h3>
                                                    : null
                                                }
                                                <div className="row mob2col">
                                                    { items }
                                                </div>
                                            </div>
                                        </InfiniteScroll> 
                                        : null
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
     }
 }

 const mapDispatchToProps = dispatch => {
    return {
        setSearchClicked: (status) => dispatch(action.setSearchClicked(status)),
        openPlaylist: (open, video_id) => dispatch(action.openPlaylist(open, video_id)),
    };
};

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData,
        searchClicked: state.search.searchClicked        
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(fullPageSearch)