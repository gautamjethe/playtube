
import React from "react"
import { IntlProvider, FormattedNumber } from 'react-intl';

class Currency extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            package:props.package && props.package.price ? props.package.price : props.price,
            language:props.i18n.language
        }
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        return {language:nextProps.i18n.language}
    }
    render(){
        let price = this.state.package
        if(!parseFloat(price)){
            price = 0
        }
        let currency = this.props.pageInfoData.appSettings.payment_default_currency;
        return <IntlProvider locale={this.state.language}>
            <FormattedNumber
                value={price}
                style="currency"
                currency={currency} />
        </IntlProvider>;
    }
}


export default Currency;