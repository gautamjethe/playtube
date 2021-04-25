import React from "react"
import Translate from "../Translate/Index"

const Breadcrum = (props) => {
    return (

        <div className="titleBarTop">
            <div className="titleBarTopBg">
              <img
                src={`${props.image}`}
                alt={Translate(props,props.title)}
              />
            </div>
            <div className="overlay">
              <div className="container">
                <div className="row">
                  <div className="col-md-12">
                    <div className="titleHeadng">
                      <h1>
                        {Translate(props,props.title)}
                        {props.icon ? 
                            <i className={`fas ${props.icon}`}></i>
                            : null
                        }
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    )
}

export default Breadcrum