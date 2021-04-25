
import React from "react"
import { connect } from "react-redux";
import TinySlider from 'tiny-slider-react';
import playlist from '../../store/actions/general';
import Link from "../../components/Link/index"
import Translate from "../../components/Translate/Index";
import CensorWord from "../CensoredWords/Index"
import ShortNumber from "short-number"
import Image from "../Image/Index"
import UserTitle from "../User/Title"
import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import SocialShare from "../SocialShare/Index"
import Canvas from "../Audio/Canvas"

class Audio extends React.Component {
    constructor(props) {
        super(props)
        let propsData = {...props}
        this.state = {
            audios: propsData.audio,
            language:propsData.i18n.language,
        }
        this.slider = null
        this.pauseSong = this.pauseSong.bind(this)
        this.playSong = this.playSong.bind(this)
        this.playPauseSong = this.playPauseSong.bind(this)
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }

        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.audio != prevState.audios || nextProps.i18n.language != prevState.language) {
            return { audios: nextProps.audio,language:nextProps.i18n.language }
        } else{
            return null
        }

    }
    
    componentDidMount() {
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (this.state.audios && itemIndex > -1 && type == "audio") {
                const items = [...this.state.audios]
                const changedItem = {...items[itemIndex]}
                changedItem.rating = rating
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, audios: items })
            }
        });
        this.props.socket.on('audioDeleted', data => {
            let id = data.audio_id
            const itemIndex = this.getItemIndex(id)
            if (this.state.audios && itemIndex > -1) {
                const items = [...this.state.audios]
                items.splice(itemIndex, 1);
                this.setState({localUpdate:true, audios: items })
            }
        });
       
        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (this.state.audios && type == "audio") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.audios]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, audios: items })
                }
            }
        }); 
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (this.state.audios && type == "audio") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.audios]
                    const changedItem = {...items[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, audios: items })
                }
            }
        });


        this.props.socket.on('likeDislike', data => {
            let itemId = data.itemId
            let itemType = data.itemType
            let ownerId = data.ownerId
            let removeLike = data.removeLike
            let removeDislike = data.removeDislike
            let insertLike = data.insertLike
            let insertDislike = data.insertDislike
            if (this.state.audios && itemType == "audio") {
                const itemIndex = this.getItemIndex(itemId)
                if (itemIndex > -1) {
                    const items = [...this.state.audios]
                    const changedItem = {...items[itemIndex]}
                    let loggedInUserDetails = {}
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
                        loggedInUserDetails = this.props.pageInfoData.loggedInUserDetails
                    }
                    if (removeLike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = null
                        changedItem['like_count'] = parseInt(changedItem['like_count']) - 1
                    }
                    if (removeDislike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = null
                        changedItem['dislike_count'] = parseInt(changedItem['dislike_count']) - 1
                    }
                    if (insertLike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = "like"
                        changedItem['like_count'] = parseInt(changedItem['like_count']) + 1
                    }
                    if (insertDislike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = "dislike"
                        changedItem['dislike_count'] = parseInt(changedItem['dislike_count']) + 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, audios: items })
                }
            }
        });
    }
    draw (peaks) {
        let ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#333333';
        peaks.forEach((peak) => {
          ctx.fillRect(...peak)
        });
    }
    getItemIndex(item_id) {
        if(!this.state.audios){
            return -1
        }
        const items = [...this.state.audios];
        const itemIndex = items.findIndex(p => p["audio_id"] == item_id);
        return itemIndex;
    }
    playSong = (song_id,e) =>{
        this.setState({
            song_id:song_id,
            playsong_id:0,
            localUpdate:true
        },() => {
            this.props.updateAudioData(this.state.audios, song_id,0,this.props.t("Submit"),this.props.t("Enter Password"))
        })
        
    }
    pauseSong = (song_id,e) => {
        this.setState({
            song_id:song_id,
            playsong_id:song_id,
            localUpdate:true
        },() => {
            this.props.updateAudioData(this.state.audios, song_id,song_id,this.props.t("Submit"),this.props.t("Enter Password"))
        })
    }
    playPauseSong = (song_id,e) => {
        if(this.props.song_id == 0 || song_id == this.props.pausesong_id || song_id != this.props.song_id){
            this.props.updateAudioData(this.state.audios, song_id,0,this.props.t("Submit"),this.props.t("Enter Password"))
        }else{
            this.props.updateAudioData(this.state.audios,song_id, song_id,this.props.t("Submit"),this.props.t("Enter Password"))
        }
    }
    
    render() {
        if (!this.state.audios || !this.state.audios.length) {
            return null
        }
       

        const settings = {
            lazyload: false,
            nav: false,
            items:1,
            loop:false,
            gutter:20,
            mouseDrag: true,
            controlsText:["<span class='material-icons'>keyboard_arrow_left</span>", "<span class='material-icons'>keyboard_arrow_right</span>"],
            responsive: {
                480: {
                    items: 1
                },
                760: {
                    items: 2
                },
                1100: {
                    items: 2
                },
                1200: {
                    items: 3
                }
              }
          };

        const content = this.state.audios.map(item => {
            return (
                <div key={item.audio_id}>
                    <div className="tracksList">
                        <div className="stream-track">
                            <div className="stream-track-img">
                                <Link href={`/audio`} customParam={`audioId=${item.custom_url}`} as={`/audio/${item.custom_url}`}>
                                    <a>
                                        <Image image={item.image} title={item.title} imageSuffix={this.props.pageInfoData.imageSuffix} />
                                    </a>
                                </Link>
                            </div>
                            <div className="stream-track-info">
                                <div className="miniPlay-shareWrap">
                                    <div className="miniplay">
                                            {
                                                this.props.song_id != item.audio_id || this.props.pausesong_id == item.audio_id ?
                                                <div className="playbtn" onClick={this.playSong.bind(this,item.audio_id)}>
                                                    <i className="fas fa-play"></i>
                                                </div>
                                                :
                                                <div className="playbtn" onClick={this.pauseSong.bind(this,item.audio_id)}>
                                                    <i className="fas fa-pause"></i>
                                                </div>
                                            }
                                        <div className="info">
                                            <React.Fragment>
                                                <UserTitle childPrepend={true}  className="user" data={item} ></UserTitle>
                                            </React.Fragment>
                                            <div className="descp"><CensorWord {...this.props} text={item.title} /></div>
                                        </div>
                                    </div>

                                    <div className="LikeDislikeWrap">
                                        <ul className="LikeDislikeList">
                                            <li>
                                                <Like icon={true} {...this.props} like_count={item.like_count} item={item} type="audio" id={item.audio_id} />{"  "}
                                            </li>

                                            <li>
                                                <Dislike icon={true} {...this.props} dislike_count={item.dislike_count} item={item} type="audio" id={item.audio_id} />{"  "}
                                            </li>
                                            <li>
                                                <Favourite icon={true} {...this.props} favourite_count={item.favourite_count} item={item} type="audio" id={item.audio_id} />{"  "}
                                            </li>
                                            
                                            <SocialShare {...this.props} hideTitle={true} buttonHeightWidth="30" url={`/audio/${item.custom_url}`} title={item.title} imageSuffix={this.props.pageInfoData.imageSuffix} media={item.image} />
                                            
                                            <li>
                                                <span title="play">
                                                    <i className="fas fa-play"></i>{" "}
                                                    {`${ShortNumber(item.play_count ? item.play_count : 0)}`}{" "}{this.props.t("play_count", { count: item.play_count ? item.play_count : 0 })}
                                                </span>
                                            </li>
                                            
                                        </ul>
                                    </div>
                                </div>
                                <div className="trackCanvas" onClick={this.playPauseSong.bind(this,item.audio_id)}>
                                    <Canvas {...this.props} peaks={item.peaks} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        })

        return (
            <div className="VideoRoWrap">
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="titleWrap">
                                <span className="title">
                                    <React.Fragment>
                                        {
                                            this.props.headerTitle ?
                                                this.props.headerTitle :
                                                null
                                        }
                                        {Translate(this.props, this.props.titleHeading ? this.props.titleHeading : `Recent Audio`)}
                                    </React.Fragment>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-12">
                            {
                                <TinySlider settings={settings} >
                                    {content}
                                </TinySlider>
                            }
                        </div>
                    </div>


                </div>
            </div>
        )
    }
}
const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData,
        song_id:state.audio.song_id,
        pausesong_id:state.audio.pausesong_id,

    };
};
const mapDispatchToProps = dispatch => {
    return {
        updateAudioData: (audios, song_id,pausesong_id,submitText,passwordText) => dispatch(playlist.updateAudioData(audios, song_id,pausesong_id,submitText,passwordText))
    };
};
export default connect(mapStateToProps, mapDispatchToProps, null)(Audio)