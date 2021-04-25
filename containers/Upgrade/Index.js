import React from "react"
import { connect } from "react-redux";

import  Translate  from "../../components/Translate/Index";
import Currency from "./Currency"

class Index extends React.Component {
    constructor(props) {
        super(props)        
        this.state = {
            packages: props.pageData.packages,
            userActivePackage: props.pageData.userActivePackage,
        }
        this.selectedPackage = this.selectedPackage.bind(this)
    }
    
  
    selectedPackage = (package_id,e) => {
        e.preventDefault();
        if(!this.state.userActivePackage || package_id != this.state.userActivePackage.package_id)
            window.location.href = "/upgrade/"+package_id
    }
    
    render() {       

        const donationVideo = this.props.pageInfoData.appSettings['video_donation']
        const sellVideo = this.props.pageInfoData.appSettings['video_sell']
        const channelEnable = this.props.pageInfoData.appSettings['enable_channel']
        const blogEnable = this.props.pageInfoData.appSettings['enable_blog']
        const playlistEnable = this.props.pageInfoData.appSettings['enable_playlist']
        const audioEnable = this.props.pageInfoData.appSettings['enable_audio']
        const adsEnable = this.props.pageInfoData.appSettings['enable_ads']
        const memberHot = this.props.pageInfoData.appSettings['member_hot']
        const memberSponsored = this.props.pageInfoData.appSettings['member_sponsored']
        const memberFeatured = this.props.pageInfoData.appSettings['member_featured']
        const livestreamingEnable = this.props.pageInfoData.appSettings['live_stream_start']
        const uploadLimitSize = { "1048576": "1 MB", "5242880": "5 MB", "26214400": "25 MB", "52428800": "50 MB", "104857600": "100 MB", "524288000": "50 MB", "1073741824": "1 GB", "2147483648": "2 GB", "5368709120": "5 GB", "10737418240": "10 GB", "0": "Unlimited" }
        const sitemodeEnable = 1;


        return (
            <React.Fragment>
                    <div className="titleBarTop">
                        <div className="titleBarTopBg"><img src={this.props.pageData['pageInfo']['banner'] ? this.props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"}
                                alt={this.props.t("Choose a plan.")} />
                        </div>
                        <div className="overlay">
                            <div className="container">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="titleHeadng">
                                            <h1>{this.props.t("Choose a plan.")}</h1>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mainContentWrap">
                        <div className="container">
                            <div className="row">
                                <div className="col-md-12">
                                <div className="ContentBoxTxt">
                                    <div className="comparison tableResponsive upgradetableResponsive">

                                    <table style={{width:`100%`}}>
                                        <thead>
                                            <tr className="upgrade-header">
                                            <th className="infoprice">
                                                <span>{Translate(this.props,"Start Today!")}</span>
                                                {Translate(this.props,'Upgrade or cancel anytime.')}
                                            </th>
                                            {
                                                this.state.packages.map(result => {
                                                   return <th  key={result.package_id} className={`price-info${this.state.userActivePackage && result.package_id == this.state.userActivePackage.package_id ? " active" : ""}`}>
                                                        <div className="compare-heading plan1Bg" style={{background:`${result.color}`}}>{Translate(this.props,result.title)}</div>
                                                        <div className="price-now">
                                                            <span><Currency {...this.props} {...result} /></span> /{result.package_description ? " "+Translate(this.props,result.package_description.trim()) : ""}
                                                        </div>
                                                        {
                                                            !this.state.userActivePackage || result.package_id != this.state.userActivePackage.package_id ?
                                                                <div><a href="#" className="price-buy" onClick={this.selectedPackage.bind(this,result.package_id)}>{Translate(this.props,'Buy Now')}</a></div>
                                                        : null
                                                        }
                                                    </th>

                                                })
                                            }
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="pricing-heading">{Translate(this.props,"Description")}</td>
                                                {
                                                    this.state.packages.map(result => {
                                                        return <td key={result.package_id} className="description">{result.description ? result.description : Translate(this.props,"N/A")}</td>
                                                    })
                                                }
                                            </tr>
                                            <React.Fragment>
                                            {
                                                memberFeatured == 1 ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Featured")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                    {
                                                                        result.is_featured == 1 ? 
                                                                        <span className="tick"><span className="material-icons">check</span></span>
                                                                    :
                                                                        <span className="notick"><span className="material-icons">close</span></span>
                                                                    }
                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                            {
                                                memberSponsored == 1 ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Sponsored")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                    {
                                                                        result.is_sponsored == 1 ? 
                                                                        <span className="tick"><span className="material-icons">check</span></span>
                                                                    :
                                                                        <span className="notick"><span className="material-icons">close</span></span>
                                                                    }
                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                            {
                                                memberHot == 1 ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Hot")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                    {
                                                                        result.is_hot == 1 ? 
                                                                        <span className="tick"><span className="material-icons">check</span></span>
                                                                    :
                                                                        <span className="notick"><span className="material-icons">close</span></span>
                                                                    }
                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                            {
                                                sitemodeEnable == 1  ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Site Theme Mode")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                       {
                                                                           this.props.t(result.themeMode)
                                                                       }
                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                             {
                                                livestreamingEnable == 1  ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Go Live")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                       {
                                                                           result.create_livestreaming != 1 ? 
                                                                            <span className="notick"><span className="material-icons">close</span></span>
                                                                           :
                                                                        result.livestreaming_create_limit != 0 ? `${this.props.t("Create {{limit}} livestream(s)",{limit:result.livestreaming_create_limit})}` : this.props.t("Unlimited")
                                                                       }

                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                            {
                                                channelEnable == 1 ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Create Videos")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                        {
                                                                           result.video_upload != 1 ? 
                                                                            <span className="notick"><span className="material-icons">close</span></span>
                                                                           :
                                                                           result.video_create_limit != 0 ? `${this.props.t("Upload upto {{video}} video(s)",{video:result.video_create_limit})}` : this.props.t("Unlimited")
                                                                        }
                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                            {
                                                <tr>
                                                    <td className="pricing-heading">
                                                        {this.props.t("Upload Videos")}
                                                    </td>
                                                    {
                                                        this.state.packages.map(result => {
                                                            return <td key={result.package_id}>
                                                                {
                                                                        result.upload_video_limit != 0 ? ` ${this.props.t("Upto ")}${uploadLimitSize[result.upload_video_limit]}` : this.props.t("Unlimited")
                                                                }
                                                            </td>
                                                        })
                                                    }
                                                </tr>
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                            {
                                                sellVideo ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Sell Uploaded Videos")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                    {
                                                                        result.sell_videos == 1 ? 
                                                                        <span className="tick"><span className="material-icons">check</span></span>
                                                                    :
                                                                        <span className="notick"><span className="material-icons">close</span></span>
                                                                    }
                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                            {
                                                donationVideo ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Get Donation on Videos")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                    {
                                                                        result.get_donation == 1 ? 
                                                                        <span className="tick"><span className="material-icons">check</span></span>
                                                                    :
                                                                        <span className="notick"><span className="material-icons">close</span></span>
                                                                    }
                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                            {
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Video Monetization")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                    {
                                                                        result.monetization == 1 ? 
                                                                        <span className="tick"><span className="material-icons">check</span></span>
                                                                    :
                                                                        <span className="notick"><span className="material-icons">close</span></span>
                                                                    }
                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                            }    
                                            </React.Fragment>
                                           
                                            <React.Fragment>
                                            {
                                                channelEnable == 1 ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Create Channel")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                       {
                                                                           result.create_channel != 1 ? 
                                                                            <span className="notick"><span className="material-icons">close</span></span>
                                                                           :
                                                                        result.channel_create_limit != 0 ? `${this.props.t("Create {{limit}} channel(s)",{limit:result.channel_create_limit})}` : this.props.t("Unlimited")
                                                                       }

                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                             <React.Fragment>
                                             {
                                                blogEnable == 1  ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Create Blog")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                       {
                                                                           result.create_blogs != 1 ? 
                                                                            <span className="notick"><span className="material-icons">close</span></span>
                                                                           :
                                                                        result.blog_create_limit != 0 ? `${this.props.t("Create {{limit}} blog(s)",{limit:result.blog_create_limit})}` : this.props.t("Unlimited")
                                                                       }

                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                            {
                                                playlistEnable == 1  ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Create Playlist")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                      {
                                                                           result.create_playlist != 1 ? 
                                                                            <span className="notick"><span className="material-icons">close</span></span>
                                                                           :
                                                                        result.playlist_create_limit != 0 ? `${this.props.t("Create {{limit}} playlist(s)",{limit:result.playlist_create_limit})}` : this.props.t("Unlimited")
                                                                       }

                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            {
                                                audioEnable == 1  ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Create Audio")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                      {
                                                                           result.create_audio != 1 ? 
                                                                            <span className="notick"><span className="material-icons">close</span></span>
                                                                           :
                                                                        result.audio_create_limit != 0 ? `${this.props.t("Create {{limit}} audio(s)",{limit:result.audio_create_limit})}` : this.props.t("Unlimited")
                                                                       }

                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                            <React.Fragment>
                                            {
                                                adsEnable == 1  ?
                                                    <tr>
                                                        <td className="pricing-heading">
                                                            {this.props.t("Create Advertisement")}
                                                        </td>
                                                        {
                                                            this.state.packages.map(result => {
                                                                return <td key={result.package_id}>
                                                                       {
                                                                           result.create_advertisement != 1 ? 
                                                                            <span className="notick"><span className="material-icons">close</span></span>
                                                                           :
                                                                        result.ad_create_limit != 0 ? `${this.props.t("Create {{limit}} advertisement(s)",{limit:result.ad_create_limit})}` : this.props.t("Unlimited")
                                                                       }

                                                                </td>
                                                            })
                                                        }
                                                    </tr>
                                                : null
                                            }    
                                            </React.Fragment>
                                        </tbody>
                                    </table>

                                {/* {
                                   // this.state.type == "month" ? 
                                        monthly
                                   // : 
                                   //     this.state.type == "year" ? 
                                   //         yearly
                                   //     :
                                   //         oneTime
                                } */}
                                    </div>
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
        pageInfoData: state.general.pageInfoData
    };
};

export default connect(mapStateToProps, null, null)(Index)