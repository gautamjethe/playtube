import React from "react"
import Image from "../Image/Index" 
import { connect } from "react-redux";

import CensorWord from "../CensoredWords/Index"
import { renderToString } from 'react-dom/server'
import InfiniteScroll from "react-infinite-scroll-component";
import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import Translate from "../../components/Translate/Index"
import axios from "../../axios-orders"


class Photos extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            photos: props.photos.results,
            pagging: props.photos.pagging,
            artist:props.artist,
            page:2
        }
        this.refreshContent = this.refreshContent.bind(this)
        this.loadMoreContent = this.loadMoreContent.bind(this)
        this.openImage = this.openImage.bind(this)
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (prevState.photos != nextProps.photos.results) {
           return { photos: nextProps.photos.results,pagging:nextProps.photos.pagging,page:2 }
        } else{
            return null
        }

    }
    
    refreshContent() {
        this.setState({ page: 1, items: [] })
        this.loadMoreContent()
    }
    openImage = (id,e) => {
        e.preventDefault()
        if(typeof lightboxJquery == "undefined"){
            return
        }

        var items = [];
        this.state.photos.each
        this.state.photos.forEach(photo => {

            let isS3 = true
            if (photo.image) {
                const splitVal = photo.image.split('/')
                if (splitVal[0] == "http:" || splitVal[0] == "https:") {
                    isS3 = false
                }
            }

            items.push({
                src:  (isS3 ? this.props.pageInfoData.imageSuffix : "") + photo.image,
                title: photo.title,
                description: photo.description,
                type: 'image'
            });
        });
        lightboxJquery.magnificPopup.open({
            items:items,
            gallery: {
              enabled: true 
            },
            tCounter:""
          },id);
    }
    loadMoreContent() {
        if(this.state.loading){
            return
        }
        this.setState({ loading: true,localUpdate:true })
        let formData = new FormData();
        formData.append('artist_id', this.state.artist.artist_id)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = "/artist-photos"
        formData.append("page", this.state.page)
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.results) {
                    let pagging = response.data.pagging
                    this.setState({localUpdate:true, page: this.state.page + 1, pagging: pagging, photos: [...this.state.photos, ...response.data.results], loading: false })
                } else {
                    this.setState({ loading: false ,localUpdate:true})
                }
            }).catch(err => {
                this.setState({ loading: false ,localUpdate:true})
            });

    }
    render() {
        const photos = this.state.photos.map((photo,key) => {
            return (
                <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6" key={photo.photo_id}>
                    <div className="ptv_artists_wrap" >
                        <div className="ptv_artist_thumb">
                            <a href="#" onClick={(e) => {this.openImage(key,e)}}>
                                <Image title={renderToString(<CensorWord {...this.props} text={photo.title} />)} image={photo.image} imageSuffix={this.props.pageInfoData.imageSuffix} />
                            </a>
                        </div>
                        <div className="artist_photo_content">
                            <div className="title">
                                <a>
                                    <h4>{<CensorWord {...this.props} text={photo.title} />}</h4>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )
            
        })
        
        return (
            <InfiniteScroll
                dataLength={this.state.photos.length}
                next={this.loadMoreContent}
                hasMore={this.state.pagging}
                loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.photos.length} />}
                endMessage={
                    <EndContent {...this.props} text={Translate(this.props, "No photo uploaded for this artist.")} itemCount={this.state.photos.length} />
                }
                pullDownToRefresh={false}
                pullDownToRefreshContent={<Release release={false} {...this.props} />}
                releaseToRefreshContent={<Release release={true} {...this.props} />}
                refreshFunction={this.refreshContent}
            >
                <div className="row mob2col artist-gallery">
                    {photos}
                </div>
            </InfiniteScroll>
        )
    }
}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};
export default connect(mapStateToProps)(Photos)
