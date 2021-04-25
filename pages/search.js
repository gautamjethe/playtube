import React from 'react';
import Layout from '../hoc/Layout/Layout';
import * as actions from '../store/actions/general';
import axios from "../axios-site"
import SearchView from "../containers/Search/Search"
import i18n from '../i18n';
import { withTranslation } from 'react-i18next';

import PageNotFound from "../containers/Error/PageNotFound"
import PermissionError from "../containers/Error/PermissionError"
import Login from "../containers/Login/Index"
import Maintanance from "../containers/Error/Maintenance"

const Search = (props) => (
    <Layout {...props}  hideSmallMenu={true}>
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
        <SearchView {...props}  hideSmallMenu={true}  />
    }
    </Layout>
)

const Extended = withTranslation('common', { i18n, wait: process.browser })(Search);

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
        let type = ""
        let queryData = "?data=1"
        if (context.query.type) {
            type = `/${context.query.type}`
        }
        if (context.query.h) {
            queryData = `${queryData}&h=${context.query.h}`
        }
        if (context.query.category) {
            queryData = `${queryData}&category=${context.query.category}`
        }
        if (context.query.sort) {
            queryData = `${queryData}&sort=${context.query.sort}`
        }
        if (context.query.filter) {
            queryData = `${queryData}&filter=${context.query.filter}`
        }
        const pageData = await axios.get("/search" + type + queryData);
        return {pageData:pageData.data.data,user_login:pageData.data.user_login,pagenotfound:pageData.data.pagenotfound,permission_error:pageData.data.permission_error,maintanance:pageData.data.maintanance}
    }
}

export default Extended