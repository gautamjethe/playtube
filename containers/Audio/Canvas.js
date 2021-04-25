import React from 'react';

class Canvas extends React.Component {

  componentDidMount () {
    if (this.props.peaks) {
      this.draw(JSON.parse(this.props.peaks));
    }
  }

  draw (peaks) {
    let ctx = this.canvas.getContext('2d');
    if(!this.props.classV){
      ctx.fillStyle = '#333333';
    }else{
      ctx.fillStyle = '#fff';
    }
    peaks.forEach((peak) => {
      ctx.fillRect(...peak)
    });
  }

  render () {
    return (
      <canvas  height="100" ref={ (ref) => this.canvas = ref }
        className={this.props.classV}></canvas>
    )
  }
}

export default Canvas