import React, { Component } from 'react'
import Link from "../../components/Link/index"

class WithErrorHandler extends Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch (error, info) {
    this.setState(state => ({ ...state, hasError: true,info:info,error:error }))
  }

  render () {
    if (this.state.hasError) {
      return (
        <div className="content-wrap">
            <div className="container">
                <div className="notfound">
                    <div className="row verticalcntr">
                        <div className="col-md-12 text-center">
                            {
                                this.state.error && this.state.error.message && this.props.pageInfoData.environment == "dev"  ? 
                                    <h2>{this.state.error.message}</h2>
                                : <h2>{this.props.t("Whoops! Something went wrong here. Please try again later.")}</h2>
                            }
                            {
                                this.state.info && this.props.pageInfoData.environment == "dev" ? 
                                    <React.Fragment>
                                        <p><code>{this.state.info.componentStack}</code></p><br />
                                    </React.Fragment>
                                : null
                            }
                            <Link href="/">
                                <a><i className="fas fa-angle-left"></i> {this.props.t("Go Back to the homepage")}</a>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default WithErrorHandler