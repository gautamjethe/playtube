import React from "react"

import Highcharts from 'highcharts'
import HighchartsReact from "highcharts-react-official"
import axios from "../../axios-orders"
import Loader from "../LoadMore/Index"

class StatsAnalytics extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            id: props.id,
            stats: null,
            type:props.type,
            title: "Today Analytics",
            search : "today"
        }
        this.change = this.change.bind(this)
    }
    componentDidMount() {
        let formData = new FormData();
        formData.append('id', this.state.id)
        formData.append('type', this.state.type)

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        formData.append("criteria",this.state.search)
        axios.post("/dashboard/stats", formData, config)
            .then(response => {
                if (response.data) {
                    this.setState({ stats: response.data })
                } else {
                    this.setState({ loading: false })
                }
            }).catch(err => {
                this.setState({ loading: false })
            });
    }
    change(e){
        let title = "Today Analytics"
        if(e.target.value == "this_week"){
            title = "This Week Analytics"
        }else if(e.target.value == "this_month"){
            title = "This Month Analytics"
        }else if(e.target.value == "this_year"){
            title = "This Year Analytics"
        }
        this.setState({search:e.target.value,title:title,stats:null},this.componentDidMount)
    }
    render() {
        if (!this.state.stats) {
            return <Loader loading={true} />
        }
        let series = []

        if(this.state.stats.likes){
            series.push({
                name: "Likes",
                data: this.state.stats.likes
            })
        }
        if(this.state.stats.dislike){
            series.push({
                name: "Dislikes",
                data: this.state.stats.dislike
            })
        }

        if(this.state.stats.favourite){
            series.push({
                name: "Favourites",
                data: this.state.stats.favourite
            })
        }
        if(this.state.stats.follow){
            series.push({
                name: "Followers",
                data: this.state.stats.follow
            })
        }


        const options = {
            title: {
                text: this.state.title
            },
            chart: {
                type: "column"
            },
            xAxis: {
                categories: this.state.stats.xaxis,
                crosshair: true
            },
            yAxis: {
                min: 0,
                title: {
                    text: this.state.stats.yaxis
                }
            }, 
            series: series
        }

        return (
            <React.Fragment>
                <div className="ads_analytics">
                    <div className="search_criteria">
                        <span>Criteria:</span>
                        <select onChange={this.change.bind(this)} value={this.state.search}>
                            <option value="today">{this.props.t("Today")}</option>
                            <option value="this_week">{this.props.t("This Week")}</option>
                            <option value="this_month">{this.props.t("This Month")}</option>
                            <option value="this_year">{this.props.t("This Year")}</option>
                        </select>
                    </div>
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={options}
                    />
                </div>
            </React.Fragment>
        )
    }

}

export default StatsAnalytics