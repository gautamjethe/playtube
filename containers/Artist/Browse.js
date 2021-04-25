import React from "react"
import { connect } from "react-redux";
import Artist from '../Artist/Item'
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import axios from "../../axios-orders"
import config from "../../config";
import InfiniteScroll from "react-infinite-scroll-component";
import Search from "../Search/Index"
import Translate from "../../components/Translate/Index"

class Browse extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            artists:props.pageData.artists,
            page:2,
            type:"artist",
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
        }else if (nextProps.pageData.artists && nextProps.pageData.artists != prevState.artists) {
            return { artists: nextProps.pageData.artists, pagging: nextProps.pageData.pagging, page: 2 }
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
            if(type == this.state.type+"s"){
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const artists = [...this.state.artists]
                    const changedItem = artists[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = null
                    }
                    this.setState({localUpdate:true,artists:artists})
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
                    const artists = [...this.state.artists]
                    const changedItem = artists[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = 1
                    }
                    this.setState({localUpdate:true,artists:artists})
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
                    const artists = [...this.state.artists]
                    const changedItem = artists[itemIndex]
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
                    this.setState({localUpdate:true,artists:artists})
                }
            }
        });
    }
    getItemIndex(item_id){
        if(this.state.artists){
            const artists = [...this.state.artists];
            const itemIndex = artists.findIndex(p => p["artist_id"] == item_id);
            return itemIndex;
        }
        return -1;
    }
    
    refreshContent(){
        this.setState({localUpdate:true,page:1,artists:[]})
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

        let url = `/artists-browse`;
        formData.append('type',`${this.props.pageInfoData.artistType}`)
        let queryString = ""
        if(this.props.pageInfoData.search){
            queryString = Object.keys(this.props.pageInfoData.search).map(key => key + '=' + this.props.pageInfoData.search[key]).join('&');
            url = `${url}?${queryString}`
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
        let artists = this.state.artists.map(item => {
            return  <div key={item.artist_id} className="col-lg-3 col-md-4 col-sm-6 ">
                        <Artist  key={item.artist_id} artists={item} {...this.props} />
                    </div>
        })
        return(
            <React.Fragment>
                    <div className="user-area">
                        <div className="container">
                            <Search  {...this.props} type="artist" subtype={`${this.props.pageInfoData.artistType}`}/>
                        </div>
                                <InfiniteScroll
                                    dataLength={this.state.artists.length}
                                    next={this.loadMoreContent}
                                    hasMore={this.state.pagging}
                                    loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.artists.length}  />}
                                    endMessage={
                                        <EndContent {...this.props} text={Translate(this.props,"No artists found.")} itemCount={this.state.artists.length} />
                                    }
                                    pullDownToRefresh={false}
                                    pullDownToRefreshContent={<Release release={false} {...this.props} />}
                                    releaseToRefreshContent={<Release release={true} {...this.props} />}
                                    refreshFunction={this.refreshContent}
                                >
                                    <div className="container">
                                        <div className="row mob2col">
                                            {artists}
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
  
export default connect(mapStateToProps,null)(Browse)