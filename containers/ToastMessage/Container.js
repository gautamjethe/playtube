import React from "react"
import { ToastContainer,toast } from 'react-toastify';

class Container extends React.Component {
    constructor(props){
        super(props)
    }
    shouldComponentUpdate(){
        return false
    }
    render(){
        return (
            <ToastContainer autoClose={5000} position={toast.POSITION.TOP_RIGHT} />
        )
    }
}

export default Container