import React from 'react';
import Layout from '../hoc/Layout/Layout';

import * as actions from '../store/actions/general';

import axios from "../axios-site"

import i18n from '../i18n';
import Maintenance from "../containers/Error/Maintenance"

import { withTranslation } from 'react-i18next';

const Index = (props) => (
  <Layout {...props} maintenance={true} >
      <Maintenance {...props} />
  </Layout>
)

const Extended = withTranslation('common', { i18n, wait: process.browser })(Index);



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
    }
}

export default Extended