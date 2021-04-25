import React from "react"
import Header from "./Header"
import Comment from "./Index"

class Reply extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            item : props.pageData.item,
            comments : props.pageData.comments,
            pagging:props.pageData.pagging,
            replyId:props.pageData.replyId
        }
    }

    render(){

        let commentType = this.state.comments[0].type
        commentType = commentType.replace(/s$/, "");

        return (
            <React.Fragment>
                <Header {...this.props} title={this.state.item.title} item={this.state.item} image={this.state.comments[0].type == "members" ? this.state.item.avtar : this.state.item.image} type={this.state.comments[0].type} />
                <Comment  {...this.props} replyId={this.state.replyId} paggingComment={this.state.pagging} comments={this.state.comments} hideTitle={true} appSettings={this.props.pageData.appSettings} commentType={commentType} type={this.state.comments[0].type} id={this.state.comments[0].type == "members" ? this.state.item.user_id : this.state.item[commentType+"_id"]} />
            </React.Fragment>
        )
    }
}

export default Reply