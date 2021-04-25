import React from "react"
import Currency from "./Currency"
const Item = (props) => {
const videoEnable = 1
const donationVideo = props.pageInfoData.appSettings['video_donation']
const sellVideo = props.pageInfoData.appSettings['video_sell']

const channelEnable = props.pageInfoData.appSettings['enable_channel']
const blogEnable = props.pageInfoData.appSettings['enable_blog']
const playlistEnable = props.pageInfoData.appSettings['enable_playlist']
const adsEnable = props.pageInfoData.appSettings['enable_ads']
const memberHot = props.pageInfoData.appSettings['member_hot']
const memberSponsored = props.pageInfoData.appSettings['member_sponsored']
const memberFeatured = props.pageInfoData.appSettings['member_featured']
const uploadLimitSize = { "1048576": "1 MB", "5242880": "5 MB", "26214400": "25 MB", "52428800": "50 MB", "104857600": "100 MB", "524288000": "50 MB", "1073741824": "1 GB", "2147483648": "2 GB", "5368709120": "5 GB", "10737418240": "10 GB", "0": "Unlimited" }
return (
        <div className="col-lg-4">
            <div className="card mb-5 mb-lg-0">
                <div className="card-body">
                    <h5 className="card-title text-muted text-uppercase text-center">{props.package.title}</h5>
                    <h6 className="card-price text-center"><Currency {...props} /><span className="period">/{props.package.package_description ? " "+props.package.package_description.trim() : ""}</span></h6>
                    <hr />
                    <ul className="fa-ul">
                        {
                            props.package.description ?
                                <li><p className="user_subscription_description" onKeyDown={(e) => e.preventDefault()} defaultValue={props.package.description}></p></li>
                                : null
                        }
                        {
                            memberFeatured == 1 && props.package.is_featured == 1 ?
                                <li>
                                    <span className="fa-li">
                                        <span className="material-icons">check</span>
                                    </span>
                                    {props.t("Featured member")}
                                    </li>
                                :
                                <li className="text-muted">
                                    <span className="fa-li">
                                        <span className="material-icons">close</span>
                                    </span>
                                    {props.t("Featured member")}
                                    </li>
                        }
                        {
                            memberSponsored == 1 && props.package.is_sponsored == 1 ?
                                <li>
                                    <span className="fa-li">
                                        <span className="material-icons">check</span>
                                    </span>
                                    {props.t("Sponsored member")}
                                    </li>
                                :
                                <li className="text-muted">
                                    <span className="fa-li">
                                        <span className="material-icons">close</span>
                                    </span>
                                    {props.t("Sponsored member")}
                                    </li>
                        }
                        {
                            memberHot == 1 && props.package.is_hot == 1 ?
                                <li>
                                    <span className="fa-li">
                                        <span className="material-icons">check</span>
                                    </span>
                                    {props.t("Hot member")}
                                    </li>
                                :
                                <li className="text-muted">
                                    <span className="fa-li">
                                        <span className="material-icons">close</span>
                                    </span>
                                    {props.t("Hot member")}
                                    </li>
                        }
                        {
                            <li>
                                <span className="fa-li">
                                    <span className="material-icons">check</span>
                                </span>
                                {props.package.upload_video_limit != 0 ? `${uploadLimitSize[props.package.upload_video_limit]} ${props.t("Video upload Limit")}` : props.t("Unlimited upload limit")}
                            </li>
                        }
                        {
                            <li>
                                <span className="fa-li">
                                    <span className="material-icons">check</span>
                                </span>
                                {props.package.video_create_limit != 0 ? `${props.t("Upload upto {{video}} video(s)",{video:props.package.video_create_limit})}` : props.t("Upload unlimited video(s)")}
                            </li>
                        }
                        {
                            sellVideo ?
                                props.package.sell_videos ?
                                    <li>
                                        <span className="fa-li">
                                            <span className="material-icons">check</span>
                                        </span>
                                        {props.t("Sell uploaded videos")}
                                    </li>
                                    :
                                    <li className="text-muted">
                                        <span className="fa-li">
                                            <span className="material-icons">close</span>
                                        </span>
                                        {props.t("Sell uploaded Videos")}
                                    </li>
                                : null
                        }
                        {
                            donationVideo ?
                                props.package.get_donation ?
                                    <li>
                                        <span className="fa-li">
                                            <span className="material-icons">check</span>
                                        </span>
                                        {props.t("Get donation on uploaded videos")}
                                    </li>
                                    :
                                    <li className="text-muted">
                                        <span className="fa-li">
                                            <span className="material-icons">close</span>
                                        </span>
                                        {props.t("Get donation on uploaded videos")}
                                    </li>
                                : null
                        }
                        {
                            channelEnable == 1 && props.package.create_channel == 1 ?
                                <li>
                                    <span className="fa-li">
                                        <span className="material-icons">check</span>
                                    </span>
                                    {props.package.channel_create_limit != 0 ? `${props.t("Create {{limit}} channel(s)",{limit:props.package.channel_create_limit})}` : props.t("Create unlimited channels")}

                                    </li>
                                :
                                <li className="text-muted">
                                    <span className="fa-li">
                                        <span className="material-icons">close</span>
                                    </span>
                                    {props.t("Create channels")}
                                    </li>
                        }
                        
                        {
                            blogEnable == 1 && props.package.create_blogs == 1 ?
                                <li>
                                    <span className="fa-li">
                                        <span className="material-icons">check</span>
                                    </span>
                                    {props.package.blog_create_limit != 0 ? `${props.t("Create {{limit}} blog(s)",{limit:props.package.blog_create_limit})}` : props.t("Create unlimited blogs")}
                                    </li>
                                :
                                <li className="text-muted">
                                    <span className="fa-li">
                                        <span className="material-icons">close</span>
                                    </span>
                                    {props.t("Create blogs")}
                                    </li>
                        }
                        
                        {
                            playlistEnable == 1 && props.package.create_playlist == 1 ?
                                <li>
                                    <span className="fa-li">
                                        <span className="material-icons">check</span>
                                    </span>
                                    {props.package.playlist_create_limit != 0 ? `${props.t("Create {{limit}} playlist(s)",{limit:props.package.playlist_create_limit})}` : props.t("Create unlimited playlists")}
                                    </li>
                                :
                                <li className="text-muted">
                                    <span className="fa-li">
                                        <span className="material-icons">close</span>
                                    </span>
                                    {props.t("Create playlists")}
                                    </li>
                        }
                        

                        {
                            adsEnable == 1 && props.package.create_advertisement == 1 ?
                                <li>
                                    <span className="fa-li">
                                        <span className="material-icons">check</span>
                                    </span>
                                    {props.package.playlist_create_limit != 0 ? `${props.t("Create {{limit}} advertisement(s)",{limit:props.package.ad_create_limit})}` : props.t("Create unlimited advertisements")}
                                    </li>
                                :
                                <li className="text-muted">
                                    <span className="fa-li">
                                        <span className="material-icons">close</span>
                                    </span>
                                    {props.t("Create advertisements")}
                                    </li>
                        }
                        
                        {
                            props.package.monetization == 1 ?
                                <li>
                                    <span className="fa-li">
                                        <span className="material-icons">check</span>
                                    </span>
                                    {props.t("Video monetization")}
                                    </li>
                                :
                                <li className="text-muted">
                                    <span className="fa-li">
                                        <span className="material-icons">close</span>
                                    </span>
                                    {props.t("Video monetization")}
                                    </li>
                        }
                    </ul>
                    <a href="#" onClick={props.selectedPackage.bind(this,props.package.package_id)} className={`btn btn-block text-uppercase${props.selectedPackage && props.selectedPackage.package_id == props.package.package_id ? "disabled" : ""}`}>{props.t("Subscribe")}</a>
                </div>
            </div>
        </div>
    )
}

export default Item