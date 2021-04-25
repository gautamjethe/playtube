import React from "react"
import { connect } from 'react-redux';
import playlist from '../../store/actions/general';

import Form from "../Form/Playlist"
import Translate from "../../components/Translate/Index";

class Playlist extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            video_id:this.props.playlistVideoId
        }
        this.close = this.close.bind(this)
    }
    close(){
        this.props.openPlaylist(false)
    }
    render(){
        if(this.state.video_id == 0){
            return null
        }
        return (
            <div className="popup_wrapper_cnt">
                <div className="popup_cnt">
                    <div className="comments">
                        <div className="VideoDetails-commentWrap">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{Translate(this.props,"Create Playlist")}</h2>
                                <a onClick={this.close}  className="_close"><i></i></a>
                            </div>
                            <Form {...this.props} video_id={this.props.playlistVideoId} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        playlistClicked: state.playlist.playlistClicked,
        playlistVideoId: state.playlist.video_id,
    };  
  };
  const mapDispatchToProps = dispatch => {
    return {        
        openPlaylist: (open) => dispatch( playlist.openPlaylist(open,0) ),
    };
  };
export default connect( mapStateToProps, mapDispatchToProps )( Playlist );