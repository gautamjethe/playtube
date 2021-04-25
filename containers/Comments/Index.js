import React from "react"

import { connect } from "react-redux";

import Create from "./Create"

import CommentLi from "./CommentLi"

import axios from "../../axios-orders"

import swal from 'sweetalert'
import ReactMediumImg from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

import Translate from "../../components/Translate/Index"

import InfiniteScroll from "react-infinite-scroll-component";
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import AdsIndex from "../Ads/Index"

class Comment extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            comments: props.comments ? props.comments : [],
            id: props.id,
            type: props.type,
            owner_id: props.owner_id,
            page: 1,
            subtype: props.subtype ? props.subtype : "",
            error: null,
            pagging: typeof props.paggingComment != "undefined" ? props.paggingComment : true,
            submitting: false,
            replyCommentId: 0,
            replyImage: null,
            commentImage: null,
            replyMessage: "",
            commentMessage: "",
            fetchingComments: true,
            editMessage: "",
            editImage: null,
            edit_comment_id: 0,
            edit_reply_comment_id: 0,
            search:"newest",
            approved:"approved"
        }
        this.loadMoreContent = this.loadMoreContent.bind(this)
        this.loadMoreReplies = this.loadMoreReplies.bind(this)
        this.replyClick = this.replyClick.bind(this)
        this.textChange = this.textChange.bind(this)
        this.createComment = this.createComment.bind(this)
        this.deleteComment = this.deleteComment.bind(this)
        this.refreshContent = this.refreshContent.bind(this)
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.id != prevState.id || nextProps.type != prevState.type) {
            if (nextProps.appSettings[(nextProps.subtype ? nextProps.subtype : "") + nextProps.commentType + "_comment"] != 1) {
                return null
            }
            return {
                comments: [],
                page: 1,
                subtype: nextProps.subtype ? nextProps.subtype : "",
                id: nextProps.id,
                type: nextProps.type,
                owner_id: nextProps.owner_id,
                error: null,
                pagging: true,
                submitting: false,
                replyCommentId: 0,
                replyImage: null,
                commentImage: null,
                replyMessage: "",
                commentMessage: "",
                fetchingComments: true,
                editMessage: "",
                editImage: null,
                edit_comment_id: 0,
                edit_reply_comment_id: 0,
                search:"newest",
                approved:"approved"
            }
        } else{
            return null
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if(this.props.id != prevProps.id){
            if (this.props.appSettings[(this.props.subtype ? this.props.subtype : "") + this.props.commentType + "_comment"] == 1) {
                this.getContent()
            }
        }
    }
    replaceTags = (description) => {
        description = description.replace(/(<a [^>]*)(target="[^"]*")([^>]*>)/gi, '$1$3');
        description = description.replace(/(<a [^>]*)(>)/gi, '$1 target="_blank" rel="nofollow"$2');
        return description;
    }
    getContent() {
        var id = this.state.id
        var type = this.state.type
        if (id && type && !this.state.getComment) {
            const formData = new FormData()
            formData.append('page', this.state.page)
            if (this.state.search)
                formData.append('search', this.state.search)
            formData.append("approved",this.state.approved)
            let url = '/comments/' + id + "/" + type;
            this.setState({localUpdate:true, error: null,getComment:true });
            axios.post(url, formData)
                .then(response => {
                    if (response.data.error) {
                        this.setState({localUpdate:true,getComment:false, error: response.data.error, fetchingComments: false });
                    } else {
                        if (this.state.page == 1) {
                            this.setState({localUpdate:true,getComment:false,page: 2,comments:response.data.comments,pagging: response.data.pagging,fetchingComments: false, error: null})
                        } else {
                            this.setState({localUpdate:true,getComment:false,fetchingComments: false, error: null, page: this.state.page + 1, pagging: response.data.pagging, comments: [...this.state.comments, ...response.data.comments] })
                        }
                    }
                }).catch(err => {
                    this.setState({localUpdate:true, fetchingComments: false, error: err });
                });
        }
    }
    componentDidMount() {
        if (this.props.commentType != "channel_post" && this.props.appSettings[(this.state.subtype  ? this.state.subtype  : "")+ this.props.commentType + "_comment"] != 1) {
            return
        }
        if(!this.props.comments){
            this.getContent();
            this.props.socket.on('commentCreated', data => {
                let id = data.id;
                let type = data.type
                let owner_id = data.owner_id
                let approve = data.approved

                let loggedinuserid = 0
                if(this.props.pageInfoData.loggedInUserDetails){
                    loggedinuserid = this.props.pageInfoData.loggedInUserDetails.user_id
                }
                if (id == this.state.id && type == this.state.type) {
                    if(approve == 1 || owner_id == loggedinuserid){
                        const comment = data.comment
                        if (comment) {
                            this.setState({localUpdate:true, comments: [comment, ...this.state.comments] })
                        }
                    }
                }
            });
        }else{
            if(this.props.replyId){
                $('html, body').animate({
                    'scrollTop' : $(`#comment-`+this.props.replyId).position().top
                });
            }
        }
        
        this.props.socket.on('deleteComment', data => {
            let id = data.id;
            let type = data.type
            if (id == this.state.id && type == this.state.type) {
                const comment_id = data.commentId
                const commentIndex = this.getComment(comment_id)
                if (commentIndex > -1) {
                    const comments = [...this.state.comments]
                    comments.splice(commentIndex, 1);
                    this.setState({localUpdate:true, comments: comments })
                }
            }
        });

        this.props.socket.on('deleteReply', data => {
            let id = data.id;
            let type = data.type
            if (id == this.state.id && type == this.state.type) {
                const comment_id = data.commentId
                const reply_id = data.replyId
                const commentIndex = this.getComment(comment_id)
                if (commentIndex > -1) {
                    const comments = [...this.state.comments]
                    let commentReplies = comments[commentIndex]['replies']
                    if (!commentReplies)
                        return
                    const replyIndex = this.getReplies(reply_id, commentReplies["reply"])
                    if (replyIndex > -1) {
                        commentReplies['reply'].splice(replyIndex, 1);
                        this.setState({localUpdate:true, comments: comments })
                    }
                }
            }
        });

        this.props.socket.on('commentEdited', data => {
            let id = data.id;
            let type = data.type
            if (id == this.state.id && type == this.state.type) {
                const comment_id = data.commentId
                const commentIndex = this.getComment(comment_id)
                if (commentIndex > -1) {
                    const comments = [...this.state.comments]
                    comments[commentIndex]['message'] = data.comment.message
                    comments[commentIndex]['image'] = data.comment.image
                    this.setState({localUpdate:true, comments: comments })
                }
            }
        });
        this.props.socket.on('replyEdited', data => {
            let id = data.id;
            let type = data.type
            if (id == this.state.id && type == this.state.type) {
                const comment_id = data.commentId
                const commentIndex = this.getComment(comment_id)
                const replyId = data.replyId
                if (commentIndex > -1) {
                    let comments = [...this.state.comments]
                    let replies = comments[commentIndex]['replies']
                    if (!replies)
                        return
                    replies = replies['reply']
                    const replyIndex = this.getReplies(replyId, replies)
                    if (replyIndex > -1) {
                        replies[replyIndex]['message'] = data.comment.message
                        replies[replyIndex]['image'] = data.comment.image
                        this.setState({localUpdate:true, comments: comments })
                    }
                }
            }
        });
        this.props.socket.on('replyCreated', data => {
            let id = data.id;
            let type = data.type
            if (id == this.state.id && type == this.state.type) {
                const comment = data.comment
                const commentId = data.commentId

                let owner_id = data.owner_id
                let approve = data.approved

                let loggedinuserid = 0
                if(this.props.pageInfoData.loggedInUserDetails){
                    loggedinuserid = this.props.pageInfoData.loggedInUserDetails.user_id
                }

                if (comment && commentId) {
                    if(approve == 1 || owner_id == loggedinuserid){
                        const commentIndex = this.getComment(commentId)
                        if (commentIndex > -1) {
                            let comments = [...this.state.comments]
                            let replies = comments[commentIndex]['replies']
                            if (!replies) {
                                replies = {}
                                replies.reply = []
                            }
                            replies.reply = [comment, ...replies.reply]
                            comments[commentIndex]['replies'] = replies
                            this.setState({localUpdate:true, comments: comments })
                        }
                    }
                }
            }
        });

        this.props.socket.on('likeDislike', data => {
            let itemId = data.itemId
            let itemType = data.itemType
            let ownerId = data.ownerId
            let reply_comment_id = data.reply_comment_id
            let removeLike = data.removeLike
            let removeDislike = data.removeDislike
            let insertLike = data.insertLike
            let insertDislike = data.insertDislike
            if (itemType == "comments") {
                if (reply_comment_id) {
                    const commentIndex = this.getComment(reply_comment_id)
                    if (commentIndex > -1) {
                        let comments = [...this.state.comments]
                        let replies = comments[commentIndex]['replies']
                        if (!replies)
                            return
                        let repliesData = replies['reply']
                        let replyIndex = this.getReplies(itemId, repliesData)
                        if (replyIndex > -1) {
                            let loggedInUserDetails = {}
                            if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
                                loggedInUserDetails = this.props.pageInfoData.loggedInUserDetails
                            }
                            if (removeLike) {
                                if (loggedInUserDetails.user_id == ownerId)
                                    repliesData[replyIndex]['like_dislike'] = null
                                repliesData[replyIndex]['like_count'] = parseInt(repliesData[replyIndex]['like_count']) - 1
                            }
                            if (removeDislike) {
                                if (loggedInUserDetails.user_id == ownerId)
                                    repliesData[replyIndex]['like_dislike'] = null
                                repliesData[replyIndex]['dislike_count'] = parseInt(repliesData[replyIndex]['dislike_count']) - 1
                            }
                            if (insertLike) {
                                if (loggedInUserDetails.user_id == ownerId)
                                    repliesData[replyIndex]['like_dislike'] = "like"
                                repliesData[replyIndex]['like_count'] = parseInt(repliesData[replyIndex]['like_count']) + 1
                            }
                            if (insertDislike) {
                                if (loggedInUserDetails.user_id == ownerId)
                                    repliesData[replyIndex]['like_dislike'] = "dislike"
                                repliesData[replyIndex]['dislike_count'] = parseInt(repliesData[replyIndex]['dislike_count']) + 1
                            }
                            comments[commentIndex]['replies'] = replies
                            this.setState({localUpdate:true, comments: comments })
                        }
                    }
                } else {
                    const commentIndex = this.getComment(itemId)
                    if (commentIndex > -1) {
                        let commentData = [...this.state.comments]
                        let loggedInUserDetails = {}
                        if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
                            loggedInUserDetails = this.props.pageInfoData.loggedInUserDetails
                        }
                        if (removeLike) {
                            if (loggedInUserDetails.user_id == ownerId)
                                commentData[commentIndex]['like_dislike'] = null
                            commentData[commentIndex]['like_count'] = parseInt(commentData[commentIndex]['like_count']) - 1
                        }
                        if (removeDislike) {
                            if (loggedInUserDetails.user_id == ownerId)
                                commentData[commentIndex]['like_dislike'] = null
                            commentData[commentIndex]['dislike_count'] = parseInt(commentData[commentIndex]['dislike_count']) - 1
                        }
                        if (insertLike) {
                            if (loggedInUserDetails.user_id == ownerId)
                                commentData[commentIndex]['like_dislike'] = "like"
                            commentData[commentIndex]['like_count'] = parseInt(commentData[commentIndex]['like_count']) + 1
                        }
                        if (insertDislike) {
                            if (loggedInUserDetails.user_id == ownerId)
                                commentData[commentIndex]['like_dislike'] = "dislike"
                            commentData[commentIndex]['dislike_count'] = parseInt(commentData[commentIndex]['dislike_count']) + 1
                        }
                        this.setState({localUpdate:true, comments: commentData })
                    }
                }
            }
        });
    }
    refreshContent() {
        this.setState({localUpdate:true, page: 1, comments: [] })
        this.loadMoreContent()
    }
    loadMoreContent() {
        this.setState({localUpdate:true, fetchingComments: true })
        this.getContent()
    }
    loadMoreReplies(comment_id) {
        var id = this.state.id
        var type = this.state.type
        if (id && type) {
            const formData = new FormData()
            formData.append('comment_id', comment_id)
            let url = '/replies/' + id + "/" + type;

            const commentIndex = this.getComment(comment_id)
            if (commentIndex > -1) {
                let comments = [...this.state.comments]
                let replies = comments[commentIndex]['replies']
                replies.loading = true

                if (replies.page) {
                    formData.append('page', replies.page)
                } else {
                    formData.append('page', 2)
                }
                this.setState({localUpdate:true, comments: comments })
            }
            formData.append("approved",this.state.approved)
            axios.post(url, formData)
                .then(response => {
                    if (response.data.error) {
                        //this.setState({localUpdate:true,error:response.data.error,submitting:false});
                    } else {
                        
                        //get comment index
                        const commentIndex = this.getComment(comment_id)
                        if (commentIndex > -1) {
                            let comments = [...this.state.comments]
                            let replies = comments[commentIndex]['replies']
                            replies.pagging = response.data.pagging
                            replies.loading = false
                            replies.reply = [...replies.reply, ...response.data.reply]
                            if (replies.page) {
                                replies.page = replies.page + 1
                            } else {
                                replies.page = 3
                            }
                            comments[commentIndex]['replies'] = replies
                            this.setState({localUpdate:true,submitting: false, error: null , comments: comments })
                        }
                    }
                }).catch(err => {
                    this.setState({localUpdate:true, submitting: false, error: err });
                });
        }
    }
    getReplies(reply_id, replies) {
        const replyIndex = replies.findIndex(p => p.comment_id == reply_id);
        return replyIndex;
    }
    getComment(comment_id) {
        const comments = [...this.state.comments];
        const commentIndex = comments.findIndex(p => p.comment_id == comment_id);
        return commentIndex;
    }
    replyClick(comment_id) {
        if (this.state.replyPosting)
            return;
        if (comment_id == this.state.replyCommentId) {
            this.setState({localUpdate:true, replyCommentId: 0, replyMessage: "", replyImage: null })
        } else {
            if (comment_id != this.state.replyCommentId) {
                this.setState({localUpdate:true, replyMessage: "", replyImage: null })
            }
            this.setState({localUpdate:true, replyCommentId: comment_id })
        }
    }
    selectedImage = (comment_id, e) => {
        if (comment_id && this.state.replyPosting) {
            this.setState({localUpdate:true, replyImage: e.target.value })
        } else if (!this.state.commentPosting) {
            this.setState({localUpdate:true, commentImage: e.target.value })
        }
    }
    textChange = (isReply, e) => {
        if (isReply && !this.state.replyPosting) {
            this.setState({localUpdate:true, replyMessage: e.target.value })
        } else if (!this.state.commentPosting) {
            this.setState({localUpdate:true, commentMessage: e.target.value })
        }
    }
    createComment = (isReply, comment_id, e) => {
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            const formData = new FormData()
            formData.append('id', this.state.id)
            formData.append('type', this.state.type)
            if (isReply) {
                if(this.state.replyPosting){
                    return
                }
                if (this.state.replyImage || this.state.replyMessage) {
                    if((!this.state.replyMessage.trim()) && !this.state.replyImage){
                        return
                    }
                    formData.append("parent_id", comment_id)
                    formData.append('message', this.state.replyMessage)
                    formData.append('image', this.state.replyImage)
                    this.setState({localUpdate:true, replyPosting: true })
                } else {
                    return
                }
            } else {
                if((!this.state.commentMessage.trim()) && !this.state.commentImage){
                    return
                }
                if(this.state.commentPosting){
                    return
                }
                if (this.state.commentImage || this.state.commentMessage) {
                    formData.append('message', this.state.commentMessage)
                    formData.append('image', this.state.commentImage)
                    this.setState({localUpdate:true, commentPosting: true })
                } else {
                    return
                }
            }

            let url = '/comments/create'

            axios.post(url, formData)
                .then(response => {
                    if (response.data.error) {
                        this.setState({localUpdate:true,commentPosting:false,replyPosting:false,error:response.data.err})
                        swal("Error", response.data.error[0].message, "error");
                    } else {
                        this.setState({localUpdate:true, submitting: false, error: null })
                        if (isReply) {
                            this.setState({localUpdate:true, replyImage: null, replyMessage: "", replyPosting: false, replyCommentId: 0 })
                        } else {
                            this.setState({localUpdate:true, commentImage: null, commentMessage: "", commentPosting: false })
                        }
                    }
                }).catch(err => {
                    this.setState({localUpdate:true,commentPosting:false,replyPosting:false})
                    swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
                });
        }
    }
    removeImage = (isReply, e) => {
        if (isReply) {
            this.setState({localUpdate:true, replyImage: null })
        } else {
            this.setState({localUpdate:true, commentImage: null })
        }
    }
    changeImage = (comment_id, picture) => {
        var url = picture.target.value;
        var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        if (picture.target.files && picture.target.files[0] && (ext === "png" || ext === "jpeg" || ext === "jpg" || ext === 'PNG' || ext === 'JPEG' || ext === 'JPG' || ext === 'gif' || ext === 'GIF')) {
            if (!comment_id)
                this.setState({localUpdate:true, commentImage: picture.target.files[0], commentImageDelete: true });
            else
                this.setState({localUpdate:true, replyImage: picture.target.files[0], replyImageDelete: true });
        } else {
            if (!comment_id)
                this.setState({localUpdate:true, commentImage: null, commentImageDelete: true });
            else
                this.setState({localUpdate:true, replyImage: null, replyImageDelete: true });
        }
    }
    likeBtn = (comment_id, isReply) => {
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            const formData = new FormData()
            formData.append('id', comment_id)
            if (isReply)
                formData.append('reply_comment_id', isReply)
            formData.append('type', "comments")
            formData.append('action', 'like')
            formData.append('subType', this.props.commentType)
            let url = '/likes'
            axios.post(url, formData)
                .then(response => {

                }).catch(err => {
                    //this.setState({localUpdate:true,submitting:false,error:err});
                });
        }
    }
    disLikeBtn = (comment_id, isReply) => {
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            const formData = new FormData()
            formData.append('id', comment_id)
            formData.append('type', "comments")
            formData.append('action', 'dislike')
            formData.append('subType', this.props.commentType)
            if (isReply)
                formData.append('reply_comment_id', isReply)
            let url = '/likes'
            axios.post(url, formData)
                .then(response => {

                }).catch(err => {
                    //this.setState({localUpdate:true,submitting:false,error:err});
                });
        }
    }
    editComment = (comment_id, isReply) => {
        if (comment_id) {
            //reply
            const comments = [...this.state.comments]
            const commentIndex = this.getComment(comment_id)
            if (commentIndex > -1) {
                const replies = comments[commentIndex]['replies']['reply']
                const replyIndex = this.getReplies(isReply, replies)
                if (replyIndex > -1) {
                    const reply = replies[replyIndex]
                    this.setState({localUpdate:true, editing: true, editMessage: reply.message, editImage: (reply.image ? this.props.pageInfoData.imageSuffix + reply.image : null), edit_comment_id: comment_id, edit_reply_comment_id: isReply })
                }
            }
        } else {
            //comment
            const comments = [...this.state.comments]
            const commentIndex = this.getComment(isReply)
            if (commentIndex > -1) {
                const comment = comments[commentIndex]
                this.setState({localUpdate:true, editing: true, editMessage: comment.message, editImage: (comment.image ? this.props.pageInfoData.imageSuffix + comment.image : null), edit_comment_id: isReply, edit_reply_comment_id: 0 })
            }
        }
    }
    postEditComment = () => {
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            const formData = new FormData()
            formData.append('id', this.state.id)
            formData.append('type', this.state.type)
            if(this.state.commentPosting){
                return;
            }
            if (this.state.edit_reply_comment_id) {
                if (this.state.editImage || this.state.editMessage || this.state.removeEditImage) {
                    formData.append("parent_id", this.state.edit_comment_id)
                    formData.append('comment_id', this.state.edit_reply_comment_id)
                    formData.append('message', this.state.editMessage)
                    formData.append('image', this.state.editImage)
                    if (this.state.removeEditImage)
                        formData.append('remove_image', this.state.removeEditImage)
                    this.setState({localUpdate:true, commentPosting: true })
                } else {
                    return
                }
            } else {
                if (this.state.editImage || this.state.editMessage || this.state.removeEditImage) {
                    formData.append('message', this.state.editMessage)
                    formData.append('comment_id', this.state.edit_comment_id)
                    formData.append('image', this.state.editImage)
                    if (this.state.removeEditImage)
                        formData.append('remove_image', this.state.removeEditImage)
                    this.setState({localUpdate:true, commentPosting: true })
                } else {
                    return
                }
            }
            formData.append("fromedit",1);
            let url = '/comments/create'

            axios.post(url, formData)
                .then(response => {
                    this.setState({localUpdate:true, commentPosting: false })
                    if (response.data.error) {
                        swal("Error", response.data.error[0].message, "error");
                    } else {
                        this.setState({localUpdate:true, editing: false, editMessage: "", editImage: null, edit_comment_id: 0, edit_reply_comment_id: 0, removeEditImage: false })
                    }
                }).catch(err => {
                    //this.setState({localUpdate:true,submitting:false,error:err});
                });
        }
    }
    textEditChange = (isReply, e) => {
        this.setState({localUpdate:true, editMessage: e.target.value })
    }
    removeEditImage = (isReply, e) => {
        this.setState({localUpdate:true, editImage: null, removeEditImage: true })
    }
    changeEditImage = (comment_id, picture) => {
        var url = picture.target.value;
        var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        if (picture.target.files && picture.target.files[0] && (ext === "png" || ext === "jpeg" || ext === "jpg" || ext === 'PNG' || ext === 'JPEG' || ext === 'JPG' || ext === 'gif' || ext === 'GIF')) {
            this.setState({localUpdate:true, editImage: picture.target.files[0], removeEditImage: true });
        } else {
            this.setState({localUpdate:true, editImage: null, removeEditImage: true });
        }
    }
    closeEditPopup = () => {
        this.setState({localUpdate:true, editing: false, editMessage: "", editImage: null, edit_comment_id: 0, edit_reply_comment_id: 0 })
    }
    deleteComment = (comment_id, isReply) => {
        let delete_comment_id = 0
        let delete_reply_id = 0
        if (comment_id) {
            delete_comment_id = comment_id
            delete_reply_id = isReply
        } else {
            delete_comment_id = isReply
        }
        swal({
            title: Translate(this.props, "Are you sure?"),
            text: Translate(this.props, "Once deleted, you will not be able to recover this!"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    //swal("Error", "Something went wrong, please try again later\nsf", "error");
                    const formData = new FormData()
                    formData.append('comment_id', delete_comment_id)
                    formData.append('reply_id', delete_reply_id)
                    formData.append('id', this.state.id)
                    formData.append('type', this.state.type)

                    const url = "/comments/delete"

                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) {

                            } else {

                            }
                        }).catch(err => {
                            swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
                        });
                    //delete
                } else {

                }
            });
    }
    changeSearch = (e) => {
        this.setState({localUpdate:true, search: e.target.value, page: 1, fetchingComments: true, comments: [] }, () => {
            this.getContent()
        })

    }
    changeModeration = (e) => {
        this.setState({localUpdate:true, approved: e.target.value, page: 1, fetchingComments: true, comments: [] }, () => {
            this.getContent()
        })
    }
    approve = (comment_id, isReply) => {
        const formData = new FormData()
        
        if (isReply){
            formData.append('id', isReply)
            formData.append('reply_comment_id', comment_id)
        }else{
            formData.append("id",comment_id)
        }
        formData.append('type', this.props.commentType)
        let url = '/comments/approve'
        if(isReply){
            const reply_id = comment_id
            const commentIndex = this.getComment(isReply)
            if (commentIndex > -1) {
                let comments = [...this.state.comments]
                let commentReplies = comments[commentIndex]['replies']
                if (!commentReplies)
                    return
                const replyIndex = this.getReplies(reply_id, commentReplies["reply"])
                if (replyIndex > -1) {
                    commentReplies['reply'].splice(replyIndex, 1);
                    this.setState({localUpdate:true, comments: comments })
                }
            }
        }else{
            const commentIndex = this.getComment(comment_id)
            if (commentIndex > -1) {
                const comments = [...this.state.comments]
                comments.splice(commentIndex, 1);
                this.setState({localUpdate:true, comments: comments })
            }
        }
        
        axios.post(url, formData)
            .then(response => {

            }).catch(err => {
                
            });
    }
    render() {
        
        if (this.props.commentType != "channel_post" && this.props.appSettings[(this.state.subtype ? this.state.subtype : "") + this.props.commentType + "_comment"] != 1) {
            return null
        }

        let moderation = null
        if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
            if(this.state.owner_id == this.props.pageInfoData.loggedInUserDetails.user_id && this.props.pageInfoData.appSettings['enable_comment_approve'] == 1){
                moderation = <select onChange={this.changeModeration.bind(this)} value={this.state.approved}><option value="approved">{Translate(this.props,"Published Comments")}</option><option value="needreview">{Translate(this.props,"Held for review")}</option></select>
            }
        }

        const comments = this.state.comments.map(comment => {
            let reply = null
            let replyLoading = false
            if (comment.replies) {
                reply = comment.replies.reply.map(reply => {
                    return <CommentLi {...this.props} approveCommentType={this.state.approved} moderation={moderation} approve={this.approve} replaceTags={this.replaceTags} key={reply.comment_id} keyName={reply.comment_id} ReactMediumImg={ReactMediumImg} deleteComment={this.deleteComment} editComment={this.editComment} like={this.likeBtn} dislike={this.disLikeBtn} replyClick={this.replyClick} comment={comment} imageSuffix={this.props.pageInfoData.imageSuffix} data={reply} commentType={this.props.commentType} appSettings={this.props.appSettings} />
                })
                replyLoading = comment.replies.pagging
            }
            let canShowReplyForm = false
            if (this.state.replyCommentId == comment.comment_id)
                canShowReplyForm = true
            return (
                <CommentLi {...this.props} moderation={moderation} approveCommentType={this.state.approved}  approve={this.approve} replaceTags={this.replaceTags}  key={comment.comment_id} keyName={comment.comment_id} ReactMediumImg={ReactMediumImg} deleteComment={this.deleteComment} editComment={this.editComment} like={this.likeBtn} dislike={this.disLikeBtn}  posting={this.state.replyPosting} createComment={this.createComment} message={this.state.replyMessage} textChange={this.textChange} removeImage={this.removeImage} changeImage={this.changeImage} image={this.state.replyImage} data={comment} create={canShowReplyForm} replyClick={this.replyClick} loadMoreReplies={this.loadMoreReplies} imageSuffix={this.props.pageInfoData.imageSuffix}  reply={reply} replyLoading={replyLoading} commentType={this.props.commentType} appSettings={this.props.appSettings} />
            )
        })
        
        let commentReplyEdit = null

        if (this.state.editing) {
            commentReplyEdit =
                <div className="popup_wrapper_cnt">
                    <div className="popup_cnt">
                        <div className="comments">
                            <div className="VideoDetails-commentWrap">
                                <div className="popup_wrapper_cnt_header">
                                    <h2>{Translate(this.props, "Edit")}</h2>
                                    <a onClick={this.closeEditPopup} className="_close"><i></i></a>
                                </div>
                                <Create edit={true} className="edit_comment" {...this.props} posting={this.state.commentPosting} create={this.postEditComment} message={this.state.editMessage} textChange={this.textEditChange} removeImage={this.removeEditImage} image={this.state.editImage} changeImage={this.changeEditImage} />
                            </div>
                        </div>
                    </div>
                </div>
        }

        

        return (
            <React.Fragment>
                {commentReplyEdit}
                <div className="VideoDetails-commentWrap">
                    {
                        !this.props.hideTitle ?
                            <h3>{Translate(this.props, "Comments")}</h3>
                            : null
                    }
                    {
                        !this.props.comments ? 
                            <React.Fragment>
                                <Create {...this.props} posting={this.state.commentPosting} create={this.createComment} message={this.state.commentMessage} textChange={this.textChange} removeImage={this.removeImage} image={this.state.commentImage} changeImage={this.changeImage} />
                                {
                                    this.state.comments.length && this.state.comments.length > 0  ? 
                                <p style={{ float: "right" }}>{Translate(this.props, "Sort By")} &nbsp;<select onChange={this.changeSearch.bind(this)} value={this.state.search}><option value="newest">{Translate(this.props,"Newest")}</option><option value="oldest">{Translate(this.props,"Oldest")}</option></select> &nbsp; &nbsp;{moderation}</p>
                                    : <p style={{ float: "right" }}>{moderation}</p>
                                }
                                
                            </React.Fragment>
                            : null
                    }
                    {
                        this.props.pageInfoData.appSettings['above_comment'] ? 
                            <AdsIndex paddingTop="20px" className="above_comment" ads={this.props.pageInfoData.appSettings['above_comment']} />
                        : null
                    }
                    
                    <div className="newCommentWrap commentListView clearfix">
                        <InfiniteScroll
                            dataLength={this.state.comments.length}
                            next={this.loadMoreContent}
                            hasMore={this.state.pagging}
                            loader={<LoadMore {...this.props} loading={true} itemCount={this.state.comments.length} />}
                            endMessage={
                                <EndContent {...this.props} text={Translate(this.props,"No comment posted yet.")} itemCount={this.state.comments.length} />
                            }
                            pullDownToRefresh={false}
                            pullDownToRefreshContent={<Release release={false} {...this.props} />}
                            releaseToRefreshContent={<Release release={true} {...this.props} />}
                            refreshFunction={this.refreshContent}
                        >
                            <ul className="userCommentsList clearfix">
                                {comments}
                            </ul>
                        </InfiniteScroll>
                    </div>

                    {
                        this.props.pageInfoData.appSettings['below_comment'] ? 
                            <AdsIndex paddingTop="20px" className="below_comment" ads={this.props.pageInfoData.appSettings['below_comment']} />
                        : null
                    }

                </div>
            </React.Fragment>
        )
    }

}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};

export default connect(mapStateToProps)(Comment)