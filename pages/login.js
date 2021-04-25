import React from 'react';
import Layout from '../hoc/Layout/Layout';

import * as actions from '../store/actions/general';

import axios from "../axios-site"

import Router from "next/router"
import LoginForm from "../containers/Login/Index"

import i18n from '../i18n';

import { withTranslation } from 'react-i18next';

import PageNotFound from "../containers/Error/PageNotFound"
import PermissionError from "../containers/Error/PermissionError"
import Maintanance from "../containers/Error/Maintenance"

const Login = (props) => (
  <Layout {...props} loginButtonHide={true} redirectLogin={true} >
    {
      props.pagenotfound ? 
        <PageNotFound {...props} />
        : props.permission_error ?
        <PermissionError {...props} />
        : props.maintanance ?
        <Maintanance {...props} />
        :
      <LoginForm {...props} />
    }
  </Layout>
)

const Extended = withTranslation('common', { i18n, wait: process.browser })(Login);



Extended.getInitialProps = async function(context) {
    const isServer = !!context.req
    if(isServer){
      if(context.query.loggedInUserDetails){
        context.res.redirect('/');
      }else{
        const req = context.req
        req.i18n.toJSON = () => null
        const initialI18nStore = {}
        req.i18n.languages.forEach((l) => {
          initialI18nStore[l] = req.i18n.services.resourceStore.data[l];
        })
        await context.store.dispatch(actions.setPageInfoData(context.query))
            return {pageData:context.query,initialI18nStore,i18n: req.i18n,initialLanguage: req.i18n.language}
      }
    }else{
      const pageData = await axios.get("/login?data=1");
      if(pageData.data.data.loggedInUserDetails){
        Router.push('/')
      }else{
        return {pageData:pageData.data.data,user_login:pageData.data.user_login,pagenotfound:pageData.data.pagenotfound,permission_error:pageData.data.permission_error,maintanance:pageData.data.maintanance}
      }
   }
}

export default Extended