import React from "react"
import { connect } from "react-redux";
import TinySlider from 'tiny-slider-react';


import Item from "../User/Item"
import Translate from "../../components/Translate/Index"

class CarouselMember extends React.Component {
    constructor(props) {
        super(props)
        let propsData = {...props}
        this.state = {
            members: propsData.members,
            key: 1,
            type:"member",
            language:propsData.i18n.language,
        }
        this.slider = null
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }

        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        } else if (nextProps.members != prevState.members || nextProps.i18n.language != prevState.language) {
            return { members: nextProps.members,language:nextProps.i18n.language }
        } else{
            return null
        }

    }
    
    componentDidMount() {
        this.props.socket.on('unfollowUser', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "members") {
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.members]
                    const changedItem = {...items[itemIndex]}
                    changedItem.follow_count = changedItem.follow_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.follower_id = null
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, members: items })
               }
            }
        });
        this.props.socket.on('followUser', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == "members") {
                const itemIndex = this.getItemIndex(id)
                if(itemIndex > -1){
                    const items = [...this.state.members]
                    const changedItem = {...items[itemIndex]}
                    changedItem.follow_count = changedItem.follow_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.follower_id = 1
                    }
                    items[itemIndex] = changedItem
                    this.setState({localUpdate:true, members: items })
               }
            }
        });
        this.props.socket.on('ratedItem', data => {
            let id = data.itemId
            let type = data.itemType
            let Statustype = data.type
            let rating = data.rating
            const itemIndex = this.getItemIndex(id)
            if (itemIndex > -1 && type == this.state.type+"s") {
                const items = [...this.state.members]
                const changedItem = {...items[itemIndex]}
                changedItem.rating = rating
                items[itemIndex] = changedItem
                this.setState({localUpdate:true, members: items })
            }
        });
        this.props.socket.on('unfavouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const members = [...this.state.members]
                    const changedItem = {...members[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count - 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = null
                    }
                    members[itemIndex] = changedItem
                    this.setState({localUpdate:true, members: members })
                }
            }
        });
        this.props.socket.on('favouriteItem', data => {
            let id = data.itemId
            let type = data.itemType
            let ownerId = data.ownerId
            if (type == this.state.type + "s") {
                const itemIndex = this.getItemIndex(id)
                if (itemIndex > -1) {
                    const members = [...this.state.members]
                    const changedItem = {...members[itemIndex]}
                    changedItem.favourite_count = changedItem.favourite_count + 1
                    if (this.props.pageInfoData.loggedInUserDetails && this.props.pageInfoData.loggedInUserDetails.user_id == ownerId) {
                        changedItem.favourite_id = 1
                    }
                    members[itemIndex] = changedItem
                    this.setState({localUpdate:true, members: members })
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
            if (itemType == this.state.type + "s") {
                const itemIndex = this.getItemIndex(itemId)
                if (itemIndex > -1) {
                    const members = [...this.state.members]
                    const changedItem = {...members[itemIndex]}
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
                    members[itemIndex] = changedItem
                    this.setState({localUpdate:true, members: members })
                }
            }
        });
    }
    getItemIndex(item_id) {
        const members = [...this.state.members];
        const itemIndex = members.findIndex(p => p["user_id"] == item_id);
        return itemIndex;
    }
    
    render() {
        if (!this.state.members || !this.state.members.length) {
            return null
        }
       

        const settings = {
            lazyload: false,
            nav: false,
            items:1,
            loop:false,
            gutter:0,
            mouseDrag: true,
            controlsText:["<span class='material-icons'>keyboard_arrow_left</span>", "<span class='material-icons'>keyboard_arrow_right</span>"],
            responsive: {
                480: {
                    items: 2
                },
                760: {
                    items: 3
                },
                1200: {
                    items: 4
                },
                1300: {
                    items: 5
                },
              }
          };

        const content = this.state.members.map(result => {
            return <div  key={result.user_id}><Item {...this.props} {...result} member={result} /></div>
        })

        return (
            <div className="VideoRoWrap">
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="titleWrap">
                                <span className="title">
                                    <React.Fragment>
                                        {
                                            this.props.headerTitle ?
                                                this.props.headerTitle :
                                                null
                                        }
                                        {Translate(this.props, this.props.titleHeading ? this.props.titleHeading : `Popular Members`)}
                                    </React.Fragment>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-12">
                            {
                                <TinySlider settings={settings} >
                                    {content}
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

export default connect(mapStateToProps, null, null)(CarouselMember)