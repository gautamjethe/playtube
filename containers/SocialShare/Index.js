import React, { Component } from 'react';
import { connect } from 'react-redux';

import Links from "./Links"

import config from "../../config"
import action from '../../store/actions/general'
import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'
class Index extends Component {
  constructor(props){
      super(props)
      this.state = {
          countItems: props.countItems ? props.countItems : 3,
          media:props.media,
          title:props.title,
          url:props.url,
          imageSuffix:props.imageSuffix,
          buttonHeightWidth:props.buttonHeightWidth,
          tags:props.tags,
          round:props.round

      }
      this.openPopup = this.openPopup.bind(this)
      this.closeEditPopup = this.closeEditPopup.bind(this)
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
        return null;
    }
    if(prevState.localUpdate){
        return {...prevState,localUpdate:false}
    }else if(nextProps.countItems != prevState.countItems || nextProps.media != prevState.media || nextProps.title != prevState.title){
        return {
            countItems: nextProps.countItems ? nextProps.countItems : 3,
            media:nextProps.media,
            title:nextProps.title,
            url:nextProps.url,
            imageSuffix:nextProps.imageSuffix,
            buttonHeightWidth:nextProps.buttonHeightWidth,
            tags:nextProps.tags,
            round:nextProps.round
        }
    }
}
  componentDidUpdate(prevProps){
    if(prevProps.countItems != this.props.countItems || prevProps.media != this.props.media || prevProps.title != this.props.title){
        return true
    }else{
        return false
    }
  }
  closeEditPopup(){
    this.props.openSharePopup(false,{})
  }
  openPopup(e){
      e.preventDefault()
      this.props.openSharePopup(true,{countItems:"all",imageSuffix:this.state.imageSuffix,title:this.state.title,tags:this.state.tags,media:this.state.media,url:this.state.url,buttonHeightWidth:this.state.buttonHeightWidth})
  }
  render() {
    let isS3 = true
    
    const shareUrl = config.app_server+this.state.url;
    const title = this.state.title;
    
    let media = this.state.media
    if(this.props.pageInfoData.livestreamingtype == 0  &&  this.state.media && this.state.media.indexOf('LiveApp/previews') > 0){
        media = this.props.pageInfoData.liveStreamingServerURL+":5443"+this.state.media
    }
    if (this.state.media) {
        const splitVal = media.split('/')
         if (splitVal[0] == "http:" || splitVal[0] == "https:") {
            isS3 = false
        }
    } 
    media = (isS3 ? this.state.imageSuffix : "")+media
    const emailTitle = renderToString(<CensorWord {...this.props} text={title} />)
    const emailBody = renderToString(<CensorWord {...this.props} text={""} />)
    const buttonHeightWidth = this.state.buttonHeightWidth
    return (
        this.state.countItems == "all" ? 
            <div className="popup_wrapper_cnt">
                <div className="popup_cnt">
                    <div className="comments">
                        <div className="VideoDetails-commentWrap">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{this.props.t("Share")}</h2>
                                <a onClick={this.closeEditPopup}  className="_close"><i></i></a>
                            </div>
                            <div className="shareVdoInfo">
                                <div className="thumb">
                                    <img alt={this.state.title} className="" src={media} />
                                </div>
                                <div className="name">
                                    <h3>{this.state.title}</h3>
                                </div>
                            </div>
                            <Links {...this.props} tags={this.state.tags}  countItems="all" url={shareUrl} title={title} media={media} emailTitle={emailTitle} emailBody={emailBody} />
                        </div>
                    </div>
                </div>
            </div>
        :
            <Links {...this.props} buttonHeightWidth={buttonHeightWidth} round={this.state.round} openPopup={this.openPopup} countItems={this.state.countItems} url={shareUrl} title={title} media={media} emailTitle={emailTitle} emailBody={emailBody} />
    );
  }
}

const mapDispatchToProps = dispatch => {
    return {
        openSharePopup: (status,data) => dispatch(action.openSharePopup(status,data)),
    };
};



export default connect(null, mapDispatchToProps)(Index)