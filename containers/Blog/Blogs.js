import React from "react"
import { connect } from "react-redux";
import Blog from '../Blog/Item'
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import axios from "../../axios-orders"

import InfiniteScroll from "react-infinite-scroll-component";
import Translate from "../../components/Translate/Index";

class Browse extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            page: 2,
            type: 'blog',
            blogs: props.blogs,
            pagging: props.pagging
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
        }else if (nextProps.blogs && nextProps.blogs != prevState.blogs) {
            return { blogs: nextProps.blogs, pagging: nextProps.pagging, page: 2}
        }else if (nextProps.pageInfoData.blogs && nextProps.blogs != prevState.blogs) {
            return { blogs: nextProps.pageInfoData.blogs.results, pagging: nextProps.pageInfoData.blogs.pagging, page: 2 }
        } else{
            return null
        }
    }


    componentDidMount() {
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == "blogs") {
                const items = [...this.state.blogs]
                const changedItem = items[itemIndex]
                changedItem.rating = rating
                this.setState({localUpdate:true, blogs: items })
            }
        });
        this.props.socket.on('blogDeleted', data => {
            let id = data.blog_id
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1) {
                const blogs = [...this.state.blogs]
                blogs.splice(itemIndex, 1);
                this.setState({localUpdate:true, blogs: blogs })
            }
        })
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
        this.loadMoreContent()
    }
    loadMoreContent() {
        this.setState({localUpdate:true, loading: true })
        let formData = new FormData();
        formData.append('page', this.state.page)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = ""
        if (this.props.contentType) {
            url = `/dashboard/blogs/${this.props.contentType}`;
        } else if (this.props.user_id) {
            formData.append('owner_id', this.props.user_id)
            url = `/members/blogs`;
        }

        axios.post(url, formData, config)
            .then(response => {
                if (response.data.blogs) {
                    let pagging = response.data.pagging
                    this.setState({localUpdate:true, page: this.state.page + 1, pagging: pagging, blogs: [...this.state.blogs, ...response.data.blogs], loading: false })
                } else {
                    this.setState({localUpdate:true, loading: false })
                }
            }).catch(() => {
                this.setState({localUpdate:true, loading: false })
            });
    }
    render() {
        let blogs = this.state.blogs.map(item => {
            return <div key={item.blog_id} className="col-md-6">
                <Blog {...this.props} canDelete={this.props.canDelete} canEdit={this.props.canEdit} key={item.blog_id} {...item} result={item} />
            </div>
        })
        return (
            <React.Fragment>
                        <InfiniteScroll
                            dataLength={this.state.blogs.length}
                            next={this.loadMoreContent}
                            hasMore={this.state.pagging}
                            loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.blogs.length} />}
                            endMessage={
                                <EndContent {...this.props} text={this.props.contentType == "my" ? Translate(this.props,'No blog created yet.') : (this.props.contentType ? Translate(this.props,'No blog found with your matching criteria.') : Translate(this.props,'No blog created by this user yet.'))} itemCount={this.state.blogs.length} />
                            }
                            pullDownToRefresh={false}
                            pullDownToRefreshContent={<Release release={false} {...this.props} />}
                            releaseToRefreshContent={<Release release={true} {...this.props} />}
                            refreshFunction={this.refreshContent}
                        >
                            <div className="row mob2col">
                                {blogs}
                            </div>
                        </InfiniteScroll>
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