import React from "react"
import { connect } from "react-redux";

import Member from './Item'
import Link from "../../components/Link"
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
            members: props.channel_members ? props.channel_members : props.pageData.members,
            page: 2,
            type: "member",
            pagging: props.channel_pagging ? props.channel_pagging : props.pageData.pagging,
            loading: false,
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
        }else if (nextProps.pageData && nextProps.channel_members && nextProps.channel_members != prevState.members) {
            return { members: nextProps.channel_members, pagging: nextProps.channel_members, page: 2,search:nextProps.search ? nextProps.search : [] }
        } else if (nextProps.pageData && nextProps.pageData.members && nextProps.pageData.members != prevState.members) {
            return { members: nextProps.pageData.members, pagging: nextProps.pageData.pagging, page: 2,search:nextProps.search ? nextProps.search : [] }
        } else if (nextProps.pageInfoData.members && nextProps.pageInfoData.members != prevState.members) {
            return {members: nextProps.pageInfoData.members, pagging: nextProps.pageInfoData.pagging, page: 2,search:nextProps.search ? nextProps.search : [] }
        } else{
            return null
        }

    }
    componentDidMount() {
        
        this.props.socket.on('unfollowUser', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "members") {
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.members]
                    const changedItem = {...items[itemIndex]}
                    changedItem.follow_count = changedItem.follow_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.follower_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, members: items })
               }
            }
        });
        this.props.socket.on('followUser', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "members") {
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.members]
                    const changedItem = {...items[itemIndex]}
                    changedItem.follow_count = changedItem.follow_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.follower_id = 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, members: items })
               }
            }
        });
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == this.state.type+"s") {
                const items = [...this.state.members]
                const changedItem = {...items[itemIndex]}
                changedItem.rating = rating
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, members: items })
            }
        });
        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const members = [...this.state.members]
                    const changedItem = {...members[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    members[itemIndex] = changedItem
                    this.setState({localUpdate:true, members: members })
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
                    const members = [...this.state.members]
                    const changedItem = {...members[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    members[itemIndex] = changedItem
                    this.setState({localUpdate:true, members: members })
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
                    const members = [...this.state.members]
                    const changedItem = {...members[itemIndex]}
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
                    members[itemIndex] = changedItem
                    this.setState({localUpdate:true, members: members })
                }
            }
        });
    }
    getItemIndex(item_id) {
        const members = [...this.state.members];
        const itemIndex = members.findIndex(p => p["user_id"] == item_id);
        return itemIndex;
    }

    refreshContent() {
        this.setState({localUpdate:true, page: 1, members: [] })
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

        let url = `/members/browse`;
        let queryString = ""
        if (this.props.pageInfoData.search) {
            queryString = Object.keys(this.props.pageInfoData.search).map(key => key + '=' + this.props.pageInfoData.search[key]).join('&');
            url = `${url}?${queryString}`
        }else if(this.props.contentType){
            url = `/dashboard/members/${this.props.contentType}`
        }else if(this.props.globalSearch){
            queryString = Object.keys(this.state.search).map(key => key + '=' + this.state.search[key]).join('&');
            url = `/search/member?${queryString}`
        }
        if(this.props.channel_id){
            queryString = ""
            url = "/channels/supporters"
            formData.append("channel_id",this.props.channel_id)
        }
        if(this.props.video_id){
            queryString = ""
            url = "/videos/donors"
            formData.append("video_id",this.props.video_id)
        }
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.members) {
                    let pagging = response.data.pagging
                    this.setState({localUpdate:true, page: this.state.page + 1, pagging: pagging, members: [...this.state.members, ...response.data.members], loading: false })
                } else {
                    this.setState({localUpdate:true, loading: false })
                }
            }).catch(err => {
                this.setState({localUpdate:true, loading: false })
            });
    }
    render() {
        let members = this.state.members.map(item => {
            return <div key={item.user_id} className="col-lg-3 col-md-4 col-sm-6 ">
                <Member {...this.props}  key={item.user_id} {...item} member={item} />
            </div>
        })
        return (
            <React.Fragment>
                {
                    this.props.headerTitle ? 
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="titleWrap">
                                    <span className="title">
                                        <React.Fragment>
                                            {
                                                this.props.headerTitle ? 
                                                    this.props.headerTitle : 
                                                    null
                                            }
                                        {Translate(this.props,this.props.titleHeading)}
                                        </React.Fragment>
                                        </span>
                                    {
                                        this.props.seemore && this.state.members.length > 3 ? 
                                        <Link href={`/members?sort=latest`}>
                                            <a className="seemore_link">
                                                {Translate(this.props,"See more")}
                                            </a>
                                        </Link>
                                        : null
                                    }
                                    
                                
                                </div>
                            </div>
                        </div>
                    : null
                }
                 {
                    !this.props.globalSearch ?
                    <div className="user-area">
                        
                            {
                                !this.props.contentType && !this.props.globalSearch ?
                                    <div className="container">
                                        <Search {...this.props}  type="member" />
                                    </div>
                                    : null
                            }
                            <InfiniteScroll
                                dataLength={this.state.members.length}
                                next={this.loadMoreContent}
                                hasMore={this.state.pagging}
                                loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.members.length} />}
                                endMessage={
                                    <EndContent {...this.props} text={Translate(this.props,'No member found with your matching criteria.')} itemCount={this.state.members.length} />
                                }
                                pullDownToRefresh={false}
                                pullDownToRefreshContent={<Release release={false} {...this.props} />}
                                releaseToRefreshContent={<Release release={true} {...this.props} />}
                                refreshFunction={this.refreshContent}
                            >
                                <div className="container">
                                <div className="row mob2col">
                                    {members}
                                </div>
                            </div>
                            </InfiniteScroll>
                        
                    </div>
                :
                <InfiniteScroll
                    dataLength={this.state.members.length}
                    next={this.loadMoreContent}
                    hasMore={this.state.pagging}
                    loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.members.length} />}
                    endMessage={
                        <EndContent {...this.props} text={Translate(this.props,'No member found with your matching criteria.')} itemCount={this.state.members.length} />
                    }
                    pullDownToRefresh={false}
                    pullDownToRefreshContent={<Release release={false} {...this.props} />}
                    releaseToRefreshContent={<Release release={true} {...this.props} />}
                    refreshFunction={this.refreshContent}
                >
                    <div className="container">
                    <div className="row mob2col">
                        {members}
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

export default connect(mapStateToProps, null)(Browse)