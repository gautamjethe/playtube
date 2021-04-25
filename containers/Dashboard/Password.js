import React from "react"
import BrowseForm from "../Form/Password"

class Password extends React.Component{
    
    render(){
        return(
            <BrowseForm {...this.props} />
        )
    }
}

export default Password