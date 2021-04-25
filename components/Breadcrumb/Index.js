import React from "react"
import Link from "next/link"
import Translate from "../Translate/Index"

const Breadcrum = (props) => {
    return (
        <div className="breadcumb-wrap breadcumb-overlay" style={{backgroundImage:`url(${props.image})`}}>
            <div className="container">
                <div className="row">
                    <div className="col-lg-10 col-md-9 col-sm-9 col-12">
                    <div className="op-breadcumb">
                        <ul>
                        <li>
                            <Link href="/">
                                <a href="/">
                                    <span>
                                        <i className="fa fa-home" aria-hidden="true"></i>
                                    </span>
                                    Home
                                </a>
                            </Link>
                        </li>
                        <li>
                        &nbsp;{Translate(props,props.title)}
                        </li>
                        </ul>
                    </div>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-3 col-12">
                    <div className="op-back" style={{display:"none"}}>
                        <a href="#">Go Back</a>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Breadcrum