import React from "react"
import { connect } from "react-redux"
import playlist from '../../store/actions/general';
import Link from "../../components/Link/index";
import Image from "../Image/Index"
import UserTitle from "../User/Title"
import axios from "../../axios-orders"

class Player extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            audios:props.audios,
            width:props.isMobile ? props.isMobile : 993,
            song_id:props.song_id,
            minimizePlayer:false,
            pausesong_id:props.pausesong_id,
            currentTime: null,
            playCount:[],
            passwords:props.pageInfoData &&  props.pageInfoData.audioPassword ? props.pageInfoData.audioPassword : []
        }
        this.audioChange = this.audioChange.bind(this)
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
        this.audioTag = new React.createRef()
        this.toggleLoop = this.toggleLoop.bind(this);
    }
    updateWindowDimensions() {
        this.setState({localUpdate:true, width: window.innerWidth });
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
    }
    componentDidMount(){
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
        
    }
    
    closePlayer = (e) => {
        e.preventDefault()
        this.props.updateAudioData([],0,0,"","")
        return
        swal({
            title: this.state.title,
            text: this.state.message,
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
        .then((willDelete) => {
            if (willDelete) {
                this.props.updateAudioData([],0,0,"","")
            } else {

            }
        });
    }
    getItemIndex(item_id) {
        const audios = [...this.props.audios];
        const itemIndex = audios.findIndex(p => p["audio_id"] == item_id);
        return itemIndex;
    }
    
    ended = () => {
        let song_id = this.props.song_id
        let itemIndex = 0
        itemIndex = this.getItemIndex(song_id)
        if (itemIndex > -1) {
            const items = [...this.props.audios]
            if(itemIndex+2 <= this.props.audios.length){
                itemIndex = itemIndex + 1
            }else{
                itemIndex = 0
            }
            this.props.updateAudioData(this.props.audios,items[itemIndex].audio_id,0,this.props.submitText,this.props.passwordText)
        }
    }
    audioChange = (song_id,e) => {
        e.preventDefault();
        if(song_id != this.state.song_id){
            let itemIndex = this.getItemIndex(song_id)
            if (itemIndex > -1) {
                const items = [...this.state.audios]            
                this.setState({localUpdate:true, song_id: items[itemIndex].audio_id,current_time:0 })
            }
        }
    }
    previous = () => {
        let song_id = this.props.song_id
        let itemIndex = 0
        itemIndex = this.getItemIndex(song_id)
        if (itemIndex > -1) {
            const items = [...this.props.audios]
            if(itemIndex == 0){
                itemIndex = this.props.audios.length - 1
            }else{
                itemIndex = itemIndex - 1
            }
            this.props.updateAudioData(this.props.audios,items[itemIndex].audio_id,0,this.props.submitText,this.props.passwordText)
        }
    }
    updateProgress () {
        this.setState({ currentTime: this.audioTag.currentTime })
    }
    formatDuration(duration){
        if(isNaN(duration)){
            return "00:00"
        }
        duration = Math.floor(duration)
        let d = Number(duration);
        var h = Math.floor(d / 3600).toString();
        var m = Math.floor(d % 3600 / 60).toString();
        var s = Math.floor(d % 3600 % 60).toString();

        var hDisplay = h.length > 0 ? (h.length < 2 ? "0" + h : h) : "00"
        var mDisplay = m.length > 0 ? ":" + (m.length < 2 ? "0" + m : m) : ":00"
        var sDisplay = s.length > 0 ? ":" + (s.length < 2 ? "0" + s : s) : ":00"
        return (hDisplay != "00" ? hDisplay+mDisplay : mDisplay.replace(":",'')) + sDisplay
    }
    playSong = () => {
        this.props.updateAudioData(this.props.audios, this.props.song_id,0,this.props.submitText,this.props.passwordText)
        this.audioTag.play();
    }
    pauseSong = () => {
        this.props.updateAudioData(this.props.audios,this.props.song_id, this.props.song_id,this.props.submitText,this.props.passwordText)
        this.audioTag.pause();
    }
    toggleLoop () {
        this.audioTag.loop = !this.audioTag.loop;
    }

    playStart = () => {
        let currentPlayingSong = this.getItemIndex(this.props.song_id)
        let audio = this.props.audios[currentPlayingSong];
        let sessionPassword = this.props.pageInfoData && this.props.pageInfoData.audioPassword ? this.props.pageInfoData.audioPassword : []
        if(audio.view_privacy == "password" && sessionPassword.indexOf(this.props.song_id) == -1 && !audio.passwords && ( !this.props.pageInfoData.levelPermissions || this.props.pageInfoData.levelPermissions["audio.view"] != 2 ) 
            && (!this.props.pageInfoData.loggedInUserDetails || this.props.pageInfoData.loggedInUserDetails.user_id != audio.owner_id)  
            
            ){
                this.audioTag.pause();
                this.setState({showPassword:true,localUpdate:true,popup_song_id:audio.audio_id})
                return;
        }
        if(this.state.playCount[this.props.song_id]){
            return
        }
        let counts = [...this.state.playCount]
        counts[this.props.song_id] = this.props.song_id
        this.setState({localUpdate:true,playCount:counts})
        const formData = new FormData()
        formData.append('id', this.props.song_id)
        const url = "/audio/play-count"
        axios.post(url, formData)
            .then(response => {
                
            }).catch(err => {
                
            });
    }
    changeVolume = (e) => {
        let value = e.target.value
        this.audioTag.volume= parseInt(value)/10;
    }
    closePopup = (e) => {
        this.setState({localUpdate:true, showPassword: false})
    }
    formSubmit = (e) => {
        e.preventDefault()
        if (!this.state.password || this.state.submitting) {
            return
        }
        let password = this.state.password
        
        const formData = new FormData();
        formData.append("password", password);
        
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let currentPlayingSong = this.getItemIndex(this.props.song_id)
        let audio = this.props.audios[currentPlayingSong];
        let url = '/audio/password/' + audio.custom_url
        this.setState({localUpdate:true, submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({localUpdate:true, error: response.data.error[0].message, submitting: false });
                } else {
                    let passwords = this.state.passwords ? this.state.passwords : []
                    passwords[this.props.song_id] = this.props.song_id
                    this.setState({localUpdate:true, submitting: false, error: null,password:"",showPassword:false,passwords:passwords })
                    
                }
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });

    }
    passwordValue = (e) => {
        this.setState({localUpdate:true, password: e.target.value })
    }
    render() {
        if(!this.props.audios.length && !this.props.audios.length && !this.props.song_id){
            return null
        }
        let currentPlayingSong = this.getItemIndex(this.props.song_id)
        let audio = this.props.audios[currentPlayingSong];
        let isS3 = true
        if (audio.audio_file) {
            const splitVal = audio.audio_file.split('/')
            if (splitVal[0] == "http:" || splitVal[0] == "https:") {
                isS3 = false
            }
        }
        if(this.props.song_id == this.props.pausesong_id){
            try{
                this.audioTag.pause();
            }catch(err){
                
            }
        }else{
            if(this.audioTag && this.audioTag.paused && !this.state.showPassword){
                if(audio.view_privacy != "password" || this.state.popup_song_id != audio.audio_id){
                    this.audioTag.play();
                }
            }
        }
        let password = null
        if(this.state.showPassword){
            password = <div className="popup_wrapper_cnt">
                            <div className="popup_cnt">
                                <div className="comments">
                                    <div className="VideoDetails-commentWrap">
                                        <div className="popup_wrapper_cnt_header">
                                            <h2>{this.props.passwordText}</h2>
                                            <a onClick={this.closePopup} className="_close"><i></i></a>
                                        </div>
                                        <div className="user_wallet">
                                            <div className="row">
                                                <form onSubmit={this.formSubmit}>
                                                    <div className="form-group">
                                                        <input type="text" className="form-control" value={this.state.password ? this.state.password : ""} onChange={this.passwordValue} />
                                                        {
                                                            this.state.error ? 
                                                            <p className="error">
                                                                {
                                                                    this.state.error
                                                                }
                                                            </p>
                                                            : null
                                                        }
                                                    </div>
                                                    <div className="form-group">
                                                        <label htmlFor="name" className="control-label"></label>
                                                        <button type="submit">{this.props.submitText}</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
        }
        return (
            <React.Fragment>
            {
                password
            }
            <div className="playbar">
                <a href="#" className="close-mini-player" onClick={this.closePlayer}><span className="material-icons">clear</span></a>
                <ul className="controller">
                    {
                        this.props.audios.length > 1 ? 
                            <li onClick={this.previous.bind(this)}>
                                <i className="fa fa-step-backward"></i>
                            </li>
                        : null
                    }
                    <li>
                    {
                        this.props.pausesong_id == audio.audio_id ?
                            <i className="fas fa-play" onClick={this.playSong.bind(this)}></i>
                        :
                            <i className="fas fa-pause" onClick={this.pauseSong.bind(this)}></i>
                    }
                    </li>
                    {
                        this.props.audios.length > 1 ? 
                    <li onClick={this.ended.bind(this)}>
                        <i className="fa fa-step-forward"></i>
                    </li>
                    : null
                    }
                    <li className="volume" onClick={ this.toggleLoop }>
                        <input className="volume-bar" type="range" min="0" max="10" onChange={(e) => this.changeVolume(e)} />
                    </li>
                    <li className={ this.audioTag && this.audioTag.loop == true ? "active" : "" } onClick={ this.toggleLoop }>
                        <i className="fas fa-redo"></i>
                    </li>
                </ul>
                <audio id="audio" autoPlay preload="auto" ref={ (tag) => this.audioTag = tag }
                    src={(isS3 ? this.props.pageInfoData.imageSuffix : "") + audio.audio_file}
                    type="audio/mpeg" style={{display:"none"}}
                    onTimeUpdate={ this.updateProgress.bind(this) }
                    onEnded={ this.ended.bind(this) }
                    onPlay={this.playStart.bind(this)}></audio>
                <ul className="progress">
                    <li className="currentTime">{this.formatDuration(this.audioTag ? this.audioTag.currentTime : 0)}</li>
                    <progress value={this.audioTag ? this.audioTag.currentTime : 0} max={audio.duration}></progress>
                    <li>{this.formatDuration(Math.floor(audio.duration))}</li>
                </ul>
                <div className="track-info">
                    <div className="img">
                    <Link  href="/audio" customParam={`audioId=${audio.custom_url}`} as={`/audio/${audio.custom_url}`}>
                        <a className="trackName">
                            <Image image={audio.image} imageSuffix={this.props.pageInfoData.imageSuffix} />
                        </a>
                    </Link>
                    </div>
                    <div className="userTrackName">
                        <UserTitle childPrepend={true}  className="username" data={audio} ></UserTitle>
                        <Link  href="/audio" customParam={`audioId=${audio.custom_url}`} as={`/audio/${audio.custom_url}`}>
                            <a className="trackName">
                                {
                                    audio.title
                                }
                            </a>
                        </Link>
                    </div>
                </div>
            </div>
            </React.Fragment>
        )
    }
}
const mapStateToProps = state => {
    return {
        song_id: state.audio.song_id,
        audios: state.audio.audios,
        pausesong_id:state.audio.pausesong_id,
        pageInfoData: state.general.pageInfoData,
        passwordText:state.audio.passwordText,
        submitText:state.audio.submitText
    };
};
const mapDispatchToProps = dispatch => {
    return {
        updateAudioData:(audios,song_id,pausesong_id,submit,password) => dispatch(playlist.updateAudioData(audios,song_id,pausesong_id,submit,password))
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Player);