import React, { Component } from "react"
import { connect } from "react-redux"
if(typeof window != "undefined"){
    require("jquery-ui/ui/widgets/draggable");
}
  
import Like from "../Like/Index"
import Favourite from "../Favourite/Index"
import Dislike from "../Dislike/Index"
import Subscribe from "../User/Follow"
import ShortNumber from "short-number"
import SocialShare from "../SocialShare/Index"
import LoadMore from "../LoadMore/Index"
import axios from "../../axios-orders"

import Translate from "../../components/Translate/Index"
import general from '../../store/actions/general';
import Link from "../../components/Link/index"
import  Router  from "next/router"
import AdsIndex from "../Ads/Index"
import imageCompression from 'browser-image-compression';
import swal from 'sweetalert'
class Cover extends Component {
    constructor(props) {
        super(props)
        this.state = {
            item: props.member,
            type: props.type,
            loadingCover: false,
            loadingImage: false,
            reposition:false,
            repositionDisplay:"none",
            showReposition:false,
            processing:false,
            percentCompleted:0
        }
    }
    openReport = (e) => {
        e.preventDefault()
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            this.props.openReport(true, this.state.item.username, 'users')
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if(nextProps.member.showCoverReposition){
            return {item: nextProps.member, reposition:true ,loadingCover:false ,loadingImage:false ,processing:false, percentCompleted:0 }
        }else if (nextProps.member != prevState.item) {
          return { item: nextProps.member ,loadingCover:false ,loadingImage:false ,processing:false, percentCompleted:0 }
        }else{
            return {loadingCover:false,loadingImage:false }
        }
    }
    componentDidUpdate(prevProps){
        if(this.props.member.showCoverReposition && this.props.member.showCoverReposition != prevProps.member.showCoverReposition){
            if(typeof $ != "undefined"){
                console.log("inside repositin")
                $('.coverphotoUsercnt img').draggable({disabled:false});
                $(".cover-image").css("height","auto");
            }
        }
    }


    uploadCover = async (picture) => {
        
        var value = picture.target.value;
        var ext = value.substring(value.lastIndexOf('.') + 1).toLowerCase();
        if (picture.target.files && picture.target.files[0] && (ext === "png" || ext === "jpeg" || ext === "jpg" || ext === 'PNG' || ext === 'JPEG' || ext === 'JPG' || ext === 'gif' || ext === 'GIF')) {

        } else {
            return false
        }
        const imageFile = picture.target.files[0];

        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        }
        let compressedFile = picture.target.files[0];
        if(ext != 'gif' && ext != 'GIF'){
            try {
            compressedFile = await imageCompression(imageFile, options);
            } catch (error) {
            
            }
        }
        //this.setState({localUpdate:true,loadingCover:true})
        let formData = new FormData();
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
                this.setState({localUpdate:true,percentCompleted:percentCompleted,processing:percentCompleted == 100 ? true : false})
            }
        };
        formData.append('user_id', this.state.item.user_id)
        formData.append('image', compressedFile,value)
        let url = `/members/upload-cover`;
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    swal("Error", Translate(this.props, response.data.error[0].message), "error");
                    this.setState({localUpdate:true,percentCompleted:0,processing:false})
                }else{
                    //this.setState({localUpdate:true,percentCompleted:0,processing:true})
                }
            }).catch(err => {
                this.setState({localUpdate:true, loadingCover: false,percentCompleted:0,processing:false })
            });
    }
    uploadImage = async (picture) =>  {
        var value = picture.target.value;
        var ext = value.substring(value.lastIndexOf('.') + 1).toLowerCase();
        if (picture.target.files && picture.target.files[0] && (ext === "png" || ext === "jpeg" || ext === "jpg" || ext === 'PNG' || ext === 'JPEG' || ext === 'JPG' || ext === 'gif' || ext === 'GIF')) {

        } else {
            return false
        }

        const imageFile = picture.target.files[0];

        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 500,
          useWebWorker: true
        }
        let compressedFile = picture.target.files[0];
        if(ext != 'gif' && ext != 'GIF'){
            try {
            compressedFile = await imageCompression(imageFile, options);
            } catch (error) {
            
            }
        }

        let formData = new FormData();
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
                this.setState({localUpdate:true,percentCompleted:percentCompleted,processing:percentCompleted == 100 ? true : false})
            }
        };
        // this.setState({localUpdate:true,loadingImage:true})
        let url = ""
        formData.append('user_id', this.state.item.user_id)
        formData.append('image', compressedFile,value)
        url = `/members/upload-image`;
        axios.post(url, formData, config)
            .then(response => {
                //this.setState({localUpdate:true,percentCompleted:0,processing:true})
            }).catch(err => {
                this.setState({localUpdate:true, loadingCover: false,percentCompleted:0 })
            });
    }
    deleteUser = (e) => {

        let username = ""
        let usernameData= ""
        if(this.props.pageInfoData.loggedInUserDetails && this.state.item.user_id != this.props.pageInfoData.loggedInUserDetails.user_id){
            username = "&user="+this.state.item.username
            usernameData = "?user="+this.state.item.username
        }

        Router.push(
            `/dashboard?type=delete`+username,
            `/dashboard/delete`+usernameData,
        )
        
    }
    componentDidMount(){
        if(window.innerWidth > 800){
            this.setState({localUpdate:true,repositionDisplay:"block",reposition:this.state.reposition})
        }else{
            this.setState({localUpdate:true,reposition:false})
        }
        let _this = this
        window.addEventListener('resize', this.updateDimensions);
        $('.coverphotoUsercnt img').draggable({
            disabled:this.state.reposition,
            scroll: false,
            axis: "y",
            cursor: "-webkit-grab",
            drag: function (event, ui) {
               let y1 = $('.header-info-wrap').height();
               let y2 = $('.coverphotoUsercnt').find('img').height();
                if (ui.position.top >= 0) {
                    ui.position.top = 0;
                }else
                    if (ui.position.top <= (y1-y2)) {
                        ui.position.top = y1-y2;
                    }
                },
                stop: function(event, ui) {
                    _this.setState({localUpdate:true,position:ui.position.top})
                }
            });
            
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }
    updateDimensions = () => {
        if(window.innerWidth > 800){
            this.setState({localUpdate:true,repositionDisplay:"block"})
        }else{
            this.setState({localUpdate:true,repositionDisplay:"none"})
        }
    };
    repositionCover = (e) => {
        e.preventDefault()
        this.setState({localUpdate:true,reposition:true},() => {
            $('.coverphotoUsercnt img').draggable({disabled:false});
            $(".cover-image").css("height","auto")
        })
    }
    repositionCancel = (e) => {
        e.preventDefault()
        $(".cover-image").css("top","")
        $(".cover-image").css("height","100%")
        this.setState({localUpdate:true,reposition:false,processing:false})
        $('.coverphotoUsercnt img').draggable({disabled:true});
    }
    repositionSave = (e) => {
        e.preventDefault()
        $('.coverphotoUsercnt img').draggable({disabled:true});
        $(".cover-image").css("top","")
        $(".cover-image").css("height","100%")
        let formData = new FormData();
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
                this.setState({localUpdate:true,percentCompleted:percentCompleted,processing:percentCompleted == 100 ? true : false})
            }
        };
        this.setState({localUpdate:true,reposition:false,showReposition:true})
        let url = ""
        formData.append("screenWidth",$(".coverphotoUser").width())
        formData.append('user_id', this.state.item.user_id)
        formData.append('position', this.state.position)
        url = `/members/reposition-cover`;
        axios.post(url, formData, config)
            .then(response => {
                //this.setState({localUpdate:true,processing:true})
            }).catch(err => {
                this.setState({localUpdate:true, loadingCover: false,processing:false })
            });
    }
    render() {
        
        let coverImage = this.state.item.cover
        let mainPhoto = this.state.item.avtar        
        if(!this.state.reposition && this.state.item.cover_crop){
            let image = this.state.item.cover_crop
            const splitVal = image.split('/')
            if (splitVal[0] == "http:" || splitVal[0] == "https:") {
            } else {
                coverImage = this.props.pageInfoData.imageSuffix + image
            }
        }
        if (coverImage) {
            const splitVal = coverImage.split('/')
            if (splitVal[0] == "http:" || splitVal[0] == "https:") {
            } else {
                coverImage = this.props.pageInfoData.imageSuffix + coverImage
            }
        }
        if (mainPhoto) { 
            const splitVal = mainPhoto.split('/')
            if (splitVal[0] == "http:" || splitVal[0] == "https:") {
            } else {
                mainPhoto = this.props.pageInfoData.imageSuffix + mainPhoto
            }
        } 

        const coverref = React.createRef();
        const imageref = React.createRef();
        return (
            <React.Fragment>
                <div className="header-info-wrap container">
                    <div className="coverphotoUser coverphotoUsercnt">
                        <img className="cover-image" src={coverImage} />
                        {
                            this.state.loadingCover ?
                                <div className="cover-loading"><LoadMore loading={true} /></div>
                                : null
                        }
                        {  
                            this.state.item.canEdit && this.state.item.canUploadCover == 1 ?
                                <React.Fragment>
                                    {/* <div className="box-overlay"></div> */}
                                    {
                                        !this.state.reposition ? 
                                        <React.Fragment>
                                            <div className="editCoverImg">
                                                <a className="link" href={void(0)} title={Translate(this.props, "Edit cover photo")} onClick={e => {
                                                    e.stopPropagation();
                                                    coverref.current.click();
                                                }}>
                                                    <span className="material-icons">camera_alt</span>
                                                    <input className="fileNone" accept="image/*" onChange={this.uploadCover.bind()} ref={coverref} type="file" />
                                                </a>
                                            </div>
                                            {
                                                this.state.repositionDisplay == "block" && this.state.item.usercover ? 
                                            <div className="editCoverImg resizeCoverImg">
                                                <a href="#" title={Translate(this.props, "Reposition cover photo")} onClick={this.repositionCover}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21,15H23V17H21V15M21,11H23V13H21V11M23,19H21V21C22,21 23,20 23,19M13,3H15V5H13V3M21,7H23V9H21V7M21,3V5H23C23,4 22,3 21,3M1,7H3V9H1V7M17,3H19V5H17V3M17,19H19V21H17V19M3,3C2,3 1,4 1,5H3V3M9,3H11V5H9V3M5,3H7V5H5V3M1,11V19A2,2 0 0,0 3,21H15V11H1M3,19L5.5,15.79L7.29,17.94L9.79,14.72L13,19H3Z"></path></svg>
                                                </a>
                                            </div>
                                            : null
                                            }
                                            {
                                                this.state.percentCompleted > 0 || this.state.processing ? 
                                                    <div className="upload-progressbar">
                                                        {
                                                            this.state.percentCompleted < 100 && !this.state.processing ? 
                                                            <React.Fragment>
                                                                <div className="percentage-100">
                                                                    {this.state.percentCompleted}%
                                                                </div>
                                                                <div className="progressbar-cnt">
                                                                    <div className="progressbar" style={{width:this.state.percentCompleted+"%"}}></div>
                                                                </div>
                                                            </React.Fragment>
                                                        
                                                        : null
                                                        }
                                                        {
                                                            this.state.processing ? 
                                                        <div className="imageprocess">
                                                            <svg width="60px" viewBox="0 0 100 100" height="60px" dangerouslySetInnerHTML={{__html:'<circle cx="84" cy="50" r="2.56936" fill="#e91d2a"><animate attributeName="r" repeatCount="indefinite" dur="0.5434782608695652s" calcMode="spline" keyTimes="0;1" values="8;0" keySplines="0 0.5 0.5 1" begin="0s"></animate><animate attributeName="fill" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="discrete" keyTimes="0;0.25;0.5;0.75;1" values="#e91d2a;#e91d2a;#e91d2a;#e91d2a;#e91d2a" begin="0s"></animate></circle><circle cx="73.0786" cy="50" r="8" fill="#e91d2a"><animate attributeName="r" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;8;8;8" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="0s"></animate><animate attributeName="cx" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="0s"></animate></circle><circle cx="16" cy="50" r="0" fill="#e91d2a"><animate attributeName="r" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;8;8;8" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-0.5434782608695652s"></animate><animate attributeName="cx" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-0.5434782608695652s"></animate></circle><circle cx="16" cy="50" r="5.43026" fill="#e91d2a"><animate attributeName="r" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;8;8;8" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-1.0869565217391304s"></animate><animate attributeName="cx" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-1.0869565217391304s"></animate></circle><circle cx="39.0786" cy="50" r="8" fill="#e91d2a"><animate attributeName="r" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;8;8;8" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-1.6304347826086956s"></animate><animate attributeName="cx" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-1.6304347826086956s"></animate></circle>'}}></svg>
                                                            {
                                                                this.props.t("Image is processing, this may take few minutes.")
                                                            }
                                                        </div>
                                                        : null
                                                        }
                                                    </div>
                                            : null
                                            }
                                        </React.Fragment>
                                    : 
                                    <React.Fragment>
                                        <div className="cover-reposition-cnt" align="center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21,15H23V17H21V15M21,11H23V13H21V11M23,19H21V21C22,21 23,20 23,19M13,3H15V5H13V3M21,7H23V9H21V7M21,3V5H23C23,4 22,3 21,3M1,7H3V9H1V7M17,3H19V5H17V3M17,19H19V21H17V19M3,3C2,3 1,4 1,5H3V3M9,3H11V5H9V3M5,3H7V5H5V3M1,11V19A2,2 0 0,0 3,21H15V11H1M3,19L5.5,15.79L7.29,17.94L9.79,14.72L13,19H3Z"></path></svg>
                                            {Translate(this.props,'Drag to reposition cover')}
                                        </div>
                                        <div className="editCoverImg">
                                            <a href="#" title={Translate(this.props, "Cancel reposition")} onClick={this.repositionCancel}>
                                            <span className="material-icons">clear</span>
                                            </a>
                                        </div>
                                        <div className="editCoverImg resizeCoverImg">
                                            <a href="#" title={Translate(this.props, "Save reposition")} onClick={this.repositionSave}>
                                            <span className="material-icons">check</span>
                                            </a>
                                        </div>
                                    </React.Fragment>
                                }
                                </React.Fragment>
                                : null
                        }
                    </div>
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="userInfo-block-wrap">
                                <div className="userInfo-block-content">
                                    <div className="userinfoLeft">
                                        <div className="userphoto-profile-img">
                                            <img src={mainPhoto} alt={this.state.item.title} />
                                            {
                                                this.state.loadingImage ?
                                                <div className="cover-loading"><LoadMore className="main-photo" loading={true} /></div>
                                                    : null
                                            }
                                            {
                                                this.state.item.canEdit ?
                                                    <a className="editProfImg link" href={void(0)} title={Translate(this.props, "Edit profile photo")} onClick={e => {
                                                        imageref.current.click();
                                                    }}>
                                                        <span className="material-icons">edit</span>
                                                        <input className="fileNone" accept="image/*" onChange={this.uploadImage.bind()} ref={imageref} type="file" />
                                                    </a>
                                                    : null
                                            }

                                        </div>
                                        <div className="user-profile-title">
                                            <h4>{this.state.item.displayname + " "}
                                                {
                                                    this.props.pageInfoData.appSettings['member_verification'] == 1 && this.state.item.verified ?
                                                        <span className="verifiedUser" title={Translate(this.props, "verified")}><span className="material-icons">check</span>
                                                        </span>
                                                        : null
                                                }
                                                {
                                                    this.props.pageInfoData.appSettings['member_featured'] == 1 && this.state.item.is_featured == 1 ?
                                                        <span className="lbl-Featured" title={Translate(this.props, "Featured Member")}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                                        </span>
                                                        : null
                                                }
                                                {
                                                    this.props.pageInfoData.appSettings['member_sponsored'] == 1 && this.state.item.is_sponsored == 1 ?
                                                        <span className="lbl-Sponsored" title={Translate(this.props, "Sponsored Member")}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                                        </span>
                                                        : null
                                                }
                                                {
                                                    this.props.pageInfoData.appSettings['member_hot'] == 1 && this.state.item.is_hot == 1 ?
                                                        <span className="lbl-Hot" title={Translate(this.props, "Hot Member")}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                                        </span>
                                                        : null
                                                }
                                            </h4>
                                            <div className="actionbtn">
                                                {`${ShortNumber(this.state.item.view_count ? this.state.item.view_count : 0)}`}{" "}{this.props.t("view_count", { count: this.state.item.view_count ? this.state.item.view_count : 0 })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="user_followed">
                                        <Subscribe button={true} fromView={true} {...this.props} follow_count={this.state.item.follow_count} user={this.state.item} type={"members"} id={this.props.id} />
                                        {`${ShortNumber(this.props.follow_count ? this.props.follow_count : 0)}`}{" "}{this.props.t("follow_count", { count: this.state.item.follow_count })}
                                    </div>
                                            
                                    <div className="LikeDislikeWrap">
                                        <ul className="LikeDislikeList">
                                            {
                                                this.props.pageInfoData.appSettings[`${"member_like"}`] == 1 ?
                                                    <li>
                                                        <Like {...this.props} icon={true} like_count={this.state.item.like_count} item={this.state.item} type={this.state.type} id={this.props.id} />
                                                    </li>
                                                    : null
                                            }
                                            {
                                                this.props.pageInfoData.appSettings[`${"member_dislike"}`] == 1 ?
                                                    <li>
                                                        <Dislike {...this.props} icon={true} dislike_count={this.state.item.dislike_count} item={this.state.item} type={this.state.type} id={this.props.id} />
                                                    </li>
                                                    : null
                                            }
                                            
                                            {
                                                this.props.pageInfoData.appSettings[`${"member_favourite"}`] == 1 ?
                                                    <li>
                                                        <Favourite {...this.props} icon={true} favourite_count={this.state.item.favourite_count} item={this.state.item} type={this.state.type} id={this.props.id} />
                                                    </li>
                                                    : null
                                            }
                                            <SocialShare {...this.props} hideTitle={true} url={`/${this.state.item.username}`} title={this.state.item.displayname} imageSuffix={this.props.pageInfoData.imageSuffix} media={this.state.item.avtar} />                                            
                                            {
                                        !this.props.profile ?
                                            <li>
                                                <div className="dropdown TitleRightDropdown">
                                                    <a href="#" data-toggle="dropdown"><span className="material-icons">more_horiz</span></a>
                                                    <ul className="dropdown-menu dropdown-menu-right edit-options">
                                                        
                                                        {
                                                            this.state.item.canEdit ?
                                                            <li>
                                                            <Link href="/dashboard" customParam={`user=${this.state.item.username}`} as={`/dashboard?user=${this.state.item.username}`}>
                                                                    <a href={`/dashboard?user=${this.state.item.username}`}><span className="material-icons">edit</span>{Translate(this.props, "Edit")}</a>
                                                                </Link>
                                                                </li>
                                                                : null
                                                        }
                                                        
                                                        
                                                        {
                                                            this.state.item.canDelete ?
                                                            <li>
                                                                <a onClick={this.deleteUser} href="#"><span className="material-icons">delete</span>{Translate(this.props, "Delete")}</a>
                                                                </li>
                                                                : null
                                                        }
                                                        
                                                        <li>
                                                            <a href="#" onClick={this.openReport.bind(this)}>
                                                            <span className="material-icons">flag</span>
                                                                {Translate(this.props, "Report")}
                                                            </a>
                                                        </li>
                                                    
                                                    </ul>
                                                </div>
                                            </li>
                                             : null
                                            }
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {
                        this.props.pageInfoData.appSettings['below_cover'] ? 
                            <AdsIndex paddingTop="20px" className="below_cover" ads={this.props.pageInfoData.appSettings['below_cover']} />
                        : null
                    }
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
        openReport: (status, contentId, contentType) => dispatch(general.openReport(status, contentId, contentType))
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Cover);