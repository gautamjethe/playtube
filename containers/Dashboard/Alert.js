import React from "react"
import BrowseForm from "../Form/Alert"

class Alert extends React.Component{
   
    render(){
        return(
            <BrowseForm {...this.props} />
        )
    }
}

export default Alert