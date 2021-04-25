import React from 'react';
import NextLink from 'next/link';
import cookie from "js-cookie";

import { withNamespaces, config} from '../../i18n';
const {translation} = config
class Link extends React.Component {
  render() {
    
    const { children, href,customParam,as } = this.props;
    const lng = process.browser && cookie.get('i18next') ? cookie.get('i18next') : this.props.i18n.language;
    if(href && href == "javascript:;" || href == "javascript:void(0)"){
      return children
    }else if (href && !href.startsWith('http://') && !href.startsWith('https://') && translation.localeSubpaths && lng !== translation.defaultLanguage && false) {
    return (
        <NextLink href={`${href}?lng=${lng}`+(customParam ? "&"+customParam : "")} as={as ? `/${lng}`+as : `/${lng}${href}`}>
          {children}
        </NextLink>
      );
    } 
    return <NextLink prefetch={false} href={href+(customParam ? "?"+customParam : "")} as={as ? as : `${href}`}>{children}</NextLink>;
  }
}

/*
  Usage of `withNamespaces` here is just to
  force `Link` to rerender on language change
*/
export default withNamespaces()(Link);