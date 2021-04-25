import React from "react"
import { connect } from "react-redux"

import playlist from '../../store/actions/general';

import Player from "../Video/Player"

import OutsidePlayer from "../Video/OutsidePlayer"

import Link from "../../components/Link/index";
import CensorWord from "../CensoredWords/Index"

import WatchLater from "../WatchLater/Index"
import Image from "../Image/Index"
import swal from 'sweetalert'


class MiniPlayer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            relatedVideos:props.relatedVideos,
            playlistVideos:props.playlistVideos,
            currentVideoTime:props.currentVideoTime,
            video:props.currentVideo,
            arrow:"up",
            message:props.deleteMessage,
            title:props.deleteTitle,
            liveStreamingURL:props.liveStreamingURL,
            width:props.isMobile ? props.isMobile : 993,
            minimizePlayer:false
        }
        this.videoChange = this.videoChange.bind(this)
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }
    updateWindowDimensions() {
        this.setState({localUpdate:true, width: window.innerWidth });
    }
    shouldComponentUpdate(nextProps, nextState){
        if(nextProps.relatedVideos != this.state.relatedVideos || nextProps.playlistVideos != this.state.playlistVideos || nextProps.currentVideoTime != this.state.currentVideoTime || nextProps.currentVideo != this.state.currentVideo){
            return true
        }
        return false
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if(nextProps.relatedVideos != prevState.relatedVideos || nextProps.playlistVideos != prevState.playlistVideos || nextProps.currentVideoTime != prevState.currentVideoTime || nextProps.currentVideo != prevState.currentVideo){
            return { message:nextProps.deleteMessage, title:nextProps.deleteTitle,currentVideoTime:nextProps.currentVideoTime,relatedVideos:nextProps.relatedVideos,playlistVideos:nextProps.playlistVideos,video:nextProps.currentVideo,liveStreamingURL:nextProps.liveStreamingURL}
        } else{
            return null
        }

    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
    }
    componentDidMount(){
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
        this.props.socket.on('unwatchlater', data => {
            if(this.state.playlistVideos.length){
                let id = data.itemId
                let ownerId = data.ownerId
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.playlistVideos]
                    const changedItem = {...items[itemIndex]}
                    if (this.props.pageData && this.props.pageData.loggedInUserDetails && this.props.pageData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.watchlater_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, playlistVideos: items })
                }
            }
        });
        this.props.socket.on('watchlater', data => {
            if(this.state.playlistVideos.length){
                let id = data.itemId
                let ownerId = data.ownerId
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.playlistVideos]
                    const changedItem = {...items[itemIndex]}
                    if (this.props.pageData && this.props.pageData.loggedInUserDetails && this.props.pageData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.watchlater_id = 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, playlistVideos: items })
                }
            }
        });
    }
    closePlayer = () => {
        swal({
            title: this.state.title,
            text: this.state.message,
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
        .then((willDelete) => {
            if (willDelete) {
                this.props.updatePlayerData([],[],null,"","")
            } else {

            }
        });
    }
    getItemIndex(item_id) {
        const videos = [...this.state.playlistVideos];
        const itemIndex = videos.findIndex(p => p["video_id"] == item_id);
        return itemIndex;
    }
    getRelatedVideosIndex(item_id){
        const videos = [...this.state.relatedVideos];
        const itemIndex = videos.findIndex(p => p["video_id"] == item_id);
        return itemIndex;
    }
    ended = () => {
        let video_id = this.state.video.video_id
        let itemIndex = 0
        if(this.state.playlistVideos.length){
            itemIndex = this.getItemIndex(video_id)
            if (itemIndex > -1) {
                const items = [...this.state.playlistVideos]
                if(itemIndex+2 <= this.state.playlistVideos.length){
                    itemIndex = itemIndex + 1
                }else{
                    itemIndex = 0
                }
                this.setState({localUpdate:true, video: {...items[itemIndex],currentVideoTime:null} })
            }
        }else if(this.state.relatedVideos.length){
            itemIndex = this.getRelatedVideosIndex(video_id)
            //first video played
            if(itemIndex == -1){
                itemIndex = 0
            }
            if (itemIndex > -1) {
                const items = [...this.state.relatedVideos]
                if(itemIndex+2 <= this.state.relatedVideos.length){
                    itemIndex = itemIndex + 1
                }else{
                    itemIndex = 0
                }
                this.setState({localUpdate:true, video: {...items[itemIndex]},currentVideoTime:null })
            }
        }        
    }
    videoChange = (video_id,e) => {
        e.preventDefault();
        if(video_id != this.state.video.video_id){
            let itemIndex = this.getItemIndex(video_id)
            if (itemIndex > -1) {
                const items = [...this.state.playlistVideos]            
                this.setState({localUpdate:true, video: {...items[itemIndex]},currentVideoTime:null })
            }
        }
    }
    openPlaylist = (e) => {
        e.preventDefault()
        this.setState({localUpdate:true,arrow: this.state.arrow == "up" ? "down" : "up"})
    }
    minimizePlayer = (e) => {
        e.preventDefault();
        this.setState({localUpdate:true,minimizePlayer:true})
    } 
    maximizePlayer = (e) => {
        e.preventDefault();
        this.setState({localUpdate:true,minimizePlayer:false})
    }
    render() {
        if(!this.state.relatedVideos.length && !this.state.playlistVideos.length && !this.state.video){
            return null
        }
        
        return (
            <React.Fragment>
            {
            this.state.minimizePlayer ? 
                   <a id="play-video" className="video-play-button" onClick={this.maximizePlayer} href="#">
                            <span></span>
                        </a>
            : null
            }
            <div className="minimizeBox" style={{display:this.state.minimizePlayer ? "none" : "block"}}>
                    <span className="close-mini-player" title="Close Player" onClick={this.closePlayer}>
                    <span className="material-icons">clear</span>
                    </span>
                    <span className="minimizePlayer" title="Minimize Player" onClick={this.minimizePlayer}>
                    <span className="material-icons">remove</span>
                    </span>
                    <div className="content">
                    {
                        this.state.video.type == 3 ?
                            <Player  updateTime={false} miniplayer={true} {...this.props} currentVideoTime={this.state.currentVideoTime} ended={this.ended} height={this.state.width > 992 ? "154px" : "90px"} imageSuffix={this.props.pageData.imageSuffix} video={this.state.video} {...this.state.video} />
                        : 
                            <OutsidePlayer liveStreamingURL={this.state.liveStreamingURL} updateTime={false} miniplayer={true}  {...this.props} currentVideoTime={this.state.currentVideoTime}  ended={this.ended} height={this.state.width > 992 ? "154px" : "90px"}  imageSuffix={this.props.pageData.imageSuffix} video={this.state.video}  {...this.state.video} />
                        
                    }
                    <div className="footer">
                        <div className="PlayPause">
                            <Link href="/watch" customParam={`videoId=${this.state.video.custom_url}`} as={`/watch/${this.state.video.custom_url}`}>
                                <a>
                                {<CensorWord {...this.props} text={this.state.video.title} />}
                                </a>
                            </Link>
                        </div>
                    {
                        this.state.playlistVideos.length && this.state.width > 992 ? 
                            <div className="maxClose">
                                <a href="#" onClick={this.openPlaylist}>
                                    <i className={`fas fa-angle-${this.state.arrow}`}></i>
                                </a>
                            </div>
                            : null
                    }
                    </div>

                    </div>
                    
                    {
                        this.state.playlistVideos.length && this.state.arrow == "down" && this.state.width > 992 ? 
                        <div className="PlaylistSidebar miniplayer" style={{border:"none",marginBottom:"0px"}}>
                            <div className="playlist_videos_list">
                                <div className="playlist_videos">
                                    {
                                        this.state.playlistVideos.map((video, index) => {
                                            return (
                                                <div className="sidevideoWrap playlistscroll clearfix" key={index}>
                                                    <div>
                                                        {
                                                            this.state.video.video_id == video.video_id ? 
                                                            "▶"
                                                            : null
                                                        }
                                                    </div>
                                                    <div>
                                                        <div className="videoImg">
                                                                <a href={`/watch/${video.custom_url}`} onClick={this.videoChange.bind(this,video.video_id)}>
                                                                    <Image title={video.title} image={video.image} imageSuffix={this.props.pageData.imageSuffix} />
                                                                </a>
                                                            <span className="time">{
                                                                video.duration ?
                                                                    video.duration
                                                                    : null
                                                            }</span>
                                                            <span className="watchPlayBtn">
                                                                <WatchLater className="watchLater" icon={true} {...this.props}  {...video} item={video} id={video.video_id} />
                                                                    <a href={`/watch/${video.custom_url}`} onClick={this.videoChange.bind(this,video.video_id)}>
                                                                    <span className="material-icons">play_arrow</span>
                                                                    </a>
                                                            </span>
                                                        </div>
                                                        <div className="sideVideoContent">
                                                                <a className="videoTitle" onClick={this.videoChange.bind(this,video.video_id)} href={`/watch/${video.custom_url}`}>
                                                                    {<CensorWord {...this.props} text={video.title} />}
                                                                </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        </div>
                        : null
                    }
                </div>
                </React.Fragment>
            
        )
    }
}
const mapStateToProps = state => {
    return {
        currentVideoTime: state.miniplayer.currentVideoTime,
        relatedVideos: state.miniplayer.relatedVideos,
        playlistVideos: state.miniplayer.playlistVideos,
        currentVideo: state.miniplayer.currentVideo,
        deleteMessage:state.miniplayer.deleteMessage,
        titleMessage:state.miniplayer.titleMessage,
        
    };
};
const mapDispatchToProps = dispatch => {
    return {
        
        updatePlayerData:(relatedVideos,playlistVideos,currentVideo,deleteMessage,deleteTitle) => dispatch(playlist.updatePlayerData(relatedVideos,playlistVideos,currentVideo,deleteMessage,deleteTitle))
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(MiniPlayer);