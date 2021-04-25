import React from "react"

import Highcharts from 'highcharts'
import HighchartsReact from "highcharts-react-official"
import axios from "../../axios-orders"
import Loader from "../LoadMore/Index"

class Analytics extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            ad_id: props.ad_id,
            stats: props.statsData ? props.statsData : null,
            title: "Today Analytics",
            search : "today",
            statsData:props.statsData
        }
        this.change = this.change.bind(this)
    }
    componentDidMount(search) {
        if(this.state.statsData && typeof search == "undefined"){
            return
        }
        let formData = new FormData();
        
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        formData.append("type",this.state.search)
        let url = "/ads/stats"
        if(this.state.statsData){
            url = "/dashboard/earning"
            formData.append("owner_id",this.props.member.user_id)
        }else{
            formData.append('ad_id', this.state.ad_id)
        }
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.stats) {
                    this.setState({ stats: response.data.stats,statsData:response.data.stats })
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
        this.setState({search:e.target.value,title:title,stats:null},() => {
            this.componentDidMount('search')
        })
    }
    render() {
        if (!this.state.stats) {
            return <Loader loading={true} />
        }

        let series = []

        if(this.state.statsData && this.props.pageData.appSettings['video_ffmpeg_path']){
            series.push({
                name: this.state.statsData ? this.props.t("Advertisement Earning") :  (this.props.item.type == 1 ? this.props.t("Clicks") : this.props.t("Views")),
                data: this.state.statsData ? this.state.statsData.adsEarning : this.state.stats.result
            })
        }else if(!this.state.statsData){
            series.push({
                name: this.state.statsData ? this.props.t("Advertisement Earning") :  (this.props.item.type == 1 ? this.props.t("Clicks") : this.props.t("Views")),
                data: this.state.statsData ? this.state.statsData.adsEarning : this.state.stats.result
            })
        }

        if(this.state.statsData && this.state.statsData.channelSupportEarning){
            series.push({
                name: this.props.t("Channel Supports Earning"), 
                data: this.state.statsData.channelSupportEarning 
            })
        }
        if(this.state.statsData && this.state.statsData.videosTipEarning){
            series.push({
                name: this.props.t("Video Tips Earning"),
                data: this.state.statsData.videosTipEarning 
            })
        }

        series.push(
        {
            name: this.state.statsData ? this.props.t("Video Earning") : this.props.t("Spent"),
            data: this.state.statsData ? this.state.statsData.videosEarning : this.state.stats.spent
        })

        const options = {
            title: {
                text: this.props.t(this.state.title)
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
                        <span>{this.props.t("Criteria")}:</span>
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

export default Analytics