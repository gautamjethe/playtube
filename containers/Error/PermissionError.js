import React from "react"
import Link from "../../components/Link/index"
const PermissionError = (props) => {
    return (
        <React.Fragment>
            <div className="container">
                <div className="notfound">
                    <div className="row verticalcntr">
                        <div className="col-md-5">
                            <div className="img404">
                                <img className="img-fluid" src="/static/images/404.png" alt="404" />
                            </div>
                        </div>
                        <div className="col-md-6 offset-md-1">
                            <h2>{props.t("Oops!, You don't have permission to view this page!")}</h2>
                            <Link href="/">
                                <a href="#"> <span className='material-icons'>keyboard_arrow_left</span> {props.t("Go Back to the homepage")}</a>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default PermissionError