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

import Parser from 'html-react-parser';


const Pages = (props) => (
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
                            

                                {
                                    props.pageData.pageInfo.image ? 
                                <div className="titleBarTop">
                                    <div className="titleBarTopBg"><img src={props.pageData.pageInfo.image}
                                            alt={props.pageData.pageInfo.title} />
                                    </div>
                                    <div className="overlay">
                                        <div className="container">
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="titleHeadng">
                                                        {/* <h1>{props.pageData.pageInfo.title}</h1> */}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            : null
                                }
                            <div className="mainContentWrap">
                                <div className="container">
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="ContentBoxTxt" style={{marginTop :!props.pageData.pageInfo.image ? "10px" : "-100px"}}>
                                                <div className="content page_content">
                                                {
                                                    Parser(props.pageData.pageContent)
                                                }
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

const Extended = withTranslation('common', { i18n, wait: process.browser })(Pages);

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