import React, { Component } from "react"
import axios from "../../axios-orders"
import { connect } from 'react-redux';
import Player from "./Player"
import OutsidePlayer from "./OutsidePlayer"
import LoadMore from "../LoadMore/Index"
import Translate from "../../components/Translate/Index";
import InfiniteScroll from "react-infinite-scroll-component";
import EndContent from "../LoadMore/EndContent"
import VideoForm from "../../containers/Form/Video"

class Popup extends Component{
    constructor(props){
        super(props)
        this.state = {
            type:props.playlist ? "search" : "upload",
            channel_id:props.channel_id,
            loading:false,
            playlist:props.playlist,
            content:[],
            page:1,
            myContent:[],
            pageMyContent:1,
            selectedVideo:[],
            submitEnable:false,
            nextPageMyContent:false,
            nextPageContent:false
        }
        this.loadMoreMyContent = this.loadMoreMyContent.bind(this)
        this.loadMoreContent = this.loadMoreContent.bind(this)
    }
    
    changeType = (e,type) => {
        if(type == "my"){
            $('#video_search_btn').val('')
            this.setState({type:"my",submitEnable:false})
        }else if(type == "url"){
            $('#video_search_btn').val('')
            this.setState({type:"url",page:1,content:[],selectedVideo:[],submitEnable:false})
        }else if(type == "search"){
            $('#video_search_btn').val('')
            this.setState({type:"search",page:1,content:[],selectedVideo:[],submitEnable:false})
        }else if(type == "upload"){
            $('#video_search_btn').val('')
            this.setState({type:"upload",page:1,content:[],selectedVideo:[],submitEnable:false})
        }
    }
    searchButtonClick = (isCheck = false,type = "") => {
        let formData = new FormData();
        if(!type || type != "my"){
            var value = $('#video_search_btn').val();
            if(!value)
                return;
            if(value){
                this.setState({loading:true})
            }
            formData.append("value",value)
            formData.append("criteria",this.state.type)
            formData.append('page',this.state.page)
        }else{
            formData.append('criteria',type)
            formData.append('page',this.state.pageMyContent)
        }
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        if(this.state.channel_id){
            formData.append('channel_id',this.state.channel_id)
        }
        let url = '/videos/search';
        if(this.state.playlist){
            url = "/channels/get-playlists"
        }
        axios.post(url, formData ,config)
        .then(response => {
            if(response.data.videos || response.data.playlists){
                let pagging = response.data.pagging
                if(type == "" || type != "my"){
                    if(this.state.page == 1){
                        if(this.state.playlist){
                            this.setState({nextPageContent:pagging,page:2,content:response.data.playlists,loading:false,submitEnable:response.data.playlists.length > 0 && this.state.type == "url" ? true : false,selectedVideo:response.data.playlists.length > 0 && this.state.type == "url" ? [response.data.playlists[0].playlist_id] : []})
                        }else{
                            this.setState({nextPageContent:pagging,page:2,content:response.data.videos,loading:false,submitEnable:response.data.videos.length > 0 && this.state.type == "url" ? true : false,selectedVideo:response.data.videos.length > 0 && this.state.type == "url" ? [response.data.videos[0].video_id] : []})
                        }
                    }else{
                        if(this.state.playlist){
                            this.setState({nextPageContent:pagging,page:this.state.page + 1,content:[...this.state.content,...response.data.playlists],loading:false,submitEnable:response.data.playlists.length > 0 && this.state.type == "url" ? true : false,selectedVideo:response.data.playlists.length > 0 && this.state.type == "url" ? [response.data.playlists[0].playlist_id] : []})
                        }else{
                            this.setState({nextPageContent:pagging,page:this.state.page + 1,content:[...this.state.content,...response.data.videos],loading:false,submitEnable:response.data.videos.length > 0 && this.state.type == "url" ? true : false,selectedVideo:response.data.videos.length > 0 && this.state.type == "url" ? [response.data.videos[0].video_id] : []})
                        }
                    }
                }else{
                    if(this.state.pageMyContent == 1){
                        if(!this.state.playlist){
                            this.setState({pageMyContent:2,nextPageMyContent:pagging,myContent:response.data.videos,loading:false})
                        }else{
                            this.setState({pageMyContent:2,nextPageMyContent:pagging,myContent:response.data.playlists,loading:false})
                        }
                    }else{
                        if(!this.state.playlist){
                            this.setState({pageMyContent:this.state.pageMyContent+1,nextPageMyContent:pagging,myContent:[...this.state.myContent,...response.data.videos],loading:false})
                        }else{
                            this.setState({pageMyContent:this.state.pageMyContent+1,nextPageMyContent:pagging,myContent:[...this.state.myContent,...response.data.playlists],loading:false})
                        }
                    }
                }
            }
        }).catch(err => {console.log(err)
            this.setState({loading:false})
        });

    }
    componentDidMount(){
        this.searchButtonClick(true,'my')
    }
    loadMoreMyContent(){
        this.setState({loading:true})
        this.searchButtonClick(true,'my')
    }
    loadMoreContent(){
        this.searchButtonClick()
    }
    selectedVideo(video_id){
        const videos = [...this.state.selectedVideo]
        var index = videos.indexOf(video_id);
        if (index > -1) {
            videos.splice(index, 1); 
        }else{
            videos.push(video_id)
        }
        let enableSubmit = false
        if(videos.length > 0){
            enableSubmit = true
        }
        this.setState({selectedVideo:videos,submitEnable:enableSubmit})
    }
    chooseVideos = () => {
        if(this.state.selectedVideo.length > 0){
            this.props.chooseVideos(this,this.state.selectedVideo)
        }else if(this.state.type == "upload"){
            this.props.chooseVideos(this,this.state.selectedVideo)
        }
    }
    
    render(){
        return (
            <div id="myModal" className="modal-popup">
                <div className="modal-content-popup">
                    <span className={"close-popup"} onClick={this.props.closePopup}>&times;</span>
                    <ul className="popupTabList clearfix">
                        {
                            !this.state.playlist ? 
                                <li className={(this.state.type == "upload" ? "active" : "")} onClick={() => this.changeType(this,'upload')}>
                                    {Translate(this.props, "Upload Video" )}
                                </li>
                            : null
                        }
                        <li className={(this.state.type == "search" ? "active" : "")} onClick={() => this.changeType(this,'search')}>
                            {Translate(this.props, this.state.playlist ? "Playlist search" : "Video search" )}
                        </li>
                        <li className={(this.state.type == "url" ? "active" : "")} onClick={() => this.changeType(this,'url')}>
                        {Translate(this.props, "URL")}
                        </li>
                        <li className={(this.state.type == "my" ? "my" : "")} onClick={() => this.changeType(this,'my')}>
                        {Translate(this.props, `My uploaded ${this.state.playlist ? "playlist" : "video"}`)} 
                        </li>
                    </ul>
                    {
                        this.state.type == "search" ?
                        <div className="populatTabListContent">
                            <p>{Translate(this.props,`Type your search in the box below to find ${this.state.playlist ? "playlists" : "videos"}`)}</p>
                            <div style={{marginBottom:"10px"}}>
                                <input type="text" id="video_search_btn" /> 
                                <button type="button" onClick={() => { this.setState({page:1},()=>{this.searchButtonClick()}) }}>{Translate(this.props,"Search")}</button>
                            </div>
                            {
                            this.state.content.length > 0 ?
                                <div id="scrollableDivPopupSearch" className="popup_container custScrollBar">
                                    <InfiniteScroll
                                            dataLength={this.state.content.length}
                                            next={this.loadMoreContent}
                                            hasMore={this.state.nextPageContent}
                                            loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.content.length} />}
                                            endMessage={
                                                <EndContent {...this.props} text={Translate(this.props,'No data found to display.')} itemCount={this.state.content.length} />
                                            }
                                            pullDownToRefresh={false}
                                            scrollableTarget="scrollableDivPopupSearch"
                                        >
                                        {
                                            this.state.content.map(result =>{
                                                let imageUrl = ""
                                                if(result.image.indexOf("http://") == 0 || result.image.indexOf("https://") == 0){
                                                    imageUrl = result.image
                                                }else{
                                                    if(this.props.pageInfoData.livestreamingtype == 0 && result.mediaserver_stream_id &&  result.image && result.image.indexOf('LiveApp/previews') > 0){
                                                        imageUrl = this.props.pageInfoData.liveStreamingServerURL+":5443"+result.image
                                                    }else{
                                                        imageUrl = this.props.pageInfoData.imageSuffix+result.image
                                                    }
                                                }
                                                return (
                                                    <div className={`upldPopupVdo${this.state.selectedVideo.indexOf(result.video_id ? result.video_id : result.playlist_id) > -1 ? " popup_content_selected" : ""}`} key={result.video_id ? result.video_id : result.playlist_id} onClick={this.selectedVideo.bind(this,result.video_id ? result.video_id : result.playlist_id)}>
                                                        <img style={{height:"100px",width:"100px"}} src={ imageUrl} />
                                                        <div>
                                                            {result.title}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                        </InfiniteScroll>
                                    </div>
                            :
                            <p>{Translate(this.props,`No ${this.state.playlist ? "playlist" : "video"} found`)}</p>
                        }
                        
                        </div>
                        :
                        this.state.type == "my" ? 
                        <div className="popup_container custScrollBar" id="scrollableDivPopup">
                        {
                            this.state.myContent.length > 0 ? 
                                
                                <InfiniteScroll
                                        dataLength={this.state.myContent.length}
                                        next={this.loadMoreMyContent}
                                        hasMore={this.state.nextPageMyContent}
                                        loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.myContent.length} />}
                                        endMessage={
                                            <EndContent {...this.props} text={Translate(this.props,'No data found to display.')} itemCount={this.state.myContent.length} />
                                        }
                                        pullDownToRefresh={false}
                                        scrollableTarget="scrollableDivPopup"
                                    >
                                    {
                                        this.state.myContent.map(result =>{
                                            let imageUrl = ""
                                            if(result.image.indexOf("http://") == 0 || result.image.indexOf("https://") == 0){
                                                imageUrl = result.image
                                            }else{
                                                if(this.props.pageInfoData.livestreamingtype == 0 && result.mediaserver_stream_id &&  result.image && result.image.indexOf('LiveApp/previews') > 0){
                                                    imageUrl = this.props.pageInfoData.liveStreamingServerURL+":5443"+result.image
                                                }else{
                                                    imageUrl = this.props.pageInfoData.imageSuffix+result.image
                                                }
                                            }
                                            return (
                                                <div  className={`upldPopupVdo${this.state.selectedVideo.indexOf(result.video_id ? result.video_id : result.playlist_id) > -1 ? " popup_content_selected" : ""}`}  key={result.video_id ? result.video_id : result.playlist_id} onClick={this.selectedVideo.bind(this,result.video_id ? result.video_id : result.playlist_id)}>
                                                    <img style={{height:"100px",width:"100px"}} src={ imageUrl } />
                                                    <div>
                                                        {result.title}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                    </InfiniteScroll>

                            :
                            <p>{Translate(this.props,`No ${this.state.playlist ? "playlist" : "video"} create by you yet`)}</p>
                        }
                        </div>
                        :
                        this.state.type == "upload" ? 
                            <VideoForm {...this.props} channel_id={this.state.channel_id} chooseVideos={this.chooseVideos} />
                        :
                        <div className="populatTabListContent">
                            <p>{Translate(this.props,'Paste site URL here:')}</p>
                            <div style={{marginBottom:"10px"}}>
                            <input type="text" id="video_search_btn" /> 
                            <button type="button" onClick={this.searchButtonClick}>{Translate(this.props,'search')}</button>
                            </div>
                            {
                                this.state.content.length > 0 ? 
                                this.state.playlist ? 
                                    <div className={`upldPopupVdo${this.state.selectedVideo.indexOf(this.state.content[0].playlist_id ? this.state.content[0].playlist_id : this.state.content[0].video_id) > -1 ? " popup_content_selected" : ""}`} key={this.state.content[0].playlist_id ? this.state.content[0].playlist_id : this.state.content[0].video_id} onClick={this.selectedVideo.bind(this,this.state.content[0].playlist_id ? this.state.content[0].playlist_id : this.state.content[0].video_id)}>
                                        <img style={{height:"100px",width:"100px"}} src={ /^((http|https):\/\/)/.test(this.state.content[0].image) ? this.state.content[0].image : this.props.pageInfoData.imageSuffix+this.state.content[0].image} />
                                        <div>
                                            {this.state.content[0].title}
                                        </div>
                                    </div>
                                :
                                this.state.content[0].type == 3 ?
                                    <Player {...this.props} video={this.state.content[0]}  />
                                :
                                    <OutsidePlayer code={this.state.content[0].code} {...this.props} video={this.state.content[0]} /> 
                                :
                                <p>{Translate(this.props,`No ${this.state.playlist ? "playlist" : "video"} found`)}</p>
                            }
                            
                        </div>
                    }
                    {
                        this.state.type != "upload" ? 
                            <div className="modal-popup-footer">
                                <button  className={this.state.submitEnable ? "popup-enable-btn" : "popup-disable-btn"}  onClick={this.chooseVideos}>
                                    {Translate(this.props,`Add ${this.state.playlist ? "playlist" : "video"}`)}
                                </button>
                                <button onClick={this.props.closePopup}>
                                    {Translate(this.props,"Cancel")}
                                </button>
                            </div>
                        : null
                    }
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        pageInfoData:state.general.pageInfoData
    };
  };

 
export default connect(mapStateToProps,null) (Popup) ;