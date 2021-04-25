import React from "react"

import Link from "../../components/Link/index"
import LanguageSwitcher from "../../components/LocaleSwitcher"
import Translate from "../../components/Translate/Index"

const Content = (props) => {
    if(!props.pageInfoData.menus){
        return null
    }
    let footerMenus = props.pageInfoData.menus.footerMenus
    let bottomFooterMenus = props.pageInfoData.menus.bottomFooterMenus
    let socialShareMenus = props.pageInfoData.menus.socialShareMenus
    let array1 = [],
            array2 = [],
            array3 = [],
            array4 = []
    let blogCount = 0
    let blogClass = 0
    if(footerMenus){
        blogCount = props.pageInfoData.menus.footerMenus.length > 3 ? 4 : (props.pageInfoData.menus.footerMenus.length > 2 ? 3 : (props.pageInfoData.menus.footerMenus.length > 1 ? 2 : 1))
        blogClass = props.pageInfoData.menus.footerMenus.length > 3 ? 3 : (props.pageInfoData.menus.footerMenus.length > 2 ? 4 : (props.pageInfoData.menus.footerMenus.length > 1 ? 6 : 12))

        for (var i = 0; i < footerMenus.length; i=i+4) {
            array1.push(footerMenus[i]);
        }

        if(blogCount > 1){
            for (var i = 1; i < footerMenus.length; i=i+4) {
                array2.push(footerMenus[i]);
            }
        }
        if(blogCount > 2){
            for (var i = 2; i < footerMenus.length; i=i+4) {
                array3.push(footerMenus[i]);
            }
        }
        if(blogCount > 3){
            for (var i = 3; i < footerMenus.length; i=i+4) {
                array4.push(footerMenus[i]);
            }
        }
    }
    return (
        <footer>
            {
                footerMenus && footerMenus.length ?
                    <div className="footer-top-wrap">
                        <div className="container">
                            <div className="row">
                                <div className={`col-lg-${blogClass} col-md-6 col-sm-6 col-12`}>
                                    <div className="fw-list footer-widget">
                                        <ul className="list">
                                        {
                                            array1.map(menu => {
                                                return (
                                                    <li  key={menu.menu_id}>
                                                        <Link href={menu.url}>
                                                            <a  target={menu.target}>
                                                                {props.t(menu.label)}
                                                            </a>
                                                        </Link>
                                                    </li>
                                                )
                                            })
                                        }
                                        </ul>
                                    </div>
                                </div>
                                {
                                    blogCount > 1 ?
                                <div className={`col-lg-${blogClass} col-md-6 col-sm-6 col-12`}>
                                <div className="fw-list footer-widget">
                                    <ul className="list">
                                    {
                                        array2.map(menu => {
                                            return (
                                                <li  key={menu.menu_id}>
                                                    <Link href={menu.url}>
                                                        <a  target={menu.target}>
                                                            {props.t(menu.label)}
                                                        </a>
                                                    </Link>
                                                </li>
                                            )
                                        })
                                    }
                                    </ul>
                                </div>
                                </div>
                                : null
                                }
                                {
                                    blogCount > 2 ?
                                <div className={`col-lg-${blogClass} col-md-6 col-sm-6 col-12`}>
                                <div className="fw-list footer-widget">
                                    <ul className="list">
                                    {
                                        array3.map(menu => {
                                            return (
                                                <li  key={menu.menu_id}>
                                                    <Link href={menu.url}>
                                                        <a  target={menu.target}>
                                                            {props.t(menu.label)}
                                                        </a>
                                                    </Link>
                                                </li>
                                            )
                                        })
                                    }
                                    </ul>
                                </div>
                                </div>
                                : null 
                                }
                                {
                                    blogCount > 3 ?
                                <div className={`col-lg-${blogClass} col-md-6 col-sm-6 col-12`}>
                                <div className="fw-list footer-widget">
                                    <ul className="list">
                                    {
                                        array4.map(menu => {
                                            return (
                                                <li  key={menu.menu_id}>
                                                    <Link href={menu.url}>
                                                        <a  target={menu.target}>
                                                            {props.t(menu.label)}
                                                        </a>
                                                    </Link>
                                                </li>
                                            )
                                        })
                                    }
                                    </ul>
                                </div>
                                </div>
                                : null 
                                }
                            </div>
                        </div>
                    </div>
                : null
            }
          <div className="footer-bottom-area">
            <div className="container-fluid">
              <div className="row">
                  <div className="col-lg-12">
                  <div className="footerContent">
                    <div className="footerLeft">
                    <ul className="footerLinks">
                    {
                        bottomFooterMenus && bottomFooterMenus.length ?
                        bottomFooterMenus.map(menu => {
                            return (
                                <li  key={menu.menu_id}>
                                    <Link href={menu.url}   key={menu.menu_id}>
                                        <a  target={menu.target}>
                                            {props.t(menu.label)}
                                        </a>
                                    </Link>
                                </li>
                            )
                        })
                        :null
                    }
                      
                      
                    </ul>
                    </div>

                    <div className="footerCenter">
                    <p className="copyright">{props.t("Copyright © {{year}} {{site_title}}. All Rights Reserved.",{year:(new Date()).getFullYear(),site_title:props.pageInfoData.appSettings['site_title']})}</p>
                    </div>

                    <div className="footerRight footer2Ul">
                    <ul className="footerLinks footerLinksRight">
                        {
                            socialShareMenus && socialShareMenus.length ?
                                socialShareMenus.map(menu => {
                                    return(
                                        <li key={menu.menu_id}>
                                            <a href={menu.url != "javascript:void(0)" && menu.url != "#" ? menu.url : "#"} target="_blank">
                                                <i className={menu.icon}></i>
                                            </a>
                                        </li>
                                    )
                                })
                            : null
                        }
                        
                    </ul>
                    <ul className="footerLinks">
                        {
                            props.pageInfoData.appSettings['video_adult'] == 1 || props.pageInfoData.appSettings['channel_adult'] == 1 || props.pageInfoData.appSettings['blog_adult'] == 1 || props.pageInfoData.appSettings['playlist_adult'] == 1 ?
                        <li>
                            <div className="custom-control custom-switch adultSwitchFtr">
                                <input type="checkbox" onChange={props.allowAdultContent} defaultChecked={props.adultChecked} className="custom-control-input" id="adultSwitchFtr" />
                                <label className="custom-control-label" htmlFor="adultSwitchFtr">{Translate(props,"Adult content")}</label>
                                <span className="error"></span>
                            </div>
                        </li>
                        : null
                        }
                        <LanguageSwitcher {...props} />
                    </ul>
                    </div>

                  </div>
                  </div>
              </div>
            </div>
          </div>
        </footer>
    )

}

export default Content