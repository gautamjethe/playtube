import React, { Component } from "react"
import { connect } from "react-redux";
import * as actions from '../../store/actions/general';

import Validator from '../../validators';
import axios from "../../axios-orders"

import AddVideos from '../../containers/Video/Popup'
import Form from '../../components/DynamicForm/Index'

import Cover from "../Cover/Index"
import Translate from "../../components/Translate/Index"
import Rating from "../Rating/Index"

import Comment from "../Comments/Index"
import Videos from "./Videos"
import Playlists from "../Playlist/Playlists"
import Artists from "../Artist/Artists";
import Router from "next/router"
import swal from 'sweetalert'

import Link from "../../components/Link/index"
import CensorWord from "../CensoredWords/Index"
import ShortNumber from "short-number"

import Community from "./Communities"
import AddPost from "./AddPost"
import Members from "../User/Browse"

import asyncComponent from '../../hoc/asyncComponent/asyncComponent';
const CarouselChannels = asyncComponent(() => {
    return import('./CarouselChannel');
});

import Date from "../Date"

class Index extends Component {
  constructor(props) {
    super(props)
    this.state = {
      submitting: false,
      channel: props.pageInfoData.channel,
      openPopup: false,
      openPlaylistPopup: false,
      relatedChannels: props.pageInfoData.relatedChannels,
      password:this.props.pageInfoData.password,
      adult:this.props.pageInfoData.adultChannel,

    }
    this.closePopup = this.closePopup.bind(this)
    this.chooseVideos = this.chooseVideos.bind(this)
    this.closePlaylistPopup = this.closePlaylistPopup.bind(this)
    this.choosePlaylist = this.choosePlaylist.bind(this)
  }
  
  static getDerivedStateFromProps(nextProps, prevState) {
    if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
        return null;
    }
    if(prevState.localUpdate){
        return {...prevState,localUpdate:false}
    }else if (nextProps.pageInfoData.channel && nextProps.pageInfoData.channel != prevState.channel) {
        return { 
          channel: nextProps.pageInfoData.channel, 
          relatedChannels: nextProps.pageInfoData.relatedChannels,
          password:nextProps.pageInfoData.password,
          adult:nextProps.pageInfoData.adultChannel,
          openPopup:false,
          openPlaylistPopup:false
        }
    } else{
        return null
    }
  }
  checkPassword = model => {
    if (this.state.submitting) {
      return
    }
    const formData = new FormData();
    for (var key in model) {
      formData.append(key, model[key]);
    }
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };
    let url = '/channels/password/' + this.props.pageInfoData.channelId;

    this.setState({localUpdate:true, submitting: true, error: null });
    axios.post(url, formData, config)
      .then(response => {
        if (response.data.error) {
          this.setState({localUpdate:true, error: response.data.error, submitting: false });
        } else {
          this.setState({localUpdate:true, submitting: false, error: null })
          this.props.setPageInfoData(response.data.data)
        }
      }).catch(err => {
        this.setState({localUpdate:true, submitting: false, error: err });
      });
  }
  deleteChannel = (e) => {
    e.preventDefault()
    swal({
      title: Translate(this.props,"Are you sure?"),
      text: Translate(this.props,"Once deleted, you will not be able to recover this channel!"),
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
      .then((willDelete) => {
        if (willDelete) {
          const formData = new FormData()
          formData.append('id', this.state.channel.custom_url)
          const url = "/channels/delete"
          axios.post(url, formData)
            .then(response => {
              if (response.data.error) {
                swal("Error", Translate(this.props,"Something went wrong, please try again later"), "error");
              } else {
                this.props.openToast(Translate(this.props,response.data.message), "success");
                Router.push(`/dashboard?type=channels`, `/dashboard/channels`)
              }
            }).catch(err => {
              swal("Error", Translate(this.props,"Something went wrong, please try again later"), "error");
            });
          //delete
        } else {

        }
      });
  }
  componentDidMount() {

   
    this.props.socket.on('ratedItem', data => {
      let id = data.itemId
      let type = data.itemType
      let Statustype = data.type
      let rating = data.rating
      if (this.state.channel && id == this.state.channel.channel_id && type == "channels") {
        const data = {...this.state.channel}
        data.rating = rating
        this.setState({localUpdate:true, channel: data })
      }
    });


    this.props.socket.on('unfollowUser', data => {
      let id = data.itemId
      let type = data.itemType
      let ownerId = data.ownerId
      if (this.state.channel && id == this.state.channel.channel_id && type == "channels") {
        const data = {...this.state.channel}
        data.follow_count = data.follow_count - 1
        if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
          data.follower_id = null
        }
        this.setState({localUpdate:true, channel: data })
      }
    });

    this.props.socket.on('followUser', data => {
      let id = data.itemId
      let type = data.itemType
      let ownerId = data.ownerId
      if (this.state.channel && id == this.state.channel.channel_id && type == "channels") {
        const data = {...this.state.channel}
        data.follow_count = data.follow_count + 1
        if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
          data.follower_id = 1
        }
        this.setState({localUpdate:true, channel: data })
      }
    });

    this.props.socket.on('unfavouriteItem', data => {
      let id = data.itemId
      let type = data.itemType
      let ownerId = data.ownerId
      if (this.state.channel && id == this.state.channel.channel_id && type == "channels") {
        if (this.state.channel.channel_id == id) {
          const data = {...this.state.channel}
          data.favourite_count = data.favourite_count - 1
          if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
            data.favourite_id = null
          }
          this.setState({localUpdate:true, channel: data })
        }
      }
    });
    this.props.socket.on('favouriteItem', data => {
      let id = data.itemId
      let type = data.itemType
      let ownerId = data.ownerId
      if (this.state.channel && id == this.state.channel.channel_id && type == "channels") {
        if (this.state.channel.channel_id == id) {
          const data = {...this.state.channel}
          data.favourite_count = data.favourite_count + 1
          if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
            data.favourite_id = 1
          }
          this.setState({localUpdate:true, channel: data })
        }
      }
    });

    this.props.socket.on('likeDislike', data => {
      let itemId = data.itemId
      let itemType = data.itemType
      let ownerId = data.ownerId
      let removeLike = data.removeLike
      let removeDislike = data.removeDislike
      let insertLike = data.insertLike
      let insertDislike = data.insertDislike
      if (this.state.channel && itemType == "channels" && this.state.channel.channel_id == itemId) {
        const item = {...this.state.channel}
        let loggedInUserDetails = {}
        if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
          loggedInUserDetails = this.props.pageInfoData.loggedInUserDetails
        }
        if (removeLike) {
          if (loggedInUserDetails.user_id == ownerId)
            item['like_dislike'] = null
          item['like_count'] = parseInt(item['like_count']) - 1
        }
        if (removeDislike) {
          if (loggedInUserDetails.user_id == ownerId)
            item['like_dislike'] = null
          item['dislike_count'] = parseInt(item['dislike_count']) - 1
        }
        if (insertLike) {
          if (loggedInUserDetails.user_id == ownerId)
            item['like_dislike'] = "like"
          item['like_count'] = parseInt(item['like_count']) + 1
        }
        if (insertDislike) {
          if (loggedInUserDetails.user_id == ownerId)
            item['like_dislike'] = "dislike"
          item['dislike_count'] = parseInt(item['dislike_count']) + 1
        }
        this.setState({localUpdate:true, channel: item })
      }
    });
    this.props.socket.on('videoAdded', data => {
      if (this.state.channel &&  data.channel_id == this.props.pageInfoData.channel.channel_id) {
        this.props.openToast(Translate(this.props,data.message), "success");
        setTimeout(() => {
          Router.push(`/channel?channelId=${this.props.pageInfoData.channel.custom_url}`, `/channel/${this.props.pageInfoData.channel.custom_url}`)
        },1000);
        
      }
    }) 
    this.props.socket.on('playlistAdded', data => {
      if (this.state.channel && data.channel_id == this.props.pageInfoData.channel.channel_id) {
        this.props.openToast(data.message, "success");
        setTimeout(() => {
          Router.push(`/channel?channelId=${this.props.pageInfoData.channel.custom_url}`, `/channel/${this.props.pageInfoData.channel.custom_url}`)
        },1000);
        
      }
    })
    this.props.socket.on('channelCoverReposition', data => {
      let id = data.channel_id
      if (this.state.channel && id == this.state.channel.channel_id) {
          const item = {...this.state.channel}
          item.cover_crop = data.image
          item.showCoverReposition = false
          this.setState({localUpdate:true, channel: item, loadingCover: false },() => {
            this.props.openToast(Translate(this.props, data.message), "success")
          })
          
      }
  });
    this.props.socket.on('channelMainPhotoUpdated', data => {
      let id = data.channel_id
      if (this.state.channel && id == this.state.channel.channel_id) {
        const item = {...this.state.channel}
        item.image = data.image
        item.showCoverReposition = false
        this.setState({localUpdate:true, channel: item },() => {
          this.props.openToast(Translate(this.props,data.message), "success");
        })
        
      }
    });
    this.props.socket.on('channelCoverUpdated', data => {
      let id = data.channel_id
      if (this.state.channel && id == this.state.channel.channel_id) {
        const item = {...this.state.channel}
        item.cover = data.image
        item.channelcover = true;
        item.cover_crop = data.cover_crop;
        item.showCoverReposition = true
        this.setState({localUpdate:true, channel: item, loadingCover: false },() => {
          this.props.openToast(Translate(this.props,data.message), "success");
        })
      }
    });
  }
  openPopup = () => {
    this.setState({localUpdate:true, openPopup: true })
  }
  closePopup = () => {
    this.setState({localUpdate:true, openPopup: false })
  }
  adPost = (e) => {
    e.preventDefault();
    this.setState({localUpdate:true,addpost:true});
  }
  closePOst = (postData) => {
    this.setState({localUpdate:true,addpost:false});
  }
  chooseVideos(e, selectedVideos) {
    if (selectedVideos) {
      this.setState({localUpdate:true, openPopup: false })
      let formData = new FormData();
      formData.append('channel_id', this.props.pageInfoData.channel.channel_id)
      formData.append('selectedVideos', selectedVideos)
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      };

      let url = '/channels/add-videos';
      axios.post(url, formData, config)
        .then(response => {
          if (response.data.videos) {
            //Router.push()
          }
        }).catch(err => {
          this.setState({localUpdate:true, loading: false })
        });
    }
    this.setState({localUpdate:true, openPopup: false })
  }

  openPlaylistPopup = () => {
    this.setState({localUpdate:true, openPlaylistPopup: true })
  }
  closePlaylistPopup = () => {
    this.setState({localUpdate:true, openPlaylistPopup: false })
  }
  choosePlaylist(e, selectedPlaylists) {
    if (selectedPlaylists) {
      let formData = new FormData();
      this.setState({localUpdate:true, openPlaylistPopup: false })
      formData.append('channel_id', this.props.pageInfoData.channel.channel_id)
      formData.append('selectedPlaylists', selectedPlaylists)
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      };

      let url = '/channels/add-playlists';
      axios.post(url, formData, config)
        .then(response => {

        }).catch(err => {
          this.setState({localUpdate:true, loading: false })
        });
    }
    this.setState({localUpdate:true, openPopup: false })
  }
  render() {
    let validatorUploadImport = []
    let fieldUploadImport = []
    validatorUploadImport.push({
      key: "password",
      validations: [
        {
          "validator": Validator.required,
          "message": "Password is required field"
        }
      ]
    })
    fieldUploadImport.push({ key: "password", label: "", type: "password",isRequired:true })
    return (

      this.state.password ?
          <Form
            {...this.props}
            className="form"
            generalError={this.state.error}
            title={"Enter Password"}
            validators={validatorUploadImport}
            model={fieldUploadImport}
            submitText={this.state.submitting ? "Submit..." : "Submit"}
            onSubmit={model => {
              this.checkPassword(model);
            }}
          />
        :
        <React.Fragment>   
            {
              this.state.channel && this.state.addpost ? 
              <AddPost {...this.props} closePOst={this.closePOst} channel_id={this.state.channel.channel_id} />
              : null
            }         
            {
              this.state.channel && this.state.channel.approve != 1 ? 
                  <div className="col-md-12">
                      <div className="generalErrors">
                          <div className="alert alert-danger alert-dismissible fade show" role="alert">
                              {Translate(this.props,'This channel still waiting for admin approval.')}
                          </div>
                    </div>
                </div>
            : null
            }
            {
              this.state.openPopup ?
                <AddVideos {...this.props}  channel_id={this.props.pageInfoData.channel.channel_id} chooseVideos={this.chooseVideos} closePopup={this.closePopup} title={Translate(this.props,"Add videos to channel")} />
                : null
            }
            {
              this.state.openPlaylistPopup ?
                <AddVideos {...this.props}  playlist={true} channel_id={this.props.pageInfoData.channel.channel_id} chooseVideos={this.choosePlaylist} closePopup={this.closePlaylistPopup} title={Translate(this.props,"Add playlists to channel")} />
                : null
            }
            {
                !this.state.adult ?                      
                <Cover  {...this.props}  {...this.state.channel} item={this.state.channel} type="channel" id={this.state.channel.channel_id} deleteChannel={this.deleteChannel} url={`/channel/${this.state.channel.custom_url}`} />
              : null
            }
            <div className="userDetailsWraps">
                      <div className="container">
                        <div className="row">
                          <div className="col-md-12">
                          {
                              this.state.adult ?
                                  <div className="adult-wrapper">
                                      {Translate(this.props,'This channel contains adult content.To view this channel, Turn on adult content setting from site footer.')}
                                  </div>
                            :
                             <React.Fragment>
                               
                            <div className="details-tab">
                              <ul className="nav nav-tabs" id="myTab" role="tablist">
                              <li className="nav-item">
                                  <a className="nav-link active" data-toggle="tab" href="#videos" role="tab" aria-controls="discription" aria-selected="false">{Translate(this.props,"Videos")}</a>
                                </li>
                                {
                                  this.props.pageInfoData.channel.playlists ?
                                    <li className="nav-item">
                                      <a className="nav-link" data-toggle="tab" href="#playlists" role="tab" aria-controls="playlists" aria-selected="true">{Translate(this.props,"Playlists")}</a>
                                    </li>
                                    : null
                                }
                                {
                                  this.props.pageInfoData.channel.supporters ?
                                    <li className="nav-item">
                                      <a className="nav-link" data-toggle="tab" href="#supporters" role="tab" aria-controls="supporters" aria-selected="true">{Translate(this.props,"Supporters")}</a>
                                    </li>
                                    : null
                                }
                                <li className="nav-item">
                                  <a className="nav-link" data-toggle="tab" href="#community" role="tab" aria-controls="community" aria-selected="true">{Translate(this.props,"Community")}</a>
                                </li>
                                {
                                  this.props.pageInfoData.channel.artists && this.props.pageInfoData.channel.artists.results && this.props.pageInfoData.channel.artists.results.length ?
                                  <li className="nav-item">
                                      <a className="nav-link" data-toggle="tab" href="#artists" role="tab" aria-controls="artists" aria-selected="true">{Translate(this.props,"Artists")}</a>
                                    </li>
                                    : null
                                }
                                {
                                  this.props.pageInfoData.appSettings[`${"channel_comment"}`] == 1 && this.state.channel.approve == 1 ?
                                    <li className="nav-item">
                                      <a className="nav-link" data-toggle="tab" href="#comments" role="tab" aria-controls="comments" aria-selected="true">{`${ShortNumber(this.state.channel.comment_count ? this.state.channel.comment_count : 0)}`}{" "}{Translate(this.props,"Comments")}</a>
                                    </li>
                                    : null
                                }
                              <li className="nav-item">
                                      <a className="nav-link" data-toggle="tab" href="#about" role="tab" aria-controls="about" aria-selected="true">{Translate(this.props,"About")}</a>
                                    </li>
                                
                                                                    
                                
                              </ul>
                              <div className="tab-content" id="myTabContent">
                                <div className="tab-pane fade active show" id="videos" role="tabpanel">
                                  <div className="details-tab-box">{
                                    this.props.pageInfoData.channel.canEdit ?
                                      <button onClick={this.openPopup}>{Translate(this.props,"Add Videos")}</button>
                                      : null
                                  }
                                    <Videos canDelete={this.props.pageInfoData.channel.canDelete}  {...this.props}  videos={this.props.pageInfoData.channel.videos.results} pagging={this.props.pageInfoData.channel.videos.pagging} channel_id={this.props.pageInfoData.channel.channel_id} />
                                  </div>
                                </div>
                                <div className="tab-pane fade" id="community" role="tabpanel">
                                  <div className="details-tab-box">{
                                    this.props.pageInfoData.channel.canEdit ?
                                      <button onClick={this.adPost}>{Translate(this.props,"Add Post")}</button>
                                      : null
                                  }
                                    <Community canDelete={this.props.pageInfoData.channel.canDelete} canEdit={this.props.pageInfoData.channel.canEdit} channel={this.state.channel}  {...this.props}  posts={this.props.pageInfoData.channel.posts.results} pagging={this.props.pageInfoData.channel.posts.pagging} channel_id={this.props.pageInfoData.channel.channel_id} />
                                  </div>
                                </div>
                                

                                {
                                  this.props.pageInfoData.channel.playlists ?
                                    <div className="tab-pane fade" id="playlists" role="tabpanel">
                                      <div className="details-tab-box">
                                        {
                                          this.props.pageInfoData.channel.canEdit ?
                                            <button onClick={this.openPlaylistPopup}>{Translate(this.props,"Add Playlists")}</button>
                                            : null
                                        }
                                        <Playlists canDelete={this.props.pageInfoData.channel.canDelete}  {...this.props}  playlists={this.props.pageInfoData.channel.playlists.results} pagging={this.props.pageInfoData.channel.playlists.pagging} channel_id={this.props.pageInfoData.channel.channel_id} />
                                      </div>
                                    </div>
                                    : null
                                }
                                {
                                  this.props.pageInfoData.channel.supporters ?
                                    <div className="tab-pane fade" id="supporters" role="tabpanel">
                                      <div className="details-tab-box">
                                        <Members  {...this.props} globalSearch={true}  channel_members={this.props.pageInfoData.channel.supporters.results} channel_pagging={this.props.pageInfoData.channel.supporters.pagging} channel_id={this.props.pageInfoData.channel.channel_id} />
                                      </div>
                                    </div>
                                    : null
                                }
                                {
                                  this.props.pageInfoData.channel.artists && this.props.pageInfoData.channel.artists.results && this.props.pageInfoData.channel.artists.results.length ?
                                    <div className="tab-pane fade" id="artists" role="tabpanel">
                                      <div className="details-tab-box">
                                        <Artists canDelete={this.props.pageInfoData.channel.canDelete}  {...this.props}  artists={this.props.pageInfoData.channel.artists.results} pagging={this.props.pageInfoData.channel.artists.pagging} channel_id={this.props.pageInfoData.channel.channel_id} />
                                      </div>
                                    </div>
                                    : null
                                }


                                
                                {
                                  this.props.pageInfoData.appSettings[`${"channel_comment"}`] == 1 && this.state.channel.approve == 1 ?
                                    <div className="tab-pane fade" id="comments" role="tabpanel">
                                      <div className="details-tab-box">
                                        <Comment  {...this.props}  owner_id={this.state.channel.owner_id} hideTitle={true} appSettings={this.props.pageInfoData.appSettings} commentType="channel" type="channels" id={this.state.channel.channel_id} />
                                      </div>
                                    </div>
                                    : null
                                }
                              <div className="tab-pane fade" id="about" role="tabpanel">
                                  <div className="details-tab-box">
                                  {
                                    this.props.pageInfoData.appSettings[`${"channel_rating"}`] == 1 && this.state.channel.approve == 1 ?
                                  <div className="tabInTitle">
                                      <h6>{Translate(this.props,'Rating')}</h6>
                                      <div className="rating">
                                          <React.Fragment>
                                              <div className="animated-rater">
                                                  <Rating {...this.props} rating={this.state.channel.rating} type="channel" id={this.state.channel.channel_id} />
                                              </div>
                                          </React.Fragment>
                                      </div>
                                    </div>
                                  : null
                                  }
                                    <div className="tabInTitle">
                                      <h6>{this.props.t("view_count", { count: this.state.channel.view_count ? this.state.channel.view_count : 0 })}</h6>
                                      <div className="owner_name">
                                          <React.Fragment>
                                          {`${ShortNumber(this.state.channel.view_count ? this.state.channel.view_count : 0)}`}{" "}{this.props.t("view_count", { count: this.state.channel.view_count ? this.state.channel.view_count : 0 })}
                                          </React.Fragment>
                                      </div>
                                    </div>
                                    <div className="tabInTitle">
                                      <h6>{Translate(this.props, "Created")}</h6>
                                      <div className="owner_name">
                                          <Date {...this.props} creation_date={this.state.channel.creation_date} initialLanguage={this.props.initialLanguage} format={'dddd, MMMM Do YYYY'} defaultTimezone={this.props.pageInfoData.defaultTimezone} />
                                      </div>
                                    </div>
                                    {
                                      this.state.channel.category ?
                                        <React.Fragment>
                                          <div className="tabInTitle categories_cnt">
                                            <h6>{Translate(this.props,"Category")}</h6>
                                            <div className="boxInLink">
                                            {
                                              <Link href={`/category`} customParam={`type=channel&categoryId=` + this.state.channel.category.slug} as={`/channel/category/` + this.state.channel.category.slug}>
                                                <a>
                                                  {<CensorWord {...this.props} text={this.state.channel.category.title} />}
                                                </a>
                                              </Link>
                                            }
                                            </div>
                                            {
                                              this.state.channel.subcategory ?
                                                <React.Fragment>
                                                  {/* <span> >> </span> */}
                                                  <div className="boxInLink">
                                                  <Link href={`/category`} customParam={`type=channel&categoryId=` + this.state.channel.subcategory.slug} as={`/channel/category/` + this.state.channel.subcategory.slug}>
                                                    <a>
                                                      {<CensorWord {...this.props} text={this.state.channel.subcategory.title} />}
                                                    </a>
                                                  </Link>
                                                  </div> 
                                                  {
                                                    this.state.channel.subsubcategory ?
                                                      <React.Fragment>
                                                        {/* <span> >> </span> */}
                                                        <div className="boxInLink">
                                                        <Link href={`/category`} customParam={`type=channel&categoryId=` + this.state.channel.subsubcategory.slug} as={`/channel/category/` + this.state.channel.subsubcategory.slug}>
                                                          <a>
                                                            {<CensorWord {...this.props} text={this.state.channel.subsubcategory.title} />}
                                                          </a>
                                                        </Link>
                                                        </div>
                                                      </React.Fragment>
                                                      : null
                                                  }
                                                </React.Fragment>
                                                : null
                                            }
                                            
                                          </div> 
                                        </React.Fragment>
                                        : null
                                    }

                                    {
                                      this.state.channel.tags && this.state.channel.tags != "" ?
                                        <div className="blogtagListWrap">
                                          <div className="tabInTitle">
                                            <h6>{Translate(this.props,"Tags")}</h6>
                                            <ul className="TabTagList clearfix">
                                              {
                                                this.state.channel.tags.split(',').map(tag => {
                                                  return (
                                                    <li key={tag}>
                                                      <Link href="/channels" customParam={`tag=${tag}`} as={`/channels?tag=${tag}`}>
                                                        <a>{<CensorWord {...this.props} text={tag} />}</a>
                                                      </Link>
                                                    </li>
                                                  )
                                                })
                                              }
                                            </ul>
                                          </div>
                                        </div>
                                        : null
                                    }
                                    {
                                      this.state.channel.description ?
                                        <React.Fragment>
                                          <div className="tabInTitle">
                                            <h6>{Translate(this.props,"Description")}</h6>
                                            <div className="channel_description">
                                              <CensorWord {...this.props} text={this.state.channel.description} />
                                            </div>
                                          </div>
                                        </React.Fragment>
                                        : null
                                    }
                                  </div>
                                </div>

                                
                                
                              </div>
                            </div>
                            </React.Fragment>
                            }
                            
                          </div>
                        </div>
                      </div>
                    
              {
                  this.state.relatedChannels && this.state.relatedChannels.length ?
                  <React.Fragment>
                    <div className="container"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                    <CarouselChannels {...this.props}  {...this.props} channels={this.state.relatedChannels} />
                  </React.Fragment>
                    : null
              }
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
    setPageInfoData: (data) => dispatch(actions.setPageInfoData(data)),
    openToast: (message, typeMessage) => dispatch(actions.openToast(message, typeMessage)),
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(Index)