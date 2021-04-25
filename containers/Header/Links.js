import React from "react"
import Link from "../../components/Link/index"
const Links = (props) => {
    if (!props.data.commentType && ( props.data.type == "users" || props.data.type == "members")) {
        return <Link href="/member" customParam={`memberId=${props.data.custom_url}`} as={`/${props.data.custom_url}`}>
            <a className={props.className ? props.className : ""}>
                {props.children ? props.children : <b>{props.data.title}</b>}
            </a>
        </Link>
    } else if (!props.data.commentType && props.data.type == "channels") {
        return <Link href="/channel" customParam={`channelId=${props.data.custom_url}`} as={`/channel/${props.data.custom_url}`}>
            <a className={props.className ? props.className : ""}>
                {props.children ? props.children : <b>{props.data.title}</b>}
            </a>
        </Link>
    } else if (!props.data.commentType && props.data.type == "channel_posts") {
        return <Link href="/post" customParam={`postId=${props.data.post_id ? props.data.post_id : props.data.custom_url}`} as={`/post/${props.data.post_id ? props.data.post_id : props.data.custom_url}`}>
            <a className={props.className ? props.className : ""}>
                {props.children ? props.children : <b>{props.data.title}</b>}
            </a>
        </Link>
    }else if (!props.data.commentType && props.data.type == "blogs") {
        return <Link href={`/blog?blogId=${props.data.custom_url}`} as={`/blog/${props.data.custom_url}`}>
            <a className={props.className ? props.className : ""}>
                {props.children ? props.children : <b>{props.data.title}</b>}
            </a>
        </Link>
    } else if (!props.data.commentType && props.data.type == "artists") {
        return <Link href="/artist" customParam={`artistId=${props.data.custom_url}`} as={`/artist/${props.data.custom_url}`}>
            <a className={props.className ? props.className : ""}>
                {props.children ? props.children : <b>{props.data.title}</b>}
            </a>
        </Link>
    } else if (!props.data.commentType && props.data.type == "playlists") {
        return <Link href="/playlist" customParam={`playlistId=${props.data.custom_url}`} as={`/playlist/${props.data.custom_url}`}>
            <a className={props.className ? props.className : ""}>
                {props.children ? props.children : <b>{props.data.title}</b>}
            </a>
        </Link>
    } else if (!props.data.commentType && props.data.type == "audio") {
        return <Link href="/audio" customParam={`audioId=${props.data.custom_url}`} as={`/audio/${props.data.custom_url}`}>
            <a className={props.className ? props.className : ""}>
                {props.children ? props.children : <b>{props.data.title}</b>}
            </a>
        </Link>
    } else if (!props.data.commentType && props.data.type == "videos") {
        return <Link href="/watch" customParam={`videoId=${props.data.custom_url}`} as={`/watch/${props.data.custom_url}`}>
            <a className={props.className ? props.className : ""}>
                {props.children ? props.children : <b>{props.data.title}</b>}
            </a>
        </Link>
    }else if(props.data.commentType == "comments" || props.data.type == "comment"){
        return <Link href="/comment" customParam={`commentId=${props.data.id}`} as={`/comment/${props.data.id}`}>
            <a className={props.className ? props.className : ""}>
                {props.children ? props.children : <b>{props.data.title}</b>}
            </a>
        </Link>
    }else if(props.data.commentType == "reply" || props.data.type == "reply"){
        return <Link href="/reply" customParam={`replyId=${props.data.id}`} as={`/reply/${props.data.id}`}>
            <a className={props.className ? props.className : ""}>
                {props.children ? props.children : <b>{props.data.title}</b>}
            </a>
        </Link>
    }else if(props.data.type == "package"){
        return <Link href="/upgrade" as={`/upgrade`}>
        <a className={props.className ? props.className : ""}>
            {props.children ? props.children : <b>{props.data.title}</b>}
        </a>
    </Link>
    }else if(props.data.type == "reply_title" || props.data.type == "comment_title"){
        return <span>{props.data.title}</span>
    }else if(props.data.type == "custom"){
        return <a className={props.className ? props.className : ""} href="#" onClick={(e) => {e.preventDefault()}}><span className="sldkfj"><b>{props.data.title}</b></span></a>
    }else{
        return props.children ? <a className={props.className ? props.className : ""}  onClick={(e) => {e.preventDefault()}} href="#">{props.children}</a> : null
    }
}

export default Links