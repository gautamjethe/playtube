import React from "react"
import Header from "./Header"
import Comment from "./Index"

class CommentContainer extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            item : props.pageData.item,
            comments : props.pageData.comments,
            pagging:props.pageData.pagging
        }
    }
    linkify(inputText) {
        // inputText = inputText.replace(/&lt;br\/&gt;/g, ' <br/>')
        // inputText = inputText.replace(/&lt;br \/&gt;/g, ' <br/>')
        // inputText = inputText.replace(/&lt;br&gt;/g, ' <br/>')
        // var replacedText, replacePattern1, replacePattern2, replacePattern3;
    
        // //URLs starting with http://, https://, or ftp://
        // replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        // replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank" rel="nofollow">$1</a>');
    
        // //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
        // replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        // replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank" rel="nofollow">$2</a>');
    
        // //Change email addresses to mailto:: links.
        // replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
        // replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1" rel="nofollow">$1</a>');
    
        return inputText;
    }
    render(){

        let commentType = this.state.comments[0].type
        commentType = commentType.replace(/s$/, "");

        return (
            <React.Fragment>
                <div className="container">
                    <div className="row">
                        <div className="col-md-10">
                            <Header {...this.props} linkify={this.linkify} title={this.state.item.title} item={this.state.item} image={this.state.comments[0].type == "members" ? this.state.item.avtar : this.state.item.image} type={this.state.comments[0].type} />
                            <Comment  {...this.props} paggingComment={this.state.pagging} comments={this.state.comments}  hideTitle={true} appSettings={this.props.pageData.appSettings} commentType={commentType} type={this.state.comments[0].type} id={this.state.comments[0].type == "members" ? this.state.item.user_id : (this.state.comments[0].type != "channel_posts" ? this.state.item[commentType+"_id"] : this.state.item["post_id"])} />
            
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default CommentContainer