import React, { Component } from "react"

import { connect } from "react-redux";

import Link from "../../components/Link"

import CreateButtons from "../Header/CreateButtons"

import Notifications from "../Header/Notifications"

import SettingMenus from "../Header/SettingMenus"

import action from '../../store/actions/general'
import Router from 'next/router'
import Translate from "../../components/Translate/Index"
import axios from "../../axios-orders"
import SiteModeChange from "../../containers/Sitemode/Index"


class FixedMenu extends Component {
    constructor(props) {
        super(props)
        this.state = {
            search: props.pageInfoData.searchTitleText ? props.pageInfoData.searchTitleText : "",
            path: typeof window != "undefined" ? Router.pathname : "",
            opendMenu: null,
            type: "",
            style: "none",
            loading: true,
            notifications: [],
            menuStyle: "",
            menuOpened:false
        }
        this.loadMoreContent = this.loadMoreContent.bind(this)
        this.updateOpenedMenu = this.updateOpenedMenu.bind(this)
        this.setNotificationWrapperRef = this.setNotificationWrapperRef.bind(this)
        this.setSettingsWrapperRef = this.setSettingsWrapperRef.bind(this)
        this.setTableSearch = this.setTableSearch.bind(this)
        this.setCreateButtonsWrapperRef = this.setCreateButtonsWrapperRef.bind(this)
        this.setSearchRef = this.setSearchRef.bind(this)
        this.setMenuButtons = this.setMenuButtons.bind(this)
        this.handleClickOutside = this.handleClickOutside.bind(this)
        this.openToggle = this.openToggle.bind(this)
        this.deleteNotification = this.deleteNotification.bind(this)
        this.markUnread = this.markUnread.bind(this)
        this.showHideMenu = this.showHideMenu.bind(this)
    }
    setMenuButtons(node) {
        this.dropMenuButtons = node
    }
    setNotificationWrapperRef(node) {
        this.dropNotificationRef = node;
    }
    setSettingsWrapperRef(node) {
        this.dropSettingsRef = node;
    }
    setCreateButtonsWrapperRef(node) {
        this.dropRef = node;
    }
    setSearchRef(node) {
        this.searchRef = node
    }
    setTableSearch(node) {
        this.searchTableRef = node
    }
    componentWillUnmount() {
        document.removeEventListener("click", this.handleClickOutside, false);
    }
    openToggle = (type, e) => {
        e.preventDefault();
        let style = this.state.style
        if (type != this.state.type)
            style = "none"
        if (type == "notifications") {
            if($(e.target).hasClass("notclosenotification")){
                return;
            }
            if (style == "none") {
                this.markAllRead(0, '')
            }
            this.setState({localUpdate:true, style: style == "block" ? "none" : "block", type: style == "none" ? "notifications" : "" }, () => {
                if (this.props.mobileMenu) {
                    if (this.state.style == "block")
                        $("body").addClass("menu_open");
                    else
                        $("body").removeClass("menu_open")
                }
            });
        } else if (type == "settings") {
            this.setState({localUpdate:true, style: style == "block" ? "none" : "block", type: style == "none" ? "settings" : "" }, () => {
                if (this.props.mobileMenu) {
                    if (this.state.style == "block")
                        $("body").addClass("menu_open");
                    else
                        $("body").removeClass("menu_open")
                }
            });
        } else if (type == "createbuttons") {
            this.setState({localUpdate:true, style: style == "block" ? "none" : "block", type: style == "none" ? "createbuttons" : "" }, () => {
                if (this.props.mobileMenu) {
                    if (this.state.style == "block")
                        $("body").addClass("menu_open");
                    else
                        $("body").removeClass("menu_open")
                }
            });
        } else if (type == "search") {
            this.setState({localUpdate:true, style: style == "block" ? "none" : "block", type: style == "none" ? "search" : "" }, () => {
                if (this.props.mobileMenu) {
                    // if (this.state.style == "block")
                    //     $("body").addClass("menu_open");
                    // else
                    //     $("body").removeClass("menu_open")
                }
            });
        } else if (type == "searchTable") {
            this.setState({localUpdate:true, style: style == "block" ? "none" : "block", type: style == "none" ? "search" : "" });
        }
    }
    handleClickOutside(e) {
        let style = "block"
        if (this.state.type && e.target && !$(e.target).hasClass("parent")) {
            if (this.state.type == "notifications") {
                if (this.dropNotificationRef && !this.dropNotificationRef.contains(e.target)) {
                    if (!$(e.target).hasClass("notclosenotification") && !$(e.target).hasClass("parent"))
                        style = "none"
                } else if (e.target && !$(e.target).hasClass('notclosenotification') && !$(e.target).hasClass('parent')) {
                    style = "none"
                } else if (!e.target) {
                    style = "none"
                }

            } else if (this.state.type == "settings") {
                if (this.dropSettingsRef && !this.dropSettingsRef.contains(e.target)) {
                    if (!$(e.target).hasClass("notclose"))
                        style = "none"
                } else if (e.target && e.target.id != "sitedarkmode" && e.target.id != "sitedarkmodelabel") {
                    style = "none"
                }
            } else if (this.state.type == "createbuttons") {
                if (this.dropRef && !this.dropRef.contains(e.target)) {
                    if (!$(e.target).hasClass("notclosecreate"))
                        style = "none"
                } else if (e.target) {
                    style = "none"
                }
            } else if (this.state.type == "search") {
                if (this.searchRef && !this.searchRef.contains(e.target)) {
                    style = "none"
                } else if (this.searchTableRef && !this.searchTableRef.contains(e.target)) {
                    style = "none"
                }
            }
            if (style == "none") {
                this.setState({localUpdate:true, type: "", style: "none" })
                $("body").removeClass("menu_open")
            }
        } else if (e.target && !$(e.target).hasClass("menu-bar") && !$(e.target).hasClass("dropdown-toggle") && (!this.dropMenuButtons || !this.dropMenuButtons.contains(e.target))) {
            if (this.state.menuStyle == " show") {
                this.setState({localUpdate:true, menuStyle: "" })
                $("body").removeClass("menu_open")
            }
        }
    }
   
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.pageInfoData.searchTitleText && nextProps.pageInfoData.searchTitleText != prevState.search) {
            return { search: nextProps.pageInfoData.searchTitleText ? nextProps.pageInfoData.searchTitleText : "", style: false }
        } else{
            return null
        }
    }
    componentDidUpdate(prevProps,prevState){
        if (!this.props.mobileMenu) {
            $("body").removeClass("menu_open")
        } else if (this.state.type) {
            $("body").addClass("menu_open")
        }
    }
    updateOpenedMenu(type) {
        this.setState({localUpdate:true, opendMenu: type })
    }
    markAllRead = () => {
        const formData = new FormData()

        this.setState({localUpdate:true, unread: 0 })
        let url = '/notifications/read'
        formData.append('allread', 1)
        axios.post(url, formData)
            .then(response => {

            }).catch(err => {

            });
    }
    loadMoreContent(firstLoaded) {
        const formData = new FormData()
        let url = '/notifications'
        if (!firstLoaded) {
            formData.append('id', this.state.notifications[this.state.notifications.length - 1].notification_id)
        }
        axios.post(url, formData)
            .then(response => {
                if (response.data.error) {
                    this.setState({localUpdate:true, loading: false })
                } else {
                    this.setState({localUpdate:true, loading: false, notifications: [...this.state.notifications, ...response.data.notifications], unread: response.data.unread, pagging: response.data.pagging })
                }
            }).catch(err => {
                this.setState({localUpdate:true, loading: false })
            });
    }
    componentDidMount() {

        this.props.socket.on('notifications', data => {
            if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
                if (data.owner_id == this.props.pageInfoData.loggedInUserDetails.user_id) {
                    this.setState({localUpdate:true, notifications: [data.notification, ...this.state.notifications], unread: this.state.unread + 1 }, () => {
                    })
                }
            }
        })
        this.props.socket.on("deleteNotifications", data => {
            let notification_id = data.notification_id
            let owner_id = data.owner_id
            if (this.props.pageInfoData && this.props.pageInfoData.loggedInUserDetails) {
                if (owner_id == this.props.pageInfoData.loggedInUserDetails.user_id) {
                    let index = this.getIndex(notification_id)
                    if (index > -1) {
                        const notifications = [...this.state.notifications]
                        notifications.splice(index, 1);
                        this.setState({localUpdate:true, notifications: notifications })
                    }
                }
            }

        })
        this.loadMoreContent(true)
        document.addEventListener("click", this.handleClickOutside, false);
        //Menu
        (function ($) {
            var defaults = {
                sm: 540,
                md: 720,
                lg: 960,
                xl: 1140,
                navbar_expand: 'lg'
            };
            $.fn.bootnavbar = function () {
                var screen_width = $(document).width();
                if (screen_width >= defaults.lg) {
                    $(this).find('.dropdownmenu').hover(function () {
                        $(this).addClass('show');
                        $(this).find('.dropdown-menu').first().addClass('show').addClass('animated fadeIn').one('animationend oAnimationEnd mozAnimationEnd webkitAnimationEnd', function () {
                            $(this).removeClass('animated fadeIn');
                        });
                    }, function () {
                        $(this).removeClass('show');
                        $(this).find('.dropdown-menu').first().removeClass('show');
                    });
                }
                $('.dropdown-menu a.dropdown-toggle').on('click', function (e) {
                    if (!$(this).next().hasClass('show')) {
                        $(this).parents('.dropdown-menu').first().find('.show').addClass("show");
                    }
                    var $subMenu = $(this).next(".dropdown-menu");
                    $subMenu.toggleClass('show');
                    $(this).parents('li.nav-item.dropdown.show').on('hidden.bs.dropdown', function (e) {
                        $('.dropdown-submenu .show').addClass("show");
                    });
                    // return false;
                });
            };
        })(jQuery);
        $(function () {
            $('#main_navbar').bootnavbar();
        })
    }

    markUnread = (notification_id, e) => {
        const formData = new FormData()
        let notifications = []
        this.state.notifications.forEach(result => {
            if (notification_id > 0) {
                if (result.notification_id == notification_id) {
                    result.is_read = result.is_read == 1 ? 0 : 1
                }
            } else {
                result.is_read = 1
            }
            notifications.push(result)
        });
        this.setState({localUpdate:true, notifications: notifications })
        let url = '/notifications/read'
        if (notification_id > 0) {
            formData.append('id', notification_id)
        }
        axios.post(url, formData)
            .then(response => {

            }).catch(err => {

            });
    }
    deleteNotification = (notification_id, e) => {
        let index = this.getIndex(notification_id)
        if (index > -1 && notification_id > 0) {
            const formData = new FormData()
            const notifications = [...this.state.notifications]
            notifications.splice(index, 1);
            this.setState({localUpdate:true, notifications: notifications })
            let url = '/notifications/delete'
            if (notification_id > 0) {
                formData.append('id', notification_id)
            }
            axios.post(url, formData)
                .then(response => {

                }).catch(err => {

                });
        }
    }
    getIndex(id) {
        const notifications = [...this.state.notifications];
        const Index = notifications.findIndex(p => p.notification_id == id);
        return Index;
    }

    onClickLoginPopUp = (e) => {
        e.preventDefault()
    }
    search = (e) => {
        e.preventDefault()
        if (!this.state.search)
            return
        this.setState({localUpdate:true, type: "", style: "none" })
        const currentPath = Router.pathname;
        if (currentPath == "/search") {
            this.props.setSearchChanged(true)
            this.props.changeSearchText(this.state.search)
        } else {
            Router.push(
                `/search?h=${this.state.search}`,
                `/search?h=${this.state.search}`,
            )
        }
    }
    
    showHideMenu = (e) => {
        this.props.setMenuOpen(!this.props.menuOpen)
    }
    searchClicked = (e) => {
        if(Router.asPath.indexOf("/search/") < 0 ){
            this.props.setSearchClicked(true)
        }        
    }
    render() {
        if (!this.props.pageInfoData) {
            return null
        }
        

        let logo = ""
        if (this.props.pageInfoData.themeMode == "dark") {
            logo = this.props.pageInfoData['imageSuffix'] + this.props.pageInfoData.appSettings['darktheme_logo']
        } else {
            logo = this.props.pageInfoData['imageSuffix'] + this.props.pageInfoData.appSettings['lightheme_logo']
        }


        return (
            <header id="header" className="fixed-top ">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="top-header pl-md-3 pr-md-3">
                                <div className="left-side">
                                    <div className="menu-icon" onClick={this.showHideMenu}><span className="material-icons">menu</span></div>
                                    <div className="logo">
                                        <Link href="/">
                                            <a><img src={logo} className="img-fluid" /></a>
                                        </Link>
                                    </div>
                                </div>
                                <div className="head-search">
                                    <div className="search-box">
                                        <input type="text" name="search" onFocus={this.searchClicked} onChange={(e) => { this.setState({localUpdate:true, search: e.target.value }) }} placeholder={Translate(this.props,'Search')} />
                                        <button onClick={this.search.bind(this)}><span className="material-icons">search</span></button>
                                    </div>
                                </div>
                                <div className="rightTopList right-side">
                                {
                                        !this.props.pageInfoData.loggedInUserDetails ?
                                            <div className="rightTopList">
                                                <ul className="custmenuRight">
                                                    <li className={!this.props.mobileMenu ? `nav-item dropdown${this.state.style == "block" ? " active" : ""}` : `dropdown MobDropdownNav${this.state.style == "block" ? " active" : ""}`}  style={{cursor:"pointer"}}  >
                                                        <a className={!this.props.mobileMenu ? "parent nav-link notclose usepicHead logged-in-cnt" : "parent loggedUer notclose usepicHead logged-in-cnt"} onClick={(e) => this.openToggle("settings",e)}  style={{cursor:"pointer"}} href="#" 
                                                            role="button">
                                                                <span className="material-icons notclose parent">account_circle</span>
                                                                <span className="material-icons notclose parent">arrow_drop_down</span>
                                                        </a>
                                                        <ul className="dropdown-menu dropdown-menu-right iconMenuList" ref={this.props.setSettingsWrapperRef}  style={{display:this.state.style}} >
                                                            <span className="dropdown-menu-arrow"></span>

                                                                {
                                                            !this.props.loginButtonHide ?
                                                                this.props.redirectLogin ?
                                                                    <li>
                                                                        <Link href="/login">
                                                                            <a className="dropdown-item iconmenu" id="loginFormPopup">{Translate(this.props, "Login")}</a>
                                                                        </Link>
                                                                    </li>
                                                                    :
                                                                    <li>
                                                                        <Link href="/login">
                                                                            <a className="dropdown-item iconmenu" id="loginFormPopup" data-toggle="modal" data-target="#loginpop">{Translate(this.props, "Login")}</a>
                                                                        </Link>
                                                                    </li>
                                                                : null
                                                        }
                                                        {
                                                            !this.props.signButtonHide && this.props.pageInfoData.appSettings['member_registeration'] == 1 ?
                                                                this.props.redirectLogin ?
                                                                    <li>
                                                                        <Link href="/signup">
                                                                            <a className="dropdown-item iconmenu">{Translate(this.props, "Sign Up")}</a>
                                                                        </Link>
                                                                    </li>
                                                                    :
                                                                    <li>
                                                                        <Link href="/signup">
                                                                            <a className="dropdown-item iconmenu" data-toggle="modal" data-target="#registerpop">{Translate(this.props, "Sign Up")}</a>
                                                                        </Link>
                                                                    </li>
                                                                : null
                                                        }
                                                            <SiteModeChange {...this.props} iconLast={true} />
                                                        </ul>
                                                    </li>
                                                </ul>                                                        
                                            </div>
                                    :                                   
                                    <ul className="loggedin">
                                        <CreateButtons type="website" {...this.props} style={this.state.type == "createbuttons" ? this.state.style : "none"} openToggle={this.openToggle} setCreateButtonsWrapperRef={this.setCreateButtonsWrapperRef} />
                                        { 
                                            this.props.pageInfoData.loggedInUserDetails ?
                                                <React.Fragment>
                                                    <Notifications type="website" {...this.props} loading={this.state.loading} notifications={this.state.notifications} deleteNotification={this.deleteNotification} markUnread={this.markUnread} pagging={this.state.pagging} loadMoreContent={this.loadMoreContent} unread={this.state.unread} style={this.state.type == "notifications" ? this.state.style : "none"} openToggle={this.openToggle} setNotificationWrapperRef={this.setNotificationWrapperRef} />
                                                    <SettingMenus type="website"    {...this.props} style={this.state.type == "settings" ? this.state.style : "none"} openToggle={this.openToggle} setSettingsWrapperRef={this.setSettingsWrapperRef} />
                                                </React.Fragment>
                                                : null
                                        }
                                    </ul>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        )

    }

}

const mapDispatchToProps = dispatch => {
    return {
        setMenuOpen: (value) => dispatch(action.setMenuOpen(value)),
        setSearchClicked: (status) => dispatch(action.setSearchClicked(status)),
        changeSearchText: (value) => dispatch(action.changeSearchText(value)),
        setSearchChanged: (status) => dispatch(action.setSearchChanged(status))
    };
};

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData,
        searchClicked: state.search.searchClicked,
        menuOpen:state.search.menuOpen,
        searchValue: state.search.searchValue,
        
    };
};


export default connect(mapStateToProps, mapDispatchToProps)(FixedMenu)