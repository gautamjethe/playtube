import React from "react"
import Create from "./Create"
import LoadMore from "../LoadMore/Index"
import UserImage from "../User/Image"
import UserTitle from "../User/Title"
import Timeago from "../Common/Timeago"
import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'
import { decode } from 'html-entities';

const CommentLi = (props) => {
    return (
        <li key={props.keyName} id={`comment-${props.data.comment_id}`}>
            <div className="userCommentWrap clearfix">
                <div className="user_avatar">
                    <UserImage data={props.data} imageSuffix={props.imageSuffix} />
                </div>
                <div className="comentBody">
                    <div className="commentCnt">
                        <div className="userInfo">
                            <UserTitle data={props.data} childData={<span className="dateday"><Timeago {...props}>{props.data.creation_date}</Timeago></span>}>
                                
                            </UserTitle>

                            {
                                (props.approveCommentType != "needreview") && ((props.pageInfoData && props.pageInfoData.loggedInUserDetails && props.pageInfoData.levelPermissions && (props.pageInfoData.levelPermissions[props.commentType+".delete"] == 2 || ((props.pageInfoData.levelPermissions[props.commentType+".delete"] == 1 || props.commentType == "artist" || props.commentType == "channel_post") && props.data.owner_id == props.pageInfoData.loggedInUserDetails.user_id)))
                                ||
                                props.pageInfoData && props.pageInfoData.loggedInUserDetails && props.pageInfoData.levelPermissions && (props.pageInfoData.levelPermissions[props.commentType+".edit"] == 2 || ((props.pageInfoData.levelPermissions[props.commentType+".edit"] == 1 || props.commentType == "artist")  && props.data.owner_id == props.pageInfoData.loggedInUserDetails.user_id))) ?

                            <div className="dropdown TitleRightDropdown">
                                <a href="#" data-toggle="dropdown"><span className="material-icons">more_vert</span></a>
                                    <ul className="dropdown-menu dropdown-menu-right edit-options">
                                {
                                    props.pageInfoData && props.pageInfoData.loggedInUserDetails && props.pageInfoData.levelPermissions && (props.pageInfoData.levelPermissions[props.commentType+".edit"] == 2 || ((props.pageInfoData.levelPermissions[props.commentType+".edit"] == 1 || props.commentType == "artist" || props.commentType == "channel_post")  && props.data.owner_id == props.pageInfoData.loggedInUserDetails.user_id)) ? 
                                        <li onClick={props.editComment.bind(this,props.comment ? props.comment.comment_id : null,props.data.comment_id)}>
                                            <span>
                                                <span className="material-icons">edit</span>
                                                {props.t("Edit")}
                                            </span>
                                        </li>
                                : null
                                }
                                {
                                    props.pageInfoData && props.pageInfoData.loggedInUserDetails && props.pageInfoData.levelPermissions && (props.pageInfoData.levelPermissions[props.commentType+".delete"] == 2 || ((props.pageInfoData.levelPermissions[props.commentType+".delete"] == 1 || props.commentType == "artist" || props.commentType == "channel_post" ) && props.data.owner_id == props.pageInfoData.loggedInUserDetails.user_id)) ? 
                                        <li onClick={props.deleteComment.bind(this,props.comment ? props.comment.comment_id : null,props.data.comment_id)}>
                                            <span>
                                            <span className="material-icons">delete</span> {props.t("Delete")}
                                            </span>
                                        </li>
                                : null
                                }
                                </ul>
                            </div>
                            : null
                            }
                        </div>
                    <div className="usercomment">
                        <p style={{whiteSpace:"pre-line"}}>{props.replaceTags(decode(renderToString(<CensorWord {...props} text={props.data.message} />)))}</p>
                        {
                            props.data.image ? 
                            <props.ReactMediumImg>
                                <img
                                src={`${props.imageSuffix}${props.data.image}`}
                                width="500"
                                />
                            </props.ReactMediumImg>
                            : null
                        }
                    </div>
                    </div>
                    <div className="commentAction">
                    {
                            (props.approveCommentType != "needreview") ? 
                        <ul className="commentActionLo clearfix">
                            
                            {
                               props.commentType == "channel_post" || props.appSettings[(props.subtype ? props.subtype : "") + props.commentType+"_comment_like"] == 1 ?
                            <li className="like" onClick={props.like.bind(this,props.data.comment_id,props.comment ? props.comment.comment_id : null)}>
                                <span className={props.data.like_dislike == "like" ? "active" : ""}>
                                    <span className="material-icons-outlined md-18">thumb_up</span> {props.data.like_count}
                                </span>
                            </li>
                            : null
                            }
                            {
                               props.commentType == "channel_post" || props.appSettings[(props.subtype ? props.subtype : "") + props.commentType+"_comment_dislike"] == 1 ?
                                    <li className="like" onClick={props.dislike.bind(this,props.data.comment_id,props.comment ? props.comment.comment_id : null)}>
                                        <span className={props.data.like_dislike == "dislike" ? "active" : ""}>
                                            <span className="material-icons-outlined md-18">thumb_down</span> {props.data.dislike_count}
                                        </span>
                                    </li>
                                : null
                            }
                            <li onClick={props.replyClick.bind(this,props.comment ? props.comment.comment_id : props.data.comment_id)}>
                                <span>
                                    <span className="material-icons md-18">reply</span> {props.t("Reply")}
                                </span>
                            </li>
                        </ul>
                        : props.data.approved != 1 ? 
                          <ul className="commentActionLo clearfix">
                            <li className="like" onClick={props.approve.bind(this,props.data.comment_id,props.comment ? props.comment.comment_id : null)}>
                                <span>
                                    <span className="material-icons-outlined md-18">check</span> {props.t("Approved")}
                                </span>
                            </li>
                            <li className="like" onClick={props.deleteComment.bind(this,props.comment ? props.comment.comment_id : null,props.data.comment_id)}>
                                <span>
                                    <span className="material-icons-outlined md-18">clear</span> {props.t("Delete")}
                                </span>
                            </li>
                          </ul>
                          : null
                        }
                        {
                            props.create && (props.approveCommentType != "needreview") ? 
                                <Create  {...props} create={props.createComment}  autofocus={true}  comment_id={props.data.comment_id} />
                            : null
                        }
                    </div>
                </div>
            </div>
            {
                props.reply ?
                    <ul className="userCommentsList replyuser clearfix">
                        {props.reply}
                        {
                            props.replyLoading ? 
                                <LoadMore {...props} loading={props.data.replies.loading} loadMoreContent={props.loadMoreReplies.bind(this,props.data.comment_id)} />
                            : null
                        }
                    </ul>
                : null
            }
        </li>
    )
}

export default CommentLi