import React from "react"

class Index extends React.Component {
    constructor(props){
        super(props)
        
    }
    componentDidMount () {
        try{
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        }catch(e){
            console.log("error",e)
        }
    }
    render(){
        return (
            <div className={this.props.className ? this.props.className + " advertisement_container" : "advertisement_container"} style={{textAlign:"center",paddingTop:this.props.paddingTop,height:"auto !important"}} dangerouslySetInnerHTML={ {__html: this.props.ads} }></div>
        )
    }
}

export default Index