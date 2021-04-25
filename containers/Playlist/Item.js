import React from "react"
import Image from "../Image/Index"

import UserTitle from "../User/Title"
import Link from "../../components/Link/index";

import SocialShare from "../SocialShare/Index"
import ShortNumber from "short-number"

import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import Timeago from "../Common/Timeago"

import axios from "../../axios-orders"
import swal from 'sweetalert'
import Translate from "../../components/Translate/Index";

import Analytics from "../Dashboard/StatsAnalytics"
import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'
class Item extends React.Component {
    constructor(props) {
        super(props)
        let propsData = {...this.props}
        this.state = {
            playlist: propsData.playlist,
            language:propsData.i18n.language
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.playlist != prevState.playlist || nextProps.i18n.language != prevState.language) {
            return { playlist: nextProps.playlist,language:nextProps.i18n.language }
        } else{
            return null
        }
    }
    shouldComponentUpdate(nextProps,nextState){
        if(nextProps.playlist != this.props.playlist || this.state.analytics != nextState.analytics || nextProps.i18n.language != this.state.language){
            return true
        }
        return false
    }
    deletePlaylist = (e) => {
        e.preventDefault()
        let message = !this.props.contentType ? Translate(this.props, "Once deleted, you will have to again add the playlist.") : Translate(this.props, "Once deleted, you will not be able to recover this!")

        swal({
            title: Translate(this.props, "Are you sure?"),
            text: message,
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()
                    let url = "/channels/delete-playlist"

                    if (!this.props.contentType) {
                        formData.append('playlist_id', this.state.playlist.playlist_id)
                        formData.append('channel_id', this.props.channel_id)
                    } else {
                        formData.append('id', this.state.playlist.custom_url)
                        url = "/playlists/delete"
                    }

                    axios.post(url, formData)
                        .then(response => {
                        }).catch(err => {
                            swal("Error", Translate(this.props, "Something went wrong, please try again later", "error"));
                        });
                    //delete
                } else {

                }
            });
    }
    analytics = ( e) => {
        e.preventDefault()
        this.setState({localUpdate:true, analytics: true })
    }
    closePopup = (e) => {
        this.setState({localUpdate:true, analytics: false })
    }
    render() {
        let analyticsData = null
        if (this.state.analytics) {
            analyticsData = <div className="popup_wrapper_cnt">
                <div className="popup_cnt" style={{ maxWidth: "60%" }}>
                    <div className="comments">
                        <div className="VideoDetails-commentWrap">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{Translate(this.props, "Analytics")}</h2>
                                <a onClick={this.closePopup} className="_close"><i></i></a>
                            </div>
                            <Analytics {...this.props} id={this.state.playlist.playlist_id} type="playlists" />
                        </div>
                    </div>
                </div>
            </div>
        }
        return (
            <React.Fragment>
                {analyticsData}
                <div className="ptv_playlistGrid">
                    <div className="playlistGrid_thumb">
                        <Image className="img-fluid" title={renderToString(<CensorWord {...this.props} text={this.state.playlist.title} />)} image={this.state.playlist.image} imageSuffix={this.props.pageInfoData.imageSuffix} />
                        <div className="overlayVideoNo">
                            <div className="verticalCenter videoNo">
                                <span className="videoNo">{ShortNumber(this.state.playlist.total_videos ? this.state.playlist.total_videos : 0)} {this.props.t("video_count", { count: this.state.playlist.total_videos ? this.state.playlist.total_videos : 0 })}</span>
                                <span className="videoNoIcon"><span className="material-icons">play_arrow</span></span>
                            </div>
                        </div>
                        <div className="overlayPlayBtn">
                            {
                                this.state.playlist.vcustom_url ? 
                                <Link href="/watch" customParam={`videoId=${this.state.playlist.vcustom_url}&list=${this.state.playlist.custom_url}`} as={`/watch/${this.state.playlist.vcustom_url}?list=${this.state.playlist.custom_url}`}>
                                    <a className="verticalCenter btnText"  onClick={this.props.closePopUp}>
                                        <span className="playListPlayBtn"><span className="material-icons">play_arrow</span> {Translate(this.props, "Play All")}</span>
                                    </a>
                                    </Link>
                                    :
                                    <Link href="/playlist" customParam={`playlistId=${this.state.playlist.custom_url}`} as={`/playlist/${this.state.playlist.custom_url}`}>
                                        <a className="verticalCenter btnText"  onClick={this.props.closePopUp}>
                                            <span className="playListPlayBtn"><span className="material-icons">play_arrow</span> {Translate(this.props, "Play All")}</span>
                                        </a>
                                    </Link>
                            }
                        </div>
                        <div className="labelBtn">
                        {
                            this.props.pageInfoData.appSettings['playlists_browse_featuredlabel'] == 1 && this.props.pageInfoData.appSettings['playlist_featured'] == 1 && this.state.playlist.is_featured == 1 ?
                            <span className="lbl-Featured" title={Translate(this.props, "Featured Playlist")}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                            </span>
                                : null
                        }
                        {
                            this.props.pageInfoData.appSettings['playlists_browse_sponsoredLabel'] == 1 && this.props.pageInfoData.appSettings['playlist_sponsored'] == 1 && this.state.playlist.is_sponsored == 1 ?
                             <span className="lbl-Sponsored" title={Translate(this.props, "Sponsored Playlist")}>
                                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                             </span>
                                : null
                        }
                        {
                            this.props.pageInfoData.appSettings['playlists_browse_hotLabel'] == 1 && this.props.pageInfoData.appSettings['playlist_hot'] == 1 && this.state.playlist.is_hot == 1 ?
                              <span className="lbl-Hot" title={Translate(this.props, "Hot Playlist")}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                              </span>
                                : null
                        }
                        </div>
                    </div>
                    <div className="playlistGrid_content">
                        <div className={`videoTitle${this.props.canDelete || this.props.canEdit  || this.props.pageInfoData.appSettings["playlists_browse_share"] == 1 ? " edit-video-btn" : ""}`}>
                            <Link href="/playlist" customParam={`playlistId=${this.state.playlist.custom_url}`} as={`/playlist/${this.state.playlist.custom_url}`}>
                                <a className="playlName"  onClick={this.props.closePopUp}>
                                    <h4>{<CensorWord {...this.props} text={this.state.playlist.title} />}</h4>
                                </a>
                            </Link>
                            {
                                this.props.canDelete || this.props.canEdit || this.props.pageInfoData.appSettings["playlists_browse_share"] == 1 ? 
                            <div className="dropdown TitleRightDropdown">
                                <a href="#" data-toggle="dropdown"><span className="material-icons">more_vert</span></a>
                                <ul className="dropdown-menu dropdown-menu-right edit-options">
                                    {
                                        this.props.canEdit ?
                                        <li>
                                            <Link href="/create-playlist" customParam={`playlistId=${this.state.playlist.custom_url}`} as={`/create-playlist/${this.state.playlist.custom_url}`}>
                                                <a className="addEdit" title={Translate(this.props, "Edit")} href={`/create-playlist/${this.state.playlist.custom_url}`}>
                                                <span className="material-icons">edit</span>{Translate(this.props, "Edit")}
                                                </a>
                                            </Link>
                                        </li>
                                            : null
                                    }
                                    {
                                        this.props.canDelete ?
                                        <li>
                                            <a className="addDelete" title={Translate(this.props, "Delete")} href="#" onClick={this.deletePlaylist}>
                                                <span className="material-icons">delete</span>
                                                {Translate(this.props, "Delete")}
                                            </a>
                                        </li>
                                            : null
                                    }
                                    
                                    {
                                        this.props.canEdit ?
                                        <li>
                                                <a className="addEdit" href="#" title={Translate(this.props, "Analytics")}  onClick={this.analytics}>
                                                    <span className="material-icons">show_chart</span>
                                                    {Translate(this.props, "Analytics")}
                                                </a>
                                        </li>
                                            : null
                                    }
                                    {
                                        this.props.pageInfoData.appSettings["playlists_browse_share"] == 1 ?
                                        <SocialShare {...this.props} buttonHeightWidth="30" url={`/playlist/${this.state.playlist.custom_url}`} title={renderToString(<CensorWord {...this.props} text={this.state.playlist.title} />)} imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.playlist.image} />
                                        : null
                                    }
                                </ul>
                            </div>
                            : null
                            }
                        </div>
                        <div className="videoInfo">
                            {
                            this.props.pageInfoData.appSettings["playlists_browse_username"] == "1" ?
                                <span className="username">
                                 <UserTitle className="" {...this.props}  closePopUp={this.props.closePopUp} data={this.state.playlist} />
                                </span>
                            : null
                            }
                            <span className="videoViewDate">
                                {
                                    this.props.pageInfoData.appSettings["playlists_browse_views"] == "1" ?                                   
                                    <span>{`${ShortNumber(this.state.playlist.view_count ? this.state.playlist.view_count : 0)}`}{" "}{this.props.t("view_count", { count: this.state.playlist.view_count ? this.state.playlist.view_count : 0 })}</span>
                                    : null
                                }
                                {
                                this.props.pageInfoData.appSettings["playlists_browse_views"] == "1" && this.props.pageInfoData.appSettings["playlists_browse_datetime"] == "1" ?
                                 <span className="seprater">|</span>
                                : null
                                }
                                {
                                this.props.pageInfoData.appSettings["playlists_browse_datetime"] == "1" ?
                                    <span><Timeago {...this.props}>{this.state.playlist.creation_date}</Timeago></span>
                                : null
                                }
                            </span>
                        </div>
                        <div className="LikeDislikeWrap">
                            <ul className="LikeDislikeList">
                                {
                                this.props.pageInfoData.appSettings["playlists_browse_like"] == "1" ?
                                    <li>
                                        <div className="actionbtn">
                                            <Like icon={true} {...this.props} like_count={this.state.playlist.like_count} item={this.state.playlist} type="playlist" id={this.state.playlist.playlist_id} />{"  "}
                                        </div>
                                    </li>
                                    : null
                                }
                                {
                                        this.props.pageInfoData.appSettings["playlists_browse_dislike"] == "1" ?
                                    <li>
                                        <div className="actionbtn">
                                            <Dislike icon={true} {...this.props} dislike_count={this.state.playlist.dislike_count} item={this.state.playlist} type="playlist" id={this.state.playlist.playlist_id} />{"  "}
                                        </div>
                                    </li>
                                    : null
                                }
                                    {
                                        this.props.pageInfoData.appSettings["playlists_browse_favourite"] == "1" ?
                                    <li>
                                        <div className="actionbtn">
                                            <Favourite icon={true} {...this.props} favourite_count={this.state.playlist.favourite_count} item={this.state.playlist} type="playlist" id={this.state.playlist.playlist_id} />{"  "}
                                        </div>
                                    </li>
                                    : null
                                }
                            </ul>
                    </div>
               
                    </div>
                        </div>
            </React.Fragment>
        )
    }
}

export default Item;