import React from "react"
import RTCClient from './rtc-client'
import Form from '../../components/DynamicForm/Index'
import { connect } from 'react-redux';
import Validator from '../../validators';
import axios from "../../axios-orders"
import StartLiveStreaming from "./StartLiveStreaming"
import MediaLiveStreaming from "./MediaLiveStreaming"
import Translate from "../../components/Translate/Index";
import Router from "next/router"
import ReactDOMServer from "react-dom/server"
import Currency from "../Upgrade/Currency"
class Index extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            rtcClient:"",
            streamKey:props.pageInfoData.streamingId ? props.pageInfoData.streamingId : this.randomNumber(),
            streamToken:props.pageInfoData.tokenStream ? props.pageInfoData.tokenStream : null,
            streamType:"camera",
            streamingStart:false,
            streamKeyCreated:props.pageInfoData.tokenStream ? true : false,
            tips: [{amount:0}],
            previousTips: [{amount:0}],
            openAddTip:false
        }
        this.webRTCAdaptor = null
        this.onUnloadComponent = this.onUnloadComponent.bind(this)
    }
    randomNumber(){
        let maximum = 15000
        let minimum = 12987
        let date = new Date()
        let time = date.getTime()
        let number = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
        return "" + number + time
    }
    onUnloadComponent = () => {
        if(this.state.live){
            return
        }
        if(this.props.pageInfoData.livestreamingtype && this.props.pageInfoData.livestreamingtype == 0){
            let formData = new FormData();
            formData.append("streamID",this.state.streamKey)
            
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
            let url = '/live-streaming/media-stream/finish';
            formData.append("remove",1);
            axios.post(url, formData, config)
                .then(response => {
                    if (response.data.error) {
                        
                    } else {
                        
                    }
                }).catch(err => {
                    
                });
        }
    }
    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.onUnloadComponent);
    }
    componentDidMount(){
        window.addEventListener("beforeunload", this.onUnloadComponent);
        Router.events.on("routeChangeStart", url => {
            this.onUnloadComponent();
        });
        this.props.socket.on('liveStreamStatus', data => {
            let id = data.id;
            if (this.state.streamKey == id) {
                if(data.action == "liveStreamStarted"){
                    this.setState({localUpdate:true,streamingStart:true})
                }else if(data.action == "liveStreamEnded"){
                    this.setState({localUpdate:true,streamingStart:false})
                }
            }
        });

        let client = new RTCClient()
        this.setState({rtcClient:client,streamType:"camera",streamingStart:false},() => {
            this.checkRTMPStreamingEnable();
        })
        let _ = this
        client.createStream({appID:this.props.pageInfoData.agora_app_id,codec:"vp8"}).then((data) => {
            if(data.error){
                _.setState({errorMessage:data.error})
            }
        })
        var _this = this
        $(document).on('click','.add_tips',function(){
            //
            if(_this.props.pageInfoData && !_this.props.pageInfoData.loggedInUserDetails){
                document.getElementById('loginFormPopup').click();
            }else{
                _this.setState({localUpdate:true,openAddTip:true})
            }
        })
    }
    onCategoryChange = (category_id) => {
        this.setState({localUpdate:true, category_id: category_id, subsubcategory_id: 0, subcategory_id: 0 })
    }
    onSubCategoryChange = (category_id) => {
        this.setState({localUpdate:true, subcategory_id: category_id, subsubcategory_id: 0 })
    }
    onSubSubCategoryChange = (category_id) => {
        this.setState({localUpdate:true, subsubcategory_id: category_id })
    }
    onChangePrivacy = (value) => {
        this.setState({localUpdate:true, privacy: value })
    }
    onStreamTypeChange = (value) => {
        let updateState = {localUpdate:true, streamType: value }
        if(value == "rtmp"){
            
        }else{
            updateState["streamingStart"] = false;
        }
        this.setState(updateState);
    }
    submitStreamKey(){
        if(this.state.submittingKey || this.state.streamToken){
            return
        }
        if(this.props.pageInfoData.livestreamingtype && this.props.pageInfoData.livestreamingtype == 0){
            let formData = new FormData();
            
            formData.append("streamingId",this.state.streamKey);
            
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
            let url = '/live-streaming/create-key';
            
            this.setState({localUpdate:true, submittingKey: true });
            axios.post(url, formData, config)
                .then(response => {
                    if (!response.data.error) { 
                        this.setState({vCreated:true,streamToken:response.data.token})
                        this.checkRTMPStreamingEnable()
                    }else{
                        console.log("Error create stream.");
                    }
                }).catch(err => {
                    console.log("Error create stream.");
                });
        }
    }
    checkRTMPStreamingEnable(){
        if(!this.state.streamKeyCreated && (this.props.pageInfoData.appSettings['antserver_media_token'] == "undefined" || this.props.pageInfoData.appSettings['antserver_media_token'] == 1)){
            this.submitStreamKey();
        }
    }
    onSubmit = model => {
        if (this.state.submitting) {
            return
        }
        
        let formData = new FormData();
        for (var key in model) {
            if(model[key] != null && typeof model[key] != "undefined")
                formData.append(key, model[key]);
        }
        if(this.state.tips){
            formData.append("tips",JSON.stringify(this.state.tips));
        }
        if(this.state.removeElements){
            formData.append("removeTips",JSON.stringify(this.state.removeElements));
        }
        if(this.state.streamType){
            formData.append("streamingId",this.state.streamKey);
        }

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/live-streaming/create';
        
        this.setState({localUpdate:true, submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) { 
                    this.setState({localUpdate:true, error: response.data.error, submitting: false });
                } else {
                    this.setState({submitting:false,live:true,custom_url:response.data.custom_url,video_id:response.data.videoId,image:response.data.image,title:response.data.title,allow_chat:model["enable_chat"]})
                }
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });
    };
    onClickCopy = (value) => {
        var textField = document.createElement('textarea')
        textField.innerText = value
        document.body.appendChild(textField)
        textField.select()
        document.execCommand('copy')
        textField.remove()
        
      }
      closeTipPopup = () => {
        this.setState({openAddTip:false,localUpdate:true,tips:this.state.previousTips,removeElements:[]})
    }
    
    setAmount = (id,e) => {
        let tips = [...this.state.tips]
        if(!tips[id]){
            let item = {}
            item.amount = e.target.value
            tips.push(item)
        }else{
            tips[id]['amount'] = e.target.value
        }
        this.setState({localUpdate:true,tips:tips});
    }
    addMoreRow = (e) => {
        let row = {}
        row['amount'] = 0
        let tips = [...this.state.tips]
        tips.push(row)
        this.setState({localUpdate:true,tips:tips});
    }
    removeTip = (id,e) => {
        e.preventDefault();
        let tips = [...this.state.tips]
        let removeElements = !this.state.removeElements ? [] : this.state.removeElements
        if(tips[id].defaulttip_id){
            removeElements.push(tips[id].defaulttip_id)
        }
        tips.splice(id, 1);
        this.setState({localUpdate:true, tips: tips,removeElements:removeElements })

    }
    saveTips = (e) => {
        let valid = true
        let tips = [...this.state.tips]
        let perprice = {}
        perprice['package'] = { price: this.props.pageInfoData.appSettings['videotip_commission_value'] }
        tips.forEach((item,index) => {
            if(parseFloat(item.amount) > 0){
                if(parseFloat(this.props.pageInfoData.appSettings['videotip_commission_value']) > 0 && parseInt(this.props.pageInfoData.appSettings['videotip_commission_type']) == 1 && parseFloat(item.amount) <= parseFloat(this.props.pageInfoData.appSettings['videotip_commission_value'])){
                    valid = false
                    item.error = this.props.t("Price enter must be greater than {{price}}.",{price:ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...perprice} />)})
                }else{
                    item.error = null
                }
            }else{
                item.error = this.props.t("Enter amount must be greater than {{price}}.",{price : parseFloat(this.props.pageInfoData.appSettings['videotip_commission_value']) > 0 && parseInt(this.props.pageInfoData.appSettings['videotip_commission_type']) == 1 ? ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...perprice} />) : 0});
                valid = false;
            }
        })
        let update = {localUpdate:true,tips:tips}
        if(valid){
            update['openAddTip'] = false
            update['previousTips'] = [...tips]
        }
        this.setState(update)
    }
    render(){
        let streamingData = null
        if(this.state.live){
            this.props.pageInfoData.livestreamingtype == 1 ?
                streamingData = <StartLiveStreaming {...this.props} allow_chat={this.state.allow_chat} title={this.state.title} image={this.state.image} video_id={this.state.video_id} custom_url={this.state.custom_url} channel={"channel_"+this.props.pageInfoData.loggedInUserDetails.user_id} role="host" currentTime="0" allowedTime={parseInt(this.props.pageInfoData.levelPermissions["livestreaming.duration"]),10} />
            :
                streamingData = <MediaLiveStreaming streamToken={this.state.streamToken} streamType={this.state.streamType} streamingId={this.state.streamKey} {...this.props} allow_chat={this.state.allow_chat} title={this.state.title} image={this.state.image} video_id={this.state.video_id} custom_url={this.state.custom_url}  role="host" currentTime="0" allowedTime={parseInt(this.props.pageInfoData.levelPermissions["livestreaming.duration"]),10} />
        }

        if(streamingData){
            return streamingData
        }

        let tips = null
        if(this.state.openAddTip){
            let perprice = {}
            perprice['package'] = { price: this.props.pageInfoData.appSettings['videotip_commission_value'] }
            tips = <div className="popup_wrapper_cnt">
                <div className="popup_cnt">
                    <div className="comments">
                        <div className="VideoDetails-commentWrap tip_cnt">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{Translate(this.props, "Create Tips")}</h2>
                                <a onClick={this.closeTipPopup} className="_close"><i></i></a>
                            </div>
                            <div className="user_wallet">
                                <div className="row">
                                    <form>
                                        {
                                        parseFloat(this.props.pageInfoData.appSettings['videotip_commission_value']) > 0 && parseInt(this.props.pageInfoData.appSettings['videotip_commission_type']) == 1 ?
                                                <p className="tip_amount_min">{this.props.t("Price enter must be greater than {{price}}.",{price:ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...perprice} />)})}</p>
                                            : null
                                        }
                                        {
                                            this.state.tips.length > 0 ? 
                                                this.state.tips.map((item,i) => {
                                                    return (
                                                        <div className="form-group" key={i}>
                                                            <div className="tip_input">
                                                                <input type="number" className="form-control" value={item.amount} disabled={item.tip_id ? true : false} placeholder={Translate(this.props,'Enter Tip Amount')} onChange={this.setAmount.bind(this,i)} />
                                                                {
                                                                    this.state.tips.length > 1 ?
                                                                        <a href="#" onClick={this.removeTip.bind(this,i)} className="remove">{this.props.t("remove")}</a>
                                                                    : null
                                                                }
                                                            </div>
                                                            {
                                                                item.error ?
                                                                    <p className="error">{item.error}</p>
                                                                : null
                                                            }
                                                        </div>
                                                    )     
                                                })
                                            : null
                                        }
                                        <div className="form-group">
                                            <label htmlFor="name" className="control-label"></label>
                                            <button type="button" onClick={this.saveTips.bind(this)}>{Translate(this.props, "Save")}</button>
                                            <button type="button" className="add_more_tip" onClick={this.addMoreRow.bind(this)}>{Translate(this.props, "Add More")}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        }

        if(this.state.errorMessage){
            return (
                <div className="videoSection1">
                    <div className="ls_overlay">
                        <div className="videoWrap" id="video">
                                <div id="local_stream" className="video-placeholder local_stream"></div>
                                <div id="local_video_info" style={{ display: "none" }} className="video-profile hide"></div>
                        </div>
                        <div className="centeredForm">
                            <div className="lsForm">
                                <div className="user-area clear">
                                    <div className="container form">
                                        {
                                            Translate(this.props,"To go live, allow access to Camera and Microphone.")
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        let validator = [
            {
                key: "title",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Title is required field"
                    }
                ]
            }
        ]
        let formFields = []
        if(this.props.pageInfoData.livestreamingtype == 0){

            let optionsType = []
            optionsType.push({ value: "camera", key: "camera_1", label: "Use Camera" })
            optionsType.push({ value: "rtmp", key: "camera_0", label: "Use Stream Key" })
            formFields.push({
                key: "streamType",
                label: "Choose how you want to start setting up your live video.",
                type: "select",
                value:  "camera",
                options: optionsType,
                onChangeFunction: this.onStreamTypeChange,
            })

            if(this.state.streamType == "rtmp"){
                let token = ""
                if(this.props.pageInfoData.appSettings['antserver_media_token'] == "undefined" || this.props.pageInfoData.appSettings['antserver_media_token'] == 1){
                    token = "?token="+this.state.streamToken
                }
                formFields.push(
                    {copyText:true,onClickCopy:this.onClickCopy, key: "stream_url", label: "Server URL",props:{onKeyDown:(e) => {e.preventDefault()}}, value:  "rtmp://"+(this.props.pageInfoData.liveStreamingServerURL.replace("https://","").replace("http://",""))+"/LiveApp" },
                    {copyText:true,onClickCopy:this.onClickCopy, key: "stream_key", label: "Stream Key",props:{onKeyDown:(e) => {e.preventDefault()}}, value:  this.state.streamKey+token },
                    { key: "text_description", type:"text_description", postDescription: '<span class="form-single-description">'+this.props.t("Copy and paste Server URL and Stream Key settings into your streaming software.")+'</span>' },

                )
            }
        }


        formFields.push(
            { key: "title", label: "Title", value: "" ,isRequired:true},
            { key: "description", label: "Description", type: "textarea", value: ""}    
        )

        //set tip options
        if(parseInt(this.props.pageInfoData.appSettings['video_tip']) == 1){
            formFields.push({ key: "addTips", type:"content",content:"<button class='add_tips' type='button'>"+Translate(this.props,"Add Tips")+"</button>" });

        }
       

        formFields.push({ key: "image", label: "Upload Image", type: "file", value: "" })

        


        if(this.state.devices && (!this.props.pageInfoData.livestreamingtype || this.props.pageInfoData.livestreamingtype == 1)){
            let devices = []
            this.state.devices.audios.forEach(function (audio) {
                devices.push({ key: audio.name+audio.name, label: audio.name, value: audio.value })
            })
            formFields.push({
                key: "audio_id",
                label: "Device Audio Setting",
                type: "select",
                value:  "",
                options: devices,
                isRequired:true
            })
            let videos = []
            this.state.devices.videos.forEach(function (video) {
                videos.push({ key: video.name+video.name, label: video.name, value: video.value })
            })
            formFields.push({
                key: "audio_id",
                label: "Device Video Setting",
                type: "select",
                value:  "",
                options: videos,
                isRequired:true
            })
        }

        if (this.props.pageInfoData.videoCategories) {
            let categories = []
            categories.push({ key: 0, value: 0, label: "Please Select Category" })
            this.props.pageInfoData.videoCategories.forEach(res => {
                categories.push({ key: res.category_id, label: res.title, value: res.category_id })
            })
            formFields.push({
                key: "category_id",
                label: "Category",
                type: "select",
                value:  "",
                onChangeFunction: this.onCategoryChange,
                options: categories
            })

            //get sub category
            if (this.state.category_id) {
                let subcategories = []

                this.props.pageInfoData.videoCategories.forEach(res => {
                    if (res.category_id == this.state.category_id) {
                        if (res.subcategories) {
                            subcategories.push({ key: 0, value: 0, label: "Please Select Sub Category" })
                            res.subcategories.forEach(rescat => {
                                subcategories.push({ key: rescat.category_id, label: rescat.title, value: rescat.category_id })
                            })
                        }
                    }
                })


                if (subcategories.length > 0) {
                    formFields.push({
                        key: "subcategory_id",
                        label: "Sub Category",
                        value: "",
                        type: "select",
                        onChangeFunction: this.onSubCategoryChange,
                        options: subcategories
                    })

                    if (this.state.subcategory_id) {
                        let subsubcategories = []

                        this.props.pageInfoData.videoCategories.forEach(res => {
                            if (res.category_id == this.state.category_id) {
                                if (res.subcategories) {
                                    res.subcategories.forEach(rescat => {
                                        if (rescat.category_id == this.state.subcategory_id) {
                                            if (rescat.subsubcategories) {
                                                subsubcategories.push({ key: 0, value: 0, label: "Please Select Sub Sub Category" })
                                                rescat.subsubcategories.forEach(ressubcat => {
                                                    subsubcategories.push({ key: ressubcat.category_id, label: ressubcat.title, value: ressubcat.category_id })
                                                })
                                            }
                                        }
                                    })
                                }
                            }
                        })

                        if (subsubcategories.length > 0) {
                            formFields.push({
                                key: "subsubcategory_id",
                                label: "Sub Sub Category",
                                type: "select",
                                value: "",
                                onChangeFunction: this.onSubSubCategoryChange,
                                options: subsubcategories
                            });
                        }
                    }
                }
            }
        }
        formFields.push({
            key: "tags",
            label: "Tags",
            type: "tags"
        })

        formFields.push({
            key: "enable_chat",
            label: "",
            type: "checkbox",
            subtype:"single",
            value: ["1"],
            options: [
                {
                    value: "1", label: "Allow chat", key: "allow_chat_1"
                }
            ]
        })

        if (this.props.pageInfoData.appSettings.video_adult == "1") {
            formFields.push({
                key: "adult",
                label: "",
                subtype:"single",
                type: "checkbox",
                value: ["0"],
                options: [
                    {
                        value: "1", label: "Mark as Adult", key: "adult_1"
                    }
                ]
            })
        }

        

        formFields.push({
            key: "search",
            label: "",
            type: "checkbox",
            subtype:"single",
            value: ["1"],
            options: [
                {
                    value: "1", label: "Show this live streaming in search results", key: "search_1"
                }
            ]
        })

        if(this.props.pageInfoData.appSettings['enable_comment_approve'] == 1){
            let comments = []
            comments.push({ value: "1", key: "comment_1", label: "Display automatically" })
            comments.push({ value: "0", key: "comment_0", label: "Don't display until approved" })
            formFields.push({
                key: "comments",
                label: "Comments Setting",
                type: "select",
                value:  "1",
                options: comments
            })
        }
        let privacyOptions = [
            {
                value: "everyone", label: "Anyone", key: "everyone"
            },
            {
                value: "onlyme", label: "Only me", key: "onlyme"
            },
            {
                value: "password", label: "Only people with password", key: "password"
            },
            {
                value: "link", label: "Only to people who have link", key: "link"
            }
        ]
        if(this.props.pageInfoData.appSettings['whitelist_domain'] == 1){
            privacyOptions.push(
                {
                    value: "whitelist_domain", label: "Whitelist Domain", key: "whitelist_domain"
                }
            )
        }
        if (this.props.pageInfoData.appSettings.user_follow == "1") {
            privacyOptions.push({
                value: "follow", label: "Only people I follow", key: "follow"
            })
        }

        formFields.push({
            key: "privacy",
            label: "Privacy",
            type: "select",
            value:  "everyone",
            onChangeFunction: this.onChangePrivacy,
            options: privacyOptions
        })
        if (this.state.privacy == "password") {
            formFields.push({
                key: "password", label: "Password", 'type': "password", value: this.state.editItem ? this.state.editItem.password : "",isRequired:true
            })
            validator.push({
                key: "password",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Password is required field"
                    }
                ]
            })
        }
        let defaultValues = {}
        formFields.forEach((elem) => {
            if (elem.value)
                defaultValues[elem.key] = elem.value
        })

        
        if (this.state.category_id) {
            defaultValues['category_id'] = this.state.category_id
        }
        if (this.state.subcategory_id) {
            defaultValues['subcategory_id'] = this.state.subcategory_id
        }
        if (this.state.privacy) {
            defaultValues['privacy'] = this.state.privacy
        }
        if (this.state.subsubcategory_id) {
            defaultValues['subsubcategory_id'] = this.state.subsubcategory_id
        }
        let token = ""
        if(this.props.pageInfoData.appSettings['antserver_media_token'] == "undefined" || this.props.pageInfoData.appSettings['antserver_media_token'] == 1){
            token = "?token="+this.state.streamToken
        }
        if (this.state.streamType) {
            defaultValues['streamType'] = this.state.streamType
            defaultValues['stream_key'] = this.state.streamKey+token
            defaultValues['stream_url'] = "rtmp://"+(this.props.pageInfoData.liveStreamingServerURL ? this.props.pageInfoData.liveStreamingServerURL.replace("https://","").replace("http://","") : "")+"/LiveApp"
        }

        if(this.state.streamType == "rtmp" && !this.state.streamingStart){
            formFields.push(
                { key: "text_description_rtmp", type:"text_description", postDescription: '<span class="form-single-description">'+this.props.t("Submit button will be enabled once you start streaming from your streaming software.")+'</span>' },
            )
        }

        var empty = false
        if(this.empty){
            empty = true
            this.empty = false
        }
        return (
            <React.Fragment>
                 {
                    tips
                }
                <div className="videoSection1">
                    <div className="ls_overlay">
                        <div className="videoWrap" id="video">
                                <div id="local_stream" className="video-placeholder local_stream"></div>
                                <div id="local_video_info" style={{ display: "none" }} className="video-profile hide"></div>
                        </div>
                        <div className="centeredForm">
                            <div className="lsForm">
                                <h3 className="header-live-streaming">
                                    {
                                        Translate(this.props,'Webcam stream info')
                                    }
                                </h3>
                            <Form
                                className="form"
                                //title={this.state.title}
                                defaultValues={defaultValues}
                                {...this.props}
                                empty={empty}
                                disableButtonSubmit={this.state.streamType == "rtmp" ? !this.state.streamingStart : false}
                                generalError={this.state.error}
                                validators={validator}
                                submitText={!this.state.submitting ? "Submit" : "Submitting..."}
                                model={formFields}
                                onSubmit={model => {
                                    this.onSubmit(model);
                                }}
                            />
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


export default connect(mapStateToProps, null)(Index);