import React from "react"
import Router from 'next/router'

import BrowseBlogs from "../Blog/Blogs"
import Translate from "../../components/Translate/Index"

class Blogs extends React.Component {
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
        let subtype = `/dashboard?type=blogs&filter=${e.target.value}${user}`
        let asPath = `/dashboard/blogs/${e.target.value}${userAs}`
        Router.push(
            `${subtype}`,
            `${asPath}`,
        )
    } 
    render() {
        const criterials = {}
        criterials["my"] = "My Blogs"
        criterials["my_recent"] = "Recently Visited Blogs"
        if (this.props.pageInfoData.appSettings["blog_rating"])
            criterials["rated"] = "My Most Rated Blogs"
        if (this.props.pageInfoData.appSettings["blog_favourite"])
            criterials["favourited"] = "My Most  Favourite Blogs"
        if (this.props.pageInfoData.appSettings["blog_comment"])
            criterials["commented"] = "My Most Commented Blogs"
        if (this.props.pageInfoData.appSettings["blog_like"])
            criterials["liked"] = "My Most Liked Blogs"
        if (this.props.pageInfoData.appSettings["blog_dislike"])
            criterials["disliked"] = "My Most Disliked Blogs"
        criterials["viewed"] = "My Most Viewed Blogs"
        if (this.props.pageInfoData.appSettings["blog_comment"])
            criterials["my_commented"] = "Blogs I Commented"
        if (this.props.pageInfoData.appSettings["blog_favourite"])
            criterials["my_favourited"] = "Blogs I  Favourite"
        if (this.props.pageInfoData.appSettings["blog_like"])
            criterials["my_liked"] = "Blogs I Liked"
        if (this.props.pageInfoData.appSettings["blog_dislike"])
            criterials["my_disliked"] = "Blogs I Disliked"
        if (this.props.pageInfoData.appSettings["blog_rating"])
            criterials["my_rated"] = "Blogs I Rated"

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
                <BrowseBlogs {...this.props} canEdit={this.state.canEdit} canDelete={this.state.canDelete} blogs={this.state.items} pagging={this.state.pagging} contentType={this.state.type} />
            </React.Fragment>
        )
    }
}

export default Blogs