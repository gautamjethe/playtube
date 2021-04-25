import React from "react"
import axios from "../../axios-orders"
import Loader from "../LoadMore/Index"
import ratingReducer from '../../store/actions/general';
import { connect } from "react-redux";
import Rater from 'react-rater'
import Translate from "../../components/Translate/Index"
class Stats extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            stats: null
        }

    }
    componentDidMount = () => {
        const formData = new FormData()
        formData.append('id', this.props.data.id)
        formData.append('type', this.props.data.type + "s")
        let url = '/ratings/stats'
        axios.post(url, formData)
            .then(response => {
                if (!response.data.error)
                    this.setState({ stats: response.data })
                else
                    this.setState({ openStats: false })
            }).catch(err => {

            });
    }
    closeEditPopup = (e) => {
        e.preventDefault()
        this.props.ratingStats()
    }
    render() {
        let stats = null

        if (this.state.stats) {

            const fiveStar = Math.floor((this.state.stats.fiveStar / this.state.stats.totalRating) * 100)
            const fourStar = Math.floor((this.state.stats.fourStar / this.state.stats.totalRating) * 100)
            const threeStar = Math.floor((this.state.stats.threeStar / this.state.stats.totalRating) * 100)
            const twoStar = Math.floor((this.state.stats.twoStar / this.state.stats.totalRating) * 100)
            const oneStar = Math.floor((this.state.stats.oneStar / this.state.stats.totalRating) * 100)


            stats = <div className="modal-body ratingpopup">
                <div className="row">
                    <div className="col-sm-5 ratingPpup">
                        <div className="rating-block">
                            <h4>{Translate(this.props,"Average rating")}</h4>
                            <h2 className="bold padding-bottom-7">{`${this.props.data.rating.toFixed(1)}`} <small>/ 5</small></h2>
                            <Rater
                                fractions={2}
                                interactive={false}
                                rating={this.props.data.rating}
                            >
                            </Rater>
                        </div>
                        {
                            this.state.stats.isRated ?
                                <div className="rating-block" style={{ marginTop: "10px" }}>
                                    <h4>{Translate(this.props,"You rated")}</h4>
                                    <h2 className="bold padding-bottom-7">{`${this.state.stats.ownRating.toFixed(1)}`} <small>/ 5</small></h2>
                                    <Rater
                                        fractions={2}
                                        interactive={false}
                                        rating={this.state.stats.ownRating}
                                    >
                                    </Rater>
                                </div>
                                : null
                        }
                    </div>
                    <div className="col-sm-7">
                        <h4>{Translate(this.props,"Rating breakdown")}</h4>
                        <div className="pull-left">
                            <div className="pull-left" style={{ width: "35px", lineHeight: "1" }}>
                                <div style={{ height: "9px", margin: "5px 0" }}>5 <span className="fas fa-star"></span></div>
                            </div>
                            <div className="pull-left" style={{ width: "180px" }}>
                                <div className="progress" style={{ height: "12px", margin: "6px 0" }}>
                                    <div className="progress-bar bg-success" role="progressbar" aria-valuenow="5" aria-valuemin="0" aria-valuemax="5" style={{ width: `${fiveStar}%` }}>
                                    </div>
                                </div>
                            </div>
                            <div className="pull-right" style={{ "marginLeft": "10px" }}>{this.state.stats.fiveStar}</div>
                        </div>
                        <div className="pull-left">
                            <div className="pull-left" style={{ "width": "35px", "lineHeight": "1" }}>
                                <div style={{ "height": "9px", "margin": "5px 0" }}>4 <span className="fas fa-star"></span></div>
                            </div>
                            <div className="pull-left" style={{ width: "180px" }}>
                                <div className="progress" style={{ "height": "12px", "margin": "6px 0" }}>
                                    <div className="progress-bar  bg-primary" role="progressbar" aria-valuenow="4" aria-valuemin="0" aria-valuemax="5" style={{ "width": `${fourStar}%` }}>
                                    </div>
                                </div>
                            </div>
                            <div className="pull-right" style={{ "marginLeft": "10px" }}>{this.state.stats.fourStar}</div>
                        </div>


                        <div className="pull-left">
                            <div className="pull-left" style={{ "width": "35px", "lineHeight": "1" }}>
                                <div style={{ "height": "9px", "margin": "5px 0" }}>3 <span className="fas fa-star"></span></div>
                            </div>
                            <div className="pull-left" style={{ width: "180px" }}>
                                <div className="progress" style={{ "height": "12px", "margin": "6px 0" }}>
                                    <div className="progress-bar bg-info" role="progressbar" aria-valuenow="4" aria-valuemin="0" aria-valuemax="5" style={{ "width": `${threeStar}%` }}>
                                    </div>
                                </div>
                            </div>
                            <div className="pull-right" style={{ "marginLeft": "10px" }}>{this.state.stats.threeStar}</div>
                        </div>


                        <div className="pull-left">
                            <div className="pull-left" style={{ "width": "35px", "lineHeight": "1" }}>
                                <div style={{ "height": "9px", "margin": "5px 0" }}>2 <span className="fas fa-star"></span></div>
                            </div>
                            <div className="pull-left" style={{ width: "180px" }}>
                                <div className="progress" style={{ "height": "12px", "margin": "6px 0" }}>
                                    <div className="progress-bar bg-warning" role="progressbar" aria-valuenow="4" aria-valuemin="0" aria-valuemax="5" style={{ "width": `${twoStar}%` }}>
                                    </div>
                                </div>
                            </div>
                            <div className="pull-right" style={{ "marginLeft": "10px" }}>{this.state.stats.twoStar}</div>
                        </div>


                        <div className="pull-left">
                            <div className="pull-left" style={{ "width": "35px", "lineHeight": "1" }}>
                                <div style={{ "height": "9px", "margin": "5px 0" }}>1 <span className="fas fa-star"></span></div>
                            </div>
                            <div className="pull-left" style={{ width: "180px" }}>
                                <div className="progress" style={{ "height": "12px", "margin": "6px 0" }}>
                                    <div className="progress-bar bg-danger" role="progressbar" aria-valuenow="4" aria-valuemin="0" aria-valuemax="5" style={{ "width": `${oneStar}%` }}>
                                    </div>
                                </div>
                            </div>
                            <div className="pull-right" style={{ "marginLeft": "10px" }}>{this.state.stats.oneStar}</div>
                        </div>



                    </div>
                </div>
            </div>
        } else {
            stats = <Loader loading={true} />
        }
        return (
            <div className="popup_wrapper_cnt">
                <div className="popup_cnt">
                    <div className="comments">
                        <div className="VideoDetails-commentWrap">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{Translate(this.props,"View Stats")}</h2>
                                <a onClick={this.closeEditPopup} className="_close"><i></i></a>
                            </div>
                            {stats}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        data: state.rating.ratingData,
    };
};
const mapDispatchToProps = dispatch => {
    return {
        ratingStats: () => dispatch(ratingReducer.ratingStats(false, null)),
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Stats);