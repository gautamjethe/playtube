import React, { Component } from "react"
import { connect } from 'react-redux';
import CastNCrew from "./Seasons"

class CastnCrew extends Component {
    constructor(props) {
        super(props)
        this.state = {
            castncrew:props.castncrew ? props.castncrew : [],
            movie:props.movie
        }
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else {
            return {
                castncrew:nextProps.castncrew ? nextProps.castncrew : [],                
            }
        }
    }

    render(){
        let seasons = []
        let season = {}
        season.season_id = 0
        season.castncrew = this.state.castncrew
        seasons.push(season)
        return <CastNCrew {...this.props} updateSteps={this.props.updateSteps} fromCastnCrew={true} seasonsCrew={seasons} selectedTab={"cast"} movie={this.state.movie} />
    }

}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};


export default connect(mapStateToProps, null)(CastnCrew);