import React from "react"
import DeleteForm from "../Form/Delete"

class Delete extends React.Component{
    
    render(){
        return(
            <DeleteForm {...this.props} />
        )
    }
}

export default Delete