import React,{Component} from "react"
import TinySlider from 'tiny-slider-react';

import { connect } from "react-redux";

class Slideshow extends Component{
    constructor(props){
        super(props)
        this.state = {
            //class:" slideshowSlider"
            class:"",
            width:props.isMobile ? props.isMobile : 993,
        }
        this.clickedItem = this.clickedItem.bind(this)
    }
    clickedItem = (link,e) => {
        if(this.state.width < 993 && link){
            window.open(link, '_blank');
        }
    }
    render(){
        if(!this.props.pageInfoData.slideshow){
            return null
        }
        const imageSuffix = this.props.pageInfoData.imageSuffix

        const settings = {
            lazyload: false,
            nav: true,
            items:1,
            loop:true,
            gutter:20,
            mouseDrag: true,
            controlsText:["<span class='material-icons'>keyboard_arrow_left</span>", "<span class='material-icons'>keyboard_arrow_right</span>"],
            responsive: {
                480: {
                    items: 1
                },
                760: {
                    items: 1
                },
                992: {
                    items: 1
                },
              }
          };


        let items = this.props.pageInfoData.slideshow.map(elem => {
            return (
                <div className="item" key={elem.slideshow_id} onClick={this.clickedItem.bind(this,elem.link1)}>
                    <div className="snglFullWdth-box">
                        <div className="img">
                            <img src={imageSuffix+elem.image} alt={elem.title} />
                        </div>
                        <div className="content">
                            <div className="snglFullWdth-content-box">
                                <h3 className="title">{elem.title}</h3>
                                <p className="text d-none d-md-block">{elem.description}</p>
                                <div className="buttons">
                                    {
                                        elem.button_1_enabled && elem.text1 != ""? 
                                        <a className="button hvr-bs animated" href={elem.link1} target="_blank">{elem.text1}</a>
                                        : null
                                    }
                                    {
                                        elem.button_2_enabled && elem.text2 != ""? 
                                        <a className="button hvr-bs animated" href={elem.link2} target="_blank">{elem.text2}</a>
                                        : null
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        })


        return ( 
            <div className={`SlideAdsWrap${this.state.class}`}>
                <div id="snglFullWdth" className="snglFullWdth">
                    <TinySlider settings={settings} className="">
                        {items}
                    </TinySlider>
                </div>
            </div>
        )
    }

}

const mapStateToProps = state => {
    return {
        pageInfoData:state.general.pageInfoData
    };
  };

export default connect(mapStateToProps)(Slideshow)