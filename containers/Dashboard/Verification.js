import React from "react"
import VerificationForm from "../Form/Verification"

class Verification extends React.Component{
    
    render(){
        return(
           <VerificationForm {...this.props} />
        )
    }
}

export default Verification