import React, { Component } from "react"
import { connect } from 'react-redux';
import Translate from "../../../components/Translate/Index";
import swal from 'sweetalert'
import * as actions from '../../../store/actions/general';
import axios from "../../../axios-orders"
import AddVideo from "./AddVideo"

class Videos extends Component {
    constructor(props) {
        super(props)
        this.state = {
            videos:props.videos,
            movie:props.movie ? props.movie : {},
            seasons:props.seasons ? props.seasons : [],
            editItem:props.editItem ? props.editItem : null
        }
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else {
            return {
                videos:nextProps.videos ? nextProps.videos : [],       
                movie:nextProps.movie ? nextProps.movie : {},
                seasons:nextProps.seasons ? nextProps.seasons : [],
                editItem:nextProps.editItem ? nextProps.editItem : null  
            }
        }
    }
    updateValues = (values) => {
        //update the values
        this.updateSteps({key:"videos",value:values})
    }
    closeVideo = () => {
        this.setState({addVideo:false})
    }
    editVideo = () => {

    }
    deleteVideo = () => {
        
    }
    addVideo = () => {
        this.setState({addVideo:true})
    }
    render(){
        let addVideo = null

        if(this.state.addVideo){
            addVideo = (
                <div className="popup_wrapper_cnt">
                    <div className="popup_cnt">
                        <div className="comments">
                            <div className="VideoDetails-commentWrap">
                                <div className="popup_wrapper_cnt_header">
                                    <h2>{Translate(this.props,"Create Video")}</h2>
                                    <a onClick={this.closeVideo}  className="_close"><i></i></a>
                                </div>
                                <AddVideo {...this.props} closeVideoCreate={this.closeVideo} editItem={this.state.editVideoItem} movie={this.state.movie} seasons={this.state.seasons} />
                            </div>
                        </div>
                    </div>
                </div>
            )
        }


        return (
            <React.Fragment>
                {
                    addVideo
                }
                <div className="movie_videos">
                    <div className="container">
                        <div className="row"> 
                            <div className="col-md-12">        
                                <button className="add_videos" onClick={this.addVideo.bind(this)}>
                                    {
                                        this.props.t("Add Video")
                                    }
                                </button>     
                                {
                                    this.state.videos.length > 0 ? 
                                        <div className="table-responsive">
                                            <table className="table custTble1">
                                                <thead>
                                                    <tr>
                                                        <th scope="col">{this.props.t("Name")}</th>
                                                        <th scope="col">{this.props.t("Type")}</th>
                                                        <th scope="col">{this.props.t("Category")}</th>
                                                        <th scope="col">{this.props.t("Plays")}</th>
                                                        <th scope="col">{this.props.t("Season")}</th>
                                                        <th scope="col">{this.props.t("Episode")}</th>
                                                        <th scope="col">{this.props.t("Options")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.videos.map((video,index) => {
                                                            return (
                                                                <tr key={video.video_id}>
                                                                    <td>
                                                                            {countries.title}
                                                                    </td>
                                                                    <td>
                                                                            {countries.category_title}
                                                                    </td>
                                                                    <td>
                                                                            {countries.plays}
                                                                    </td>
                                                                    <td>
                                                                            {countries.season_id}
                                                                    </td>
                                                                    <td>{countries.episode_id}</td>
                                                                    <td>
                                                                        <div className="actionBtn">
                                                                            <a className="text-success" href="#" title={Translate(this.props, "Edit")} onClick={this.editVideo.bind(this, video.video_id)}><span className="material-icons">edit</span></a> 
                                                                            <a className="text-danger" href="#" title={Translate(this.props, "Delete")} onClick={this.deleteVideo.bind(this, video.video_id)}><span className="material-icons">delete</span></a>                                                                                           
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                : null
                                }
                            </div>
                        </div>
                    </div>
                </div>
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
        openToast: (message, typeMessage) => dispatch(actions.openToast(message, typeMessage))
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Videos);