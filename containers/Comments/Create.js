import React from "react"

import UserImage from "../User/Image"

const Create = (props) => {
    const commentref = React.createRef();
    var createObjectURL = (URL || webkitURL || {}).createObjectURL || function(){};
    let color = null
    if(props.edit){
        color = {
            color:"black"
        }
    }
    let style = {}
    if(!props.pageInfoData.loggedInUserDetails){
        style = {style:{width:"100%"}}
    }
    return (
        <div className="create_new_comment">
            {
                props.pageInfoData && props.pageInfoData.loggedInUserDetails ?
                    <div className="user_avatar">
                        <UserImage noRedirect={true} imageSuffix={props.pageInfoData.imageSuffix} data={props.pageInfoData.loggedInUserDetails} />
                    </div>
            : null
            }
            <div className="input_comment" {...style}>
                {
                    props.autofocus ? 
                    <textarea style={color} autoFocus placeholder={props.t("Write your reply here...")} value={props.message} onChange={props.textChange.bind(this,true)}></textarea>
                :
                    <textarea style={color} placeholder={props.t("Write your comment here...")} value={props.message} onChange={props.textChange.bind(this,false)}></textarea>
                }
                {
                    props.image ? 
                        <div className="newcomntImg-prev">
                            <img className="comment-preview-image" src={props.image ? (typeof props.image == "string" ? props.image : createObjectURL(props.image)) : null} alt="" />
                            <a className="comment-image-close" onClick={props.removeImage.bind(this,props.autofocus)}>X</a>
                        </div>
                : null
                }
                <div className="comntAction">
                    <div className="commentImgfile">
                        <label onClick={e => {
                                commentref.current.click();
                            }}> 
                            <span className="material-icons">camera_alt</span>
                        </label>
                        <input className="fileNone" onChange={props.changeImage.bind(this,props.comment_id)}  ref={commentref} type="file" />
                    </div>
                    <button className="postcoment" onClick={props.create.bind(this,props.autofocus,props.comment_id)}>
                        {   props.edit ? 
                                props.posting ? props.t("Editing...") : props.t("Edit")
                        :
                            props.posting ? props.t("Posting...") : props.t("Post")
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Create