import React from "react"
import { toast } from 'react-toastify';
import { connect } from 'react-redux';
import toastReducer from '../../store/actions/general';

class ToastMessage extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            open:false
        }
        
    }
   
    render(){
        if( this.props.message){
            if(this.props.type == "warn")
                toast.warn(this.props.message);
            else if(this.props.type == "error")
                toast.error(this.props.message);
            else if(this.props.type == "info")
                toast.info(this.props.message);
            else 
                toast.success(this.props.message);
            setTimeout(() => this.props.openToast(),500)
        }
        return(
            null
        )
    }
}

const mapStateToProps = state => {
    return {
        message: state.toast.message,
        type: state.toast.type,
    };  
  };
  const mapDispatchToProps = dispatch => {
    return {        
        openToast: () => dispatch( toastReducer.openToast("","success") ),
    };
  };
export default connect( mapStateToProps, mapDispatchToProps )( ToastMessage );