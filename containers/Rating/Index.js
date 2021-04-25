import React from "react"
import { connect } from "react-redux";
import Rater from 'react-rater'
import axios from "../../axios-orders"
import ratingReducer from '../../store/actions/general';
import Translate from "../../components/Translate/Index"
import 'react-rater/lib/react-rater.css'
class Index extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            rating: props.rating,
            id:props.id,
            type:props.type,
            newRating:0,
            openStats:false
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if(nextProps.rating != prevState.rating){
            return {rating:nextProps.rating}
        } else{
            return null
        }
    }
    updateRating = () => {
        if(this.props.pageInfoData && !this.props.pageInfoData.loggedInUserDetails){
            document.getElementById('loginFormPopup').click();
        }else{
            const formData = new FormData()
            formData.append('id',this.props.id)
            formData.append("rating",this.state.newRating)
            formData.append('type',this.props.type+"s")
            let url = '/ratings'
            axios.post(url,formData)
            .then(response => {
                
            }).catch(err => {
                //this.setState({localUpdate:true,submitting:false,error:err});
            });
        }
    }
    handleRate({ rating }) {
        this.setState({localUpdate:true,
            newRating:rating,
        },()=>{
            this.updateRating();
        })
      }
      openRatingBox = (e) => {
          e.preventDefault()
          this.props.ratingStats(true,{id:this.state.id,type:this.state.type,rating:this.state.rating})
      }
    render(){
        return(
            <React.Fragment>
                    <Rater
                    fractions={2}
                    rating={this.state.rating}
                    onRate={this.handleRate.bind(this)}
                    >                    
                    </Rater>
                <a href="#" onClick={this.openRatingBox} style={{marginLeft:"10px",fontSize:"14px"}}><span>{this.state.rating % 1 != 0 ?  this.state.rating.toFixed(1) : this.state.rating} {Translate(this.props,"out of 5 stars")}</span></a>
            </React.Fragment>
        )
    }
}


const mapDispatchToProps = dispatch => {
  return {        
    ratingStats: (open,data) => dispatch( ratingReducer.ratingStats(open,data) ),
  };
};
export default connect( false, mapDispatchToProps )( Index );