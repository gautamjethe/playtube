import React from "react"
import Image from "../Image/Index"

import Link from "../../components/Link/index";
import swal from 'sweetalert'

import SocialShare from "../SocialShare/Index"
import ShortNumber from "short-number"
import ChannelFollow from "../User/Follow"

import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import axios from "../../axios-orders"
import UserTitle from "../User/Title"
import Timeago from "../Common/Timeago"
import Translate from "../../components/Translate/Index"
import Analytics from "../Dashboard/StatsAnalytics"
import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'
class Item extends React.Component {
    constructor(props) {
        super(props)
        let propsData = {...this.props}
        this.state = {
            channel: propsData.channel,
            language:propsData.i18n.language
        }
    }
    

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if ((nextProps.channel && nextProps.channel != prevState.channel) || nextProps.i18n.language != prevState.language) {
            return { channel: nextProps.channel,language:nextProps.i18n.language }
        } else{
            return null
        }
    }

    shouldComponentUpdate(nextProps,nextState){
        if(nextProps.channel != this.props.channel || this.state.analytics != nextState.analytics || nextProps.i18n.language != this.state.language){
            return true
        }
        return false
    }
    delete(e) {
        e.preventDefault()
        swal({
            title: Translate(this.props,"Are you sure?"),
            text: Translate(this.props,"Once deleted, you will not be able to recover this!"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()
                    formData.append('id', this.state.channel.custom_url)
                    const url = "/channels/delete"
                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) {
                                swal("Error", Translate(this.props,"Something went wrong, please try again later", "error"));
                            } else {

                            }
                        }).catch(err => {
                            swal("Error", Translate(this.props,"Something went wrong, please try again later"), "error");
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
                            <Analytics {...this.props} id={this.state.channel.channel_id} type="channels" />
                        </div>
                    </div>
                </div>
            </div>
        }
        return (
            <React.Fragment>
                {analyticsData}
            <div className="snglChnnl-block clearfix">
                <Link href="/channel" customParam={`channelId=${this.state.channel.custom_url}`} as={`/channel/${this.state.channel.custom_url}`}>
                    <a className="snglChnnl-coverimg" onClick={this.props.closePopUp}>
                        <Image className="img-fluid" title={renderToString(<CensorWord {...this.props} text={this.state.channel.title} />)} image={this.state.channel.cover_crop ? this.state.channel.cover_crop : this.state.channel.cover} imageSuffix={this.props.pageInfoData.imageSuffix} />
                        <div className="lbletop">
                            {
                                this.props.pageInfoData.appSettings['channels_browse_featuredlabel'] == 1 && this.props.pageInfoData.appSettings['channel_featured'] == 1 && this.state.channel.is_featured == 1 ?
                                    <span className="lbl-Featured" title={Translate(this.props,"Featured Channel")}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                    </span>
                                    : null
                            }
                            {
                                this.props.pageInfoData.appSettings['channels_browse_sponsoredLabel'] == 1 && this.props.pageInfoData.appSettings['channel_sponsored'] == 1 && this.state.channel.is_sponsored == 1 ?
                                    <span className="lbl-Sponsored" title={Translate(this.props,"Sponsored Channel")}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                    </span>
                                    : null
                            }
                            {
                                this.props.pageInfoData.appSettings['channels_browse_hotLabel'] == 1 && this.props.pageInfoData.appSettings['channel_hot'] == 1 && this.state.channel.is_hot == 1 ?
                                    <span className="lbl-Hot" title={Translate(this.props,"Hot Channel")}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                    </span>
                                    : null
                            }
                        </div>
                    </a>
                </Link>
                <div className="snglChnnl-content">
                    <div className="userImg">
                        <Link href="/channel" customParam={`channelId=${this.state.channel.custom_url}`} as={`/channel/${this.state.channel.custom_url}`}>
                            <a  onClick={this.props.closePopUp}>
                                <Image className="img-fluid" title={renderToString(<CensorWord {...this.props} text={this.state.channel.title} />)} image={this.state.channel.image} imageSuffix={this.props.pageInfoData.imageSuffix} />
                            </a>
                        </Link>
                    </div>
                    <div className="videoList_content">
                        <div className={`videoTitle${this.props.canDelete || this.props.canEdit  || this.props.pageInfoData.appSettings["channels_browse_share"] == 1 ? " edit-video-btn" : ""}`}>
                            <Link href="/channel" customParam={`channelId=${this.state.channel.custom_url}`} as={`/channel/${this.state.channel.custom_url}`}>
                                <a className="chnnlName" onClick={this.props.closePopUp}>
                                    {<CensorWord {...this.props} text={this.state.channel.title} />}
                                    {this.state.channel.channelverified == 1 ?
                                        <span className="verifiedUser" title={Translate(this.props,"verified")}><span className="material-icons">check</span></span>
                                        : null
                                    }
                                </a>
                            </Link>
                            {
                                    this.props.canDelete || this.props.canEdit || this.props.pageInfoData.appSettings["channels_browse_share"] == 1 ? 
                                <div className="dropdown TitleRightDropdown">
                                    <a href="#" data-toggle="dropdown"><span className="material-icons">more_vert</span></a>
                                    <ul className="dropdown-menu dropdown-menu-right edit-options">
                                        {
                                            this.props.canEdit ?
                                                <li>
                                                    <Link href="/create-channel" customParam={`channelId=${this.state.channel.custom_url}`} as={`/create-channel/${this.state.channel.custom_url}`}>
                                                        <a>
                                                        <span className="material-icons">edit</span>{Translate(this.props,"Edit")}
                                                    </a>
                                                    </Link>
                                                </li>
                                                : null
                                        }
                                        {
                                            this.props.canDelete ?
                                                <li>
                                                    <a href="#" onClick={this.delete.bind(this)}>
                                                    <span className="material-icons">delete</span>{Translate(this.props,"Delete")}
                                                </a>
                                                </li>
                                                : null
                                        }
                                        {
                                            this.props.canEdit ?
                                                <li>
                                                    <a href="#"  onClick={this.analytics}>
                                                        <span className="material-icons">show_chart</span>
                                                        {Translate(this.props,"Analytics")}
                                                </a>
                                                </li>
                                                : null
                                        }
                                        
                                        {
                                            this.props.pageInfoData.appSettings["channels_browse_share"] == 1 ?
                                            <SocialShare {...this.props} buttonHeightWidth="30" url={`/channel/${this.state.channel.custom_url}`} title={renderToString(<CensorWord {...this.props} text={this.state.channel.title} />)} imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.channel.image} />
                                            : null
                                        }
                                    </ul>
                                </div>
                                : null
                            }
                        </div>
                    </div>

                    <div className="channelInfo">
                        {
                        this.props.pageInfoData.appSettings["channels_browse_username"] == "1" ?
                            <span className="username">
                                <UserTitle className=""  closePopUp={this.props.closePopUp} {...this.props} data={this.state.channel} ></UserTitle>
                            </span>
                        : null
                        }
                        <span className="channelViewDate">
                            {
                                this.props.pageInfoData.appSettings["channels_browse_views"] == "1" ?                                   
                                <span>{`${ShortNumber(this.state.channel.view_count ? this.state.channel.view_count : 0)}`}{" "}{this.props.t("view_count", { count: this.state.channel.view_count ? this.state.channel.view_count : 0 })}</span>
                                : null
                            }
                            {
                            this.props.pageInfoData.appSettings["channels_browse_views"] == "1" && this.props.pageInfoData.appSettings["channels_browse_datetime"] == "1" ?
                                <span className="seprater">|</span>
                            : null
                            }
                            {
                            this.props.pageInfoData.appSettings["channels_browse_datetime"] == "1" ?
                                <span><Timeago {...this.props}>{this.state.channel.creation_date}</Timeago></span>
                            : null
                            }
                        </span>
                    </div>

                    {
                        this.props.pageInfoData.appSettings['channels_browse_videoscount'] == 1 || this.props.pageInfoData.appSettings['channels_browse_subscribecount'] == 1  ? 
                    <div className="videono">
                        {
                            this.props.pageInfoData.appSettings['channels_browse_videoscount'] == 1 ? 
                        <span>{`${ShortNumber(this.state.channel.total_videos ? this.state.channel.total_videos : 0)}`} {" "} {this.props.t("videos_count", { count: this.state.channel.total_videos_count ? this.state.channel.total_videos_count : 0 })}</span>
                        : null
                        }
                        {
                            this.props.pageInfoData.appSettings['channels_browse_videoscount'] == 1 && this.props.pageInfoData.appSettings['channels_browse_subscribecount'] == 1 ? 
                            <React.Fragment>
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                            </React.Fragment>
                        : null
                        }
                        {
                            this.props.pageInfoData.appSettings['channels_browse_subscribecount'] == 1 ? 
                        <span>{`${ShortNumber(this.state.channel.follow_count ? this.state.channel.follow_count : 0)}`} {" "} {this.props.t("subscribe_count", { count: this.state.channel.follow_count ? this.state.channel.follow_count : 0 })}</span>
                            : null
                        }
                    </div>
                    : null
                    }                    
                 
                    {
                            this.props.pageInfoData.appSettings['channels_browse_subscribe'] == 1 ? 
                                <ChannelFollow  {...this.props} className="subscribe" title={this.state.channel.follower_id ? Translate(this.props,"Subscribed") : Translate(this.props,"Subscribe")} type="channels" user={this.state.channel} user_id={this.state.channel.follower_id} />
                            : null
                    }
                    <div className="LikeDislikeWrap">
                        <ul className="LikeDislikeList">
                            
                        {
                        this.props.pageInfoData.appSettings["channels_browse_like"] == "1" ? 
                            <li>
                                <Like icon={true} {...this.props} like_count={this.state.channel.like_count} item={this.state.channel} type="channel" id={this.state.channel.channel_id} />{"  "}
                            </li>
                        : null
                        }
                            {
                                this.props.pageInfoData.appSettings["channels_browse_dislike"] == "1" ? 
                            <li>
                                <Dislike icon={true} {...this.props} dislike_count={this.state.channel.dislike_count} item={this.state.channel} type="channel" id={this.state.channel.channel_id} />{"  "}
                            </li>
                            : null
                            }
                            {
                                this.props.pageInfoData.appSettings["channels_browse_favourite"] == "1" ? 
                            <li>
                                <Favourite icon={true} {...this.props} favourite_count={this.state.channel.favourite_count} item={this.state.channel} type="channel" id={this.state.channel.channel_id} />{"  "}
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