import React from "react"
import { connect } from "react-redux";
import Playlist from '../Playlist/Item'

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
            playlists: props.pageData.playlists,
            page: 2,
            type: "playlist",
            pagging: props.pageData.pagging,
            loading: false,
            searchType: "creation_date",
            search:props.search ? props.search : []
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
        }else if (nextProps.pageData.playlists != prevState.playlists) {
            return { playlists: nextProps.pageData.playlists, pagging: nextProps.pageData.pagging, page: 2,search:nextProps.search ? nextProps.search : [] }
        } else{
            return null
        }
    }
    componentDidMount() {
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == this.state.type + "s") {
                const items = [...this.state.playlists]
                const changedItem = {...items[itemIndex]}
                changedItem.rating = rating
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, playlists: items })
            }
        });
        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const playlists = [...this.state.playlists]
                    const changedItem = {...playlists[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    playlists[itemIndex] = changedItem
                    this.setState({localUpdate:true, playlists: playlists })
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
                    const playlists = [...this.state.playlists]
                    const changedItem = {...playlists[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    playlists[itemIndex] = changedItem
                    this.setState({localUpdate:true, playlists: playlists })
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
                    const playlists = [...this.state.playlists]
                    const changedItem = {...playlists[itemIndex]}
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
                    playlists[itemIndex] = changedItem
                    this.setState({localUpdate:true, playlists: playlists })
                }
            }
        });
    }
    getItemIndex(item_id) {
        const playlists = [...this.state.playlists];
        const itemIndex = playlists.findIndex(p => p["playlist_id"] == item_id);
        return itemIndex;
    }

    refreshContent() {
        this.setState({localUpdate:true, page: 1, playlists: [] })
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
        let url = `/playlists-browse`;
        let queryString = ""
        if (this.props.pageInfoData.search) {
            queryString = Object.keys(this.props.pageInfoData.search).map(key => key + '=' + this.props.pageInfoData.search[key]).join('&');
            url = `${url}?${queryString}`
        }else if(this.props.globalSearch){
            queryString = Object.keys(this.state.search).map(key => key + '=' + this.state.search[key]).join('&');
            url = `/search/playlist?${queryString}`
        }

        axios.post(url, formData, config)
            .then(response => {
                if (response.data.playlists) {
                    let pagging = response.data.pagging
                    this.setState({localUpdate:true, page: this.state.page + 1, pagging: pagging, playlists: [...this.state.playlists, ...response.data.playlists], loading: false })
                } else {
                    this.setState({localUpdate:true, loading: false })
                }
            }).catch(err => {
                this.setState({localUpdate:true, loading: false })
            });
    }
    render() {
        let playlists = this.state.playlists.map(item => {
            return <div key={item.playlist_id} className="col-xl-3 col-lg-4 col-md-4 col-sm-6">
                <Playlist {...this.props}  key={item.playlist_id} {...item} playlist={item} />
            </div>
        })
        return (
            <React.Fragment>
                {
                            !this.props.globalSearch ?
                    <div className="user-area">
                        {
                            !this.props.globalSearch ?
                                <div className="container">
                                    <Search {...this.props}  type="playlist" />
                                </div>
                                : null
                        }
                        <InfiniteScroll
                            dataLength={this.state.playlists.length}
                            next={this.loadMoreContent}
                            hasMore={this.state.pagging}
                            loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.playlists.length} />}
                            endMessage={
                                <EndContent {...this.props} text={this.props.pageInfoData.search || this.props.globalSearch ?  Translate(this.props,'No playlist found with your matching criteria.') : Translate(this.props,'No playlist created yet.')} itemCount={this.state.playlists.length} />
                            }
                            pullDownToRefresh={false}
                            pullDownToRefreshContent={<Release release={false} {...this.props} />}
                            releaseToRefreshContent={<Release release={true} {...this.props} />}
                            refreshFunction={this.refreshContent}
                        >
                            <div className="container">
                                <div className="row mob2col">
                                    {playlists}
                                </div>
                            </div>
                        </InfiniteScroll>
                        
                    </div>
                :
                <InfiniteScroll
                    dataLength={this.state.playlists.length}
                    next={this.loadMoreContent}
                    hasMore={this.state.pagging}
                    loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.playlists.length} />}
                    endMessage={
                        <EndContent {...this.props} text={this.props.pageInfoData.search || this.props.globalSearch ?  Translate(this.props,'No playlist found with your matching criteria.') : Translate(this.props,'No playlist created yet.')} itemCount={this.state.playlists.length} />
                    }
                    pullDownToRefresh={false}
                    pullDownToRefreshContent={<Release release={false} {...this.props} />}
                    releaseToRefreshContent={<Release release={true} {...this.props} />}
                    refreshFunction={this.refreshContent}
                >
                    <div className="container">
                        <div className="row mob2col">
                            {playlists}
                        </div>
                    </div>
                </InfiniteScroll>
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

export default connect(mapStateToProps, null, null)(Browse)