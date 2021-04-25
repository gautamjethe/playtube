
import React from "react"

import { connect } from "react-redux";

import Translate from "../../components/Translate/Index";
import Timeago from "../Common/Timeago"
import Like from "../Like/Index"
import Dislike from "../Dislike/Index"
import ShortNumber from "short-number"
import Link from "../../components/Link/index";
import Image from "../Image/Index"

class  Posts extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            posts:props.posts,
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if(prevState.posts != nextProps.posts){
            return {posts:nextProps.posts}
        } else{
            return null
        }
    }
    getItemIndex(item_id){
        if(this.state.posts){
            const posts = [...this.state.posts];
            const itemIndex = posts.findIndex(p => p["post_id"] == item_id);
            return itemIndex;
        } 
        return -1;
    }
    componentDidMount(){

        this.props.socket.on('communityDeleted',data => {
            let id = data.post_id
            const itemIndex = this.getItemIndex(id)
            if(itemIndex > -1){
                const posts = [...this.state.posts]
                posts.splice(itemIndex, 1);
                this.setState({localUpdate:true,posts:posts})
            } 
        })
        
        this.props.socket.on('communityEdited',data => {
            let id = data.post_id
            const itemIndex = this.getItemIndex(id)
            if(itemIndex > -1){
                const posts = [...this.state.posts]
                posts[itemIndex]["title"] = data.postData.title
                posts[itemIndex]["image"] = data.postData.image
                this.setState({localUpdate:true,posts:posts})
            }
        })

        this.props.socket.on('likeDislike',data => {
            let itemId = data.itemId
            let itemType = data.itemType
            let ownerId =  data.ownerId
            let removeLike  = data.removeLike
            let removeDislike  = data.removeDislike
            let insertLike = data.insertLike
            let insertDislike =  data.insertDislike
            if(itemType == "channel_posts"){
                const itemIndex = this.getItemIndex(itemId)
                if(itemIndex > -1){
                    const items = [...this.state.posts]
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
                    this.setState({localUpdate:true,posts:items})
                }
            }
        });
        
    }
    
    render(){
        
        return (
            <React.Fragment>
                { 
                    <div className="container mb-5">
                        <h4>{Translate(this.props,'')}</h4>
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="titleWrap">
                                    <span className="title">
                                        <React.Fragment>
                                            <span className="channel_post"><span className="material-icons">post_add</span></span>
                                            {Translate(this.props,"Latest Channel Posts")}
                                        </React.Fragment>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="PostCard-wrap">
                                {
                                    this.state.posts.map(post => {
                                        var description = post.title
                                        if (description.length > 300) {
                                            description = description.substring(0, 300);
                                        } 
                                        return (
                                                <div className="card postCard-box" key={post.post_id}>
                                                    <div className="card-body">
                                                        <div className="head">
                                                            <div className="clogo">
                                                                <Link href="/channel" customParam={`channelId=${post.channel_custom_url}`} as={`/channel/${post.channel_custom_url}`}>
                                                                    <a>
                                                                        <Image title={post.channel_name} image={post.avtar} imageSuffix={this.props.pageInfoData.imageSuffix} />
                                                                    </a>
                                                                </Link>
                                                            </div>
                                                            <span className="cname">
                                                            <Link href="/channel" customParam={`channelId=${post.channel_custom_url}`} as={`/channel/${post.channel_custom_url}`}>
                                                                <a>
                                                                    {post.channel_name}
                                                                </a>
                                                            </Link>
                                                            </span>
                                                            <div className="postdate">
                                                                <Timeago {...this.props}>{post.creation_date}</Timeago>
                                                            </div>
                                                        </div>
                                                        <div className="content">
                                                            <div className="text">
                                                                <Link href="/post" customParam={`postId=${post.post_id}`} as={`/post/${post.post_id}`}>
                                                                    <a>
                                                                        {description}
                                                                    </a>
                                                                </Link>
                                                            </div>
                                                            <div className="imgbox">
                                                                <Link href="/post" customParam={`postId=${post.post_id}`} as={`/post/${post.post_id}`}>
                                                                    <a>
                                                                        <Image image={post.image} imageSuffix={this.props.pageInfoData.imageSuffix} />
                                                                    </a>
                                                                </Link>
                                                            </div>
                                                        </div>

                                                        <div className="foot">
                                                            <div className="likeDislike">
                                                                {/* <div className="icon like active" title="Like">
                                                                    <span className="material-icons-outlined md-18">thumb_up</span>
                                                                    89
                                                                </div> */}
                                                                <div className="icon like">
                                                                    <Like icon={true} {...this.props} like_count={post.like_count} item={post} type="channel_post" id={post.post_id} />{"  "}
                                                                </div>
                                                                <div className="icon like">
                                                                    <Dislike icon={true} {...this.props} dislike_count={post.dislike_count} item={post} type="channel_post" id={post.post_id} />{"  "}
                                                                </div>
                                                            </div>

                                                            <div className="commentOption">
                                                                <div className="icon like">
                                                                    <Link  href="/post" customParam={`postId=${post.post_id}`} as={`/post/${post.post_id}`}>
                                                                        <a className="community-comment-a">
                                                                            <span className="material-icons-outlined md-18">comment</span> {`${ShortNumber(post.comment_count ? post.comment_count : 0)}`}
                                                                        </a> 
                                                                    </Link> 
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                        )
                                    })
                                }
                    </div>
                </div>
                }
            </React.Fragment>
        )
    }
} 

const mapStateToProps = state => {
    return {
        pageInfoData:state.general.pageInfoData
    };
  };
  
export default connect(mapStateToProps,null)(Posts)

