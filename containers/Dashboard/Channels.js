import React from "react"
import Router from 'next/router'

import BrowseChannels from "../Channel/Channels"
import Translate from "../../components/Translate/Index"

class Channels extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            type:props.pageData.filter ? props.pageData.filter : "my",
            pagging:props.pageData.items.pagging,
            items:props.pageData.items.results,
            canEdit:props.pageData.canEdit,
            canDelete:props.pageData.canDelete,
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.pageData.filter != prevState.type) {
            return {type:nextProps.pageData.filter,pagging:nextProps.pageData.items.pagging,items:nextProps.pageData.items.results}
        }else{
            return null
        }
    }
    changeType(e){
        let user = this.props.pageInfoData.user ? `&user=${this.props.pageInfoData.user}` : "";
        let userAs = this.props.pageInfoData.user ? `?user=${this.props.pageInfoData.user}` : "";
        let subtype = `/dashboard?type=channels&filter=${e.target.value}${user}`
        let asPath = `/dashboard/channels/${e.target.value}${userAs}`
        Router.push(
            `${subtype}`,
            `${asPath}`,
        )
    } 
    render() {
        const criterials = {}
        criterials["my"] = "My Channels"
        criterials["my_recent"] = "Recently Visited Channels"
        if (this.props.pageInfoData.appSettings["channel_rating"])
            criterials["rated"] = "My Most Rated Channels"
        if (this.props.pageInfoData.appSettings["channel_favourite"])
            criterials["favourited"] = "My Most  Favourite Channels"
        if (this.props.pageInfoData.appSettings["channel_comment"])
            criterials["commented"] = "My Most Commented Channels"
        criterials["my_subscribed"] = "My Most Subscribed Channels"
        if (this.props.pageInfoData.appSettings["channel_like"])
            criterials["liked"] = "My Most Liked Channels"
        if (this.props.pageInfoData.appSettings["channel_dislike"])
            criterials["disliked"] = "My Most Disliked Channels"
        criterials["viewed"] = "My Most Viewed Channels"
        criterials["subscribed"] = "Channels I Subscribed"
        if (this.props.pageInfoData.appSettings["channel_comment"])
            criterials["my_commented"] = "Channels I Commented"
        if (this.props.pageInfoData.appSettings["channel_favourite"])
            criterials["my_favourited"] = "Channels I  Favourite"
        if (this.props.pageInfoData.appSettings["channel_like"])
            criterials["my_liked"] = "Channels I Liked"
        if (this.props.pageInfoData.appSettings["channel_dislike"])
            criterials["my_disliked"] = "Channels I Disliked"
        if (this.props.pageInfoData.appSettings["channel_rating"])
            criterials["my_rated"] = "Channels I Rated"

        return (
            <React.Fragment>
                <div>
                    <div className="serachRsltsort">
                        <div className="totalno"></div>
                        <div className="sortby formFields">
                            <div className="form-group sortbys">
                                <span className="lble" style={{ width: "105px" }}>{Translate(this.props,"Criteria")}:</span>
                                <select className="form-control" value={this.state.type} onChange={this.changeType.bind(this)}>
                                    {
                                        Object.keys(criterials).map(function(keyName, keyIndex) {
                                           return <option key={keyName} value={keyName}>{Translate(this.props,criterials[keyName])}</option>
                                        },this)
                                    }
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <BrowseChannels {...this.props} canEdit={this.state.canEdit} canDelete={this.state.canDelete} channels={this.state.items} pagging={this.state.pagging} contentType={this.state.type} />
            </React.Fragment>
        )
    }
}

export default Channels