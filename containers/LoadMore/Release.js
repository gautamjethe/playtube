import React from "react"

const Release = (props) => {

    if(props.release){
        return (
            <h3>{props.t("Release to refresh")}</h3>
        )
    }else{
        return (
            <h3>{props.t("Pull down to refresh")}</h3>
        )
    }

}

export default Release