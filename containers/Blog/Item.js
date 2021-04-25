import React from "react"
import Image from "../Image/Index"

import UserTitle from "../User/Title"
import Link from "../../components/Link/index";

import SocialShare from "../SocialShare/Index"

import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import swal from 'sweetalert'
import axios from "../../axios-orders"
import striptags from "striptags"
import Timeago from "../Common/Timeago"
import Translate from "../../components/Translate/Index"
import ShortNumber from "short-number"
import Analytics from "../Dashboard/StatsAnalytics"
import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'

class Index extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            blog: props.result
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.result && nextProps.result != prevState.blog) {
            return { blog: nextProps.result }
        } else{
            return null
        }
    }
    delete(e) {
        e.preventDefault()
        swal({
            title: Translate(this.props, "Are you sure?"),
            text: Translate(this.props, "Once deleted, you will not be able to recover this!"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()
                    formData.append('id', this.state.blog.custom_url)
                    const url = "/blogs/delete"
                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) {
                                swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
                            } else {

                            }
                        }).catch(err => {
                            swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
                        });
                    //delete
                } else {

                }
            });
    }
    analytics = (e) => {
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
                            <Analytics {...this.props} id={this.state.blog.blog_id} type="blogs" />
                        </div>
                    </div>
                </div>
            </div>
        }
        let description = striptags(this.state.blog.description)
        if (description.length > 300) {
            description = description.substring(0, 300);
        }
        return (
            <React.Fragment>
                {analyticsData}
                <div className="snglblog-block clearfix" key={this.state.blog.blog_id}>
                    <div className="blogImgWrap">
                        <Link href={`/blog`} customParam={`blogId=${this.state.blog.custom_url}`} as={`/blog/${this.state.blog.custom_url}`}>
                            <a className="blogImg"  onClick={this.props.closePopUp}>
                                <Image image={this.state.blog.image} title={<CensorWord {...this.props} text={this.state.blog.title} />} imageSuffix={this.props.pageInfoData.imageSuffix} />

                            </a>
                        </Link>

                        <div className="lbletop">

                            {
                                this.props.pageInfoData.appSettings['blogs_browse_featuredlabel'] == 1 && this.props.pageInfoData.appSettings['blog_featured'] == 1 && this.state.blog.is_featured == 1 ?
                                    <span className="lbl-Featured" title={Translate(this.props, "Featured Blog")}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                    </span>
                                    : null
                            }
                            {
                                this.props.pageInfoData.appSettings['blogs_browse_sponsoredLabel'] == 1 && this.props.pageInfoData.appSettings['blog_sponsored'] == 1 && this.state.blog.is_sponsored == 1 ?
                                    <span className="lbl-Sponsored" title={Translate(this.props, "Sponsored Blog")}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                    </span>
                                    : null
                            }
                            {
                                this.props.pageInfoData.appSettings['blogs_browse_hotLabel'] == 1 && this.props.pageInfoData.appSettings['blog_hot'] == 1 && this.state.blog.is_hot == 1 ?
                                    <span className="lbl-Hot" title={Translate(this.props, "Hot Blog")}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                    </span>
                                    : null
                            }
                        </div>
                    </div>


                    
                    <div className={`blogContent${this.props.canDelete || this.props.canEdit  || this.props.pageInfoData.appSettings["blogs_browse_share"] == 1 ? " edit-blog-btn" : ""}`}>                        
                        <Link href={`/blog`} customParam={`blogId=${this.state.blog.custom_url}`} as={`/blog/${this.state.blog.custom_url}`}>
                            <a className="blogTitle"  onClick={this.props.closePopUp}>{renderToString(<CensorWord {...this.props} text={this.state.blog.title} />)}</a>
                        </Link>
                        {
                                    this.props.canDelete || this.props.canEdit || this.props.pageInfoData.appSettings["blogs_browse_share"] == 1 ? 
                                <div className="dropdown TitleRightDropdown">
                                    <a href="#" data-toggle="dropdown"><span className="material-icons">more_vert</span></a>
                                    <ul className="dropdown-menu dropdown-menu-right edit-options">
                                    {
                                        this.props.canEdit ?
                                        <li>
                                            <Link href="/create-blog" customParam={`blogId=${this.state.blog.custom_url}`} as={`/create-blog/${this.state.blog.custom_url}`}>
                                                <a className="addPlaylist addEdit" title={Translate(this.props, "Edit")}>
                                                <span className="material-icons">edit</span>{Translate(this.props, "Edit")}
                                                </a>
                                            </Link>
                                            </li>
                                            : null
                                    }
                                    {
                                        this.props.canDelete ?
                                        <li>
                                            <a className="addPlaylist addDelete"  title={Translate(this.props, "Delete")} href="#" onClick={this.delete.bind(this)}>
                                                <span className="material-icons">delete</span>
                                                {Translate(this.props, "Delete")}
                                            </a>
                                            </li>
                                            : null
                                    }
                                    {
                                        this.props.canEdit ?
                                        <li>
                                            <a href="#" className="addPlaylist addEdit"  onClick={this.analytics} title={Translate(this.props, "Analytics")}>
                                                <span className="material-icons">show_chart</span>
                                                    {Translate(this.props, "Analytics")}
                                            </a>
                                            </li>
                                            : null
                                    }
                                    {
                                        this.props.pageInfoData.appSettings['blogs_browse_share'] == 1 ?
                                            <SocialShare {...this.props} buttonHeightWidth="30" round="true" tags={this.state.blog.tags} url={`/blog/${this.state.blog.custom_url}`} title={renderToString(<CensorWord {...this.props} text={this.state.blog.title} />)} imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.blog.image} />
                                            : null
                                    }
                                    </ul>
                                </div>
                                : null
                            }
                    </div>
                    
                    <div className="blogFootr">
                    {
                            this.props.pageInfoData.appSettings['blogs_browse_username'] == 1 ?
                                <div className="authorDate">
                                        {
                                            this.props.pageInfoData.appSettings['blogs_browse_username'] == 1 ?
                                                <React.Fragment>
                                                    <UserTitle childPrepend={true}  closePopUp={this.props.closePopUp} className="UserName" data={this.state.blog} ></UserTitle>
                                                </React.Fragment>
                                                : null
                                        }
                                </div>
                                : null
                        }
                    {
                                    this.props.pageInfoData.appSettings["blogs_browse_views"] == 1 || this.props.pageInfoData.appSettings["blogs_browse_datetime"] ? 
                            <span className="videoViewDate">
                                {
                                    this.props.pageInfoData.appSettings["blogs_browse_views"] == 1  ? 
                                <span>{`${ShortNumber(this.state.blog.view_count ? this.state.blog.view_count : 0)}`}{" "}{this.props.t("view_count", { count: this.state.blog.view_count ? this.state.blog.view_count : 0 })}</span>
                                : null
                                }
                                 {
                            this.props.pageInfoData.appSettings["blogs_browse_views"] == "1" && this.props.pageInfoData.appSettings["blogs_browse_datetime"] == "1" ?
                                <span className="seprater">|</span>
                            : null
                            }
                                {
                                    this.props.pageInfoData.appSettings["blogs_browse_datetime"] == 1  ? 
                                        <span><Timeago {...this.props}>{this.state.blog.creation_date}</Timeago></span>
                                    : null
                                }
                            </span>
                    : null
                    }
                    <div className="LikeDislikeWrap">
                        <ul className="LikeDislikeList">
                                
                                {
                                    this.props.pageInfoData.appSettings['blogs_browse_like'] == 1 ?
                                        <li>
                                            <Like icon={true} {...this.props} like_count={this.state.blog.like_count} item={this.state.blog} type="blog" id={this.state.blog.blog_id} />{"  "}
                                        </li>
                                        : null
                                }
                                {
                                    this.props.pageInfoData.appSettings['blogs_browse_dislike'] == 1 ?
                                        <li>
                                            <Dislike icon={true} {...this.props} dislike_count={this.state.blog.dislike_count} item={this.state.blog} type="blog" id={this.state.blog.blog_id} />{"  "}
                                        </li>
                                        : null
                                }
                                {
                                    this.props.pageInfoData.appSettings['blogs_browse_favourite'] == 1 ?
                                        <li>
                                            <Favourite icon={true} {...this.props} favourite_count={this.state.blog.favourite_count} item={this.state.blog} type="blog" id={this.state.blog.blog_id} />{"  "}
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
export default Index