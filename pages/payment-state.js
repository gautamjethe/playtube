import React from 'react';
import Layout from '../hoc/Layout/Layout';
import * as actions from '../store/actions/general';
import axios from "../axios-site"
import Breadcrum from "../components/Breadcrumb/Form"
import i18n from '../i18n';
import { withTranslation } from 'react-i18next';
import Router from 'next/router'
const Index = (props) => (
    // {props.pageData.type}
    <Layout {...props} >
        <React.Fragment>
            <Breadcrum {...props}  image={props.pageData['pageInfo']['banner'] ? props.pageData['pageInfo']['banner'] : "/static/images/breadcumb-bg.jpg"} title={`${props.pageData.type == "success" || props.pageData.type == "completed" ? "Success" : "Error"} Payment`} />          
            <div className="mainContentWrap">
                <div className="container">
                <div className="row">
                    <div className="col-md-12">
                        <div className="ContentBoxThankyou text-center">
                            <div className="centerDivBox-wrap"> 1
                                <div className="centerDivBoxTxt">
                                    {
                                        props.pageData.type == "approved" || props.pageData.type == "completed"  ? 
                                            <React.Fragment>
                                                <div className="IconSuccess">
                                                    <i className="fa fa-check" aria-hidden="true"></i>
                                                </div>
                                                <h2>{props.t("Thank you!")}</h2>
                                                <p>{props.t("Thank you! Your payment has completed successfully.")}</p>
                                                    <button onClick={()=>{
                                                        Router.push("/")
                                                    }}>
                                                        {props.t("Continue")}
                                                </button>
                                            </React.Fragment>
                                        :
                                           ( props.pageData.type == "pending"  ? 
                                             <React.Fragment>
                                             <div className="IconSuccess">
                                                 <i className="fa fa-check" aria-hidden="true"></i>
                                             </div>
                                             <h2>{props.t("Payment Pending")}</h2>
                                             <p>{props.t("Thank you for submitting your payment. Your payment is currently pending - your account will be activated when we are notified that the payment has completed successfully. Please return to our login page when you receive an email notifying you that the payment has completed.")}</p>
                                             <button onClick={()=>{
                                                        Router.push("/")
                                                    }}>
                                                        {props.t("Continue")}
                                             </button>
                                         </React.Fragment>
                                            :
                                            <React.Fragment>
                                            <div className="IconFaild">
                                                    <i className="fa fa-times" aria-hidden="true"></i>
                                            </div>
                                            <h2>{props.t("Payment Failed")}</h2>
                                             <p>{props.t("Our payment processor has notified us that your payment could not be completed successfully. We suggest that you try again with another credit card or funding source.")}</p>
                                             <button onClick={()=>{
                                                Router.push("/")
                                                }}>
                                                {props.t("Continue")}
                                            </button>
                                            </React.Fragment>
                                           )
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </React.Fragment>
    </Layout>
)

const Extended = withTranslation('common', { i18n, wait: process.browser })(Index);

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
        const pageData = await axios.get("?data=1");
        return { pageData: pageData.data.data }
    }
}

export default Extended