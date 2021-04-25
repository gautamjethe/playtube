import React from "react"
import Translate from "../../components/Translate/Index"

class Chat extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            custom_url:props.custom_url,
            channel:props.channel,
            streamId:props.streamId,
            comments:props.comments ? props.comments : [],
            comment:"",
            showTab:"chat",
            finish:props.finish
        }
        this.submitComment = this.submitComment.bind(this)
        this.deleteMessage = this.deleteMessage.bind(this)
        this.changeTab = this.changeTab.bind(this)
        this.messagesEnd = React.createRef();
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.channel != prevState.channel || nextProps.custom_url != prevState.custom_url || nextProps.streamId != prevState.streamId ) {
            return {streamId: nextProps.streamId, custom_url: nextProps.custom_url, channel: nextProps.channel, comments: nextProps.comments,showTab:"chat",finish:nextProps.finish }
        } else{
            return null
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if(this.props.channel != prevProps.channel || this.props.custom_url != prevProps.custom_url || this.props.streamId != prevProps.streamId ){
            this.props.socket.emit('leaveRoom', {room:prevProps.channel,custom_url:prevProps.custom_url,streamId:prevProps.streamId})
            this.props.socket.emit('roomJoin', {room:this.props.channel,streamId:this.props.streamId})
            this.scrollToBottom()
        }
    }
    shouldComponentUpdate(nextProps,nextState){
        if(nextState.comments != this.state.comments || this.state.comment != nextState.comment || nextState.showTab != this.state.showTab || nextState.channel != this.state.channel || nextState.streamId != this.state.streamId){
            return true
        }else{
            return false
        }
    }
    componentWillUnmount() {
        this.props.socket.disconnect();
        window.removeEventListener("beforeunload", this.onUnloadComponent);
    }
   
    scrollToBottom = () => {
        var _ = this
        _.messagesEnd.scrollTop = _.messagesEnd.scrollHeight;
    }
    componentDidMount(){
        this.scrollToBottom()
        //roomJoin
        this.props.socket.emit('roomJoin', {streamId:this.state.streamId,room:this.state.channel})
        this.props.socket.on('userMessage', data => {
            let comments = [...this.state.comments]
            comments.push(data)
            this.setState({localUpdate:true,comments:comments},() => {
                this.scrollToBottom();
            })
        });

        this.props.socket.on('deleteMessage', data => {
            let chat_id = data.chat_id
            const itemIndex = this.getCommentIndex(chat_id)
            if(itemIndex > -1){
                const comments = [...this.state.comments]
                comments.splice(itemIndex, 1);
                this.setState({localUpdate:true,comments:comments})
            }
        });

    }
    submitComment = () => {
        if(this.state.comment){
            this.postComment();
        }
    }
    enterHit = (e) => {
        if (event.keyCode === 13) {
            e.preventDefault()
            this.postComment()
            return false
        }else{
            return true
        }
    }
    postComment = () => {
        if(this.state.comment && this.props.pageInfoData.loggedInUserDetails){
            let data = {}
            data.room = this.state.channel
            data.streamId = this.state.streamId
            data.message = this.state.comment
            data.id = this.state.custom_url
            data.displayname = this.props.pageInfoData.loggedInUserDetails.displayname
            data.user_id = this.props.pageInfoData.loggedInUserDetails.user_id
            data.image = this.props.pageInfoData.loggedInUserDetails.avtar
            this.setState({localUpdate:true,comment:""})
            this.props.socket.emit('userMessage', data)
            
        }
    }
    deleteMessage = (e,chat_id) => {
        e.preventDefault();
        let data = {}
        data.room = this.state.channel
        data.streamId = this.state.streamId
        data.chat_id = chat_id
        this.props.socket.emit('deleteMessage',data)

    }
    getCommentIndex(item_id){
        if(this.state.comments){
            const comments = [...this.state.comments];
            const itemIndex = comments.findIndex(p => p["chat_id"] == item_id);
            return itemIndex;
        }
        return -1;
    }
    changeTab = (e) => {
        e.preventDefault();
        this.setState({showTab:"participants"})
    }
    getParticipantData = (e) => {
        let participants = []
        this.state.comments.forEach(comment => {
            if(!participants[comment.user_id])
                participants[comment.user_id] = comment
        });
        return participants;
    }
    render(){
        let mainPhoto = this.props.pageInfoData.loggedInUserDetails ? this.props.pageInfoData.loggedInUserDetails.avtar : null

        if (mainPhoto) {
            const splitVal = mainPhoto.split('/')
            if (splitVal[0] == "http:" || splitVal[0] == "https:") {
            } else {
                mainPhoto = this.props.pageInfoData.imageSuffix + mainPhoto
            }
        }

        return(
            <React.Fragment>
                <div className="ls_sdTitle">
                    
                    {
                        this.state.showTab == "chat" ?
                        <React.Fragment>
                            <div className="title">{Translate(this.props,'Live Chat')}</div>
                            <div className="dropdown TitleRightDropdown">
                                <a className="lsdot" href="#" data-toggle="dropdown"><i className="fas fa-ellipsis-v"></i></a>
                                <ul className="dropdown-menu dropdown-menu-right edit-options">
                                    <li>
                                        <a href="#" onClick={this.changeTab}>{Translate(this.props,'Participants')}</a>
                                    </li>
                                </ul>
                            </div>
                    </React.Fragment>
                    : 
                    <div className="chat_participants_cnt">
                        <a href="#" onClick={(e) => {e.preventDefault();this.setState({showTab:"chat"})}}><span className="material-icons">arrow_back</span></a>
                        <span>{Translate(this.props,'Participants')}</span>
                    </div>
                }
                </div>

                <div className="chatList custScrollBar" ref={(ref) => this.messagesEnd = ref}>
                    {
                        this.state.showTab == "chat" ?
                            <div> 
                                {
                                    this.state.comments.map(comment => {
                                        let commentImage = comment.image
                                        if (comment.image) {
                                            const splitVal = commentImage.split('/')
                                            if (splitVal[0] == "http:" || splitVal[0] == "https:") {
                                            } else {
                                                commentImage = this.props.pageInfoData.imageSuffix + comment.image
                                            }
                                        }
                                        return (
                                            <div className="chatListRow" key={comment.chat_id}>
                                                <img className="userImg" src={commentImage} />
                                                <div className="chatMessege">
                                                    <a href="#" onClick={(e) => e.preventDefault()} className="name">{comment.displayname}</a> 
                                                    <span>{comment.message}</span>                                   
                                                </div>
                                                {
                                                    this.props.deleteAll || (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == comment.user_id) ? 
                                                    <a className="deletebtn" href="#" onClick={(e) => this.deleteMessage(e,comment.chat_id)}><i className="fas fa-times"></i></a>
                                                    : null
                                                }
                                            </div>
                                        )
                                    })
                                    
                                }
                                {/* <div  className="chatListRow"></div> */}
                            </div>
                        : 
                            this.getParticipantData().map(comment => {
                                let commentImage = comment.image
                                if (comment.image) {
                                    const splitVal = commentImage.split('/')
                                    if (splitVal[0] == "http:" || splitVal[0] == "https:") {
                                    } else {
                                        commentImage = this.props.pageInfoData.imageSuffix + comment.image
                                    }
                                }
                                return (
                                    <div className="chatListRow" key={comment.chat_id}>
                                        <img className="userImg" src={commentImage} />
                                        <div className="chatMessege">
                                            <a href="#" onClick={(e) => e.preventDefault()} className="name">{comment.displayname}</a> 
                                        </div>
                                    </div>
                                )
                            })
                    }
                   
                
                </div>

                <div className="Chattexttyping">
                    {
                        mainPhoto && this.state.showTab == "chat" && !this.state.finish  ? 
                        <React.Fragment>
                            <div className="userName">
                                <img className="userImg" src={mainPhoto} />
                                <span className="name">{this.props.pageInfoData.loggedInUserDetails.displayname}</span>
                            </div>
                            <div className="chatInput clearfix">
                                <input className="chatbox" type="text" onKeyDown={(e) => this.enterHit(e) } placeholder={this.props.t("Say Something...")} value={this.state.comment} onChange={(e) => this.setState({localUpdate:true,comment:e.target.value})} />
                                <button className="chatsend float-right" onClick={this.submitComment}><i className="fas fa-paper-plane"></i></button>
                            </div>
                        </React.Fragment>
                    : null
                    }
                </div>
            </React.Fragment>
        )
    }
}
export default Chat