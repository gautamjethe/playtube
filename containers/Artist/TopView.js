import React from "react"

import Image from "../Image/Index"


import SocialShare from "../SocialShare/Index"

import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import Translate from "../../components/Translate/Index"
import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'
class TopView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            artist: props.artist
        }
    }
    componentDidMount() {
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            if (id == this.state.artist.artist_id && type == "artists") {
                const data = this.state.artist
                data.rating = rating
                this.setState({ artist: data })
            }
        });
        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "artists") {
                if (this.state.artist.artist_id == id) {
                    const changedItem = { ...this.state.artist }
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    this.setState({ artist: changedItem })
                }
            }
        });
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "artists") {
                if (this.state.artist.artist_id == id) {
                    const changedItem = { ...this.state.artist }
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    this.setState({ artist: changedItem })
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
            if (itemType == "artists") {
                if (this.state.artist.artist_id == itemId) {
                    const changedItem = { ...this.state.artist }
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
                    this.setState({ artist: changedItem })
                }
            }
        });
    }
    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-12">
                        <div className="channelInfo-wrap artistDetailsWrap">
                            <div className="playlist-profile-img">
                                <Image title={this.state.artist.title} image={renderToString(<CensorWord {...this.props} text={this.state.artist.image} />)} imageSuffix={this.props.pageInfoData.imageSuffix} />
                            </div>
                            <div className="playList-profileRight">
                            <div className="playlist-profile-title">
                                <h4>{Translate(this.props,this.state.artist.title) + " "} {
                                    this.state.artist.verified ?
                                        <span className="verifiedUser" title={Translate(this.props, "verified")}><span className="material-icons">check</span>
                                        </span>
                                        : null
                                }</h4>
                            </div>
                            
                            <div className="LikeDislikeWrap">
                                <ul className="LikeDislikeList">
                                    <li> 
                                        <Like  {...this.props} icon={true} like_count={this.state.artist.like_count} item={this.state.artist} parentType={this.state.artist.type} type="artist" id={this.state.artist.artist_id} />{"  "}
                                    </li>
                                    <li>
                                        <Dislike  {...this.props} icon={true} dislike_count={this.state.artist.dislike_count} item={this.state.artist} parentType={this.state.artist.type} type="artist" id={this.state.artist.artist_id} />{"  "}
                                    </li>
                                    <li>
                                        <Favourite  {...this.props} icon={true} favourite_count={this.state.artist.favourite_count} item={this.state.artist} parentType={this.state.artist.type} type="artist" id={this.state.artist.artist_id} />{"  "}
                                    </li>
                                    <SocialShare {...this.props} hideTitle={true} buttonHeightWidth="30" url={`/artist/${this.state.artist.custom_url}`} title={renderToString(<CensorWord {...this.props} text={this.state.artist.title} />)} imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.artist.image} />
                                </ul>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default TopView