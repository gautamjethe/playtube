import React from "react"
import Link from "../../components/Link/index"
const PageNotFound = (props) => {
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
                            <h2>{props.t("Oops!, The Page you are looking for can't be found!")}</h2>
                            <Link href="/">
                                <a> <span className='material-icons'>keyboard_arrow_left</span> {props.t("Go Back to the homepage")}</a>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default PageNotFound