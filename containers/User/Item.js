import React from "react"
import Image from "../Image/Index"

import Link from "../../components/Link/index";

import SocialShare from "../SocialShare/Index"
import ShortNumber from "short-number"

import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import Subscribe from "../User/Follow"
import  Translate  from "../../components/Translate/Index"

class Item extends React.Component {
    constructor(props) {
        super(props)
        let propsData = {...props}
        this.state = {
            member: propsData.member,
            language:propsData.i18n.language

        }
    }
    shouldComponentUpdate(nextProps,nextState){
        if(nextProps.member != this.props.member || nextProps.i18n.language != this.state.language){
            return true
        }
        return false
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }

        if (prevState.member != nextProps.member || nextProps.i18n.language != prevState.language) {
           return { member: nextProps.member }
        } else{
            return null
        }

    }
    render() {
        return (
            <div className="member-block">
                <div className="member-img-block">
                    <Link href="/member" customParam={`memberId=${this.state.member.username}`} as={`/${this.state.member.username}`}>
                        <a  onClick={this.props.closePopUp}>
                            <Image title={this.state.member.displayname} image={this.state.member.avtar} imageSuffix={this.props.pageInfoData.imageSuffix} />
                        </a>
                    </Link>
                    <div className="lbletop">
                        {
                            this.props.pageInfoData.appSettings['users_featuredlabel'] == 1 && this.props.pageInfoData.appSettings['member_featured'] == 1 && this.state.member.is_featured == 1 ?
                                <span className="lbl-Featured" title={Translate(this.props,"Featured Member")}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                </span>
                                : null
                        }
                        {
                            this.props.pageInfoData.appSettings['users_sponsoredLabel'] == 1 && this.props.pageInfoData.appSettings['member_sponsored'] == 1 && this.state.member.is_sponsored == 1 ?
                                <span className="lbl-Sponsored" title={Translate(this.props,"Sponsored Member")}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                </span>
                                : null
                        }
                        {
                            this.props.pageInfoData.appSettings['users_hotLabel'] == 1 && this.props.pageInfoData.appSettings['member_hot'] == 1 && this.state.member.is_hot == 1 ?
                                <span className="lbl-Hot" title={Translate(this.props,"Hot Member")}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                </span>
                                : null
                        }
                    </div>
                </div>
                <Link href="/member" customParam={`memberId=${this.state.member.username}`} as={`/${this.state.member.username}`}>
                    <a className="name" onClick={this.props.closePopUp}>
                        <React.Fragment>
                            {this.state.member.displayname}
                            {
                                this.props.pageInfoData.appSettings['member_verification'] == 1 && this.state.member.verified ?
                                    <span className="verifiedUser" title={Translate(this.props,"verified")}><span className="material-icons">check</span></span>
                                    : null
                            }
                        </React.Fragment>
                    </a>
                </Link>

                <div className="member-content">
                    <div className="member-stats">
                    {
                        this.props.pageInfoData.appSettings["users_views"] == "1" ?
                        <span>{`${ShortNumber(this.state.member.view_count ? this.state.member.view_count : 0)}`}{" "}{this.props.t("view_count", { count: this.state.member.view_count ? this.state.member.view_count : 0 })}</span>
                        : null
                    }
                    {
                    this.props.pageInfoData.appSettings["users_views"] == "1" && this.props.pageInfoData.appSettings["users_followers"] == "1" ?
                        <span className="seprater">|</span>
                    : null
                    }
                    {
                    this.props.pageInfoData.appSettings["users_followers"] == "1" ?
                        <span>{`${ShortNumber(this.state.member.follow_count ? this.state.member.follow_count : 0)}`}{" "}{this.props.t("follow_count", { count: this.state.member.follow_count ? this.state.member.follow_count : 0 })}</span>
                    : null
                    }
                    </div>
                    {
                        this.props.pageInfoData.appSettings['users_follow'] == 1 ? 
                            <Subscribe  {...this.props} className="follwbtn" type="members" user={this.state.member} user_id={this.state.member.user_id} />
                    : null
                    }
                    <div className="LikeDislikeWrap">
                        <ul className="LikeDislikeList">
                        {
                        this.props.pageInfoData.appSettings['users_like'] == 1 ? 
                            <li>
                                <Like icon={true} {...this.props} like_count={this.state.member.like_count} item={this.state.member} type="member" id={this.state.member.user_id} />{"  "}
                            </li>
                            : null
                        }
                        {
                        this.props.pageInfoData.appSettings['users_dislike'] == 1 ? 
                            <li>
                                <Dislike icon={true} {...this.props} dislike_count={this.state.member.dislike_count} item={this.state.member} type="member" id={this.state.member.user_id} />{"  "}
                            </li>
                            :null
                        }
                        {
                        this.props.pageInfoData.appSettings['users_favourite'] == 1 ? 
                            <li>
                                <Favourite icon={true} {...this.props} favourite_count={this.state.member.favourite_count} item={this.state.member} type="member" id={this.state.member.user_id} />{"  "}
                            </li>
                            : null
                        }
                        {
                        this.props.pageInfoData.appSettings['users_share'] == 1 ? 
                        <SocialShare {...this.props} hideTitle={true} buttonHeightWidth="30" url={`/${this.state.member.username}`} title={this.state.member.displayname} imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.member.avtar} />
                            : null
                        }
                        </ul>
                    </div>
                    
                </div>


            </div>
        )
    }
}

export default Item;