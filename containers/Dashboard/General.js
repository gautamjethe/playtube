import React from "react"
import BrowseForm from "../Form/General"

class General extends React.Component{
    constructor(props){
        super(props)
    }
    render(){
        return(
            <BrowseForm {...this.props} />
        )
    }
}

export default General