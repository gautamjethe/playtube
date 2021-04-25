import React from "react"

import Form from "../Form/Post"
import Translate from "../../components/Translate/Index";

class AddPost extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            channel_id:props.channel_id
        }
    }
    
    render(){
        return (
            <div className="popup_wrapper_cnt">
                <div className="popup_cnt">
                    <div className="comments">
                        <div className="VideoDetails-commentWrap">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{this.props.editItem ? Translate(this.props,"Edit Post") : Translate(this.props,"Create Post")}</h2>
                                <a onClick={this.props.closePOst}  className="_close"><i></i></a>
                            </div>
                            <Form {...this.props} closePOst={this.props.closePOst} channel_id={this.props.channel_id} imageSuffix={this.props.pageInfoData["imageSuffix"]} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}


  
export default AddPost