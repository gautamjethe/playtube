import React from "react"

const EndContent = (props) => {
    //item count props.itemCount
    return (
        <React.Fragment>
            {
                props.itemCount == 0 && props.text ?
                        <div className="no-content text-center">
                            {props.t(props.text)}
                        </div>
                    :
                    <React.Fragment>{
                        props.itemCount == 0 ? 
                        <div className="container">
                        <div className="row">
                            <div className="col-md-12">
                            <div className="no-content text-center">
                                {props.t("We Didn't Find Any Data.")}
                            </div>
                            </div>
                        </div>
                        </div>                              
                        : 
                        props.itemCount > 20 && !props.notShow ?
                        <div className="container">
                            <div className="row">
                            <div className="col-md-12">
                            <div className="content-end text-center">
                                {props.t("Looks like you've reached the end.")}
                            </div> 
                            </div>
                        </div>  
                        </div>                          
                        : null
                        }
                    </React.Fragment>
            }
        </React.Fragment>
    )
}

export default EndContent;