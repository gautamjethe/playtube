import React from "react"

import Items from "./CreateButtonsItem"

class CreateButtons extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            style:props.style,
            type:props.type
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if(nextProps.style != prevState.style || nextProps.type != prevState.type){
            return {style:nextProps.style,type:nextProps.type}
        }else{
            return null
        }
    }
    
    render(){
        if(!this.props.pageData.levelPermissions){
            return null
        }
        return(
            <React.Fragment>
                
                <li className={!this.props.mobileMenu ? `nav-item dropdown${this.state.style == "block" ? " active" : ""}` : `dropdown MobDropdownNav${this.state.style == "block" ? " active" : ""}`}>
                    <a className={!this.props.mobileMenu ? "nav-link notclosecreate parent bg-cnt" : "nav-link notclosecreate parent"} href="#" onClick={(e) => this.props.openToggle('createbuttons',e)}>
                        <span className="material-icons notclosecreate parent">add</span>
                    </a>
                    {
                    !this.props.mobileMenu  ?
                    <ul className="createButtons dropdown-menu dropdown-menu-right iconMenuList" ref={this.props.setCreateButtonsWrapperRef}  style={{display:this.state.style}}>
                        <span className="dropdown-menu-arrow"></span>
                        <Items {...this.props} />
                    </ul>
                    : null
                }
                </li>                
            </React.Fragment>
        )
    }
}
export default CreateButtons