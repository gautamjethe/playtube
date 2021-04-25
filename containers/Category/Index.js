import React from "react"
import { connect } from "react-redux";
import Breadcrum from "../../components/Breadcrumb/Category"

import Router from "next/router"

import Video from '../Video/Item'
import Channel from '../Channel/Item'
import Blog from '../Blog/Item'

import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import axios from "../../axios-orders"
import playlist from '../../store/actions/general';

import InfiniteScroll from "react-infinite-scroll-component";
import Translate from "../../components/Translate/Index";
class Index extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            id:props.pageData.categoryId,
            type:props.pageData.type,
            items:props.pageData.items,
            category:props.pageData.category,
            subsubcategories:props.pageData.subsubcategories,
            subcategories:props.pageData.subcategories,
            page:2,
            pagging:props.pageData.pagging,
            loading:false
        }
        this.onChange = this.onChange.bind(this)
        this.loadMoreContent = this.loadMoreContent.bind(this)
        this.refreshContent = this.refreshContent.bind(this)
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.pageInfoData.categoryId && nextProps.pageInfoData.categoryId != prevState.id) {
            return { 
                id:nextProps.pageData.categoryId,
                type:nextProps.pageData.type,
                items:nextProps.pageData.items,
                category:nextProps.pageData.category,
                subsubcategories:nextProps.pageData.subsubcategories,
                subcategories:nextProps.pageData.subcategories,
                page:2,
                pagging:nextProps.pageData.pagging,
                loading:false
             }
        } else{
            return null
        }
    }

    componentDidMount(){
        this.props.socket.on('unfollowUser',data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if(type == this.state.type+"s"){   
                const itemIndex = this.getItemIndex(id)  
                if(itemIndex > -1){
                    const items = [...this.state.items]
                    const changedItem = {...items[itemIndex]}       
                    changedItem.follow_count = changedItem.follow_count - 1
                    if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.follower_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true,items:items})
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
                const items = [...this.state.items]
                const changedItem = {...items[itemIndex]}
                changedItem.follow_count = data.follow_count + 1
                if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                    changedItem.follower_id = 1
                }
                items[itemIndex] = changedItem
                this.setState({localUpdate:true,items:items})
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
                    const items = [...this.state.items]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true,items:items})
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
                    const items = [...this.state.items]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if(this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId){
                        changedItem.favourite_id = 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true,items:items})
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
                    const items = [...this.state.items]
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
                    this.setState({localUpdate:true,items:items})
                }
            }
        });
    }
    getItemIndex(item_id){
        if(this.state.items){
            const items = [...this.state.items];
            let checkId = "blog_id"
            if(this.state.type == "channel"){
                checkId = "channel_id"
            }else if(this.state.type == "video"){
                checkId = "video_id"
            }
            const itemIndex = items.findIndex(p => p[checkId] == item_id);
            return itemIndex;
        }
        return -1;
    }
    
    

    onChange(e){
        if(e.target.value){
            Router.push(`/category?type=${this.state.type}&categoryId=${e.target.value}`,`/${this.state.type}/category/${e.target.value}`)
        }
    }
    refreshContent(){
        this.setState({localUpdate:true,page:1,items:[]})
        this.loadMoreContent()
    }
    loadMoreContent(){
        if(this.state.loading){
            return
        }
        this.setState({localUpdate:true,loading:true})
        let formData = new FormData();        
        formData.append('page',this.state.page)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = `${this.state.type}-category/${this.state.id}`;
        axios.post(url, formData ,config)
        .then(response => {
            if(response.data.items){
                let pagging = response.data.pagging
                this.setState({localUpdate:true,page:this.state.page+1,pagging:pagging,items:[...this.state.items,...response.data.items],loading:false})
            }else{
                this.setState({localUpdate:true,loading:false})
            }
        }).catch(err => {
            this.setState({localUpdate:true,loading:false})
        });

    }
    render(){ 
        let items = null
        if(this.state.type == "blog"){
                items = this.state.items.map(item => {
                   return  <div key={item.blog_id} className="col-lg-6 col-md-6 col-sm-12">
                                <Blog {...this.props}  key={item.blog_id} {...item} result={item} />
                            </div>
                })
        }else if(this.state.type == "channel"){
            items = this.state.items.map(item => {
               return  <div key={item.channel_id} className="col-lg-3 col-md-4 col-sm-6 ">
                            <Channel {...this.props}  key={item.channel_id} {...item} channel={item}  />
                        </div>
            })
        }else if(this.state.type == "video"){
            items = this.state.items.map(item => {
               return  <div key={item.video_id} className="col-lg-3 col-md-4 col-sm-6 ">
                            <Video {...this.props}  key={item.video_id} {...item} video={item}  />
                        </div>
            })
        }

        return(
            <React.Fragment>
                    <Breadcrum {...this.props}  onChange={this.onChange} subcategories={this.state.subcategories} subsubcategories={this.state.subsubcategories} image={this.state.category.image ? this.state.category.image : this.props.pageInfoData.appSettings[this.state.type+"_category_default_photo"]} title={this.state.category.title} />
                    <div className="user-area">
                            <InfiniteScroll
                                dataLength={this.state.items.length}
                                next={this.loadMoreContent}
                                hasMore={this.state.pagging}
                                loader={<LoadMore {...this.props} page={this.state.page} loading={true}  itemCount={this.state.items.length}  />}
                                endMessage={
                                    <EndContent {...this.props} text={this.state.type == "blog" ? Translate(this.props,"No blog created in this category yet.") : (this.state.type == "channel" ? Translate(this.props,'No channel created in this category yet.') : Translate(this.props,'No video created in this category yet.'))} itemCount={this.state.items.length} />
                                }
                                pullDownToRefresh={false}
                                pullDownToRefreshContent={<Release release={false} {...this.props} />}
                                releaseToRefreshContent={<Release release={true} {...this.props} />}
                                refreshFunction={this.refreshContent}
                            >
                                <div className="container">
                                <div className="row mob2col">
                                    {items}
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
  const mapDispatchToProps = dispatch => {
    return {
        openPlaylist: (open, video_id) => dispatch(playlist.openPlaylist(open, video_id)),
    };
};
export default connect(mapStateToProps,mapDispatchToProps)(Index)