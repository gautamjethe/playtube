import React from 'react'
import Document, { Head, Main, NextScript,Html } from 'next/document'

export default class MyDocument extends Document {
	static async getInitialProps(ctx) {
		const initialProps = await Document.getInitialProps(ctx);
		return { ...initialProps };
	  }	
	render() {
		return (
			<React.Fragment>
				<Html lang={this.props.__NEXT_DATA__.props ? this.props.__NEXT_DATA__.props.initialProps.pageProps.initialLanguage : "en"} dir={this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.isRTL ? "rtl" : "ltr"}>
					<Head>
						<link href={`${this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES ? this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES : ""}/static/css/bootstrap.min.css`} rel="stylesheet" />
						<link href={`${this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES ? this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES : ""}/static/css/fontawesome/css/all.min.css`} rel="stylesheet" />
						<link href="https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Two+Tone|Material+Icons+Round|Material+Icons+Sharp" rel="stylesheet" />
						<link href="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.1.0/css/flag-icon.min.css" rel="stylesheet" />
						<link href={`${this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES ? this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES : ""}/static/css/toast.css`} rel="stylesheet" />
						<link href={`${this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES ? this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES : ""}/static/css/style.css`} rel="stylesheet" />
						<link href={`${this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES ? this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES : ""}/static/css/responsive.css`} rel="stylesheet" />
						<link href={`${this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES ? this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES : ""}/static/custom/header.css`} rel="stylesheet" />
						<script src={`${this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES ? this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES : ""}/static/scripts/jquery-3.4.1.min.js`}></script>
						<script src={`${this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES ? this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES : ""}/static/scripts/bootstrap.bundle.min.js`}></script>
						<script src={`${this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES ? this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.CDN_URL_FOR_STATIC_RESOURCES : ""}/static/custom/header.js`}></script>
						{
							this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData && this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.appSettings &&  this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.appSettings['google_analytics_code'] ? 
						<script dangerouslySetInnerHTML={{__html: `(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
						(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
						m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
						})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
						ga('create', "${this.props.__NEXT_DATA__.props.initialProps.pageProps.pageData.appSettings['google_analytics_code']}", 'auto');
						ga('send', 'pageview');`}} />
							: null
						}
					</Head>
					<body>
						<main>
							<Main />
							<NextScript />
						</main>
					</body>
				</Html>
			</React.Fragment>
		)
	}
}
