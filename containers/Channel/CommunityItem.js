import React from "react"
import Image from "../Image/Index"

import Link from "../../components/Link/index";
import swal from 'sweetalert'

import ShortNumber from "short-number"

import Like from "../Like/Index"
import Dislike from "../Dislike/Index"
import axios from "../../axios-orders"
import Timeago from "../Common/Timeago"
import Translate from "../../components/Translate/Index"
class Item extends React.Component {
    constructor(props) {
        super(props)
        let propsData = {...this.props}
        this.state = {
            channel:propsData.channel,
            post: propsData.post,
            language:propsData.i18n.language
        }
        this.delete = this.delete.bind(this)        
    }
    

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if ((nextProps.post && nextProps.post != prevState.post) || nextProps.i18n.language != prevState.language) {
            return { post: nextProps.post,language:nextProps.i18n.language }
        } else{
            return null
        }
    }

    // shouldComponentUpdate(nextProps,nextState){
    //     if(nextProps.post != this.props.post || nextProps.i18n.language != this.state.language){
    //         return true
    //     }
    //     return false
    // }
   
    delete(e) {
        e.preventDefault()
        swal({
            title: Translate(this.props,"Are you sure?"),
            text: Translate(this.props,"Once deleted, you will not be able to recover this!"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()
                    formData.append('id', this.state.post.post_id)
                    formData.append('channel_id', this.state.post.channel_id)
                    const url = "/post/delete"
                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) { 
                                swal("Error", Translate(this.props,"Something went wrong, please try again later", "error"));
                            } else {

                            }
                        }).catch(err => {
                            swal("Error", Translate(this.props,"Something went wrong, please try again later"), "error");
                        });
                    //delete
                } else {

                }
            });
    }
    
    render() {
        
        var description = this.state.post.title
        if (description.length > 300) {
            description = description.substring(0, 300);
        } 
        return (
            <React.Fragment>
                <div className="communty-content d-flex">
                    <div className="profileImg">
                        <Link href="/channel" customParam={`channelId=${this.state.post.channel_custom_url}`} as={`/channel/${this.state.post.channel_custom_url}`}>
                            <a>
                                <Image title={this.state.post.channel_name} image={this.state.post.avtar} imageSuffix={this.props.pageInfoData.imageSuffix} />
                            </a>
                        </Link>
                    </div>
                    <div className="content flex-grow-1">
                        <div className="postBy"> 
                            <div className="authr">
                                <Link href="/channel" customParam={`channelId=${this.state.post.channel_custom_url}`} as={`/channel/${this.state.post.channel_custom_url}`}>
                                    <a>
                                        {this.state.post.channel_name}
                                    </a>
                                </Link>
                            </div>
                            <div className="pdate">
                                <Link  href="/post" customParam={`postId=${this.state.post.post_id}`} as={`/post/${this.state.post.post_id}`}>
                                    <a><Timeago {...this.props} tile={true}>{this.state.post.creation_date}</Timeago></a>
                                </Link>
                            </div>
                        </div>
                        {
                            this.state.channel && (this.state.channel.canEdit || this.state.channel.canDelete) ?
                        <div className="options">
                            <div className="LikeDislikeWrap">
                                <ul className="LikeDislikeList">
                                    <li>
                                        <div className="dropdown TitleRightDropdown">
                                            <a href="#" data-toggle="dropdown"><span className="material-icons">more_verti</span></a>
                                            <ul className="dropdown-menu dropdown-menu-right edit-options">
                                            {
                                                this.state.channel.canEdit ?
                                                <li>
                                                    <a href="#" onClick={(e) => this.props.adPost(this.state.post,e)}><span className="material-icons">edit</span>{Translate(this.props, "Edit")}</a>
                                                </li>
                                                    : null
                                            } 
                                            {
                                                this.state.channel.canDelete ?
                                                <li>
                                                    <a onClick={this.delete} href="#"><span className="material-icons">delete</span>{Translate(this.props, "Delete")}</a>
                                                    </li>
                                                    : null
                                            }
                                            </ul>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        : null
                        }
                        <div className="text">
                            {
                                !this.props.linkify ? 
                            <Link  href="/post" customParam={`postId=${this.state.post.post_id}`} as={`/post/${this.state.post.post_id}`}>
                                <a className="postImg">
                                    <p>{description}</p>
                                    {
                                        this.state.post.image ? 
                                        <Image  image={this.state.post.image} className="img-fluid" imageSuffix={this.props.pageInfoData.imageSuffix} />
                                    : null
                                    }
                                </a>
                            </Link>
                            :
                            <React.Fragment>
                                <p style={{whiteSpace:"pre-line"}} dangerouslySetInnerHTML={{__html:this.props.linkify(this.state.post.title)}}></p>
                                {
                                    this.state.post.image ? 
                                        <Image  image={this.state.post.image} className="img-fluid" imageSuffix={this.props.pageInfoData.imageSuffix} />
                                    : null
                                }
                            </React.Fragment>
                            }
                        </div>
                        <div className="LikeDislikeWrap">
                            <ul className="LikeDislikeList">
                            
                            <li>
                                <Like icon={true} {...this.props} like_count={this.state.post.like_count} item={this.state.post} type="channel_post" id={this.state.post.post_id} />{"  "}
                            </li>
                            
                            <li>
                                <Dislike icon={true} {...this.props} dislike_count={this.state.post.dislike_count} item={this.state.post} type="channel_post" id={this.state.post.post_id} />{"  "}
                            </li>
                          
                            <li>
                                <Link  href="/post" customParam={`postId=${this.state.post.post_id}`} as={`/post/${this.state.post.post_id}`}>
                                    <a className="community-comment-a">
                                        <span title={this.props.t("Comments")}><span className="material-icons md-18">comment</span> {`${ShortNumber(this.state.post.comment_count ? this.state.post.comment_count : 0)}`}</span>
                                    </a> 
                                </Link>  
                            </li>
                               
                            </ul>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default Item;