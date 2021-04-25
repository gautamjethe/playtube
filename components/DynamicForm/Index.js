import React from "react";

import Spinner from "../../components/UI/Spinner"
import File from "./file"
import Translate from "../Translate/Index";
let  DatePicker  = null
import AutoSuggest from "../../containers/Autosuggest/Index"



export default class DynamicForm extends React.Component {
  state = {};
  constructor(props) {
    super(props);
    this.state = {
      errors: {},
      tags: [],
      fields: props.initalValues ? props.initalValues : (props.defaultValues ? props.defaultValues : {})
    }
  }
 
  removeImage = (m,e) => {
    let fields = { ...this.state.fields }
    fields[this.uploadKey] = null
    if(m.onChangeFunction){
      m.onChangeFunction(false);
    }
    this.setState(
      {
        localUpdate:true, 
        fields,
        videoWidth: null
      },
      () => { }
    );
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if(prevState.localUpdate){
        return {...prevState,localUpdate:false}
    }
    let updateData = {}
    if (nextProps.defaultValues && !nextProps.empty) {
      updateData['fields'] =   { ...prevState["fields"], ...nextProps.defaultValues } 
    } 
    if (nextProps.defaultValues && nextProps.empty) {
      updateData['fields'] = { ...prevState["fields"], ...nextProps.defaultValues }
    }
    if (nextProps.videoKey){
      updateData['videoKey'] =  nextProps.videoKey
    }
    if (nextProps.defaultValues && nextProps.defaultValues.tags){
      updateData['tags'] =  nextProps.defaultValues.tags
    }
    
    if(Object.keys(updateData).length){
      return {...prevState,...updateData}
    }else{
        return null
    }
}
  componentDidMount() {
    if (this.props.defaultValues)
      this.setState({localUpdate:true, fields: { ...this.props.defaultValues } })
    if (this.props.videoKey)
      this.setState({localUpdate:true, videoKey: this.props.videoKey })
    if (this.props.defaultValues && this.props.defaultValues.tags)
      this.setState({localUpdate:true, tags: this.props.defaultValues.tags })
    DatePicker = require("react-date-picker").default
  }

  // Validate form fields (This is configured in DynamicForm as props)
  validate = () => {
    let errors = {};
    const validators = this.props.validators;
    validators.forEach((v) => {
      let fieldValue = this.state.fields[v.key];
      v.validations.forEach((vd) => {
        let r = vd.validator(fieldValue,v.key);
        
        if (!r) {
          if (!errors[v.key]) {
            if (errors[v.key] == undefined) {
              errors[v.key] = [];
            }
            errors[v.key].push(Translate(this.props, vd.message));
          }
        }
      });
    })
    return errors
  }

  onSubmit = e => {
    e.preventDefault();
    let errors = this.validate();
    if (errors != this.state.errors)
      this.setState({localUpdate:true, errors: errors })
    if (Object.entries(errors).length !== 0) {
      return false;
    }
    if (this.props.onSubmit) {
      const state = { ...this.state.fields }
      if(state['tags'])
        state['tags'] = []
      if (this.state.tags.length)
        state.tags = this.state.tags
      this.props.onSubmit(state);
    }
  };

  onChange = (e, key, type = "single", fieldType = "", m) => {
   
    let fields = { ...this.state.fields }
    let errors = { ...this.state.errors }
    if (type === "single") {
      if (fieldType == "file" || fieldType == "video" || fieldType == "audio") {
        var url = e.dataTransfer ? e.dataTransfer.files[0].name : e.target.value;
        var file = !e.dataTransfer ? e.target.files[0] : e.dataTransfer.files[0]
        var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        if (fieldType == "file" && file && (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == 'PNG' || ext == 'JPEG' || ext == 'JPG')) {
          fields[key] = file
          errors[key] = null
          this.setState({localUpdate:true,
            fields: fields,
            errors:errors
          });
          if (m && m.onChangeFunction) {
            m.onChangeFunction(file)
          }
          return
        } else if (fieldType == "video" && file && (ext == "flv" || ext == "ogg" || ext == "mkv" || ext == "mk3d" || ext == "mks" || ext == "wmv" || ext == "flv" || ext == "mp4" || ext == "mov" || ext == "webm" || ext == 'mpeg' || ext == '3gp' || ext == 'avi')) {
          fields[key] = file
          errors[key] = null
          this.setState({localUpdate:true,
            fields: fields,
            errors:errors
          });
          if (m && m.onChangeFunction) {
            m.onChangeFunction(file)
          }
          return
        }else if (fieldType == "audio" && file && (ext == "mp3")) {
          fields[key] = file
          errors[key] = null
          this.setState({localUpdate:true,
            fields: fields,
            errors:errors
          });
          if (m && m.onChangeFunction) {
            m.onChangeFunction(file)
          }
          return
        } else {
          fields[key] = null
          this.setState({localUpdate:true,
            fields: fields
          });
          return;
        }
      }
      errors[key] = null
      fields[key] = e && e.target ? e.target.value : e
      this.setState({localUpdate:true,
        fields: fields,
        errors:errors
      },() => {
      });
    } else {
      // Array of values (e.g. checkbox): TODO: Optimization needed.
      let found = this.state.fields[key] 
        ? this.state.fields[key].find(d => d === e.target.value)
        : false;
      let index = this.getSingleType(key)
      if(index > -1 && this.props.model[index].subtype == "single"){
        fields[key] = [this.state.fields[key] && this.state.fields[key].indexOf("1") > -1 ? "0" : e.target.value]
        errors[key] = null
        this.setState({localUpdate:true,
          fields: fields,
          errors:errors
        });
      }else if (found) {
        let data = this.state.fields[key].filter(d => {
          return d !== found;
        });
        fields[key] = data
        errors[key] = null
        this.setState({localUpdate:true,
          fields: fields,
          errors:errors
        });

      } else {
        let others = this.state.fields[key] ? [...this.state.fields[key]] : [];
        fields[key] = [e.target.value, ...others]
        errors[key] = null
        this.setState({localUpdate:true,
          fields: fields,
          errors:errors
        });

      }
    }
    if (m && m.onChangeFunction) {
      m.onChangeFunction(e.target.value)
    }
  };
  removeTag = (i) => {
    const newTags = [...this.state.tags];
    newTags.splice(i, 1);
    this.setState({localUpdate:true, tags: newTags });
  }

  inputKeyDown = (e) => {
    const val = e.target.value;
    if (e.key === 'Enter' && val) {
      if (this.state.tags.find(tag => tag.toLowerCase() === val.toLowerCase())) {
        e.preventDefault();
        return;
      }
      this.setState({localUpdate:true, tags: [...this.state.tags, val] });
      this.tagInput.value = null;
      e.preventDefault();
    } else if (e.key === 'Backspace' && !val) {
      this.removeTag(this.state.tags.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
    }
  }
  videoLoaded = (e) => {
    if (!this.state.videoWidth)
      this.setState({localUpdate:true, videoWidth: jQuery('#video_cnt').width() })
  }
  getSingleType = (key) => {
    const models = [...this.props.model];
    const modelIndex = models.findIndex(p => p.key == key);
    return modelIndex;
  }
  createForm = (m) => {
    let key = m.key;

      let type = m.type || "text";
      let props = m.props || {};
      let name = m.name;
      let value = m.value;
      let target = key;
      value = this.state.fields[target];
      if (typeof value == "undefined")
        value = ""
      let errorDiv = null
      if (Object.entries(this.state.errors).length !== 0 && this.state.errors[key]) {
        errorDiv = (
          <span className="error">{this.state.errors[key]}</span>
        )
      }
      let input = (
        <React.Fragment>
          {
            m.copyText ? 
              <div className="copy_container">
                <input
                  {...props}
                  className="form-input form-control"
                  type={type}
                  key={key}
                  id={key}
                  placeholder={m.placeholder ? Translate(this.props, m.placeholder) : null}
                  name={name}
                  value={value ? value : ""}
                  onChange={e => {
                    this.onChange(e, target);
                  }}
                />
                <button type="button" onClick={(e) => m.onClickCopy(value)} className="copy_txt">{Translate(this.props, "Copy")}</button>
              </div>
            :
            <input
              {...props}
              className="form-input form-control"
              type={type}
              key={key}
              id={key}
              placeholder={m.placeholder ? Translate(this.props, m.placeholder) : null}
              name={name}
              value={value ? value : ""}
              onChange={e => {
                this.onChange(e, target);
              }}
            />
          }
          
        </React.Fragment>
      );
      
      if (type == "textarea") {
        input = (
          m.htmlEditor ?
            m.htmlEditor
            :
            <textarea
              {...props}
              className="form-input form-control"
              type={type}
              key={key}
              id={key}
              name={name}
              value={value ? value : ""}
              onChange={e => {
                this.onChange(e, target);
              }}
            ></textarea>
        );
      }
      var createObjectURL = (URL || webkitURL || {}).createObjectURL || function () { };
      if (type == "file" || type == "video" || type == "audio") {
        this.uploadKey = key
        input = (
          <React.Fragment>
            {!value || type == "video" ?
              <File {...this.props} videoKey={this.state.videoKey} type={type} name={name} target={target} m={m} keyName={key} dropRef={this.dropRef} onChange={this.onChange} fileUpload={this.fileUpload} clickUploadImage={this.clickUploadImage} defaultText={Translate(this.props, m.defaultText)} />
              : type == "audio" ?
              <File {...this.props} videoKey={"audio"} type={type} name={name} target={target} m={m} keyName={key} dropRef={this.dropRef} onChange={this.onChange} fileUpload={this.fileUpload} clickUploadImage={this.clickUploadImage} defaultText={Translate(this.props, m.defaultText)} />
              :
              type != "video" ?
                <div className="previewUploadImg" style={{ display: (value ? "block" : "none") }}>
                  <div>
                    <img src={value ? (typeof value == "string" ? value : createObjectURL(value)) : null} alt={Translate(this.props, "Image Preview")} />
                    <span className="close closePreviewImage" onClick={this.removeImage.bind(this,m)}>x</span>
                  </div>
                </div>
                : null
              // <div className="previewUploadImg" style={{display:(value ? "block": "none")}}>
              //   <div style={{maxWidth:"100%",width:this.state.videoWidth ? this.state.videoWidth : "50%"}}>
              //     <video id="video_cnt" preload={'auto'} onLoadedData={this.videoLoaded} controls src={value ? createObjectURL(value) : null} alt="preview" />
              //     <span className="close closePreviewImage" onClick={this.removeImage}>x</span>
              //   </div>
              // </div>
            }
          </React.Fragment>
        );
      }
      if (type == "simplefile") {
        input = <input
          {...props}
          className="custom-control-file"
          type="file"
          key={key}
          id={key}
          accept={"video/*"}
          name={name}
          onChange={e => {
            this.onChange(e, target,'single','video');
          }}
        />
      }
      if (type == "content") {
        input = ""
      }
      if (type == "radio") {
        input = m.options.map(o => {
          let checked = o.value == value;
          return (
            <div className="custom-control custom-radio">
              <input
                {...props}
                className="custom-control-input"
                type={type}
                key={o.key}
                name={o.name}
                checked={checked}
                value={o.value}
                id={"ll" + o.key}
                onChange={e => {
                  this.onChange(e, o.name);
                }}
              />
              <label key={"ll" + o.key} className="custom-control-label" htmlFor={"ll" + o.key}>{Translate(this.props, o.label)}</label>
            </div>
          );
        });
      }
      if (type == "select") {
        input = m.options.map(o => {
          let checked = o.value == value;
          return (
            <option
              {...props}
              key={o.key}
              value={o.value}
              defaultValue={checked}
            >
              {Translate(this.props, o.label)}
            </option>
          );
        });

        input = (
          <select
            value={value}
            className="form-control"
            onChange={e => {
              this.onChange(e, m.key, 'single', type, m);
            }}
          >
            {input}
          </select>
        );
      }
      if (type == "tags") {
        if (this.state.tags.length) {
          input = this.state.tags.map((tag, i) => (
            <li key={tag}>
              {tag}
              <button type="button" onClick={() => { this.removeTag(i); }}>+</button>
            </li>
          ))
        } else {
          input = null
        }
        input =
          <div className="input-tag">
            <ul className="input-tag__tags">
              {input}
              <li className="input-tag__tags__input">
                <input placeholder={this.props.t("Tags")} type="text" onKeyDown={this.inputKeyDown} ref={c => { this.tagInput = c; }} />
              </li>
            </ul>
          </div>

      } 

      if (type == "checkbox") {
        m.imageSelect ? 
          input = m.options.map(o => {
            let checked = false;
            if (value && value.length > 0) {
              checked = value.indexOf(o.value) > -1 ? true : false;
            }
            return (
              <React.Fragment key={"cfr" + o.key}>
                <div className="col-lg-2 col-sm-4 col-12">
                    <div className="custom-control custom-checkbox image-checkbox">
                              <input
                              {...props}
                              className="custom-control-input"
                              type={type}
                              key={"LL" + o.key}
                              name={o.name}
                              id={"LL" + o.key}
                              checked={checked} 
                              value={o.value}
                              onChange={e => {
                                this.onChange(e, m.key, "multiple");
                              }}
                            />
                        <label key={"ll" + o.key} className="custom-control-label" htmlFor={"LL" + o.key}>
                            <img src={o.image}
                                alt={Translate(this.props, o.label)} className="img-fluid" />
                            <p className="nameSelectImg">{Translate(this.props, o.label)}</p>
                        </label>
                    </div>
                </div>
              </React.Fragment>
            );
          })
        :
        input = m.options.map(o => {
          let checked = false;
          if (value && value.length > 0) {
            checked = value.indexOf(o.value) > -1 ? true : false;
          }
          return (
            <React.Fragment key={"cfr" + o.key}>
              <div className="custom-control custom-switch">
                <input
                  {...props}
                  className="custom-control-input"
                  type={type}
                  key={"LL" + o.key}
                  name={o.name}
                  id={"LL" + o.key}
                  checked={checked} 
                  value={o.value}
                  onChange={e => {
                    this.onChange(e, m.key, "multiple");
                  }}
                />
                <label key={"ll" + o.key} className="custom-control-label" htmlFor={"LL" + o.key}>
                  {
                    o.image ?
                      <div><img src={o.image} style={{ height: "100px" }} /><p>{Translate(this.props, o.label)}</p></div>
                      : Translate(this.props, o.label)
                  }

                </label>
              </div>
            </React.Fragment>
          );
        });
      }
      if (type == "checkbox") {
        if(m.imageSelect){
          input = <div className="imgSelectWrap container">
              <div className="row">
                  {input}
              </div>
            </div>
        }
      }
      if (type == "date" && DatePicker) {
          input = <DatePicker
            onChange={e => {
              this.onChange(e, m.key, 'single', type, m);
            }}
            value={value}
          />
      }
      if (type == "autosuggest"){
        input = <AutoSuggest {...this.props} {...m} setAutosuggestId={this.onChange} keyValue={m.key}  />
      }
      if(type == "text_description"){
        input = null
      }
      return (
        <React.Fragment>
          {
            m.label ? 
          <label className="form-label" key={"l" + key} htmlFor={key}>
            {Translate(this.props, m.label)}
            {
              m.isRequired ? 
              <span className="field_mantatory">*</span>
              : null
            }
          </label>
          : null
          }
          {
            type != "content" ?
              input
              :
              <div className="button" dangerouslySetInnerHTML={{ __html: m.content }}></div>
          }
          {
            m.postDescription ? 
              <div className="form-description-cnt" dangerouslySetInnerHTML={{ __html: m.postDescription }}></div>
            : null
          }
          {errorDiv}
        </React.Fragment>
      );
  }
  renderForm = () => {
    let model = this.props.model;

    let formUI = model.map(m => {
        if(m.key != "group_data"){
          return <div key={"g" + m.key} className="form-group">{this.createForm(m)}</div>
        }else{
          let length = m.values.length
          return <div key={"g" + m.keyValue} className="form-group form-group-fields">
            {
                m.values.map(m => {
                  return <div key={"g" + m.key} className={`parent-cnt col-sm-${12/length}`}><div className="form-group">{this.createForm(m)}</div></div>
              })
            }
          </div>
        }
    });
    return formUI;
  };

  render() {
    let title = this.props.title || "";
    let generalError = null
    if (this.props.generalError) {
      if (typeof this.props.generalError == "string") {
          generalError =
            <div key="error_1" className="alert alert-danger alert-dismissible fade show" role="alert">
              {Translate(this.props, this.props.generalError)}
            </div>
      } else {
        let errors = []
        if(this.props.generalError.error){
          errors = this.props.generalError.error
        }else{
          errors = this.props.generalError
        }
        try{
          generalError =
            errors.map((error, index) => {
              return (
                <div key={index} className="alert alert-danger alert-dismissible fade show" role="alert">
                  {Translate(this.props, error.message ? error.message : error.msg)}
                  {/* <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">×</span>
                  </button> */}
                </div>
              )
            })
          }catch(error){
          //silence
        }

      }
    }else if(this.props.errorMessage){
      if (typeof this.props.errorMessage == "string") {
        generalError =
          <div key="error_1" className="alert alert-danger alert-dismissible fade show" role="alert" dangerouslySetInnerHTML={{ __html: this.props.errorMessage }}></div>
      }
    }

    return (
      <div className="user-area clear">
        <div className={"container " + this.props.className}>
          {
            title ? 
              <div className="row">
                <div className="col-md-12">
                  <div className="titleform">
                    {Translate(this.props, title)}
                  </div>
                </div>
              </div>
            : null
          }
          {
            generalError ?
              <div className="row form-error">
                <div className="col-md-12">
                  <div className="generalErrors">
                    {generalError}
                  </div>
                </div>
              </div>
              : null
          }
          {
            this.props.model.length ? 
          <form
            className="formFields"
            onSubmit={e => {
              this.onSubmit(e);
            }}
          >
            {this.renderForm()}
            {
              !this.props.submitHide ?
                <div className="input-group">
                  <button type="submit" disabled={this.props.disableButtonSubmit}>{Translate(this.props, this.props.submitText ? this.props.submitText : "Submit Form")}</button>
                </div>
                : null
            }
           
            {
              this.props.percentCompleted > 0 || this.props.processing ? 
                <div className="sc-upload-progressbar">
                    {
                        this.props.percentCompleted < 100 && !this.props.processing ? 
                        <React.Fragment>
                          <div className="sc-imageprocess">
                            <div className="sc-progress-upload-txt">
                                {this.props.t("Uploading...")}
                            </div>
                            <div className="sc-cnt-percent">
                              <div className="sc-percentage-100" style={{width:(this.props.percentCompleted > 30 ? this.props.percentCompleted - 5 : this.props.percentCompleted)+"%"}}>
                              </div>
                              <div className="sc-progressbar-cnt" style={{marginLeft:(this.props.percentCompleted > 30 ? this.props.percentCompleted - 5 : this.props.percentCompleted)+"%"}}>
                                {this.props.percentCompleted}%
                              </div>
                            </div>
                           
                          </div>
                        </React.Fragment>
                    
                    : null
                    }
                    {
                        this.props.processing ? 
                    <div className="sc-imageprocess-txt">
                        <svg width="60px" viewBox="0 0 100 100" height="60px" dangerouslySetInnerHTML={{__html:'<circle cx="84" cy="50" r="2.56936" fill="#fff"><animate attributeName="r" repeatCount="indefinite" dur="0.5434782608695652s" calcMode="spline" keyTimes="0;1" values="8;0" keySplines="0 0.5 0.5 1" begin="0s"></animate><animate attributeName="fill" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="discrete" keyTimes="0;0.25;0.5;0.75;1" values="#e91d2a;#e91d2a;#e91d2a;#e91d2a;#e91d2a" begin="0s"></animate></circle><circle cx="73.0786" cy="50" r="8" fill="#fff"><animate attributeName="r" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;8;8;8" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="0s"></animate><animate attributeName="cx" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="0s"></animate></circle><circle cx="16" cy="50" r="0" fill="#fff"><animate attributeName="r" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;8;8;8" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-0.5434782608695652s"></animate><animate attributeName="cx" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-0.5434782608695652s"></animate></circle><circle cx="16" cy="50" r="5.43026" fill="#fff"><animate attributeName="r" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;8;8;8" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-1.0869565217391304s"></animate><animate attributeName="cx" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-1.0869565217391304s"></animate></circle><circle cx="39.0786" cy="50" r="8" fill="#fff"><animate attributeName="r" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;8;8;8" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-1.6304347826086956s"></animate><animate attributeName="cx" repeatCount="indefinite" dur="2.1739130434782608s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-1.6304347826086956s"></animate></circle>'}}></svg>
                        {
                            this.props.t(this.props.textProgress)
                        }
                    </div>
                    : null
                    }
                </div>
              : this.props.loading ? <Spinner type="uploading" /> : null
            }
          </form>
          : null
         }
        </div>
      </div>
    );
  }
}
