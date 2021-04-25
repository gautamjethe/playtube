import React from "react"
import { connect } from "react-redux";
import action from '../../store/actions/general'

import Link from "../../components/Link/index"
import LanguageSwitcher from "../../components/LocaleSwitcher"
import Router from "next/router"
import Image from "../Image/Index"

import axios from "../../axios-orders"
import Translate from "../../components/Translate/Index"
class SideFixedMenu extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            adult:props.pageInfoData.adultAllowed ? true : false,
             previousUrl:typeof window != "undefined" ? Router.asPath : ""
        }
        this.allowAdultContent = this.allowAdultContent.bind(this)
        this.openSubMenu = this.openSubMenu.bind(this);
        this.openMenu = this.openMenu.bind(this);
        
    }
    openMenu = (e,submenu) => {
        if(submenu){
            if(this.state.submenu != submenu[0].menu_id){
                this.setState({submenu:submenu[0].menu_id})
            }else{
                this.setState({submenu:null})
            }
        }
    }
    openSubMenu = (e,submenu) => {
        if(submenu){
            if(this.state.subsubmenu != submenu[0].menu_id){
                this.setState({subsubmenu:submenu[0].menu_id})
            }else{
                this.setState({subsubmenu:null})
            }
        }
    }
    allowAdultContent = (e) => {
        this.setState({adult:!this.state.adult},() => {
            const formData = new FormData()
            formData.append('adult', this.state.adult ? 1 : 0)            
            let url = '/members/adult'
            axios.post(url, formData)
                .then(response => {
                 Router.push( this.state.previousUrl ? this.state.previousUrl : Router.pathname)
                })
        })
        
    }
    showHideMenu = (e) => {
        this.props.setMenuOpen(true)
    }
    render(){
        let path = ""
        if(typeof window != "undefined"){
            path = Router.asPath
        }else{
            path = this.props.currentPageUrl
        }
        if(this.props.pageInfoData.appSettings['fixed_header'] != 1){
            return null;
        }
        let bottomFooterMenus = this.props.pageInfoData.menus.bottomFooterMenus
        let socialShareMenus = this.props.pageInfoData.menus.socialShareMenus
        let menus = null
        if(this.props.pageInfoData.menus && this.props.pageInfoData.menus.menus){
            menus = this.props.pageInfoData.menus.menus.map(elem => {
                return (
                    <li onClick={(e) => {this.openMenu(e,elem.submenus)}} className={"nav-item" + (elem.submenus ? " dropdown dropdownmenu" : "")+ (this.props.menuOpen && elem.submenus ? " hide" : "") } key={elem.menu_id}>
                        <Link href={elem.params ? elem.params : elem.url} customParam={elem.customParam} as={elem.url}>
                            <a className={"nav-link" + (elem.submenus ? " dropdown-toggle" : "") + (path.indexOf(elem.url) > -1 && path.indexOf(elem.url+"/") < 0 ? " active" : "")} target={elem.target} id={"navbarDropdown" + elem.menu_id}
                            >
                                {
                                    elem.icon ? 
                                        <i className={elem.icon}></i>
                                    : null
                                }
                                {this.props.t(elem.label)}
                            </a>
                        </Link>
                        {
                            elem.submenus ?
                                <ul className={`submenu collapse${this.state.submenu && this.state.submenu == elem.submenus[0].menu_id ? " show" : ""}`}>
                                    {
                                        elem.submenus.map(subMenu => {
                                            return (
                                                <li onClick={(e) => {this.openSubMenu(e,subMenu.subsubmenus)}} className={"nav-item" + (subMenu.subsubmenus ? " dropdown dropdownmenu" : "")} key={subMenu.menu_id}>
                                                    <Link href={subMenu.params ? subMenu.params : subMenu.url} customParam={subMenu.customParam} as={subMenu.url}>
                                                        <a className={ (subMenu.subsubmenus ? " dropdown-toggle" : "")} target={subMenu.target}
                                                            id={"navbarDropdown" + subMenu.menu_id}>
                                                                {
                                                                    subMenu.icon ? 
                                                                        <i className={subMenu.icon}></i>
                                                                    : null
                                                                }
                                                            {this.props.t(subMenu.label)}
                                                        </a>
                                                    </Link>
                                                    {
                                                        subMenu.subsubmenus ?
                                                            <ul className={`submenu collapse${this.state.subsubmenu && this.state.subsubmenu == subMenu.subsubmenus[0].menu_id ? " show" : ""}`}>
                                                                {
                                                                    subMenu.subsubmenus.map(subsubMenu => {
                                                                        return (
                                                                            <li key={subsubMenu.menu_id}>
                                                                                <Link href={subsubMenu.params ? subsubMenu.params : subsubMenu.url} customParam={subsubMenu.customParam} as={subsubMenu.url}>
                                                                                    {
                                                                                        subsubMenu.icon ? 
                                                                                            <i className={subsubMenu.icon}></i>
                                                                                        : null
                                                                                    }
                                                                                    <a target={subsubMenu.target}>{this.props.t(subsubMenu.label)}</a>
                                                                                </Link>
                                                                            </li>
                                                                        )
                                                                    })
                                                                }
                                                            </ul>
                                                            : null
                                                    }
                                                </li>
                                            )
                                        })
                                    }
                                </ul>
                                : null
                        }
                    </li>
                )
            })
        }
        var hideSmallMenu = this.props.hideSmallMenu
        var menuOpen = this.props.menuOpen
        
        if(menuOpen && this.props.mobileMenu){
            menuOpen = false
            hideSmallMenu = false
        }


        if(hideSmallMenu && menuOpen){
            return null
        }
        let logo = ""
        if (this.props.pageInfoData.themeMode == "dark") {
            logo = this.props.pageInfoData['imageSuffix'] + this.props.pageInfoData.appSettings['darktheme_logo']
        } else {
            logo = this.props.pageInfoData['imageSuffix'] + this.props.pageInfoData.appSettings['lightheme_logo']
        }
        return (
            <div className={`sidebar-menu${menuOpen ? " mini-menu" : ""}`}>
                {
                        hideSmallMenu ? 
                        <div className="top-header side-menu-top">
                            <div className="left-side">
                                <div className="menu-icon" onClick={this.showHideMenu}><span className="material-icons">menu</span></div>
                                <div className="logo">
                                    <Link href="/">
                                        <a onClick={this.closeMenu}><img src={logo} className="img-fluid" /></a>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    : null
                    }
                <div className="menu-list sidebar-scroll">
                    
                    <ul className={`main-menu border-sidebar${menuOpen ? " small-menu" : ""}`}>
                        <li>
                            <Link href="/">
                                <a className={(path == "/" ? "active" : "")}>
                                    <span className="material-icons">home</span> {Translate(this.props,'Home')}
                                </a>
                            </Link>
                        </li>
                        {
                            this.props.pageData.levelPermissions && this.props.pageData.levelPermissions["livestreaming.create"] == 1 && this.props.pageData.liveStreamingEnable ?
                        <li>
                            <Link href="create-livestreaming" as="/live-streaming">
                                <a>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="6" fill="#f44336"/><path fill="#f44336" d="M17.09,16.789L14.321,13.9C11.663,16.448,10,20.027,10,24s1.663,7.552,4.321,10.1l2.769-2.889 C15.19,29.389,14,26.833,14,24C14,21.167,15.19,18.61,17.09,16.789z"/><path fill="#f44336" d="M33.679,13.9l-2.769,2.889C32.81,18.611,34,21.167,34,24c0,2.833-1.19,5.389-3.09,7.211l2.769,2.889 C36.337,31.552,38,27.973,38,24S36.337,16.448,33.679,13.9z"/><g><path fill="#f44336" d="M11.561,11.021l-2.779-2.9C4.605,12.125,2,17.757,2,24s2.605,11.875,6.782,15.879l2.779-2.9 C8.142,33.701,6,29.1,6,24S8.142,14.299,11.561,11.021z"/><path fill="#f44336" d="M39.218,8.121l-2.779,2.9C39.858,14.299,42,18.9,42,24s-2.142,9.701-5.561,12.979l2.779,2.9 C43.395,35.875,46,30.243,46,24S43.395,12.125,39.218,8.121z"/></g></svg>
                                    {this.props.t("Go Live")}
                                </a>
                            </Link>
                        </li>
                        : null
                        }
                        {
                            this.props.pageInfoData.loggedInUserDetails ? 
                                <React.Fragment>
                                    <li>
                                        <Link href="/dashboard" as="/dashboard/videos/my_recent" customParam="type=videos&filter=my_recent">
                                            <a className={(path.indexOf('/dashboard/videos/my_recent') > -1 ? "active" : "")}>
                                                <span className="material-icons">history</span> {Translate(this.props,'History')}
                                            </a>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/dashboard" as="/dashboard/purchases" customParam="type=purchases">
                                            <a className={(path.indexOf('/dashboard/purchases') > -1 ? "active" : "")}><span className="material-icons">shop_two</span> {Translate(this.props,'Purchases')}</a>
                                        </Link>
                                    </li>
                                </React.Fragment>
                        : null
                        }
                        <li>
                            <Link href="/videos" as="/videos/latest" customParam="sort=latest">
                    <a className={(path.indexOf('/videos/latest') > -1 ? "active" : "")}><span className="material-icons">videocam</span> {Translate(this.props,'Latest Videos')}</a>
                            </Link>
                        </li>
                        <li>
                            <Link href="/videos" as="/videos/trending" customParam="pageType=trending">
                    <a className={(path.indexOf('/videos/trending') > -1 ? "active" : "")}><span className="material-icons">trending_up</span> {Translate(this.props,'Trending Videos')}</a>
                            </Link>
                        </li>
                        <li>
                            <Link href="/videos" as="/videos/top" customParam="pageType=top">
                    <a className={(path.indexOf('/videos/top') > -1 ? "active" : "")}><span className="material-icons">bar_chart</span> {Translate(this.props,'Top Videos')}</a>
                            </Link>
                        </li>
                    </ul>

                    {
                        this.props.pageInfoData.channelSubscriptions && this.props.pageInfoData.channelSubscriptions.length > 0 ? 
                            <ul className={`main-menu border-sidebar${menuOpen ? " hide" : ""}`}>
                                 <li className={`sidebar-menu-title`}>{Translate(this.props,'Subscriptions')}</li>
                                {
                                    this.props.pageInfoData.channelSubscriptions.map(channel => {
                                        return (
                                            <li key={channel.custom_url}>
                                                 <Link href="/channel" customParam={`channelId=${channel.custom_url}`} as={`/channel/${channel.custom_url}`}>
                                                    <a className="sidebar-icon">
                                                        <Image className="sidebar-img" imageSuffix={this.props.pageInfoData.imageSuffix} image={channel.image} title={channel.title} />
                                                        {channel.title}
                                                    </a>
                                                </Link>
                                            </li>
                                        )
                                    })
                                }
                                <li>
                                    <Link href="/channels">
                                        <a>
                                            <span className="material-icons">add_circle</span> {Translate(this.props,'Browse channels')}
                                        </a>
                                    </Link>
                                </li>
                            </ul>
                    : null
                    }
                    {
                        this.props.pageInfoData.popularMembers ? 
                            <ul className={`main-menu border-sidebar${menuOpen ? " hide" : ""}`}>
                                <li className="sidebar-menu-title">{Translate(this.props,'Popular Members')}</li>
                                {
                                    this.props.pageInfoData.popularMembers.map((member,index) => {
                                        if(index < 5){
                                            return (
                                                <li key={member.user_id}>
                                                    <Link href="/member" customParam={`memberId=${member.username}`} as={`/${member.username}`}>
                                                        <a className="sidebar-icon">
                                                            <Image className="sidebar-img" imageSuffix={this.props.pageInfoData.imageSuffix} image={member.avtar} title={this.props.t(member.displayname)} />
                                                            {member.displayname}
                                                        </a>
                                                    </Link>
                                                </li>
                                            )
                                        }
                                    })
                                }                                

                            </ul>
                        : null
                    }        
                    {
                        menus ? 
                            <ul className={`main-menu border-sidebar${menuOpen ? " hide" : ""}`}>
                                 <li className={`sidebar-menu-title`}>{Translate(this.props,'Menus')}</li>
                                {menus}
                            </ul>
                    : null
                    }

                    <div className={`sidebar-menu-two${menuOpen ? " hide" : ""}`}>  
                    
                    {
                        this.props.pageInfoData.categoriesVideo ? 
                            <ul className="main-menu border-sidebar">
                                <li className="sidebar-menu-title">{Translate(this.props,'Categories')}</li>
                                {
                                    this.props.pageInfoData.categoriesVideo.map(category => {
                                        return (
                                            <li key={category.category_id}>
                                                <Link href={`/category`} customParam={`type=video&categoryId=` + category.slug} as={`/video/category/` + category.slug}>
                                                    <a className="sidebar-icon">
                                                        <Image className="sidebar-img" imageSuffix={this.props.pageInfoData.imageSuffix} image={category.image} title={this.props.t(category.title)} />
                                                        {category.title}
                                                    </a>
                                                </Link>
                                            </li>
                                        )
                                    })
                                }                                

                            </ul>
                        : null
                    }           

                       


                        <ul className="main-menu border-sidebar">
                            <li className="sidebar-menu-title">{Translate(this.props,'Settings')}</li>
                            <LanguageSwitcher {...this.props} />
                            {
                                this.props.pageInfoData.appSettings['video_adult'] == 1 || this.props.pageInfoData.appSettings['channel_adult'] == 1 || this.props.pageInfoData.appSettings['blog_adult'] == 1 || this.props.pageInfoData.appSettings['playlist_adult'] == 1 ?
                                <div className="custom-control custom-switch adultSwitchFtr">
                                    <input onChange={this.allowAdultContent} defaultChecked={this.state.adult}  type="checkbox" className="custom-control-input" id="adultSwitchFtr"  />
                                    <label className="custom-control-label" htmlFor="adultSwitchFtr">{this.props.t("Adult content")}</label>
                                    <span className="error"></span>
                                </div>
                            : null
                        }
                        </ul>

                        
                        {
                            socialShareMenus && socialShareMenus.length ?
                        <ul className="main-menu border-sidebar">
                            <li className="sidebar-menu-title">{this.props.t("Follow us on")}</li>
                            <div className="social-follow-btn">
                                {
                                    socialShareMenus.map(menu => {
                                        return(
                                            <a key={menu.menu_id} href={menu.url != "javascript:void(0)" && menu.url != "#" ? menu.url : "#"} target="_blank">
                                                <i className={menu.icon}></i>
                                            </a>
                                        )
                                    })
                                }
                            </div>
                        </ul>
                        : null
                        }
                        {
                            bottomFooterMenus && bottomFooterMenus.length ?
                                <div className="imp-links">
                                    {
                                        bottomFooterMenus.map(menu => {
                                            return (
                                                <Link href={menu.url}   key={menu.menu_id}>
                                                    <a  target={menu.target}>
                                                        {this.props.t(menu.label)}
                                                    </a>
                                                </Link>
                                            )
                                        })
                                    }
                                </div>
                        : null
                        }
                        <div className="copyright">
                            {this.props.t("Copyright © {{year}} {{site_title}}. All Rights Reserved.",{year:(new Date()).getFullYear(),site_title:this.props.pageInfoData.appSettings['site_title']})}
                        </div>

                    </div>
                </div>
            </div>
        )
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setMenuOpen: (value) => dispatch(action.setMenuOpen(value))
    };
};
export default connect(null, mapDispatchToProps)(SideFixedMenu)