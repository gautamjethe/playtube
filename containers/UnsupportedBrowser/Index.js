const index = (props) => {
    return (
        <div className="content-wrap">
        <div className="user-area">
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="browserSupportWrap">
                            <div className="leftImg">
                                <img alt="" src="/static/images/dinosaur-vflc7WKGL.png" />
                            </div>                            
                            <div className="browsers">
                                <h1>{props.t(props,"Please update your browser")}
                                </h1>
                                <p>{props.t(props,"Your browser isn’t supported anymore. Update it to get the best {{site_url}} experience and our latest features.",{site_url:props.pageInfoData.appSettings["site_title"]})}
                                </p>
                                <ul className="browsers-list">
                                    <li className="browser"><a href="https://www.opera.com/" target="_blank">
                                        <img
                                                src="/static/images/opera-vflERXhu7.png" alt=""
                                                width="72px" height="72px" />
                                            <h3>{props.t(props,"Opera")}</h3>
                                        </a></li>
                                    <li className="browser"><a href="https://www.microsoft.com/edge" target="_blank"><img
                                                src="/static/images/edgium-vflAQEMIb.png" alt=""
                                                width="72px" height="72px" />
                                            <h3>{props.t(props,"Microsoft Edge")}</h3>
                                        </a></li>
                                    <li className="browser"><a target="_blank"
                                            href="https://www.mozilla.org/firefox/new/?utm_source=youtube.com&amp;utm_medium=referral&amp;utm_campaign=supported-browser"><img
                                                src="/static/images/firefox-vflMTE3Tn.png" alt=""
                                                width="72px" height="72px" />
                                            <h3>{props.t(props,"Mozilla Firefox")}</h3>
                                        </a></li>
                                    <li className="browser last"><a target="_blank"
                                            href="https://www.google.com/chrome/index.html?brand=CHNY&amp;utm_campaign=en&amp;utm_source=en-et-youtube&amp;utm_medium=et"><img
                                                src="/static/images/chrome-vflGHXqMv.png" alt=""
                                                width="72px" height="72px" />
                                            <h3>{props.t(props,"Google Chrome")}</h3>
                                        </a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    )
}

export default index