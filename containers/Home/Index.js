import React,{Component} from "react"
import { connect } from "react-redux";
import asyncComponent from '../../hoc/asyncComponent/asyncComponent';

import Translate from "../../components/Translate/Index"
import NewsLetter from "../../containers/Newsletter/Index"
import TopVideos from '../../containers/HomePage/TopVideos'
import Channels from '../../containers/HomePage/CarouselChannel'
import AdsIndex from "../Ads/Index"
import ChannelPost from "../HomePage/ChannelPosts"

const VideoSlider = asyncComponent(() => {
    return import('../HomePage/VideoSlider');
});
import actions from '../../store/actions/general';
const Members = asyncComponent(() => {
    return import("../HomePage/Members");
});
const Audio = asyncComponent(() => {
    return import("../HomePage/Audio");
});
const Slideshow = asyncComponent(() => {
    return import('../../components/Slideshow/Index');
});

class Home extends Component {
    constructor(props){
        super(props)
        this.state = {
            videos:props.pageInfoData.videos,
            channels:props.pageInfoData.channels,
            categoriesData:props.pageInfoData.categoryVideos,
            members:props.pageInfoData.popularMembers,
            slideshow:props.pageInfoData.slideshow,
            audio:props.pageInfoData.audio,
            livestreamers:props.pageInfoData.livestreamers
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        let dataTypes = {}
        if(nextProps.pageInfoData.videos != prevState.videos){
            dataTypes.videos = nextProps.pageInfoData.videos
        }
        if(nextProps.pageInfoData.popularMembers != prevState.popularMembers){
            dataTypes.members = nextProps.pageInfoData.popularMembers
        }
        if(nextProps.pageInfoData.slideshow != prevState.slideshow){
            dataTypes.slideshow = nextProps.pageInfoData.slideshow
        }
        if(nextProps.pageInfoData.channels != prevState.channels){
            dataTypes.channels = nextProps.pageInfoData.channels
        }
        if(nextProps.pageInfoData.audio != prevState.audio){
            dataTypes.audio = nextProps.pageInfoData.audio
        }
        if(nextProps.pageInfoData.livestreamers != prevState.livestreamers){
            dataTypes.livestreamers = nextProps.pageInfoData.livestreamers
        }
        
        if(nextProps.pageInfoData.categoryVideos != prevState.categories){
            dataTypes.categoriesData = nextProps.pageInfoData.categoryVideos
        }
        if(Object.keys(dataTypes).length){
            return dataTypes
        }else{
            return null
        }
    }
    componentDidMount() {
        if(this.state.categoriesData){
            this.setState({categories: this.state.categoriesData})
        }
     }
    render(){
        return (
            <React.Fragment>
                    <Slideshow {...this.props} />
                    {
                        !this.state.slideshow ? 
                    <VideoSlider {...this.props}  videos={this.state.videos.featured} />
                    : 
                    this.state.videos.featured ? 
                        <React.Fragment>
                            <TopVideos  {...this.props}   openPlaylist={this.props.openPlaylist} headerTitle={<span className="sponsored">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                            </span>}   seemore={true} title={Translate(this.props,"Featured Videos")} videos={this.state.videos.sponsored} type="featured"  />
                        </React.Fragment>
                    : null
                    }
                    {
                        this.state.videos.featured ? 
                            this.props.pageInfoData.appSettings['featuredvideo_ads'] ? 
                                <AdsIndex paddingTop="20px" className="featuredvideo_ads" ads={this.props.pageInfoData.appSettings['featuredvideo_ads']} />
                            : null            
                        : null            
                    }
                    {
                        this.state.videos && this.state.videos.sponsored ? 
                             <React.Fragment>
                            <TopVideos  {...this.props}   openPlaylist={this.props.openPlaylist} headerTitle={<span className="sponsored">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                            </span>}   seemore={true} title={Translate(this.props,"Sponsored Videos")} videos={this.state.videos.sponsored} type="sponsored"  />
                            {
                                    this.props.pageInfoData.appSettings['sponsoredvideo_ads'] ? 
                                        <AdsIndex paddingTop="20px" className="sponsoredvideo_ads" ads={this.props.pageInfoData.appSettings['sponsoredvideo_ads']} />
                                    : null
                                }
                            </React.Fragment>
                    : null
                    }
                     {
                        this.state.videos && this.state.videos.hot ? 
                            <React.Fragment>
                                {
                                    this.state.videos && this.state.videos.sponsored ? 
                                        <div className="container hr"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                                    : null
                                }
                                <TopVideos  {...this.props}   openPlaylist={this.props.openPlaylist} headerTitle={<span className="hot">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                </span>}  seemore={true} title={Translate(this.props,"Hot Videos")} type="hot" videos={this.state.videos.hot}  />
                                {
                                    this.props.pageInfoData.appSettings['hotvideo_ads'] ? 
                                        <AdsIndex paddingTop="20px" className="hotvideo_ads" ads={this.props.pageInfoData.appSettings['hotvideo_ads']} />
                                    : null
                                }
                            </React.Fragment>
                    : null
                    }
                    {
                        this.state.videos && this.state.videos.recent_videos ? 
                            <React.Fragment>
                                {
                                    this.state.videos && (this.state.videos.sponsored || this.state.videos.hot) ? 
                                        <div className="container hr"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                                : null
                                }
                                <TopVideos  {...this.props}   openPlaylist={this.props.openPlaylist} headerTitle={<span className="recent_video"><span className="material-icons">video_library</span></span>}  seemore={true} title={Translate(this.props,"Recent Videos")} sort="recent" videos={this.state.videos.recent_videos}  />
                                {
                                    this.props.pageInfoData.appSettings['recentvideo_ads'] ? 
                                        <AdsIndex paddingTop="20px" className="recentvideo_ads" ads={this.props.pageInfoData.appSettings['recentvideo_ads']} />
                                    : null
                                }
                            </React.Fragment>
                    : null
                    }
                    {
                        this.state.livestreamers ? 
                            <React.Fragment>
                                <div className="container hr"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                                <div className="container">
                                    <Members  {...this.props}  headerTitle={<span className="recent_video"><span className="material-icons">live_tv</span></span>}  seemore={true} titleHeading={Translate(this.props,"Best Livestreamer Of The Month")} sort="recent" type="member" members={this.state.livestreamers} />
                                </div>
                            </React.Fragment>
                    : null
                    }
                    {
                        this.state.members ? 
                            <React.Fragment>
                                <div className="container hr"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                                <div className="container">
                                    <Members  {...this.props}  headerTitle={<span className="recent_video"><span className="material-icons">people</span></span>}  seemore={true} titleHeading={Translate(this.props,"Popular Members")} sort="recent" type="member" members={this.state.members} />
                                </div>
                            </React.Fragment>
                    : null
                    }
                    {
                        this.state.channels && this.state.channels.posts ? 
                            <React.Fragment>
                                <div className="container hr"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                                <ChannelPost  {...this.props} posts={this.state.channels.posts}  />
                            </React.Fragment>
                        : null
                    }
                    {
                        this.state.channels && this.state.channels.featured ? 
                            <React.Fragment>
                                <div className="container hr"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                             <Channels  {...this.props}  headerTitle={<span className="featured">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                             </span>}   seemore={true} title={Translate(this.props,"Featured Channels")} channels={this.state.channels.featured} type="featured" />
                             {
                                    this.props.pageInfoData.appSettings['featuredchannel_ads'] ? 
                                        <AdsIndex className="featuredchannel_ads" paddingTop="20px" ads={this.props.pageInfoData.appSettings['featuredchannel_ads']} />
                                    : null
                                }
                            </React.Fragment>
                    : null
                    }
                    {
                        this.state.channels && this.state.channels.sponsored ? 
                            <React.Fragment>
                                <div className="container hr"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                                <Channels  {...this.props}   headerTitle={<span className="sponsored">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                </span>}  seemore={true} title={Translate(this.props,"Sponsored Channels")} channels={this.state.channels.sponsored} type="sponsored"  />
                                {
                                    this.props.pageInfoData.appSettings['sponsoredchannel_ads'] ? 
                                        <AdsIndex paddingTop="20px" className="sponsoredchannel_ads" ads={this.props.pageInfoData.appSettings['sponsoredchannel_ads']} />
                                    : null
                                }
                            </React.Fragment>
                    : null
                    }
                    {
                        this.state.channels && this.state.channels.hot ? 
                            <React.Fragment>
                                <div className="container hr"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                                <Channels  {...this.props}  headerTitle={<span className="hot">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-award"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                </span>}   seemore={true} title={Translate(this.props,"Hot Channels")} type="hot" channels={this.state.channels.hot}  />
                                {
                                    this.props.pageInfoData.appSettings['hotchannel_ads'] ? 
                                        <AdsIndex paddingTop="20px" className="hotchannel_ads" ads={this.props.pageInfoData.appSettings['hotchannel_ads']} />
                                    : null
                                }
                            </React.Fragment>
                    : null
                    }
                    {
                        this.state.audio && this.state.audio ? 
                            <React.Fragment>
                                <div className="container hr"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div>
                                <Audio  {...this.props}  headerTitle={
                                <span className="recent_video"><span className="material-icons">headset</span></span>
                                }   seemore={true} title={Translate(this.props,"Recent Audio")} type="latest" audio={this.state.audio}  />
                            </React.Fragment>
                    : null
                    }
                    
                    {
                        this.state.categories ? 
                            this.state.categories.map(cat => {
                                return <React.Fragment key={cat.category.category_id+"_cnt"}><div className="container hr"><div className="row"><div className="col-sm-12"><hr className="horline" /></div></div></div><TopVideos key={cat.category.category_id+"_cat_videos"} {...this.props}   openPlaylist={this.props.openPlaylist} headerTitle={<span className="category"><span className="material-icons">category</span></span>}  subType="category_id" seemore={true} key={cat.category.category_id}  videos={cat.videos} title={Translate(this.props,cat.category.title)} type={cat.category.category_id}  /></React.Fragment>
                            })
                    : null
                    }
                    {
                        this.state.categories ? 
                            this.props.pageInfoData.appSettings['categoryvideo_ads'] ? 
                                <AdsIndex paddingTop="20px" className="categoryvideo_ads" ads={this.props.pageInfoData.appSettings['categoryvideo_ads']} />
                            : null            
                        : null            
                    }

                    {
                        !this.props.pageInfoData.loggedInUserDetails ? 
                        <NewsLetter {...this.props}  />
                        : null
                    }                    
            </React.Fragment>
        )
    }
}

const mapStateToProps = state => {
    return {
        pageInfoData:state.general.pageInfoData
    };
  };
  const mapDispatchToProps = dispatch => {
    return {
        openPlaylist: (open, video_id) => dispatch(actions.openPlaylist(open, video_id)),
    };
};
export default connect(mapStateToProps,mapDispatchToProps)(Home)