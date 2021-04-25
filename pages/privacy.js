import React from 'react';
import Layout from '../hoc/Layout/Layout';
import * as actions from '../store/actions/general';
import axios from "../axios-site"
import i18n from '../i18n';
import { withTranslation } from 'react-i18next';

import PageNotFound from "../containers/Error/PageNotFound"
import PermissionError from "../containers/Error/PermissionError"
import Login from "../containers/Login/Index"
import Maintanance from "../containers/Error/Maintenance"

import Breadcrum from "../components/Breadcrumb/Index"


const Privacy = (props) => (
    <Layout {...props} >
        {
            props.pagenotfound ?
                <PageNotFound {...props} />
: props.user_login ?
        <Login {...props} />
                : props.permission_error ?

                    <PermissionError {...props} />
                    : props.maintanance ?
                        <Maintanance {...props} />
                        :

                        <React.Fragment>
                            <div className="titleBarTop">
                                <div className="titleBarTopBg"><img src={props.pageData['pageInfo']['banner'] ? props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"}
                                        alt={props.t("Privacy Policy")} />
                                </div>
                                <div className="overlay">
                                    <div className="container">
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="titleHeadng">
                                                    <h1>{props.t("Privacy Policy")}</h1>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mainContentWrap">
                                <div className="container">
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="ContentBoxTxt">
                                                <div className="content page_content" dangerouslySetInnerHTML={{ __html: (props.pageData.pagecontent) }}>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
        }
    </Layout>
)

const Extended = withTranslation('common', { i18n, wait: process.browser })(Privacy);

Extended.getInitialProps = async function (context) {
    const isServer = !!context.req
    if (isServer) {
        const req = context.req
        req.i18n.toJSON = () => null
        const initialI18nStore = {}
        req.i18n.languages.forEach((l) => {
            initialI18nStore[l] = req.i18n.services.resourceStore.data[l];
        })
        await context.store.dispatch(actions.setPageInfoData(context.query))
        return { pageData: context.query, initialI18nStore, i18n: req.i18n, initialLanguage: req.i18n.language }
    } else {

        const pageData = await axios.get("/privacy?data=1");
        return { pageData: pageData.data.data, pagenotfound: pageData.data.pagenotfound, permission_error: pageData.data.permission_error, maintanance: pageData.data.maintanance }
    }
}

export default Extended