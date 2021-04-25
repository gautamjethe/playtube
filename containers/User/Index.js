import React, { Component } from "react"
import { connect } from "react-redux";
import * as actions from '../../store/actions/general';

import Cover from "../Cover/User"

import Comment from "../Comments/Index"
import Videos from "../Video/Videos"
import Channel from "../Channel/Channels"
import Blog from "../Blog/Blogs"
import Playlists from "../Playlist/Playlists"
import Audio from "../Audio/Browse"
import Linkify from "react-linkify"
import ShortNumber from "short-number"
import Rating from "../Rating/Index"
import Rater from "react-rater"
import Translate from "../../components/Translate/Index"
import Date from "../Date"

class Index extends Component {
    constructor(props) {
        super(props)
        this.state = {
            videos: props.pageInfoData.videos,
            channels: props.pageInfoData.channels,
            playlists: props.pageInfoData.playlists,
            blogs: props.pageInfoData.blogs,
            member: props.pageInfoData.member,
            audios:props.pageInfoData.audio
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }

        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.pageInfoData.member != prevState.member) {
            return {audios:nextProps.pageInfoData.audio, member: nextProps.pageInfoData.member, videos: nextProps.pageInfoData.videos, channels: nextProps.pageInfoData.channels, playlists: nextProps.pageInfoData.playlists, blogs: nextProps.pageInfoData.blogs }
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
            if (id == this.state.member.user_id && type == "members") {
                const data = { ...this.state.member }
                data.rating = rating
                this.setState({localUpdate:true, member: data })
            }
        });
        this.props.socket.on('unfollowUser', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (id == this.state.member.user_id && type == "members") {
                const data = { ...this.state.member }
                data.follow_count = data.follow_count - 1
                if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    data.follower_id = null
                }
                this.setState({localUpdate:true, member: data })
            }
        });
        this.props.socket.on('followUser', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (id == this.state.member.user_id && type == "members") {
                const data = { ...this.state.member }
                data.follow_count = data.follow_count + 1
                if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                    data.follower_id = 1
                }
                this.setState({localUpdate:true, member: data })
            }
        });

        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (id == this.state.member.user_id && type == "members") {
                if (this.state.member.user_id == id) {
                    const data = { ...this.state.member }
                    data.favourite_count = data.favourite_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        data.favourite_id = null
                    }
                    this.setState({localUpdate:true, member: data })
                }
            }
        });
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (id == this.state.member.user_id && type == "members") {
                if (this.state.member.user_id == id) {
                    const data = { ...this.state.member }
                    data.favourite_count = data.favourite_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        data.favourite_id = 1
                    }
                    this.setState({localUpdate:true, member: data })
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
            if (itemType == "members" && this.state.member.user_id == itemId) {
                const item = { ...this.state.member }
                let loggedInUserDetails = {}
                if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
                    loggedInUserDetails = this.props.pageInfoData.loggedInUserDetails
                }
                if (removeLike) {
                    if (loggedInUserDetails.user_id == ownerId)
                        item['like_dislike'] = null
                    item['like_count'] = parseInt(item['like_count']) - 1
                }
                if (removeDislike) {
                    if (loggedInUserDetails.user_id == ownerId)
                        item['like_dislike'] = null
                    item['dislike_count'] = parseInt(item['dislike_count']) - 1
                }
                if (insertLike) {
                    if (loggedInUserDetails.user_id == ownerId)
                        item['like_dislike'] = "like"
                    item['like_count'] = parseInt(item['like_count']) + 1
                }
                if (insertDislike) {
                    if (loggedInUserDetails.user_id == ownerId)
                        item['like_dislike'] = "dislike"
                    item['dislike_count'] = parseInt(item['dislike_count']) + 1
                }
                this.setState({localUpdate:true, member: item })
            }
        });
        this.props.socket.on('userCoverReposition', data => {
            let id = data.user_id
            if (id == this.state.member.user_id) {
                const item = { ...this.state.member }
                item.cover_crop = data.image
                item.showCoverReposition = false
                this.setState({localUpdate:true, member: item, loadingCover: false },()=>{
                    this.props.openToast(Translate(this.props, data.message), "success")
                })
                
            }
        });
        this.props.socket.on('userMainPhotoUpdated', data => {
            let id = data.user_id
            if (id == this.state.member.user_id) {
                const item = {...this.state.member}
                item.avtar = data.image
                const userData = { ...this.props.pageInfoData }
                if (userData.loggedInUserDetails && userData.loggedInUserDetails.user_id == id) {
                    userData.loggedInUserDetails.avtar = data.image
                    this.setState({localUpdate:true, member: item, loadingCover: false },() => {
                        this.props.setPageInfoData(userData)
                        this.props.openToast(Translate(this.props, data.message), "success");
                    })
                }else{
                    this.setState({localUpdate:true, member: item, loadingCover: false },() => {
                        this.props.openToast(Translate(this.props, data.message), "success");
                    })
                }
               
            }
        });
        this.props.socket.on('userCoverUpdated', data => {
            let id = data.user_id
            if (id == this.state.member.user_id) {
                const item = {...this.state.member}
                item.cover = data.image
                item.usercover = true;
                item.cover_crop = data.cover_crop;
                item.showCoverReposition = true
                this.setState({localUpdate:true, member: item, loadingCover: false },() => {
                    this.props.openToast(Translate(this.props, data.message), "success");
                })
                
            }
        });

    }

    render() {
        return (
            <React.Fragment>
                    <Cover {...this.props}  {...this.state.member} member={this.state.member} type="member" id={this.state.member.user_id} />
                    <div className="userDetailsWraps">
                        <div className="container">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="details-tab">
                                        <ul className="nav nav-tabs" id="myTab" role="tablist">
                                            <li className="nav-item">
                                                <a className="nav-link active" data-toggle="tab" href="#about" role="tab" aria-controls="about" aria-selected="true">{Translate(this.props, "About")}</a>
                                            </li>
                                            <li className="nav-item">
                                                <a className="nav-link" data-toggle="tab" href="#videos" role="tab" aria-controls="discription" aria-selected="false">{Translate(this.props, "Videos")}</a>
                                            </li>
                                            {
                                                this.state.channels ?
                                                    <li className="nav-item">
                                                        <a className="nav-link" data-toggle="tab" href="#channels" role="tab" aria-controls="channels" aria-selected="true">{Translate(this.props, "Channels")}</a>
                                                    </li>
                                                    : null
                                            }
                                            {
                                                this.state.blogs ?
                                                    <li className="nav-item">
                                                        <a className="nav-link" data-toggle="tab" href="#blogs" role="tab" aria-controls="blogs" aria-selected="true">{Translate(this.props, "Blogs")}</a>
                                                    </li>
                                                    : null
                                            }
                                            {
                                                this.state.playlists ?
                                                    <li className="nav-item">
                                                        <a className="nav-link" data-toggle="tab" href="#playlists" role="tab" aria-controls="playlists" aria-selected="true">{Translate(this.props, "Playlists")}</a>
                                                    </li>
                                                    : null
                                            }
                                            {
                                                this.state.audios ?
                                                    <li className="nav-item">
                                                        <a className="nav-link" data-toggle="tab" href="#audios" role="tab" aria-controls="audios" aria-selected="true">{Translate(this.props, "Audio")}</a>
                                                    </li>
                                                    : null
                                            }
                                            {
                                                this.props.pageInfoData.appSettings[`${"member_comment"}`] == 1 ?
                                                    <li className="nav-item">
                                                        <a className="nav-link" data-toggle="tab" href="#comments" role="tab" aria-controls="comments" aria-selected="true">{`${ShortNumber(this.state.member.comment_count ? this.state.member.comment_count : 0)}`}{" "}{this.props.t("comment_count", { count: this.state.member.comment_count ? this.state.member.comment_count : 0 })}</a>
                                                    </li>
                                                    : null
                                            }
                                        </ul>
                                        <div className="tab-content" id="myTabContent">
                                        <div className="tab-pane fade active show" id="about" role="tabpanel">
                                                <div className="details-tab-box">
                                                {
                                                    this.props.pageInfoData.appSettings[`${"member_rating"}`] == 1 ?
                                                    <React.Fragment>
                                                        <div className="tabInTitle">
                                                            <h6>{Translate(this.props, "Rating")}</h6>
                                                            <div className="rating">
                                                                <React.Fragment>
                                                                    <div className="animated-rater">
                                                                        {
                                                                            !this.props.settings ?
                                                                                <Rating {...this.props} {...this.state.member} rating={this.state.member.rating} type="member" id={this.state.member.user_id} />
                                                                                :
                                                                                <Rater rating={this.state.member.rating} fractions={2} total={5} interactive={false} />
                                                                        }
                                                                    </div>                                                                        
                                                                </React.Fragment>
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                    : null
                                                }
                                                    <React.Fragment>
                                                        <div className="tabInTitle">
                                                            <h6>{Translate(this.props, "First Name")}</h6>
                                                            <div className="owner_name">
                                                                <React.Fragment>
                                                                    {this.state.member.first_name}
                                                                </React.Fragment>
                                                            </div>
                                                        </div>

                                                    </React.Fragment>
                                                    {
                                                        this.state.member.last_name ? 
                                                    <React.Fragment>
                                                        <div className="tabInTitle">
                                                            <h6>{Translate(this.props, "Last Name")}</h6>
                                                            <div className="owner_name">
                                                                <React.Fragment>
                                                                    {this.state.member.last_name}
                                                                </React.Fragment>
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                     : null
                                                    }
                                                    <div className="tabInTitle">
                                                        <h6>{Translate(this.props, "Member Since")}</h6>
                                                        <div className="member_since">
                                                            <Date {...this.props} creation_date={this.state.member.creation_date} initialLanguage={this.props.initialLanguage} format={'dddd, MMMM Do YYYY'} defaultTimezone={this.props.pageInfoData.defaultTimezone} />
                                                        </div>
                                                    </div>
                                                    <React.Fragment>
                                                        <div className="tabInTitle">
                                                            <h6>{Translate(this.props, "Gender")}</h6>
                                                            <div className="owner_gender">
                                                                <React.Fragment>
                                                                    {this.state.member.gender == "male" ? this.props.t("Male") : this.props.t("Female")}
                                                                </React.Fragment>
                                                            </div>
                                                        </div>

                                                    </React.Fragment>
                                                    {this.state.member.age > 0 ?
                                                        <React.Fragment>
                                                            <div className="tabInTitle">
                                                                <h6>{Translate(this.props, "Age")}</h6>
                                                                <div className="owner_gender">
                                                                    <React.Fragment>
                                                                        {this.state.member.age}
                                                                    </React.Fragment>
                                                                </div>
                                                            </div>

                                                        </React.Fragment>
                                                        : null
                                                    }
                                                    {
                                                        this.state.member.about ?
                                                            <React.Fragment>
                                                                <div className="tabInTitle">
                                                                    <h6>{Translate(this.props, "About")}</h6>
                                                                    <div className="channel_description">
                                                                        <Linkify properties={{ target: '_blank' }}>{this.state.member.about}</Linkify>
                                                                    </div>
                                                                </div>

                                                            </React.Fragment>
                                                            : null
                                                    }
                                                    {
                                                        this.state.member.phone_number ?
                                                            <React.Fragment>
                                                                <div className="tabInTitle">
                                                                    <h6>{Translate(this.props, "Phone Number")}</h6>
                                                                    <div className="owner_phone">
                                                                        {this.state.member.phone_number}
                                                                    </div>
                                                                </div>

                                                            </React.Fragment>
                                                            : null
                                                    }
                                                    {
                                                        this.state.member.facebook ?
                                                            <React.Fragment>
                                                                <div className="tabInTitle">
                                                                    <h6>{Translate(this.props, "Facebook")}</h6>
                                                                    <div className="owner_external_link">
                                                                        <a href={this.state.member.facebook} target="_blank">{this.state.member.facebook}</a>
                                                                    </div>
                                                                </div>

                                                            </React.Fragment>
                                                            : null
                                                    }

                                                    {
                                                        this.state.member.instagram ?
                                                            <React.Fragment>
                                                                <div className="tabInTitle">
                                                                    <h6>{Translate(this.props, "Instagram")}</h6>
                                                                    <div className="owner_external_link">
                                                                        <a href={this.state.member.instagram} target="_blank">{this.state.member.instagram}</a>
                                                                    </div>
                                                                </div>

                                                            </React.Fragment>
                                                            : null
                                                    }
                                                    {
                                                        this.state.member.pinterest ?
                                                            <React.Fragment>
                                                                <div className="tabInTitle">
                                                                    <h6>{Translate(this.props, "Pinterest")}</h6>
                                                                    <div className="owner_external_link">
                                                                        <a href={this.state.member.pinterest} target="_blank">{this.state.member.pinterest}</a>
                                                                    </div>
                                                                </div>

                                                            </React.Fragment>
                                                            : null
                                                    }
                                                    {
                                                        this.state.member.twitter ?
                                                            <React.Fragment>
                                                                <div className="tabInTitle">
                                                                    <h6>{Translate(this.props, "Twitter")}</h6>
                                                                    <div className="owner_external_link">
                                                                        <a href={this.state.member.twitter} target="_blank">{this.state.member.twitter}</a>
                                                                    </div>
                                                                </div>

                                                            </React.Fragment>
                                                            : null
                                                    }

                                                </div>
                                            </div>
                                           
                                            <div className="tab-pane fade" id="videos" role="tabpanel">
                                                <div className="details-tab-box">
                                                    <Videos {...this.props}  user_id={this.state.member.user_id} videos={this.state.videos.results} pagging={this.state.videos.pagging} />
                                                </div>
                                            </div>
                                            {
                                                this.state.channels ?
                                                    <div className="tab-pane fade" id="channels" role="tabpanel">
                                                        <div className="details-tab-box">
                                                            <Channel {...this.props}  user_id={this.state.member.user_id} channels={this.state.channels.results} pagging={this.state.channels.pagging} />
                                                        </div>
                                                    </div>
                                                    : null
                                            }
                                            {
                                                this.state.blogs ?
                                                    <div className="tab-pane fade" id="blogs" role="tabpanel">
                                                        <div className="details-tab-box">
                                                            <Blog {...this.props}  user_id={this.state.member.user_id} blogs={this.state.blogs.results} pagging={this.state.blogs.pagging} />
                                                        </div>
                                                    </div>
                                                    : null
                                            }
                                            {
                                                this.state.playlists ?
                                                    <div className="tab-pane fade" id="playlists" role="tabpanel">
                                                        <div className="details-tab-box">
                                                            <Playlists {...this.props}  user_id={this.state.member.user_id} playlists={this.state.playlists.results} pagging={this.state.playlists.pagging} />
                                                        </div>
                                                    </div>
                                                    : null
                                            }
                                            {
                                                this.state.audios ?
                                                    <div className="tab-pane fade" id="audios" role="tabpanel">
                                                        <div className="details-tab-box">
                                                            <Audio {...this.props} search={true} userowner_id={this.state.member.user_id} audios={this.state.audios.results} pagging={this.state.audios.pagging} />
                                                        </div>
                                                    </div>
                                                    : null
                                            }
                                            {
                                                this.props.pageInfoData.appSettings[`${"member_comment"}`] == 1 ?
                                                    <div className="tab-pane fade" id="comments" role="tabpanel">
                                                        <div className="details-tab-box">
                                                            <Comment {...this.props}  owner_id={this.state.member.user_id} hideTitle={true} appSettings={this.props.pageInfoData.appSettings} commentType="member" type="members" id={this.state.member.user_id} />
                                                        </div>
                                                    </div>
                                                    : null
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </React.Fragment>
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
        setPageInfoData: (data) => dispatch(actions.setPageInfoData(data)),
        openToast: (message, typeMessage) => dispatch(actions.openToast(message, typeMessage)),
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Index)