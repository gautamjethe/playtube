import React from "react"
import BalanceForm from "../Form/Balance"
import Withdraw from "./Withdraw"
class Balance extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            type:props.type
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if (nextProps.type != prevState.type) {
            return { type:nextProps.type }
        }else{
            return null
        }
    }
    render(){
        return this.state.type == "balance" ? <BalanceForm {...this.props} /> : <Withdraw {...this.props} />
    }
}

export default Balance