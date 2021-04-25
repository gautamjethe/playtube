import React from "react"
import Router from 'next/router'

import BrowseMembers from "../User/Browse"
import Translate from "../../components/Translate/Index"

class Members extends React.Component {
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
        let subtype = `/dashboard?type=members&filter=${e.target.value}${user}`
        let asPath = `/dashboard/members/${e.target.value}${userAs}`
        Router.push(
            `${subtype}`,
            `${asPath}`,
        )
    } 
    render() {
        const criterials = {}
        criterials["my_subscribed"] = "Members Who Followed Me"
        criterials["subscribed"] = "Members I Followed"
        criterials["my_recent"] = "Members Recently Viewed"
        if (this.props.pageInfoData.appSettings["member_like"])
            criterials["my_liked"] = "Members I Liked"
        if (this.props.pageInfoData.appSettings["member_dislike"])
            criterials["my_disliked"] = "Members I Disliked"
        if (this.props.pageInfoData.appSettings["member_favourite"])
            criterials["my_favourited"] = "Members I  Favourite"
        if (this.props.pageInfoData.appSettings["member_comment"])
            criterials["my_commented"] = "Members I Commented"
        if (this.props.pageInfoData.appSettings["member_rating"])
            criterials["my_rated"] = "Members I Rated"
        
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
                <BrowseMembers {...this.props} canEdit={this.state.canEdit} canDelete={this.state.canDelete} pageData={{members:this.state.items,pagging:this.state.pagging}} contentType={this.state.type} />
            </React.Fragment>
        )
    }
}

export default Members