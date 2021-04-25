import React, {Suspense} from "react"
import { connect } from 'react-redux';
import action from '../../store/actions/general';
import dynamic from "next/dynamic";
const PWAPrompt = dynamic(() => import("react-ios-pwa-prompt"), {
    ssr: false
  });
import Content from "./Content"
import LoginPopup from "../Login/Popup"
import SignupPopup from "../Signup/Popup"

import Playlist from "../Video/Playlist"
import ToastMessage from "../ToastMessage/Index"
import ToastContainer from "../ToastMessage/Container"
import RatingStats from "../Rating/Stats"
import SocialShare from "../SocialShare/Footer"
import Report from "../Report/Index"
import axios from "../../axios-orders"

import Router from "next/router"

import FullPageSearch from "../Footer/FullPageSearch"

class Footer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            adult:props.pageInfoData.adultAllowed ? true : false,
             previousUrl:typeof window != "undefined" ? Router.asPath : ""
        }
        this.allowAdultContent = this.allowAdultContent.bind(this)
    }
    allowAdultContent = (e) => {
        this.setState({adult:!this.state.adult},() => {
            const formData = new FormData()
            formData.append('adult', this.state.adult ? 1 : 0)            
            let url = '/members/adult'
            axios.post(url, formData)
                .then(response => {
                 Router.push( this.state.previousUrl ? this.state.previousUrl : Router.pathname)
                })
        })
        
    }
    
    render() {

        return (
            <React.Fragment>
                {
                    this.props.pageInfoData.appSettings["fixed_header"] != 1 ? 
                        <Content  {...this.props} allowAdultContent={this.allowAdultContent} adultChecked={this.state.adult} />
                    : 
                        null
                }
                {
                    this.props.searchClicked && this.props.pageInfoData.appSettings['fixed_header'] == 1 ? 
                    <FullPageSearch {...this.props} />
                    : null
                }
                {
                    !this.props.pageInfoData.loggedInUserDetails ?
                        <React.Fragment>
                            <LoginPopup {...this.props} />
                            <SignupPopup  {...this.props} />
                        </React.Fragment>
                        : null
                }
                {
                    this.props.playlistClicked && this.props.playlistVideoId != 0 ?
                        <Playlist {...this.props} />
                        : null
                }
                
                <ToastContainer {...this.props} />
                {
                    <ToastMessage {...this.props} />
                }
                {
                    this.props.ratingClicked ?
                        <RatingStats  {...this.props} />
                        : null
                }
                {
                    this.props.openReport ? 
                    <Report {...this.props} />
                    : null
                }
                {
                    this.props.isSharePopup ?
                        <React.Fragment>
                            <SocialShare {...this.props} shareData={this.props.sharePopupData} countItems="all" checkcode={true} />
                        </React.Fragment>
                        : null
                }
                {
                    this.props.pageInfoData.appSettings["pwa_app_name"] ? 
                        <PWAPrompt copyTitle={this.props.t("Add to Home Screen")} 
                        copyBody={this.props.t("Add it to your home screen to use it in fullscreen and while offline.")} 
                        copyShareButtonLabel={this.props.t("1) Press the 'Share' button")} copyAddHomeButtonLabel={this.props.t("2) Press 'Add to Home Screen'")}
                        copyClosePrompt={this.props.t("Cancel")} timesToShow={50} permanentlyHideOnDismiss={true} />
                    : null
                }
            </React.Fragment>
        )
    }
}

const mapStateToProps = state => {
    return {
        playlistClicked: state.playlist.playlistClicked,
        ratingClicked: state.rating.ratingClicked,
        playlistVideoId: state.playlist.video_id,
        message: state.toast.message,
        isSharePopup: state.sharepopup.status,
        sharePopupData: state.sharepopup.data,
        openReport:state.report.status,
        searchClicked:state.search.searchClicked
    };
};
const mapDispatchToProps = dispatch => {
    return {
        setPageInfoData: (data) => dispatch(action.setPageInfoData(data)),
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Footer);