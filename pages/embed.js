import React from 'react';
import Layout from '../hoc/Layout/Layout';

import * as actions from '../store/actions/general';

import axios from "../axios-site"

import VideoView from "../containers/Video/Embed"

import i18n from '../i18n';

import { withTranslation } from 'react-i18next';

import PageNotFound from "../containers/Error/PageNotFound"
import PermissionError from "../containers/Error/PermissionError"
import Login from "../containers/Login/Index"
import Maintanance from "../containers/Error/Maintenance"

const Watch = (props) => (
  <Layout {...props} videoView={true} embedVideo={true} hideSmallMenu={true} >
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
      <VideoView {...props}  hideSmallMenu={true} />
    }
  </Layout>
)

const Extended = withTranslation('common', { i18n, wait: process.browser })(Watch);

Extended.getInitialProps = async function(context) {
    const isServer = !!context.req
    if(isServer){
        const req = context.req
        req.i18n.toJSON = () => null
        const initialI18nStore = {}
        req.i18n.languages.forEach((l) => {
            initialI18nStore[l] = req.i18n.services.resourceStore.data[l];
        })
        await context.store.dispatch(actions.setPageInfoData(context.query))
        return {pageData:context.query,initialI18nStore,i18n: req.i18n,initialLanguage: req.i18n.language}
    }else{
      let playlist = ""
      if(context.query.list){
        playlist = "list="+context.query.list+"&"
      }
      const pageData = await axios.get("/embed/"+context.query.videoId+"?"+playlist+"data=1");
      return {pageData:pageData.data.data,user_login:pageData.data.user_login,pagenotfound:pageData.data.pagenotfound,permission_error:pageData.data.permission_error,maintanance:pageData.data.maintanance}
   }
}

export default Extended