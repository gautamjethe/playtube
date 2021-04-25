import React from "react"
import BrowseForm from "../Form/Profile"

class Profile extends React.Component{
    
    render(){
        return(
            <BrowseForm {...this.props} />
        )
    }
}

export default Profile