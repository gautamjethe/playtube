import React from "react"

const AdultFilter = (props) => {
    return(
        <React.Fragment>
            <li>
            <div className="custom-control custom-switch adultSwitch">
                    <input type="checkbox" className="custom-control-input" id="Toggle1" />
                    <label className="custom-control-label" htmlFor="Toggle1">{props.t("Adult content")}</label>
                </div>
            </li>
        </React.Fragment>
    )
}

export default AdultFilter