import React, { Component } from 'react';
import { connect } from 'react-redux';

import Links from "./Links"

import config from "../../config"
import action from '../../store/actions/general'

class Index extends Component {
  constructor(props){
      super(props)
      this.state = {
          ...props.shareData
      }
      this.closeEditPopup = this.closeEditPopup.bind(this)
  }
 
  closeEditPopup(){
    this.props.openSharePopup(false,{})
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
    const emailTitle = title
    const emailBody = "Email Body"
    return (
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
                            <Links tags={this.state.tags}  countItems="all" url={shareUrl} title={title} media={media} emailTitle={emailTitle} emailBody={emailBody} />
                        </div>
                    </div>
                </div>
            </div>
        );
  }
}

const mapDispatchToProps = dispatch => {
    return {
        openSharePopup: (status,data) => dispatch(action.openSharePopup(status,data)),
    };
};



export default connect(null, mapDispatchToProps)(Index)