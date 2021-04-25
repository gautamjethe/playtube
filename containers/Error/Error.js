import React from "react";

const error = (props) => {

    return (
        <p>{props.t(props.message)}</p>
    )

}

export default error;