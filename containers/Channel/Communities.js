import React from "react"

import axios from "../../axios-orders"
import { connect } from "react-redux";

import InfiniteScroll from "react-infinite-scroll-component";
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import Translate from "../../components/Translate/Index";
import Item from "./CommunityItem"
import AddPost from "./AddPost"

class  Posts extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            page:2,
            posts:props.posts,
            channel:props.channel,
            pagging:props.pagging,
            channel_id:props.channel_id
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
        }else if(prevState.posts != nextProps.posts){
            return {posts:nextProps.posts,pagging:nextProps.pagging,page:2,channel_id:nextProps.channel_id}
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
        this.props.socket.on('communityAdded',data => {
            let id = data.channel_id
            console.log(id,this.state.channel_id)
            if(id == this.state.channel_id){
                const posts = [data.postData,...this.state.posts]
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
    refreshContent(){
        this.setState({localUpdate:true,page:1,posts:[]})
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
       
        formData.append('channel_id',this.props.channel_id)
        url = `/channels/posts`;
       
        axios.post(url, formData ,config)
        .then(response => {
            if(response.data.posts){
                let pagging = response.data.pagging
                this.setState({localUpdate:true,page:this.state.page+1,pagging:pagging,posts:[...this.state.posts,...response.data.posts],loading:false})
            }else{
                this.setState({localUpdate:true,loading:false})
            }
        }).catch(err => {
            this.setState({localUpdate:true,loading:false})
        });

    }
    adPost = (data,e) => {
        e.preventDefault();
        this.setState({localUpdate:true,addpost:true,editData:data});
    }
    closePOst = () => { 
        this.setState({localUpdate:true,addpost:false,editData:null});
    }
    render(){
        
        return (
            <React.Fragment>
                {
                    this.state.addpost ? 
                        <AddPost {...this.props} closePOst={this.closePOst} editItem={this.state.editData} channel_id={this.props.channel_id} />
                    : null
                }    
                <InfiniteScroll
                            dataLength={this.state.posts.length}
                            next={this.loadMoreContent}
                            hasMore={this.state.pagging}
                            loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.posts.length} />}
                            endMessage={
                                <EndContent {...this.props} text={Translate(this.props,'No post created yet.')} itemCount={this.state.posts.length} />
                            }
                            pullDownToRefresh={false}
                            pullDownToRefreshContent={<Release release={false} {...this.props} />}
                            releaseToRefreshContent={<Release release={true} {...this.props} />}
                            refreshFunction={this.refreshContent}
                        >
                            <React.Fragment>
                                {
                                    this.state.posts.map(post => {
                                        return (
                                            <div key={post.post_id} className="communty-boxWrap">
                                                <Item adPost={this.adPost} channel={this.state.channel} canDelete={this.props.canDelete} canEdit={this.props.canEdit} {...this.props} {...post} post={post}   />
                                            </div>
                                        )
                                    })
                                }
                            </React.Fragment>                  
                </InfiniteScroll>
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