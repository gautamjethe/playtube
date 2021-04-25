import React,{Component} from "react"

import Breadcrum from "../../components/Breadcrumb/Form"


import Form from '../../components/DynamicForm/Index'
import AddVideos from '../../containers/Video/Popup'


import { connect } from 'react-redux';

import Validator from '../../validators';

import axios from "../../axios-orders"

import Router from "next/router"
import  Translate  from "../../components/Translate/Index";
import imageCompression from 'browser-image-compression';

class Channel extends Component {
    constructor(props){
        super(props)
        
        this.state = {
            title:`${props.pageInfoData.editItem ? "Edit" : "Create"} Channel` ,
            editItem: props.pageInfoData.editItem,
            category_id:props.pageInfoData.editItem ? props.pageInfoData.editItem.category_id : null ,
            subcategory_id:props.pageInfoData.editItem ? props.pageInfoData.editItem.subcategory_id : null,
            subsubcategory_id:props.pageInfoData.editItem ? props.pageInfoData.editItem.subsubcategory_id : null,
            privacy:props.pageInfoData.editItem ? props.pageInfoData.editItem.view_privacy : "everyone",
            success:false,
            error:null,
            channelImage:""
        }
        this.myRef = React.createRef();
        this.chooseVideos = this.chooseVideos.bind(this)
    } 
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else {
            
            return {
                title:`${nextProps.pageInfoData.editItem ? "Edit" : "Create"} Channel` ,
                editItem: nextProps.pageInfoData.editItem,
                category_id:nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.category_id : null ,
                subcategory_id:nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.subcategory_id : null,
                subsubcategory_id:nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.subsubcategory_id : null,
                privacy:nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.view_privacy : "everyone",
                success:false,
                error:null,
                channelImage:""
            }
        }
    }
    componentDidUpdate(prevProps,prevState){
        if(this.props.pageData.editItem != prevProps.pageData.editItem){
            this.empty = true
            this.firstLoaded = false
        }
    }
    onSubmit = async model => {
        if(this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails){
            document.getElementById('loginFormPopup').click();
            return false;
        }
        if(this.state.submitting){
            return
        }
        this.setState({localUpdate:true,submitting:true,error:null});
        let formData = new FormData();
        for ( var key in model ) {
            if(key == "image" && model[key] && typeof model[key] != "string"){
                var ext = model[key].name.substring(model[key].name.lastIndexOf('.') + 1).toLowerCase();
                const options = {
                  maxSizeMB: 1,
                  maxWidthOrHeight: 1200,
                  useWebWorker: true
                }
                let compressedFile = model[key]
                if(ext != 'gif' && ext != 'GIF'){
                    try {
                    compressedFile = await imageCompression(model[key], options);
                    } catch (error) { }
                }
                formData.append(key, compressedFile,model[key].name);
              }else{
                  if(model[key] != null && typeof model[key] != "undefined")
                    formData.append(key, model[key]);
              }
        }        
        
        //image
        if(model['image']){
            let image =   typeof model['image'] == "string" ? model['image'] : false
            if(image){
                formData.append('channelImage',image)
            }
        }
        if(this.state.selectedVideos){
            formData.append('videos',this.state.selectedVideos)
        }
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/channels/create';
        if(this.state.editItem){
            url = "/channels/create";
            formData.append("channelId",this.state.editItem.channel_id)
            formData.append("fromEdit",true)
        }
        
        axios.post(url, formData,config)
        .then(response => {
            if(response.data.error){
                this.setState({localUpdate:true,error:response.data.error,submitting:false});
                window.scrollTo(0, this.myRef.current.offsetTop);
            }else{
                Router.push(`/channel?channelId=${response.data.custom_url}`,`/channel/${response.data.custom_url}`)
            }
        }).catch(err => {
            this.setState({localUpdate:true,submitting:false,error:err});
        });
    };
    
    onCategoryChange = (category_id) => {
        this.setState({localUpdate:true,category_id:category_id,subsubcategory_id:0,subcategory_id:0})
    }
    onSubCategoryChange = (category_id) => {
        this.setState({localUpdate:true,subcategory_id:category_id,subsubcategory_id:0})
    }
    onSubSubCategoryChange = (category_id) => {
        this.setState({localUpdate:true,subsubcategory_id:category_id})
    }
    onChangePrivacy = (value) => {
        this.setState({localUpdate:true,privacy:value})
    }
    componentDidMount(){
        var _this = this
        $(document).on('click','.add_video',function(){
            //
            if(_this.props.pageInfoData && !_this.props.pageInfoData.loggedInUserDetails){
                document.getElementById('loginFormPopup').click();
            }else{
            _this.setState({localUpdate:true,openPopup:true})
            }
        })
    }
    closePopup = () => {
        this.setState({localUpdate:true,openPopup:false})
    }
    chooseVideos(e,selectedVideos) {
        this.setState({localUpdate:true,selectedVideos:selectedVideos,openPopup:false})
    }
    render(){        

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

        let formFields = [
            { key: "title", label: "Title",value:this.state.editItem ? this.state.editItem.title : null,isRequired:true },
            { key: "description", label: "Description",type:"textarea",value:this.state.editItem ? this.state.editItem.description : null },
        ]

        //support price
        if(this.props.pageInfoData.appSettings['channel_support'] == 1){
            validator.push(
                {
                key: "channel_subscription_amount", 
                    validations: [
                        {
                        "validator": Validator.required,
                        "message": "Support Price is required field"
                        }
                    ]
                },
                {
                key: "channel_subscription_amount", 
                    validations: [
                        {
                        "validator": Validator.price,
                        "message": "Please provide valid support price"
                        }
                    ]
                }
            )
            formFields.push(
                { key: "channel_subscription_amount", label: "Support Price(per month)", type: "text", value: this.state.editItem && this.state.editItem.channel_subscription_amount ? this.state.editItem.channel_subscription_amount : "0", placeholder:"00.00",isRequired:true }
            )
        }

        formFields.push(
            { key: "addVideos", type:"content",content:"<button class='add_video' type='button'>"+Translate(this.props,"Add Videos")+"</button>" },
            { key: "image", label: "Upload Image", type:"file",value:this.state.editItem && this.state.editItem.image ? this.props.pageInfoData.imageSuffix+this.state.editItem.image : null }
        )

        if(this.props.pageInfoData.channelCategories){
            let categories = []
            categories.push({key:0,value:0,label:"Please Select Category"})
            this.props.pageInfoData.channelCategories.forEach(res => {
                categories.push({key:res.category_id,label:res.title,value:res.category_id})
            })
            formFields.push({ 
                key: "category_id", 
                label: "Category", 
                type: "select",
                value:this.state.editItem ? this.state.editItem.category_id : null,
                onChangeFunction:this.onCategoryChange,
                options: categories
            })

            //get sub category
            if(this.state.category_id){
                let subcategories = []
                
                this.props.pageInfoData.channelCategories.forEach(res => {
                    if(res.category_id == this.state.category_id){
                        if(res.subcategories){
                            subcategories.push({key:0,value:0,label:"Please Select Sub Category"})
                            res.subcategories.forEach(rescat => {
                                subcategories.push({key:rescat.category_id,label:rescat.title,value:rescat.category_id})
                            })
                        }
                    }
                })


                if(subcategories.length > 0){
                    formFields.push({ 
                        key: "subcategory_id", 
                        value:this.state.editItem ? this.state.editItem.subcategory_id : null,
                        label: "Sub Category", 
                        type: "select",
                        onChangeFunction:this.onSubCategoryChange,
                        options: subcategories
                    } )

                    if(this.state.subcategory_id){
                        let subsubcategories = []
                        
                        this.props.pageInfoData.channelCategories.forEach(res => {
                            if(res.category_id == this.state.category_id){
                                if(res.subcategories){
                                    res.subcategories.forEach(rescat => {
                                        if(rescat.category_id == this.state.subcategory_id){
                                            if(rescat.subsubcategories){
                                                subsubcategories.push({key:0,value:0,label:"Please Select Sub Sub Category"})
                                                rescat.subsubcategories.forEach(ressubcat => {
                                                    subsubcategories.push({key:ressubcat.category_id,label:ressubcat.title,value:ressubcat.category_id})
                                                })
                                            }
                                        }
                                    })
                                }
                            }
                        })

                        if(subsubcategories.length > 0){
                            formFields.push( { 
                                key: "subsubcategory_id", 
                                value:this.state.editItem ? this.state.editItem.subsubcategory_id : null,
                                label: "Sub Sub Category", 
                                type: "select",
                                onChangeFunction:this.onSubSubCategoryChange,
                                options: subsubcategories
                            });
                        }
                    }
                }
            }
        }
        formFields.push({
            key:"tags",
            label:"Tags",
            type:"tags",
            value: this.state.editItem && this.state.editItem.tags ? this.state.editItem.tags.split(",") : null,
        })
        if(this.props.pageInfoData.channelArtists){
            let artists = []

            this.props.pageInfoData.channelArtists.forEach(res => {
                artists.push({value:res.artist_id.toString(),key:res.title,label:res.title,image:this.props.pageInfoData.imageSuffix+res.image})
            })

            formFields.push({
                key: "artists",
                label: "Artists",
                imageSelect:true,
                value: this.state.editItem && this.state.editItem.artists ? this.state.editItem.artists.split(",") : null,
                type: "checkbox",
                value:this.state.editItem && this.state.editItem.artists ? this.state.editItem.artists.split(",") : null,
                options: artists
            })
        }

        if(this.props.pageInfoData.appSettings.channel_adult == "1"){
            formFields.push({
                key: "adult",
                label: "",
                subtype:"single",
                value:[this.state.editItem && this.state.editItem.adult ? "1" : "0"],
                type: "checkbox",
                options: [
                    {
                        value:"1",label:"Mark as Adult",key:"adult_1"
                    }
                ]
            })
        }

        formFields.push({
            key: "search",
            label: "",
            subtype:"single",
            value:[this.state.editItem ? (this.state.editItem.search ? "1" : "0")  : "1"],
            type: "checkbox",
            //value:["1"],
            options: [
                {
                    value:"1",label:"Show this in search results",key:"search_1"
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
                value: this.state.editItem ? this.state.editItem.autoapprove_comments.toString() : "1",
                options: comments
            })
        }
        let privacyOptions = [
            {
                value:"everyone",label:"Anyone",key:"everyone"
            },
            {
                value:"onlyme",label:"Only me",key:"onlyme"
            },
            {
                value:"password",label:"Only people with password",key:"password"
            },
            {
                value:"link",label:"Only to people who have channel link",key:"link"
            }
        ]

        if(this.props.pageInfoData.appSettings.user_follow == "1"){
            privacyOptions.push({
                value:"follow",label:"Only people I follow",key:"follow"
            })
        }

        formFields.push({
            key: "privacy",
            label: "Privacy",
            type: "select",
            value:this.state.editItem ? this.state.editItem.view_privacy : "everyone",
            onChangeFunction:this.onChangePrivacy,
            options: privacyOptions
        })
        if(this.state.privacy == "password"){
            formFields.push({ key: "password", label: "Password" ,'type':"password",value:this.state.editItem ? this.state.editItem.password : "",isRequired:true})
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
        if(!this.firstLoaded){
            formFields.forEach((elem) => {
                if(elem.value)
                    defaultValues[elem.key] = elem.value
                else{
                    defaultValues[elem.key] = ""
                }
            })
            this.firstLoaded = true
        }
        if(this.state.category_id){
            defaultValues['category_id'] = this.state.category_id
        }
        if(this.state.subcategory_id){
            defaultValues['subcategory_id'] = this.state.subcategory_id
        }
        if(this.state.privacy){
            defaultValues['privacy'] = this.state.privacy
        }
        if(this.state.subsubcategory_id){
            defaultValues['subsubcategory_id'] = this.state.subsubcategory_id
        }
        var empty = false
        if(this.empty){
            empty = true
            this.empty = false
        }
        return (
            <React.Fragment>
                { this.state.openPopup ?  <AddVideos {...this.props} chooseVideos={this.chooseVideos} closePopup={this.closePopup} title={Translate(this.props,"Add video to channel")} /> :null }
                    <Breadcrum {...this.props}  image={this.props.pageData['pageInfo']['banner'] ? this.props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"} title={`${this.state.editItem ? "Edit" : "Create"} Channel`} />          
                    <div className="mainContentWrap">
                        <div className="container">
                        <div className="row">
                            <div className="col-md-12">
                            <div className="formBoxtop loginp content-form" ref={this.myRef}>
                                <Form
                                    //key={this.state.current.id}
                                    className="form"
                                    //title={this.state.title}
                                    defaultValues={defaultValues}
                                    validators={validator}
                                    empty={empty}
                                    generalError={this.state.error}
                                    {...this.props}
                                    submitText={!this.state.submitting ? "Submit" : "Submit..."}
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
        )
    }
}

const mapStateToProps = state => {
    return {
        pageInfoData:state.general.pageInfoData
    };
  };

 
export default connect(mapStateToProps,null) (Channel) ;