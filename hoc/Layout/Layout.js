import React, { Component } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import {  i18n } from '../../i18n';
import Header from "../../containers/Header/Index"
import Footer from "../../containers/Footer/Index"

import * as actions from '../../store/actions/general';
import AdsIndex from "../../containers/Ads/Index"
import Router from 'next/router'

const { BroadcastChannel } = require('broadcast-channel');
import WithErrorHandler from "../withErrorHandler/withErrorHandler"

import Gdpr from "../../containers/Gdpr/Index"

import UnsupportedBrowser from "../../containers/UnsupportedBrowser/Index"

import SideFixedMenu from "../../containers/Menu/SideFixedMenu"
import Translate from '../../components/Translate/Index';

class Layout extends Component {
    constructor(props) {
        super(props)
        if (props.pageData) {
            //this.props.setPageInfoData(props.pageData)
        }
        this.state = {
            width:props.isMobile ? props.isMobile : 993,
            IEBrowser:props.pageData.IEBrowser
        }
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
        this.closeMenu = this.closeMenu.bind(this)
    }
    componentDidMount(){
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
        const userChannel = new BroadcastChannel('user');
        if(this.props.pageInfoData.logout){
            userChannel.postMessage({
                payload: {
                    type: "LOGOUT"
                }
            }); 
        }
        userChannel.onmessage = data => { 
            if(data.payload.type === "LOGIN") {
                if (!this.props.pageData.loggedInUserDetails || this.props.pageData.loggedInUserDetails.user_id != this.props.pageInfoData.loggedInUserDetails.user_id ) {
                    Router.push( this.state.previousUrl ? this.state.previousUrl : Router.asPath)
                }
            }else if(data.payload.type == "LOGOUT"){
                if (this.props.pageData.loggedInUserDetails) {
                    Router.push( "/")
                    this.props.updatePlayerData([], [])
                    this.props.updateAudioData([], 0)
                }
            }
         }
    }
    updateWindowDimensions() {
        const data = {"width":window.innerWidth}
        this.setState(data);
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
    }
    static getDerivedStateFromProps(nextProps, prevState){        
        nextProps.pageData.themeMode = nextProps.pageInfoData.themeMode
        nextProps.setPageInfoData(nextProps.pageData)
		return null;
	}
   
    getSelectedLanguage(){
        let index = this.getLanguageIndex(i18n.language)
        if(index > -1){
            let language = this.props.pageInfoData.languages[index];
            if(language){
                return language.is_rtl == 1 ? true : false
            }
        }
        return false
    }
    getLanguageIndex(code){
        if(this.props.pageInfoData.languages){
            const languages = [...this.props.pageInfoData.languages];
            const itemIndex = languages.findIndex(p => p["code"] == code);
            return itemIndex;
        }else{
            return -1;
        }
    }
    closeMenu = () => {
        this.props.setMenuOpen(true)
    }
    render() {
        
        let videoDuration = ""
        let videoURL = ""
        const imageSuffix = this.props.pageInfoData.imageSuffix
        if(this.props.videoView && this.props.pageInfoData.video && this.props.pageInfoData.video.completed == 1){
            if(this.props.pageInfoData.video.duration){
                videoDuration = "PT"
                let duration = this.props.pageInfoData.video.duration.split(":");
                videoDuration = videoDuration+duration[0]+"H"
                videoDuration = videoDuration+duration[1]+"M"
                videoDuration = videoDuration+duration[2]+"S"
            }

            if(this.props.pageInfoData.video.type == 3){
                let splitName = this.props.pageInfoData.video.video_location.split('/')
                let fullName = splitName[splitName.length - 1]
                let videoName = fullName.split('_')[0]
                let path = "/upload/videos/video/"
                videoURL = imageSuffix + path + videoName + "_240p.mp4"
            }else if(this.props.pageInfoData.video.type == 10 && this.props.pageInfoData.video.is_livestreaming == 0 && this.props.pageInfoData.liveStreamingURL){
                videoURL = this.props.pageInfoData.liveStreamingURL +"/"+this.props.pageInfoData.video.code
            }else if(this.props.pageInfoData.video.type == 9){
                videoURL = this.props.pageInfoData.video.code
            }
        }

        const generalInfo = this.props.pageInfoData.pageInfo
       

        let isURL = false
        if (generalInfo.image) {
            const splitVal = generalInfo.image.split('/')
             if (splitVal[0] == "http:" || splitVal[0] == "https:") {
                isURL = true
            }
        }
        let theme = "white"
		if(this.props.pageInfoData && this.props.pageInfoData.themeMode){
			theme = this.props.pageInfoData.themeMode
        }

        let googleFonts = ""
        if(this.props.pageInfoData['cssValues']){
            let url = 'https://fonts.googleapis.com/css?family=';
            const cssValues = this.props.pageInfoData['cssValues']
            if(theme == "dark" && cssValues["dark"]['font_style'] == "google"){
                const options = []
                options.push(cssValues['dark']['fontFamily_default'])
                options.push(cssValues['dark']['fontFamily_heading'])
                googleFonts = url+options.join("|")
            }else if(cssValues["white"]['font_style'] == "google"){
                const options = []
                options.push(cssValues['white']['fontFamily_default'])
                options.push(cssValues['white']['fontFamily_heading'])
                googleFonts = url+options.join("|")
            }
        }
        let isIE = this.state.IEBrowser
        let fixedHeader = ""
        let disableMarginLeftClass = ""
        if(this.props.pageInfoData.appSettings["fixed_header"] == 1 && this.state.width > 992){
            fixedHeader = " fixed-header"
            if(this.props.hideSmallMenu){
                disableMarginLeftClass = " marginLeft0"
            }
        }
        let CDN_URL_FOR_STATIC_RESOURCES = this.props.pageInfoData.CDN_URL_FOR_STATIC_RESOURCES ? this.props.pageInfoData.CDN_URL_FOR_STATIC_RESOURCES : ""
        let fixedMenu = ""
        if(this.state.width > 992)
            fixedMenu = (this.props.hideSmallMenu ? " top-menu" : " sidemenu") +disableMarginLeftClass+(this.props.menuOpen ? "" : " sidemenu-opened")
        return (
            <React.Fragment>
                {generalInfo ?
                    <Head>
                        {generalInfo.title ?
                            <title>{Translate(this.props,generalInfo.title)}</title>
                            : null}
                        {generalInfo.description ?
                            <meta name="description" content={Translate(this.props,generalInfo.description)} />
                            : null}
                        {generalInfo.keywords ?
                            <meta name="keywords" content={generalInfo.keywords} />
                            : null}
                        {generalInfo.title ?
                            <meta property="og:title" content={Translate(this.props,generalInfo.title)} />
                            : null}
                        {generalInfo.description ?
                            <meta property="og:description" content={Translate(this.props,generalInfo.description)} />
                            : null}
                        {generalInfo.image ?
                            <meta property="og:image" content={(!isURL ? imageSuffix : "") + generalInfo.image} />
                            : null}
                        {generalInfo.image && generalInfo.imageWidth ?
                            <meta property="og:image:width" content={generalInfo.imageWidth} />
                            : null}
                        {generalInfo.image && generalInfo.imageHeight ?
                            <meta property="og:image:height" content={generalInfo.imageHeight} />
                            : null}
                        {generalInfo.title ?
                            <meta property="twitter:title" content={Translate(this.props,generalInfo.title)} />
                            : null}
                        {generalInfo.description ?
                            <meta property="twitter:description" content={Translate(this.props,generalInfo.description)} />
                            : null}
                        {generalInfo.image ?
                            <meta property="twitter:image" content={(!isURL ? imageSuffix : "") + generalInfo.image} />
                            : null}
                        {generalInfo.image ?
                            <meta name="twitter:card" content="summary" />
                            : null}
                        {
                            this.props.pageInfoData.appSettings["pwa_app_name"] ? 
                            <React.Fragment>
                                <link rel='manifest' href='/manifest.json' />
                                <meta name="apple-mobile-web-app-status-bar-style" content="black" />
                                <meta name="apple-mobile-web-app-title" content={this.props.pageInfoData.appSettings["pwa_app_name"]} />
                                <meta name="msapplication-TileColor" content={this.props.pageInfoData.appSettings["pwa_app_bg_color"]} />
                                <meta name="theme-color" content={this.props.pageInfoData.appSettings["pwa_app_theme_color"]} />
                                <meta name="msapplication-TileImage" content={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_512"]} />
                                <meta name="mobile-web-app-capable" content="yes" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_512"]} media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_192"]} rel="icon" sizes="192x192" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_512"]} rel="apple-touch-icon" sizes="180x180" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_152"]} rel="apple-touch-icon" sizes="152x152" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_144"]} rel="apple-touch-icon" sizes="144x144" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_512"]} rel="apple-touch-icon-precomposed" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_128"]} rel="apple-touch-icon-precomposed" sizes="128x128" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_128"]} rel="icon" sizes="128x128" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_512"]} rel="apple-touch-icon" sizes="120x120" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_512"]} rel="apple-touch-icon" sizes="114x114" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_512"]} rel="apple-touch-icon" sizes="76x76" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_72"]} rel="apple-touch-icon" sizes="72x72" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_512"]} rel="apple-touch-icon" sizes="57x57" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_512"]} rel="icon" sizes="32x32" />
                                <link href={imageSuffix+this.props.pageInfoData.appSettings["pwa_icon_sizes_512"]} rel="icon" sizes="16x16" />
                            </React.Fragment>
                            : null
                        }
                        {
                            generalInfo.custom_tags ?
                            require('html-react-parser')(
                                generalInfo.custom_tags
                            )
                            : null
                        }
                    </Head>
                    : null
                }
                
                <Head>
                    <link rel="icon" href={this.props.pageInfoData['imageSuffix']+this.props.pageInfoData.appSettings['favicon']}/>
                    <link href={`${CDN_URL_FOR_STATIC_RESOURCES}/static/css/variable_white.css`} rel="stylesheet" />
                    {
							this.getSelectedLanguage() ? 
							<React.Fragment>
								<link href={`${CDN_URL_FOR_STATIC_RESOURCES}/static/css/bootsrap-rtl.min.css`} rel="stylesheet" />
								<link href={`${CDN_URL_FOR_STATIC_RESOURCES}/static/css/rtl.style.css`} rel="stylesheet" />
							</React.Fragment>
							: null
						}
                </Head>
                {
                    googleFonts ?
                        <Head>
                            <link href={googleFonts} rel="stylesheet" />
                        </Head>
                    : null
                }
                {
                    theme == "dark" ? 
                        <Head>
                            <link href={`${CDN_URL_FOR_STATIC_RESOURCES}/static/css/variable_dark.css`} rel="stylesheet" />
                        </Head>
                        :
                        null
                }
                {
                    this.props.videoView && this.props.pageInfoData.video && this.props.pageInfoData.video.type == 3 ?
                        <Head>
                            <script src="//imasdk.googleapis.com/js/sdkloader/ima3.js"></script>
                            <script src="//cdn.iframe.ly/embed.js" async></script>
                        </Head>
                        : null
                }
            
                {
                    this.props.artistView && this.props.pageInfoData.photos && this.props.pageInfoData.photos.results.length > 0 ?
                        <Head>
                            <link href={`${CDN_URL_FOR_STATIC_RESOURCES}/static/css/magnific-popup.css`} rel="stylesheet" />
                            <script src={`${CDN_URL_FOR_STATIC_RESOURCES}/static/scripts/jQuery-1.9.1.js`}></script>
                            <script src={`${CDN_URL_FOR_STATIC_RESOURCES}/static/scripts/jquery.magnific-popup.js`}></script>
                        </Head>
                        : null
                }
                
                {
                    this.props.pageInfoData.appSettings['advertisement_type'] == 2 ? 
                    <Head>
                        <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
                    </Head>
                    : null
                }
                
                {
                    videoURL != "" ?
                    <Head>
                        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: 
                            `{
                                "@context": "http://schema.org",
                                "@type": "VideoObject",
                                "name": "${this.props.pageInfoData.video.title}",
                                "description": "${this.props.pageInfoData.video.title}",
                                "thumbnailUrl":"${(!isURL ? imageSuffix : "") + generalInfo.image}",
                                "uploadDate": "${this.props.pageInfoData.video.creation_date}",
                                "duration": "${videoDuration}",
                                "contentUrl": "${videoURL}"
                            }`
                        }  }>
                            
                        </script>
                    </Head>
                : null
                }
                
                {
                    isIE ? 
                    <UnsupportedBrowser {...this.props} />
                    : null
                }
                {
                     this.props.embedVideo ?
                        this.props.children
                     : null
                }
                {
                    !this.props.maintenance && !isIE && !this.props.pageInfoData.maintanance && !this.props.embedVideo ?
                        <React.Fragment>
                            <Header {...this.props} layout={this.state.width > 992 ? "" : "mobile"} layoutWidth={this.state.width} />
                            {
                                this.props.pageInfoData.appSettings['below_header'] ? 
                                    <AdsIndex className="header_advertisement" paddingTop="90px" ads={this.props.pageInfoData.appSettings['below_header']} />
                                : null
                            }
                        </React.Fragment>
                        : null
                }
                
                {
                    !isIE && !this.props.embedVideo ? 
                    !this.props.liveStreaming ? 
                        <WithErrorHandler {...this.props}>
                            <div className={`main-content${fixedMenu}${this.props.pageInfoData.loggedInUserDetails ? " user-logged-in"+fixedHeader : fixedHeader}${this.state.width > 992 ? "" :" mobile-layout-cnt"}${this.props.pageInfoData.slideshow ? " slideshow-enable" : ""}`}>
                                {
                                    this.state.width > 992 ? 
                                    <React.Fragment>
                                        <div className="sidemenu-overlay" onClick={this.closeMenu}></div>
                                        <SideFixedMenu {...this.props} />
                                    </React.Fragment>
                                : null
                                }
                                <div className={`content-wrap${this.props.menuOpen && !this.props.hideSmallMenu && this.state.width > 992 ? " ml100" : this.props.menuOpen && this.props.hideSmallMenu && this.state.width > 992 ? " ml0" : ""}${this.state.width > 992 ? "" :" mobile-layout"}`}>
                                    {this.props.children}         
                                </div>
                            </div>       
                        </WithErrorHandler>
                        : 
                        <WithErrorHandler {...this.props}>
                            <div className={`ls_contentWrap${this.state.width > 992 ? "" :" mobile-layout-cnt"}`}>
                                <div className="ls_mainContent">
                                    {this.props.children}
                                </div>
                            </div>
                        </WithErrorHandler>
                : null
                }
                {
                    !this.props.maintenance && !this.props.embedVideo && !isIE && !this.props.pageInfoData.maintanance && !this.props.liveStreaming ?
                        <React.Fragment>
                            {
                                this.props.pageInfoData.appSettings['above_footer'] ? 
                                    <AdsIndex className="footer_advertisement" paddingTop="20px" ads={this.props.pageInfoData.appSettings['above_footer']} />
                                : null
                            }
                            <Footer {...this.props} layout={this.state.width > 992 ? "" : "mobile"}  />
                            <Gdpr {...this.props} layout={this.state.width > 992 ? "" : "mobile"}  />
                        </React.Fragment>
                        : null
                }
            </React.Fragment>
        )
    }
}


const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData,
        menuOpen:state.search.menuOpen
    };
};

const mapDispatchToProps = dispatch => {
    return {
        setPageInfoData: (data) => dispatch(actions.setPageInfoData(data)),
        setMenuOpen: (status) => dispatch(actions.setMenuOpen(status)),
        updatePlayerData: (relatedVideos, playlistVideos, currentVideo, deleteMessage, deleteTitle) => dispatch(actions.updatePlayerData(relatedVideos, playlistVideos, currentVideo, deleteMessage, deleteTitle)),
        updateAudioData: (audios, song_id) => dispatch(actions.updateAudioData(audios,song_id))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Layout);

