import React from "react"
import { connect } from 'react-redux';
import report from '../../store/actions/general';

import Form from "../Form/Report"
import Translate from "../../components/Translate/Index";

class Report extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            status:this.props.status
        }
        this.close = this.close.bind(this)
    }
    close(){
        this.props.openReport(false)
    }
    render(){
        if(this.state.status == 0){
            return null
        }
        return (
            <div className="popup_wrapper_cnt">
                <div className="popup_cnt">
                    <div className="comments">
                        <div className="VideoDetails-commentWrap">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{Translate(this.props,"Report Content")}</h2>
                                <a onClick={this.close}  className="_close"><i></i></a>
                            </div>
                            <Form {...this.props} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        status: state.report.status,
        contentId: state.report.contentId,
        contentType: state.report.contentType,
    };  
  };
  const mapDispatchToProps = dispatch => {
    return {        
        openReport: (open) => dispatch( report.openReport(open,"","") ),
    };
  };
export default connect( mapStateToProps, mapDispatchToProps )( Report );