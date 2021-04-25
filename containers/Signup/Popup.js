import React, { Component } from "react"

import Form from "./Form"


const Popup = (props) => {
    return (
        <div className="modal fade" id="registerpop">
            <div className="modal-dialog modal-md modal-dialog-centered modal-lg popupDesign">
                <div className="modal-content">
                    <div className="modal-body">
                        <div className="loginRgtrBox loginRgtrBoxPopup">
                            <button type="button" className="close" data-dismiss="modal">&times;</button>
                            <Form {...props} popup={true} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Popup