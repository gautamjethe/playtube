import React, { Component } from "react";

import Breadcrum from "../../components/Breadcrumb/Form";

import Form from "../../components/DynamicForm/Index";

import { connect } from "react-redux";

import Validator from "../../validators";

import axios from "../../axios-orders";

import Router from "next/router";
import confiFlile from "../../config"

import { Editor } from '@tinymce/tinymce-react';
import imageCompression from 'browser-image-compression';


class Blog extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editor: false,
      editItem: props.pageInfoData.editItem,
      editorState: props.pageInfoData.editItem ? props.pageInfoData.editItem.description : "",
      title: props.pageInfoData.editItem ? "Edit Blog" : "Create Blog",
      category_id: props.pageInfoData.editItem
        ? props.pageInfoData.editItem.category_id
        : null,
      subcategory_id: props.pageInfoData.editItem
        ? props.pageInfoData.editItem.subcategory_id
        : null,
      subsubcategory_id: props.pageInfoData.editItem
        ? props.pageInfoData.editItem.subsubcategory_id
        : null,
      privacy: props.pageInfoData.editItem
        ? props.pageInfoData.editItem.view_privacy
        : "everyone",
      success: false,
      error: null
    };
    this.myRef = React.createRef();
  } 
  
  static getDerivedStateFromProps(nextProps, prevState) {
    if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
        return null;
    }
    if(prevState.localUpdate){
        return {...prevState,localUpdate:false}
    }else {
        return {
          editor: true,
          editItem: nextProps.pageInfoData.editItem,
          editorState: nextProps.pageInfoData.editItem ? nextProps.pageInfoData.editItem.description : "",
          title: nextProps.pageInfoData.editItem ? "Edit Blog" : "Create Blog",
          category_id: nextProps.pageInfoData.editItem
            ? nextProps.pageInfoData.editItem.category_id
            : null,
          subcategory_id: nextProps.pageInfoData.editItem
            ? nextProps.pageInfoData.editItem.subcategory_id
            : null,
          subsubcategory_id: nextProps.pageInfoData.editItem
            ? nextProps.pageInfoData.editItem.subsubcategory_id
            : null,
          privacy: nextProps.pageInfoData.editItem
            ? nextProps.pageInfoData.editItem.view_privacy
            : "everyone",
          success: false,
          error: null
        }
    }
}
componentDidUpdate(prevProps,prevState){
    if(this.props.editItem != prevProps.editItem){
        this.empty = true
        this.firstLoaded = false
    }
}


  componentDidMount() {
    this.setState({localUpdate:true, editor: true });
  }

  onSubmit = async model => {
    if (
      this.props.pageInfoData &&
      !this.props.pageInfoData.loggedInUserDetails
    ) {
      document.getElementById("loginFormPopup").click();
      return false;
    }
    if (this.state.submitting) {
      return;
    }
    this.setState({localUpdate:true, submitting: true, error: null });
    let formData = new FormData();
    for (var key in model) {
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
    if (model["image"]) {
      let image = typeof model["image"] == "string" ? model["image"] : false;
      if (image) {
        formData.append("blogImage", image);
      }
    }

    const config = {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    };
    let url = "/blogs/create";
    if (this.state.editItem) {
      formData.append("blogId", this.state.editItem.blog_id);
    }
    
    axios
      .post(url, formData, config)
      .then(response => {
        if (response.data.error) {
          window.scrollTo(0, this.myRef.current.offsetTop);
          this.setState({localUpdate:true, error: response.data.error, submitting: false });
        } else {
          Router.push(
            `/blog?blogId=${response.data.custom_url}`,
            `/blog/${response.data.custom_url}`
          );
        }
      })
      .catch(err => {
        this.setState({localUpdate:true, submitting: false, error: err });
      });
  };

  onCategoryChange = category_id => {
    this.setState({localUpdate:true,
      category_id: category_id,
      subsubcategory_id: 0,
      subcategory_id: 0
    });
  };
  onSubCategoryChange = category_id => {
    this.setState({localUpdate:true, subcategory_id: category_id, subsubcategory_id: 0 });
  };
  onSubSubCategoryChange = category_id => {
    this.setState({localUpdate:true, subsubcategory_id: category_id });
  };
  onChangePrivacy = value => {
    this.setState({localUpdate:true, privacy: value });
  };
  uploadMedia = e => {
    this.onSubmitUploadImport({ upload: e });
  };
  handleEditorChange = (e) => {
    this.setState({localUpdate:true, editorState: e.target.getContent() });
  }
  uploadImageCallBack(file) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/blogs/upload-image");
      const data = new FormData();
      data.append("image", file);
      xhr.send(data);
      xhr.addEventListener("load", () => {
        const response = JSON.parse(xhr.responseText);
        if (response.link) resolve({ data: { link: response.link } });
      });
      xhr.addEventListener("error", () => {
        const error = JSON.parse(xhr.responseText);
        reject(error);
      });
    });
  }
  render() {
    let validator = [
      {
        key: "title",
        validations: [
          {
            validator: Validator.required,
            message: "Title is required field"
          }
        ]
      },
      {
        key: "description",
        validations: [
          {
            validator: Validator.required,
            message: "Description is required field"
          }
        ]
      }
    ];


    let theme = ""
		if(this.props.pageInfoData && this.props.pageInfoData.themeMode){
			theme = this.props.pageInfoData.themeMode
    }
    
    let htmlEditor = null;
    {
      this.state.editor
        ? (htmlEditor = (
            <Editor
              initialValue={this.state.editorState}
              apiKey={this.props.pageInfoData.tinymceKey}
              init={{
                height: 700,
                menubar: true,
                skin: 'oxide'+(theme != "white" ? "-"+theme : ""),
                images_upload_url: confiFlile.app_server+'/api/blogs/upload-image',
                plugins: [
                  'advlist autolink lists link image charmap print preview anchor',
                  'searchreplace visualblocks code fullscreen',
                  'insertdatetime media table paste code help wordcount'
                ],
                toolbar:
                  'undo redo | formatselect | bold italic backcolor | \
                  alignleft aligncenter alignright alignjustify | \
                  bullist numlist outdent indent | removeformat | help'
              }}
              onChange={this.handleEditorChange}
            />
          ))
        : null;
    }

    let formFields = [
      {
        key: "title",
        label: "Title",
        value: this.state.editItem ? this.state.editItem.title : ""
        ,isRequired:true
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        htmlEditor: htmlEditor
        ,isRequired:true
      },
      {
        key: "image",
        label: "Upload Image",
        type: "file",
        value: this.state.editItem && this.state.editItem.image ?  this.props.pageInfoData.imageSuffix +this.state.editItem.image : ""
      }
    ];

    if (this.props.pageInfoData.blogCategories) {
      let categories = [];
      categories.push({ key: 0, value: 0, label: "Please Select Category" });
      this.props.pageInfoData.blogCategories.forEach(res => {
        categories.push({
          key: res.category_id,
          label: res.title,
          value: res.category_id
        });
      });
      formFields.push({
        key: "category_id",
        label: "Category",
        type: "select",
        value: this.state.editItem ? this.state.editItem.category_id : "",
        onChangeFunction: this.onCategoryChange,
        options: categories
      });

      //get sub category
      if (this.state.category_id) {
        let subcategories = [];

        this.props.pageInfoData.blogCategories.forEach(res => {
          if (res.category_id == this.state.category_id) {
            if (res.subcategories) {
              subcategories.push({
                key: 0,
                value: 0,
                label: "Please Select Sub Category"
              });
              res.subcategories.forEach(rescat => {
                subcategories.push({
                  key: rescat.category_id,
                  label: rescat.title,
                  value: rescat.category_id
                });
              });
            }
          }
        });

        if (subcategories.length > 0) {
          formFields.push({
            key: "subcategory_id",
            label: "Sub Category",
            type: "select",
            value: this.state.editItem
              ? this.state.editItem.subcategory_id
              : "",
            onChangeFunction: this.onSubCategoryChange,
            options: subcategories
          });

          if (this.state.subcategory_id) {
            let subsubcategories = [];

            this.props.pageInfoData.blogCategories.forEach(res => {
              if (res.category_id == this.state.category_id) {
                if (res.subcategories) {
                  res.subcategories.forEach(rescat => {
                    if (rescat.category_id == this.state.subcategory_id) {
                      if (rescat.subsubcategories) {
                        subsubcategories.push({
                          key: 0,
                          value: 0,
                          label: "Please Select Sub Sub Category"
                        });
                        rescat.subsubcategories.forEach(ressubcat => {
                          subsubcategories.push({
                            key: ressubcat.category_id,
                            label: ressubcat.title,
                            value: ressubcat.category_id
                          });
                        });
                      }
                    }
                  });
                }
              }
            });

            if (subsubcategories.length > 0) {
              formFields.push({
                key: "subsubcategory_id",
                label: "Sub Sub Category",
                value: this.state.editItem
                  ? this.state.editItem.subsubcategory_id
                  : "",
                type: "select",
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
      type: "tags",
      value:
        this.state.editItem && this.state.editItem.tags
          ? this.state.editItem.tags.split(",")
          : ""
    });

    if (this.props.pageInfoData.appSettings.blog_adult == "1") {
      formFields.push({
        key: "adult",
        label: "",
        type: "checkbox",
        subtype:"single",
        value:[this.props.pageInfoData.editItem && this.props.pageInfoData.editItem.adult ? "1" : "0"],
        options: [
          {
            value: "1",
            label: "Mark Blog as Adult",
            key: "adult_1"
          }
        ]
      });
    }

    formFields.push({
      key: "search",
      label: "",
      value:[this.props.pageInfoData.editItem ? (this.props.pageInfoData.editItem.search ? "1" : "0")  : "1"],
      type: "checkbox",
      subtype:"single",
      options: [
        {
          value: "1",
          label: "Show this blog in search results",
          key: "search_1"
        }
      ]
    });
    if(this.props.pageInfoData.appSettings['enable_comment_approve'] == 1){
      let comments = []
      comments.push({ value: "1", key: "comment_1", label: "Display automatically" })
      comments.push({ value: "0", key: "comment_0", label: "Don't display until approved" })
      formFields.push({
          key: "comments",
          label: "Comments Setting",
          type: "select",
          value: this.props.pageInfoData.editItem ? this.props.pageInfoData.editItem.autoapprove_comments.toString() : "1",
          options: comments
      })
    }
    let privacyOptions = [
      {
        value: "everyone",
        label: "Anyone",
        key: "everyone"
      },
      {
        value: "onlyme",
        label: "Only me",
        key: "onlyme"
      },
      {
        value: "link",
        label: "Only to people who have blog link",
        key: "link"
      }
    ];

    if (this.props.pageInfoData.appSettings.user_follow == "1") {
      privacyOptions.push({
        value: "follow",
        label: "Only people I follow",
        key: "follow"
      });
    }

    formFields.push({
      key: "privacy",
      label: "Privacy",
      type: "select",
      value: this.state.editItem
        ? this.state.editItem.view_privacy
        : "everyone",
      onChangeFunction: this.onChangePrivacy,
      options: privacyOptions
    });
    {
      !this.state.editItem || this.state.editItem.draft == "0"
        ? formFields.push({
            key: "draft",
            label: "Published/Draft",
            type: "select",
            value: this.state.editItem ? (!this.state.editItem.draft ? "0" : "1") : "1",
            options: [
              {
                value: 1,
                label: "Published",
                key: "publish"
              },
              {
                value: 0,
                label: "Draft",
                key: "draft"
              }
            ]
          })
        : null;
    }

    let defaultValues = {};
    if(!this.firstLoaded){
      formFields.forEach(elem => {
        if (elem.key == "description")
          defaultValues[elem.key] = this.state.editorState;
        else if (elem.value) defaultValues[elem.key] = elem.value;
      });
      this.firstLoaded = true
    }
    if (this.state.category_id) {
      defaultValues["category_id"] = this.state.category_id;
    }
    if (this.state.subcategory_id) {
      defaultValues["subcategory_id"] = this.state.subcategory_id;
    }
    if (this.state.privacy) {
      defaultValues["privacy"] = this.state.privacy;
    }
    if (this.state.subsubcategory_id) {
      defaultValues["subsubcategory_id"] = this.state.subsubcategory_id;
    }
    if (this.state.editorState) {
      defaultValues["description"] = this.state.editorState;
    }
    var empty = false
    if(this.empty){
        empty = true
        this.empty = false
    }
    return (
      <React.Fragment>
          <Breadcrum {...this.props}  image={this.props.pageData['pageInfo']['banner'] ? this.props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"}title={`${this.state.editItem ? "Edit" : "Create"} Blog`} />          
          <div className="mainContentWrap">
            <div className="container">
              <div className="row">
                <div className="col-md-12">
                  <div className="formBoxtop loginp content-form" ref={this.myRef}>
                    <Form
                      className="form"
                      {...this.props}
                      //title={this.state.title}
                      defaultValues={defaultValues}
                      validators={validator}
                      submitText={
                        !this.state.submitting ? "Submit" : "Submitting..."
                      }
                      empty={empty}
                      generalError={this.state.error}
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
    );
  }
}

const mapStateToProps = state => {
  return {
    pageInfoData: state.general.pageInfoData
  };
};

export default connect(mapStateToProps, null)(Blog);
