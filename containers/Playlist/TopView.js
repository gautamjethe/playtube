import React from "react"

import Image from "../Image/Index"
import { connect } from "react-redux"

import general from '../../store/actions/general';

import SocialShare from "../SocialShare/Index"

import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import Link from "../../components/Link/index"
import Translate from "../../components/Translate/Index"
import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'
class TopView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            playlist: props.playlist
        }
    }
   
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if(nextProps.playlist != prevState.playlist){
            return {playlist:nextProps.playlist}
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
            if (id == this.state.playlist.playlist_id && type == "playlists") {
                const data = {...this.state.playlist}
                data.rating = rating
                this.setState({localUpdate:true, playlist: data })
            }
        });
        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "playlists") {
                if (this.state.playlist.playlist_id == id) {
                    const changedItem = { ...this.state.playlist }
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    this.setState({localUpdate:true, playlist: changedItem })
                }
            }
        });
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "playlists") {
                if (this.state.playlist.playlist_id == id) {
                    const changedItem = { ...this.state.playlist }
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    this.setState({localUpdate:true, playlist: changedItem })
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
            if (itemType == "playlists") {
                if (this.state.playlist.playlist_id == itemId) {
                    const changedItem = { ...this.state.playlist }
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
                    this.setState({localUpdate:true, playlist: changedItem })
                }
            }
        });
    }
    openReport = (e) => {
        e.preventDefault()
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            this.props.openReport(true, this.state.playlist.custom_url, 'playlists')
        }
    }
    render() {
        let mainPhoto = null
        if (this.state.playlist.image) {
            mainPhoto = this.props.pageInfoData.imageSuffix + this.state.playlist.image
        } else {
            mainPhoto = this.props.pageInfoData.imageSuffix + this.props.pageInfoData.appSettings["playlist_default_photo"]
        }
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-12">
                        <div className="channelInfo-wrap">
                            <div className="playlist-profile-img">
                                <Image title={renderToString(<CensorWord {...this.props} text={this.state.playlist.title} />)} image={mainPhoto} imageSuffix="" />
                            </div>
                            <div className="playlist-profile-title">
                                <h4><CensorWord {...this.props} text={this.state.playlist.title} />{" "} {
                                    this.state.playlist.verified ?
                                        <span className="verifiedUser" title={Translate(this.props, "verified")}><span className="material-icons">check</span>
                                        </span>
                                        : null
                                }</h4>
                                <div className="ChannelMoreinfo">

                                    {
                                        this.props.pageInfoData.appSettings['playlist_featured'] == 1 && this.state.playlist.is_featured == 1 ?
                                            <span className="lbl-Featured" title={Translate(this.props, "Featured Playlist")}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                            </span>
                                            : null
                                    }
                                    {
                                        this.props.pageInfoData.appSettings['playlist_sponsored'] == 1 && this.state.playlist.is_sponsored == 1 ?
                                            <span className="lbl-Sponsored" title={Translate(this.props, "Sponsored Playlist")}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                            </span>
                                            : null
                                    }
                                    {
                                        this.props.pageInfoData.appSettings['playlist_hot'] == 1 && this.state.playlist.is_hot == 1 ?
                                            <span className="lbl-Hot" title={Translate(this.props, "Hot Playlist")}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                            </span>
                                            : null
                                    }
                                </div>
                            </div>

                            

                                    <div className="LikeDislikeWrap">
                                         <ul className="LikeDislikeList">
                                    {
                                        this.props.pageInfoData.appSettings[`${"playlist_like"}`] == 1  && this.state.playlist.approve == 1 ?
                                            <li>
                                                <Like {...this.props} icon={true} like_count={this.state.playlist.like_count} item={this.state.playlist} parentType={this.state.playlist.type} type="playlist" id={this.state.playlist.playlist_id} />
                                            </li>
                                            : null
                                    }
                                    {
                                        this.props.pageInfoData.appSettings[`${"playlist_dislike"}`] == 1  && this.state.playlist.approve == 1 ?
                                            <li>
                                                <Dislike {...this.props} icon={true}  dislike_count={this.state.playlist.dislike_count} item={this.state.playlist} parentType={this.state.playlist.type} type="playlist" id={this.state.playlist.playlist_id} />
                                            </li>
                                            : null
                                    }
                                    {
                                        this.props.pageInfoData.appSettings[`${"playlist_favourite"}`] == 1  && this.state.playlist.approve == 1 ?
                                            <li>
                                                <Favourite {...this.props} icon={true}  favourite_count={this.state.playlist.favourite_count} item={this.state.playlist} parentType={this.state.playlist.type} type="playlist" id={this.state.playlist.playlist_id} />
                                            </li>
                                            : null
                                    }
                                    {
                                    this.state.playlist.approve == 1 ? 
                                        <SocialShare {...this.props} hideTitle={true} tags={this.state.playlist.tags} url={`${this.props.url}`} title={this.state.playlist.title} imageSuffix="" media={mainPhoto} />
                                    : null
                                    }
                                    
                                    
                                    <li>
                                        <div className="dropdown TitleRightDropdown">
                                            <a href="#" data-toggle="dropdown"><span className="material-icons">more_horiz</span></a>
                                            <ul className="dropdown-menu dropdown-menu-right edit-options">
                                                 {
                                                    this.state.playlist.canEdit ?
                                                    <li>
                                                        <Link href="/create-playlist" customParam={`playlistId=${this.state.playlist.custom_url}`} as={`/create-playlist/${this.state.playlist.custom_url}`}>
                                                            <a href={`/create-playlist/${this.state.playlist.custom_url}`}><span className="material-icons">edit</span>{Translate(this.props, "Edit")}</a>
                                                        </Link>
                                                    </li>
                                                        : null
                                                }
                                                {
                                                    this.state.playlist.canDelete ?
                                                    <li>
                                                        <a onClick={this.props.deletePlaylist} href="#"><span className="material-icons">delete</span>{Translate(this.props, "Delete")}</a>
                                                    </li>
                                                        : null
                                                }
                                                {
                                                     this.state.playlist.approve == 1 ? 
                                                
                                                <li>
                                                    <a href="#" onClick={this.openReport.bind(this)}>
                                                    <span className="material-icons">flag</span>
                                                        {Translate(this.props, "Report")}
                                                    </a>
                                                </li>
                                                : null
                                                }
                                            </ul>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};
const mapDispatchToProps = dispatch => {
    return {
        openReport: (status, contentId, contentType) => dispatch(general.openReport(status, contentId, contentType))
    };
};
export default connect(mapStateToProps, mapDispatchToProps, null)(TopView);