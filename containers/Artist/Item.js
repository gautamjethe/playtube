import React from "react"
import Image from "../Image/Index"

import Link from "../../components/Link/index";

import SocialShare from "../SocialShare/Index"

import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import Translate from "../../components/Translate/Index"
import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'
class Item extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            artist:props.artists
        }
    }
    
    render(){
        return (
            <div className="single-user">
                <div className={`img${this.props.className ? " "+this.props.className : ""}`}>
                    <Link href="/artist" customParam={`artistId=${this.state.artist.custom_url}`} as={`/artist/${this.state.artist.custom_url}`}>
                        <a>                        
                            <Image title={renderToString(<CensorWord {...this.props} text={this.state.artist.title} />)} image={this.state.artist.image} imageSuffix={this.props.pageInfoData.imageSuffix} />
                        </a>
                    </Link>
                </div>
                    <div className="content">
                        <Link href="/artist" customParam={`artistId=${this.state.artist.custom_url}`} as={`/artist/${this.state.artist.custom_url}`}>
                            <a className="name">          
                                <React.Fragment>         
                                {<CensorWord {...this.props} text={Translate(this.props,this.state.artist.title)} />}
                                 {
                                    this.state.artist.verified ? 
                                        <span className="verifiedUser" title={Translate(this.props,"verified")}><span className="material-icons">check</span></span>
                                    : null
                                }
                                </React.Fragment>     
                            </a>
                        </Link>
                        <div className="LikeDislikeWrap">
                        <ul className="LikeDislikeList">
                        {
                        this.props.pageInfoData.appSettings["artists_browse_like"] == "1" ?
                            <li>
                                <Like icon={true} {...this.props} like_count={this.state.artist.like_count} item={this.state.artist} parentType={this.state.artist.type} type="artist" id={this.state.artist.artist_id} />{"  "}
                            </li>
                        : null
                        }
                        {
                            this.props.pageInfoData.appSettings["artists_browse_dislike"] == "1" ?
                            <li>
                                <Dislike icon={true} {...this.props} dislike_count={this.state.artist.dislike_count} item={this.state.artist} parentType={this.state.artist.type} type="artist" id={this.state.artist.artist_id} />{"  "}
                            </li>
                        : null
                        }
                            {
                                this.props.pageInfoData.appSettings["artists_browse_favourite"] == "1" ?
                            <li>
                                <Favourite icon={true} {...this.props} favourite_count={this.state.artist.favourite_count} item={this.state.artist} parentType={this.state.artist.type} type="artist" id={this.state.artist.artist_id} />{"  "}
                            </li>
                            : null
                            }
                            
                        {
                            this.props.pageInfoData.appSettings["artists_browse_share"] == "1" ?
                            <SocialShare {...this.props} hideTitle={true} buttonHeightWidth="30" url={`/playlist/${this.state.artist.custom_url}`} title={renderToString(<CensorWord {...this.props} text={Translate(this.props,this.state.artist.title)} />) } imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.artist.image} />
                        :null
                        }
                        </ul>
                        </div>
                        
                    </div>
            </div>
        )
    }
}

export default  Item ;