import React, { Component } from "react"

import Breadcrum from "../../components/Breadcrumb/Form"

import Form from '../../components/DynamicForm/Index'

import { connect } from 'react-redux';

import Validator from '../../validators';

import axios from "../../axios-orders"

import Router from "next/router"
import Translate from "../../components/Translate/Index";
import ReactDOMServer from "react-dom/server"
import Currency from "../Upgrade/Currency"
 
class Video extends Component {
    constructor(props) {
        super(props)
        let enableVideo = false
        if (props.pageInfoData.appSettings.uploadVideo == "1") {
            enableVideo = true
        }
        if(props.chooseVideos){
            props.pageInfoData.editItem = null
        }
        this.state = {
            processing:false,
            enableUploadVideo: enableVideo,
            chooseType: enableVideo ? "upload" : "import",
            editItem: props.pageInfoData.editItem,
            videoTitle: props.pageInfoData.editItem ? props.pageInfoData.editItem.title : null,
            videoDescription: props.pageInfoData.editItem ? props.pageInfoData.editItem.description : null,
            tips:props.pageInfoData.editItem && props.pageInfoData.editItem.tips ? [...props.pageInfoData.editItem.tips] : [{amount:0}],
            previousTips:props.pageInfoData.editItem && props.pageInfoData.editItem.tips ? [...props.pageInfoData.editItem.tips] : [{amount:0}],
            videoTags: props.pageInfoData.editItem && props.pageInfoData.editItem.tags ? props.pageInfoData.editItem.tags.split(',') : null,
            videoImage: null,
            category_id: props.pageInfoData.editItem ? props.pageInfoData.editItem.category_id : null,
            subcategory_id: props.pageInfoData.editItem ? props.pageInfoData.editItem.subcategory_id : null,
            subsubcategory_id: props.pageInfoData.editItem ? props.pageInfoData.editItem.subsubcategory_id : null,
            privacy: props.pageInfoData.editItem ? props.pageInfoData.editItem.view_privacy : "everyone",
            success: props.pageInfoData.editItem ? true : false,
            error: null,
            sell_videos:props.pageInfoData.sell_videos ? true : false,
            openAddTip:false,
            channel_id:props.channel_id ? props.channel_id : null
        }
        this.myRef = React.createRef();
        this.setAmount = this.setAmount.bind(this)
        this.canTipOpen = false
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else {
            if(nextProps.chooseVideos){
                nextProps.pageInfoData.editItem = null
            }
            let enableVideo = false
            if (nextProps.pageInfoData.appSettings.uploadVideo == "1") {
                enableVideo = true
            }
            return {
                channel_id:nextProps.channel_id ? nextProps.channel_id : null,
                openAddTip:false,
                tips:nextProps.pageInfoData.editItem && nextProps.pageInfoData.editItem.tips ? [...nextProps.pageInfoData.editItem.tips] : [{amount:0}],
                previousTips:nextProps.pageInfoData.editItem && nextProps.pageInfoData.editItem.tips ? [...nextProps.pageInfoData.editItem.tips] : [{amount:0}],
                chooseType: enableVideo ? "upload" : "import",
                editItem: nextProps.pageInfoData.editItem,
                videoTitle: nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.title : null,
                videoDescription: nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.description : null,
                videoTags: nextProps.pageInfoData.editItem && nextProps.pageInfoData.editItem.tags ? nextProps.pageInfoData.editItem.tags.split(',') : null,
                videoImage: null,
                category_id: nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.category_id : null,
                subcategory_id: nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.subcategory_id : null,
                subsubcategory_id: nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.subsubcategory_id : null,
                privacy: nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.view_privacy : "everyone",
                success: nextProps.pageInfoData.editItem ? true : false,
                error: null,
                sell_videos:nextProps.pageInfoData.sell_videos ? true : false
            }
        }
    }
    componentDidMount(){
        var _this = this
        $(document).on('click','.add_tips',function(){
            //
            if(_this.props.pageInfoData && !_this.props.pageInfoData.loggedInUserDetails){
                document.getElementById('loginFormPopup').click();
            }else{
                _this.canTipOpen = true
                _this.setState({localUpdate:true,openAddTip:true})
            }
        })
    }
    componentDidUpdate(prevProps,prevState){
        if(this.props.editItem != prevProps.editItem){
            this.empty = true
            this.firstLoaded = false
        }
    }
    onSubmit = model => {
        if (this.state.submitting) {
            return
        }
        if(model["duration"]){
            //check duration format it must be HH:MM:SS
            let valid =  /^\d{2}:\d{2}:\d{2}$/.test(model["duration"]);

            if(!valid){
                this.setState({localUpdate:true,error:[{message:this.props.t("Duration must be in format HH:MM:SS.")}]})
                return;
            }

        }
        if(this.props.pageInfoData.appSettings['video_commission_type']  == 1 && this.props.pageInfoData.appSettings['video_commission_value'] > 0){
            if(model['price'] && parseFloat(model['price']) > 0){
                if(model['price'] <=  this.props.pageInfoData.appSettings['video_commission_value']){
                    let perprice = {}
                    perprice['package'] = { price: this.props.pageInfoData.appSettings['video_commission_value'] }
                    this.setState({localUpdate:true,error:[{message:this.props.t("Price enter must be greater than {{price}}.",{price:ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...perprice} />)})}]})
                    return;
                }
            }else{
                model['price'] = 0
            }
        }

        let formData = new FormData();
        for (var key in model) {
            if(model[key] != null && typeof model[key] != "undefined")
                formData.append(key, model[key]);
        }
        if (this.state.videoId) {
            formData.append("videoId", this.state.videoId)
            formData.append("videoResolution", this.state.videoWidth)
        }

        if(this.state.tips){
            formData.append("tips",JSON.stringify(this.state.tips));
        }
        if(this.state.removeElements){
            formData.append("removeTips",JSON.stringify(this.state.removeElements));
        }

        if (this.state.chooseType == "import") {
            formData.append('duration', this.state.videoDuration)
            formData.append('type', this.state.videoType)
            formData.append('code', this.state.videoCode)
            if (this.state.videoType == 6) {
                formData.append('channel', this.state.videoChannel)
            }
        }else if(this.state.chooseType == "embed"){
            formData.append('type', "22")
            formData.append('code', this.state.videoCode)
        }

        //image
        if (model['image']) {
            let image = typeof model['image'] == "string" ? model['image'] : false
            if (image) {
                formData.append('videoImage', image)
            }
        }

        if(this.state.channel_id){
            formData.append("channel_id",this.state.channel_id);
        }

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/videos/create';
        if (this.state.editItem) {
            url = "/videos/create";
            formData.append("fromEdit", 1)
            formData.append("videoId", this.state.editItem.video_id)
        }
        this.setState({localUpdate:true, submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({localUpdate:true, error: response.data.error, submitting: false });
                } else {
                    if(this.props.chooseVideos){
                        this.props.chooseVideos()
                    }else{
                        Router.push(`/watch?videoId=${response.data.custom_url}`, `/watch/${response.data.custom_url}`)
                    }
                }
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });
    };
    chooseType = (type, e) => {
        e.preventDefault()
        if (this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails) {
            document.getElementById('loginFormPopup').click();
        } else {
            if (this.state.validating) {
                return
            }
            this.empty = true
            this.setState({localUpdate:true, chooseType: type })
        }
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
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
    
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
        const i = Math.floor(Math.log(bytes) / Math.log(k));
    
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    uploadMedia = (e) => {
        let res_field = e.name
       var extension = res_field.substr(res_field.lastIndexOf('.') + 1).toLowerCase();
       var allowedExtensions = ['mp4','mov','webm','mpeg','3gp','avi','flv','ogg','mkv','mk3d','mks','wmv'];
        if (allowedExtensions.indexOf(extension) === -1) 
        {
            alert(this.props.t('Invalid file Format. Only {{data}} are allowed.',{data:allowedExtensions.join(', ')}));
            return false;
        }else if( this.props.pageInfoData.appSettings['video_upload_limit'] == 1 && e.size > parseInt(this.props.pageInfoData.appSettings['video_upload_limit'])*1000000){
            alert(this.props.t('Maximum upload limit is {{upload_limit}}',{upload_limit:this.formatBytes(parseInt(this.props.pageInfoData.appSettings['video_upload_limit'])*1000000)}));
            return false;
        }
        this.onSubmitUploadImport({ "upload": e })
    }
    onSubmitUploadImport = (model) => {
        if (this.state.validating) {
            return
        }
        const formData = new FormData();
        for (var key in model) {
            formData.append(key, model[key]);
        }
        if(key == "embed-code"){
            let previousState = {...this.state}
            previousState["validating"] = false
            previousState['success'] = true
            this.empty = true
            this.firstLoaded = false
            this.setState({ ...previousState,localUpdate:true,videoCode:model[key] })
            return;
        }

        var config = {};

        if(key == "upload"){
            config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
                    this.setState({localUpdate:true,percentCompleted:percentCompleted,processing:percentCompleted == 100 ? true : false})
                }
            };
        }else{
            config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
        }

        let url = '/videos/' + key;
        if (this.state.isEdit) {
            url = "/videos/create/" + this.state.isEdit;
        }
        this.setState({localUpdate:true, validating: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({localUpdate:true, error: response.data.error, validating: false });
                } else {
                    if (key == "import-url") {

                        const data = response.data
                        const previousState = { ...this.state }
                        if (data.title) {
                            previousState["videoTitle"] = data.title
                        }
                        if (data.description) {
                            previousState["videoDescription"] = data.description
                        }
                        if (data.tags) {
                            previousState["videoTags"] = data.tags
                        }
                        if (data.image) {
                            previousState["videoImage"] = data.image
                        }
                        if (data.duration) {
                            previousState["videoDuration"] = data.duration
                        }
                        if (data.type) {
                            previousState['videoType'] = data.type
                        }
                        if (data.channel) {
                            previousState['videoChannel'] = data.channel
                        }
                        if (data.code) {
                            previousState['videoCode'] = data.code
                        }
                        previousState["validating"] = false
                        previousState['success'] = true
                        this.empty = true
                        this.firstLoaded = false
                        this.setState({ ...previousState,localUpdate:true })
                    } else {
                        this.setState({localUpdate:true, videoWidth: response.data.videoWidth, validating: false, videoId: response.data.videoId, success: true, videoTitle: response.data.name, videoImage: response.data.images[0] });
                    }
                }
            }).catch(err => {
                this.setState({localUpdate:true, validating: false, error: err });
            });
    }
    closeTipPopup = () => {
        this.setState({openAddTip:false,localUpdate:true,tips:this.state.previousTips,removeElements:[]},() => {
            this.canTipOpen = false
        })
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
    render() {

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

        let imageUrl = null
        if(this.state.editItem && this.state.editItem.image){
            if(this.state.editItem.image.indexOf("http://") == 0 || this.state.editItem.image.indexOf("https://") == 0){
                imageUrl = this.state.editItem.image
            }else{
                if(this.props.pageInfoData.livestreamingtype == 0 && this.state.editItem.mediaserver_stream_id &&  this.state.editItem.image && this.state.editItem.image.indexOf('LiveApp/previews') > 0){
                    imageUrl = this.props.pageInfoData.liveStreamingServerURL+":5443"+this.state.editItem.image
                }else{
                    imageUrl = this.props.pageInfoData.imageSuffix+this.state.editItem.image
                }
            }
        }
        let formFields = [
            { key: "title", label: "Video Title", value: this.state.editItem ? this.state.editItem.title : null ,isRequired:true},
            { key: "description", label: "Video Description", type: "textarea", value: this.state.editItem ? this.state.editItem.description : null }    
        ]

        //set tip options
        if(parseInt(this.props.pageInfoData.appSettings['video_tip']) == 1){
            formFields.push({ key: "addTips", type:"content",content:"<button class='add_tips' type='button'>"+Translate(this.props,"Add Tips")+"</button>" });

        }


        formFields.push({ key: "image", label: "Upload Video Image", type: "file", value: imageUrl })

        if(this.state.chooseType == "embed" || (this.state.editItem && this.state.editItem.type == 22)){
            formFields.push({ key: "duration", label: "Video Duration (eg - HH:MM:SS)", value: this.state.editItem ? this.state.editItem.duration : null })
        }

        if(this.state.chooseType == "upload" && this.state.sell_videos && (!this.state.editItem || this.state.editItem.type == 3)){
            
            validator.push({
                key: "price",
                validations: [
                    {
                        "validator": Validator.price,
                        "message": "Please provide valid price"
                    }
                ]
            })
            formFields.push({ key: "price", label: "Price (Leave empty for free videos)", value: this.state.editItem ? this.state.editItem.price : null,isRequired:true })
            if(this.props.pageInfoData.appSettings['video_commission_type']  == 1 && this.props.pageInfoData.appSettings['video_commission_value'] > 0){
                let perprice = {}
                perprice['package'] = { price: this.props.pageInfoData.appSettings['video_commission_value'] }
                formFields.push({
                    key: "price_desc_1",
                    type: "content",
                    content: '<span>' + this.props.t("Price enter must be greater than {{price}}.",{price:ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...perprice} />)}) + '</span>'
                })
            }
        }

        if (this.props.pageInfoData.videoCategories) {
            let categories = []
            categories.push({ key: 0, value: 0, label: "Please Select Video Category" })
            this.props.pageInfoData.videoCategories.forEach(res => {
                categories.push({ key: res.category_id, label: res.title, value: res.category_id })
            })
            formFields.push({
                key: "category_id",
                label: "Category",
                type: "select",
                value: this.state.editItem ? this.state.editItem.category_id : null,
                onChangeFunction: this.onCategoryChange,
                options: categories
            })

            //get sub category
            if (this.state.category_id) {
                let subcategories = []

                this.props.pageInfoData.videoCategories.forEach(res => {
                    if (res.category_id == this.state.category_id) {
                        if (res.subcategories) {
                            subcategories.push({ key: 0, value: 0, label: "Please Select Video Sub Category" })
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
                        value: this.state.editItem ? this.state.editItem.subcategory_id : null,
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
                                                subsubcategories.push({ key: 0, value: 0, label: "Please Select Video Sub Sub Category" })
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
                                value: this.state.editItem ? this.state.editItem.subsubcategory_id : null,
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
        if (this.props.pageInfoData.videoArtists) {
            let artists = []

            this.props.pageInfoData.videoArtists.forEach(res => {
                artists.push({ value: res.artist_id.toString(), key: res.title, label: res.title, image: this.props.pageInfoData.imageSuffix + res.image })
            })

            formFields.push({
                key: "artists",
                label: "Video Artists",
                imageSelect:true,
                type: "checkbox",
                value: this.state.editItem && this.state.editItem.artists ? this.state.editItem.artists.split(",") : null,
                options: artists
            })
        }

        if (this.props.pageInfoData.appSettings.video_adult == "1") {
            formFields.push({
                key: "adult",
                label: "",
                subtype:"single",
                type: "checkbox",
                value: this.state.editItem ? [this.state.editItem.adult ? "1" : "0"] : ["0"],
                options: [
                    {
                        value: "1", label: "Mark Video as Adult", key: "adult_1"
                    }
                ]
            })
        }

        formFields.push({
            key: "search",
            label: "",
            type: "checkbox",
            subtype:"single",
            value: this.state.editItem ? [this.state.editItem.search ? "1" : "0"] : ["1"],
            options: [
                {
                    value: "1", label: "Show this video in search results", key: "search_1"
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
                value: this.state.editItem  ? this.state.editItem.autoapprove_comments.toString() : "1",
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
                value: "link", label: "Only to people who have video link", key: "link"
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
            value: this.state.editItem ? this.state.editItem.view_privacy : "everyone",
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
        if (this.state.chooseType) {
            formFields.forEach((elem) => {
                if (elem.value)
                    defaultValues[elem.key] = elem.value
            })
        }
        if (!this.firstLoaded && (this.state.videoTitle || this.state.videoImage || this.state.videoDescription || this.state.videoTags)) {
            if (this.state.videoTitle) {
                defaultValues['title'] = this.state.videoTitle
            }
            if (this.state.videoImage) {
                defaultValues['image'] = this.state.videoImage
            }
            if (this.state.videoDescription) {
                defaultValues['description'] = this.state.videoDescription
            }
            if (this.state.videoTags) {
                defaultValues['tags'] = this.state.videoTags
            }
            this.firstLoaded = true
        }
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
        let validatorUploadImport = []
        let fieldUploadImport = []
        if (this.state.chooseType == "upload" && !this.state.editItem) {
            validatorUploadImport.push({
                key: "upload",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Upload video is required field."
                    }
                ]
            })
            fieldUploadImport.push({ key: "upload", label: "", type: "video", defaultText: "Drag & Drop Video File Here", onChangeFunction: this.uploadMedia })
        } else if(this.state.chooseType == "embed" && !this.state.editItem) {
            validatorUploadImport.push({
                key: "embed-code",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Embed Video code is required field"
                    }
                ]
            })
            fieldUploadImport.push({ key: "embed-code", label:"", placeholder:"Embed Video Code", type: "textarea" })
            
        } else {
            validatorUploadImport.push({
                key: "import-url",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Import video link is required field"
                    },
                    {
                        "validator": Validator.url,
                        "message": "Please provide valid link."
                    }
                ]
            })
            fieldUploadImport.push({ key: "import-url", label:"", placeholder:"Import Video Link", type: "text" })
        }
        var empty = false
        if(this.empty){
            empty = true
            this.empty = false
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
        if(this.canTipOpen){
            defaultValues = {}
        }
        return (
            <React.Fragment>
                {
                    tips
                }
                {
                    this.state.success ?
                            
                            !this.state.channel_id ?
                               <React.Fragment>
                                    <Breadcrum {...this.props}  image={this.props.pageData['pageInfo']['banner'] ? this.props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"} title={`${this.state.editItem ? "Edit" : "Create"} Video`} />
                                    <div className="mainContentWrap">
                                        <div className="container">
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="formBoxtop loginp content-form" ref={this.myRef}>
                                                        <Form
                                                            className="form"
                                                            defaultValues={defaultValues}
                                                            {...this.props}
                                                            empty={empty}
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
                                    </div>
                               </React.Fragment>
                                :
                                <div className="mt20">
                                <Form
                                    className="form"
                                    defaultValues={defaultValues}
                                    {...this.props}
                                    empty={empty}
                                    generalError={this.state.error}
                                    validators={validator}
                                    submitText={!this.state.submitting ? "Submit" : "Submitting..."}
                                    model={formFields}
                                    onSubmit={model => {
                                        this.onSubmit(model);
                                    }}
                                />
                                </div>
                        :
                        <div className="videoBgWrap" ref={this.myRef}>
                            {/* {
                                this.props.pageInfoData.appSettings['video_createpage'] ? 
                                    <video autoPlay muted loop id="videoBg">
                                        <source src={this.props.pageInfoData.imageSuffix+this.props.pageInfoData.appSettings['video_createpage']} type="video/mp4" />
                                        Your browser does not support HTML5 video.
                                    </video>
                            : null
                            } */}
                            {
                                this.state.enableUploadVideo || this.props.pageInfoData.levelPermissions['video.embedcode'] == 1 ?
                                    <div className="user-area">
                                        <div className="container">
                                             <div className="BtnUpld">
                                                {
                                                    this.state.enableUploadVideo ? 
                                                <a href="#" onClick={this.chooseType.bind(this, "upload")} className={this.state.chooseType == "upload" ? "active" : ""}>
                                                    {Translate(this.props,"Upload")}
                                                </a>
                                                : null
                                                }
                                                <a href="#"  onClick={this.chooseType.bind(this, "import")} className={this.state.chooseType == "import" ? "active" : ""}>
                                                    {Translate(this.props,"Import")}
                                                </a>
                                                {
                                                    this.props.pageInfoData.levelPermissions['video.embedcode'] == 1 ? 
                                                    <a href="#"  onClick={this.chooseType.bind(this, "embed")} className={this.state.chooseType == "embed" ? "active" : ""}>
                                                        {Translate(this.props,"Embed Video")}
                                                    </a>
                                                : null
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    :  <div className="user-area">
                                            <div className="container">
                                                <div className="BtnUpld"></div>
                                            </div>
                                        </div>
                            }
                            {
                                this.state.chooseType ?
                                    //upload file
                                    <React.Fragment>
                                        <Form
                                            className="form"
                                            videoKey="video"
                                            generalError={this.state.error}
                                            title={this.state.chooseType == "upload" ? "Upload Video" : (this.state.chooseType == "embed" ? "Embed Video" : "Import Video Link")}
                                            validators={validatorUploadImport}
                                            model={fieldUploadImport}
                                            empty={empty}
                                            submitText={this.state.chooseType != "embed" ? "Fetch Video" : "Embed Video"}
                                            {...this.props}
                                            percentCompleted={this.state.percentCompleted}
                                            processing={this.state.processing}
                                            textProgress="Video is processing, this may take few minutes."
                                            submitHide={this.state.chooseType == "upload" ? true : false}
                                            loading={this.state.validating ? true : false}
                                            onSubmit={model => {
                                                this.onSubmitUploadImport(model);
                                            }}
                                        />
                                    </React.Fragment>
                                    : null
                            }
                        </div>
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


export default connect(mapStateToProps, null)(Video);