import React, { Component } from "react"

class File extends Component{
    constructor(props){
        super(props)
        this.state = {
            drag: false,
        }
        this.fileUpload = React.createRef();
        this.dropRef = React.createRef()
    }
    handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
      }
      handleDragIn = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.dragCounter++
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          this.setState({drag: true})
        }
      }
      handleDragOut = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.dragCounter--
        if (this.dragCounter === 0) {
          this.setState({drag: false})
        }
      }
      handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.setState({drag: false})
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
           this.props.onChange(e, this.props.keyName, "single", this.props.videoKey ? this.props.videoKey : "file",this.props.m) 
            e.dataTransfer.clearData()
          this.dragCounter = 0    
        }
      }
      componentDidMount() {
        let div = this.dropRef.current
        if(div){
          div.addEventListener('dragenter', this.handleDragIn)
          div.addEventListener('dragleave', this.handleDragOut)
          div.addEventListener('dragover', this.handleDrag)
          div.addEventListener('drop', this.handleDrop)
        }
      }
      componentWillUnmount() {
        let div = this.dropRef.current
        if(div){
          div.removeEventListener('dragenter', this.handleDragIn)
          div.removeEventListener('dragleave', this.handleDragOut)
          div.removeEventListener('dragover', this.handleDrag)
          div.removeEventListener('drop', this.handleDrop)
        }
      }
      clickUploadImage = () => {
        this.fileUpload.current.click();
      }
    render(){

        return (
            <div className="filesinput" ref={this.dropRef}>
              <div className="file_input uploadicn" style={{"outline":this.state.drag ? "2px dashed white" : ""}} onClick={this.clickUploadImage}><i className="fa fa-upload" aria-hidden="true"></i>{this.props.defaultText ? this.props.defaultText : this.props.t("Drag & Drop Image Here")}</div>
              <input
                {...this.props.data}
                style={{
                  "display":"none"
                }}
                className="form-control"
                ref={this.fileUpload}
                type="file"
                key={this.props.keyName}
                //accept={this.props.type+"/*"}
                id={this.props.keyName}
                name={this.props.name}
                onChange={(e) => this.props.onChange(e, this.props.target,"single",this.props.type,this.props.m)}
              />
              </div>
        )
    }
}

export default File