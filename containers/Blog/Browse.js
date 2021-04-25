import React from "react"
import { connect } from "react-redux";
import Blog from '../Blog/Item'
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import axios from "../../axios-orders"
import InfiniteScroll from "react-infinite-scroll-component";
import Search from "../Search/Index"
import Masonry from 'react-masonry-css'

import config from "../../config";
import Translate from "../../components/Translate/Index";


class Browse extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            blogs: props.pageData.blogs,
            page: 2,
            type: "blog",
            pagging: props.pageData.pagging,
            loading: false,
            searchType: "creation_date",
            search: props.search ? props.search : []
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
        }else if (nextProps.pageData.blogs && nextProps.pageData.blogs != prevState.blogs) {
            return { blogs: nextProps.pageData.blogs, pagging: nextProps.pageData.pagging, page: 2, search: nextProps.search ? nextProps.search : [] }
        } else{
            return null
        }
    }

    componentDidMount() {


        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const blogs = [...this.state.blogs]
                    const changedItem = blogs[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    this.setState({localUpdate:true, blogs: blogs })
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
                    const blogs = [...this.state.blogs]
                    const changedItem = blogs[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    this.setState({localUpdate:true, blogs: blogs })
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
                    const blogs = [...this.state.blogs]
                    const changedItem = blogs[itemIndex]
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
                    this.setState({localUpdate:true, blogs: blogs })
                }
            }
        });
    }
    getItemIndex(item_id) {
        const blogs = [...this.state.blogs];
        const itemIndex = blogs.findIndex(p => p["blog_id"] == item_id);
        return itemIndex;
    }

    refreshContent() {
        this.setState({localUpdate:true, page: 1, blogs: [] })
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
        let url = `/blogs-browse`;
        let queryString = ""
        if (this.props.pageInfoData.search) {
            queryString = Object.keys(this.props.pageInfoData.search).map(key => key + '=' + this.props.pageInfoData.search[key]).join('&');
            url = `${url}?${queryString}`
        } else if (this.props.globalSearch) {
            queryString = Object.keys(this.state.search).map(key => key + '=' + this.state.search[key]).join('&');
            url = `/search/blog?${queryString}`
        }
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.blogs) {
                    let pagging = response.data.pagging
                    this.setState({localUpdate:true, page: this.state.page + 1, pagging: pagging, blogs: [...this.state.blogs, ...response.data.blogs], loading: false })
                } else {
                    this.setState({localUpdate:true, loading: false })
                }
            }).catch(err => {
                this.setState({localUpdate:true, loading: false })
            });
    }
    render() {
        let blogs = this.state.blogs.map(item => {
            return <Blog key={item.blog_id}  {...this.props}  key={item.blog_id} {...item} result={item} />
        })
        const breakpointColumnsObj = {
            default: 2,
            1300: 2,
            700: 1,
            500: 1
        };
        return (
            <React.Fragment>
                {
                                !this.props.globalSearch ?
                    <div className="user-area">
                        
                            {
                                !this.props.globalSearch ?
                                <div className="container">
                                    <Search {...this.props}  type="blog" />
                                </div>
                                    : null
                            }

                                <InfiniteScroll
                                    dataLength={this.state.blogs.length}
                                    next={this.loadMoreContent}
                                    hasMore={this.state.pagging}
                                    loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.blogs.length} />}
                                    endMessage={
                                        <EndContent {...this.props} text={this.props.pageInfoData.search || this.props.globalSearch ?  Translate(this.props,'No blog found with your matching criteria.') : Translate(this.props,'No blog created yet.')} itemCount={this.state.blogs.length} />
                                    }
                                    pullDownToRefresh={false}
                                    pullDownToRefreshContent={<Release release={false} {...this.props} />}
                                    releaseToRefreshContent={<Release release={true} {...this.props} />}
                                    refreshFunction={this.refreshContent}
                                >
                                    <div className="container">
                                            <Masonry
                                                breakpointCols={breakpointColumnsObj}
                                                className="my-masonry-grid row"
                                                columnClassName="my-masonry-grid_column">
                                                {blogs}
                                            </Masonry>
                                    </div>
                                </InfiniteScroll>
                        
                    </div>
                :
                    <InfiniteScroll
                        dataLength={this.state.blogs.length}
                        next={this.loadMoreContent}
                        hasMore={this.state.pagging}
                        loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.blogs.length} />}
                        endMessage={
                            <EndContent {...this.props} text={this.props.pageInfoData.search || this.props.globalSearch ?  Translate(this.props,'No blog found with your matching criteria.') : Translate(this.props,'No blog created yet.')} itemCount={this.state.blogs.length} />
                        }
                        pullDownToRefresh={false}
                        pullDownToRefreshContent={<Release release={false} {...this.props} />}
                        releaseToRefreshContent={<Release release={true} {...this.props} />}
                        refreshFunction={this.refreshContent}
                    >
                        <div className="container">
                                <Masonry
                                    breakpointCols={breakpointColumnsObj}
                                    className="my-masonry-grid row"
                                    columnClassName="my-masonry-grid_column">
                                    {blogs}
                                </Masonry>
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

export default connect(mapStateToProps, null)(Browse)