import React, { Component } from "react"
import { connect } from "react-redux";
import axios from "../../axios-orders"

import Items from "./NotificationItems"


class Notifications extends Component {
    constructor(props) {
        super(props)
        this.state = {
            loading: props.loading,
            notifications: props.notifications,
            unread: props.unread,
            open: false,
            style:props.style,
            pagging:props.pagging,
            type:props.type
        }
        

    }
   
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
         if(nextProps.style != prevState.style || nextProps.unread != prevState.unread || nextProps.notifications != prevState.notifications || nextProps.loading != prevState.loading || nextProps.pagging != prevState.pagging || nextProps.type != prevState.type){
            return {style:nextProps.style,unread:nextProps.unread,notifications:nextProps.notifications,pagging:nextProps.pagging,loading:nextProps.loading,type:nextProps.type}
        }else{
            return null
        }
    }
    
    
    render() {
        return (
            <React.Fragment>
                <li className={!this.props.mobileMenu ?  `nav-item dropdown main notclosenotification${this.state.style == "block" ? " active" : ""}` : `main dropdown MobDropdownNav notclosenotification${this.state.style == "block" ? " active" : ""}`} id="navbarDropdownList" onClick={(e)=>this.props.openToggle('notifications',e)}>
                    <a className={!this.props.mobileMenu ? "nav-link markReadAll parent notclosenotification bg-cnt" : "parent notclosenotification"}  href="#">
                        <span className="material-icons parent">notifications</span>
                        {
                            this.state.unread > 0 ?
                                <span className="notifNmbr parent">{this.state.unread > 10 ? "10+" : this.state.unread}</span>
                                : null
                        }
                    </a>
                    {
                        !this.props.mobileMenu ? 
                    <ul className={`dropdown-menu notificationMenu dropdown-menu-right iconMenuList`} ref={this.props.setNotificationWrapperRef}  style={{display:this.state.style}}>
                        <span className="dropdown-menu-arrow"></span>
                        <Items {...this.props} loadMoreContent={this.props.loadMoreContent}  pagging={this.state.pagging} notifications={this.state.notifications} loading={this.state.loading} />
                    </ul>
                    : null
                    }
                </li>
            </React.Fragment>
        )

    }


}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};

export default connect(mapStateToProps)(Notifications)