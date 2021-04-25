import React from "react"

class Index extends React.Component{
    constructor(props){
        super(props)
        this.state = {

        }
    }

    render(){
        return (
            <li className={!this.props.mobileMenu ?  `nav-item dropdown main notclosesearch${this.state.style == "block" ? " active" : ""}` : `main dropdown MobDropdownNav notclosesearch${this.state.style == "block" ? " active" : ""}`} onClick={(e)=>this.props.openToggle('search',e)}>
                <a className={!this.props.mobileMenu ? "nav-link markReadAll parent notclosesearch" : "parent"} >
                <span className="material-icons parent">search</span>
                </a>
            </li>
        )
    }
}
export default Index