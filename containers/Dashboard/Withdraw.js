import React from "react"
import Router from 'next/router'

import Translate from "../../components/Translate/Index"


import LoadMore from "../LoadMore/Index"
import EndContent from "../LoadMore/EndContent"
import Release from "../LoadMore/Release"
import axios from "../../axios-orders"
import InfiniteScroll from "react-infinite-scroll-component";
import ReactDOMServer from "react-dom/server"
import Currency from "../Upgrade/Currency"
import swal from 'sweetalert'
import Date from "../Date"

class Withdraw extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            pagging: props.pageData.items.pagging,
            items: props.pageData.items.results,
            canEdit: props.pageData.canEdit,
            canDelete: props.pageData.canDelete,
            page: 1,
            fields: props.pageData.searchData,
            submitting: false,
            member: props.member
        }
        this.loadMoreContent = this.loadMoreContent.bind(this)
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.pageData.searchData != prevState.searchData) {
            return { submitting: false, page: 2, pagging: nextProps.pageData.items.pagging, items: nextProps.pageData.items.results }
        }else{
            return null
        }
    }
    componentDidMount(){
        let user = this.props.pageInfoData.user ? `&user=${this.props.pageInfoData.user}` : "";
        let userAs = this.props.pageInfoData.user ? `?user=${this.props.pageInfoData.user}` : "";
        $(document).on("click",'.open_balance',function() {
            Router.push(
                `/dashboard?type=balance${user}`,
                `/dashboard/balance${userAs}`,
            )
        })
    }
    loadMoreContent() {
        this.setState({localUpdate:true, loading: true })
        let formData = new FormData();
        if(this.state.member){
            formData.append('owner_id',this.state.member.user_id)
        }
        formData.append('page', this.state.page)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };

        let url = `/members/withdraws`;
        let queryString = ""
        if (this.props.pageInfoData.searchData) {
            queryString = Object.keys(this.props.pageInfoData.searchData).map(key => key + '=' + this.props.pageInfoData.searchData[key]).join('&');
            url = `${url}?${queryString}`
        }
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.items) {
                    let pagging = response.data.pagging
                    this.setState({localUpdate:true, page: this.state.page + 1, pagging: pagging, items: [...this.state.items, ...response.data.items], loading: false })
                } else {
                    this.setState({localUpdate:true, loading: false })
                }
            }).catch(err => {
                this.setState({localUpdate:true, loading: false })
            });
    }

    
    delete = (withdraw_id, e) => {
        e.preventDefault()
        swal({
            title: Translate(this.props, "Are you sure?"),
            text: Translate(this.props, "Once deleted, you will not be able to recover this!"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()
                    formData.append('withdraw_id', withdraw_id)
                    formData.append('user_id', this.state.member.user_id)
                    const url = "/members/withdraw-delete"
                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) {
                                swal("Error", Translate(this.props, "Something went wrong, please try again later", "error"));
                            } else {
                                const itemIndex = this.getItemIndex(withdraw_id)
                                if (itemIndex > -1) {
                                    const items = [...this.state.items]
                                    items.splice(itemIndex, 1);
                                    this.setState({localUpdate:true, items: items })
                                }
                            }
                        }).catch(err => {
                            swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
                        });
                    //delete
                } else {

                }
            });
    }
    getItemIndex(item_id) {
        const items = [...this.state.items];
        const itemIndex = items.findIndex(p => p["withdraw_id"] == item_id);
        return itemIndex;
    }
    change(e) {
        const fields = { ...this.state.fields }
        fields[e.target.id] = e.target.value
        this.setState({localUpdate:true, fields: fields })
    }
    submitForm = (e, isType) => {
        if (e)
            e.preventDefault()
        if (this.state.submitting) {
            return;
        }
        this.setState({localUpdate:true, submitting: true, items: [], pagging: false })
        const values = {}
        for (var key in this.state.fields) {
            if (this.state.fields[key] && this.state.fields[key] != "") {
                let keyName = key
                values[keyName] = this.state.fields[key]
            }
        }
        var queryString = Object.keys(values).map(key => key + '=' + values[key]).join('&');

        let user = this.props.pageInfoData.user ? `user=${this.props.pageInfoData.user}` : "";

        Router.push(
            `/dashboard?type=withdraw&${queryString}${queryString ? "&" : ""}${user}`,
            `/dashboard/withdraw?${queryString}${queryString ? "&" : ""}${user}`,
        )
    }
    render() {
        let results = this.state.items.map(item => {
            let spent = {}
            spent['package'] = { price: item.amount }
            return (
                <tr key={item.withdraw_id}>
                    <td><a href={`mailto:${item.email}`} target="_blank">{item.email}</a></td>
                    <td>{ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...spent} /> )}</td>
                    <td>
                        {
                                item.status == 1 ?
                                Translate(this.props, "Approved")
                                    :
                                    item.status == 2 ?
                                        Translate(this.props, "Rejected")
                                            : Translate(this.props, "Processing")
                        }
                    </td>
                    <td><Date {...this.props} creation_date={item.creation_date} initialLanguage={this.props.initialLanguage} format={'dddd, MMMM Do YYYY'} defaultTimezone={this.props.pageInfoData.defaultTimezone} /></td>
                    <td>
                        <div className="actionBtn">
                            <a className="text-danger" href="#" title={Translate(this.props, "Delete")} onClick={this.delete.bind(this, item.withdraw_id)}><span className="material-icons">delete</span></a>
                        </div>
                    </td>
                </tr>
            )
        })
        
        return (
            <React.Fragment>
                <button className="custom-control open_balance" href="#">{this.props.t("Back to balance")}</button>
                <div className="row">
                    <div className="col-12">
                        <div className="grid-menu justify-content-between search-form">
                            <form onSubmit={this.submitForm}>
                                <div className="form-group col-xs-3 col-md-3">
                                    <label htmlFor="status" className="control-label">{Translate(this.props, "Status")}</label>
                                    <select className="form-control" id="status" value={this.state.fields.status ? this.state.fields.status : ""} onChange={this.change.bind(this)}>
                                        <option key={""} value="">{Translate(this.props, "")}</option>
                                        <option key="0" value={"0"}>{Translate(this.props, "Processing")}</option>
                                        <option key="1" value={"1"}>{Translate(this.props, "Approved")}</option>
                                        <option key="2" value={"2"}>{Translate(this.props, "Rejected")}</option>

                                    </select>
                                </div>

                                <div className="form-group col-xs-3 col-md-3">
                                    <label htmlFor="name" className="control-label" style={{ marginTop: "21px" }}>{"  "}</label>
                                    <input type="submit" value={Translate(this.props, "Search")} style={{ display: "block" }} />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
               <div className="container">
                    <div className="row">
                        <div className="col-md-12">                                
                            <InfiniteScroll
                                className=""
                                dataLength={this.state.items.length}
                                next={this.loadMoreContent}
                                hasMore={this.state.pagging}
                                loader={<LoadMore {...this.props} page={this.state.page} loading={true} itemCount={this.state.items.length} />}
                                endMessage={
                                    <EndContent {...this.props} text={Translate(this.props,'No data found to display.')}  itemCount={this.state.items.length} />
                                }
                                pullDownToRefresh={false}
                                pullDownToRefreshContent={<Release release={false} {...this.props} />}
                                releaseToRefreshContent={<Release release={true} {...this.props} />}
                                refreshFunction={this.refreshContent}
                            >
                                <div className="table-responsive">
                                <table className="table custTble1">
                                    <thead>
                                        <tr>
                                            <th scope="col">{Translate(this.props,"Email")}</th>
                                            <th scope="col">{Translate(this.props,"Amount")}</th>
                                            <th scope="col">{Translate(this.props,"Status")}</th>
                                            <th scope="col">{Translate(this.props,"Creation Date")}</th>
                                            <th scope="col">{Translate(this.props,"Options")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results}
                                    </tbody>
                                </table>
                                </div>
                            </InfiniteScroll>
                        </div>
                    </div>
                </div>

            </React.Fragment>
        )
    }
}

export default Withdraw