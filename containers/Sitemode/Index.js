import React from "react"
import { connect } from 'react-redux';
import * as actions from '../../store/actions/general';
import axios from "../../axios-orders"

class Sitemode extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            modeChecked:props.pageInfoData.themeMode == "dark"
        }
        
    }
   
    changeSiteMode = (e) => {
        e.preventDefault();
        this.setState({modeChecked:!this.state.modeChecked},() => {
            //set site mode

        const data = { ...this.props.pageInfoData }
        data.themeMode = !this.state.modeChecked ? "white" : "dark"
        this.props.setPageInfoData(data)
        const formData = new FormData()
        formData.append('mode', !this.state.modeChecked ? 'white' : 'dark')            
        let url = '/members/theme-mode'
        axios.post(url, formData)
            .then(response => {
                
            })
        })
        
    }
    
    
    render(){
            if(!this.props.pageInfoData.toogleMode){
                return false
            }
            return (
                <li>
                    <a className="dropdown-item iconmenu parent" style={{cursor:"pointer"}} href="#" onClick={this.changeSiteMode}>
                        {
                            !this.props.iconLast ? 
                        <span className="material-icons parent">nights_stay</span>
                        : null
                        }
                        {this.props.t("Mode")}
                        {
                            this.props.iconLast ? 
                        <span className="material-icons parent ml-2">nights_stay</span>
                        : null
                        }
                    </a>
                </li>
            )
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setPageInfoData: (data) => dispatch(actions.setPageInfoData(data)),
    };
};

export default connect(null, mapDispatchToProps)(Sitemode);