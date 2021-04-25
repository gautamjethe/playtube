import React from "react"
import { connect } from "react-redux";
import TinySlider from 'tiny-slider-react';

import Item from "./Item"
import Translate from "../../components/Translate/Index"

import Link from "../../components/Link"
class CarouselBlogs extends React.Component {
    constructor(props) {
        super(props)
        let propsData = {...props}
        this.state = {
            blogs: props.blogs,
            key: 1,
            language:propsData.i18n.language
        }
        this.slider = null
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if ((nextProps.blogs && nextProps.blogs != prevState.blogs) || nextProps.i18n.language != prevState.language) {
            return { blogs: nextProps.blogs,language:nextProps.i18n.language }
        } else{
            return null
        }
    }

    componentDidMount() {
        this.props.socket.on('blogDeleted', data => {
            let id = data.blog_id
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1) {
                const blogs = [...this.state.blogs]
                blogs.splice(itemIndex, 1);
                this.setState({localUpdate:true, blogs: blogs  })
            }
        })
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == "blogs") {
                const items = [...this.state.blogs]
                const changedItem = items[itemIndex]
                changedItem.rating = rating
                this.setState({localUpdate:true, blogs: items  })
            }
        });
        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "blogs") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.blogs]
                    const changedItem = items[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    this.setState({localUpdate:true, blogs: items })
                }
            }
        });
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "blogs") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const items = [...this.state.blogs]
                    const changedItem = items[itemIndex]
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    this.setState({localUpdate:true, blogs: items  })
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
            if (itemType == "blogs") {
                const itemIndex = this.getItemIndex(itemId)
                if (itemIndex > -1) {
                    const items = [...this.state.blogs]
                    const changedItem = items[itemIndex]
                    let loggedInUserDetails = {}
                    if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
                        loggedInUserDetails = this.props.pageInfoData.loggedInUserDetails
                    }
                    if (removeLike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = null
                        changedItem['like_count'] = parseInt(changedItem['like_count']) - 1
                    }
                    if (removeDislike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = null
                        changedItem['dislike_count'] = parseInt(changedItem['dislike_count']) - 1
                    }
                    if (insertLike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = "like"
                        changedItem['like_count'] = parseInt(changedItem['like_count']) + 1
                    }
                    if (insertDislike) {
                        if (loggedInUserDetails.user_id == ownerId)
                            changedItem['like_dislike'] = "dislike"
                        changedItem['dislike_count'] = parseInt(changedItem['dislike_count']) + 1
                    }
                    this.setState({localUpdate:true, blogs: items })
                }
            }
        });
    }
    getItemIndex(item_id) {
        if (this.state.blogs) {
            const items = [...this.state.blogs];
            const itemIndex = items.findIndex(p => p.blog_id == item_id);
            return itemIndex;
        } else {
            return -1;
        }
    }
   
    render() {
        if (!this.state.blogs || !this.state.blogs.length) {
            return null
        }
       
        

        const settings = {
            lazyload: false,
            nav: false,
            items:3,
            loop:false,
            gutter:20,
            mouseDrag: true,
            controlsText:["<span class='material-icons'>keyboard_arrow_left</span>", "<span class='material-icons'>keyboard_arrow_right</span>"],
            responsive: {
                480: {
                    items: 1
                },
                760: {
                    items: 2
                },
                992: {
                    items: 2
                },
              }
          };

        return (
            <div className="VideoRoWrap">
                <div className="container">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="titleWrap">
                                <span className="title">
                                    <React.Fragment>
                                        {
                                            this.props.headerTitle ?
                                                this.props.headerTitle :
                                                null
                                        }
                                        {Translate(this.props, this.props.title ? this.props.title : `Related Blogs`)}
                                    </React.Fragment>
                                </span>
                                {
                                    this.props.seemore && this.state.blogs.length > 2 ?
                                        <Link href={`/blogs?${this.props.type ? "type" : "sort"}=${this.props.type ? this.props.type : this.props.sort}`}>
                                            <a className="seemore_link">
                                                {
                                                    Translate(this.props, "See more")
                                                }
                                            </a>
                                        </Link>
                                        : null
                                }

                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-12" className="btn-slide">
                            {
                                <TinySlider key={1}  settings={settings} >
                                    {
                                        this.state.blogs.map(result => {
                                            return <div  key={result.blog_id}><Item {...this.props} {...result} result={result} /></div>
                                        })
                                    }
                                </TinySlider>
                            }
                        </div>
                    </div>

                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};

export default connect(mapStateToProps, null, null)(CarouselBlogs)