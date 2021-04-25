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

import Analytics from "./AdsAnalytics"

class Ads extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            pagging: props.pageData.items.pagging,
            items: props.pageData.items.ads,
            canEdit: props.pageData.canEdit,
            canDelete: props.pageData.canDelete,
            searchData: props.pageData.searchData && Object.keys(props.pageData.searchData).length ? props.pageData.searchData : null,
            fields: props.pageData.searchData,
            page: 1,
            adsPaymentStatus: props.pageData.adsPaymentStatus,
            submitting: false,
            member: props.member,
            adsWallet:props.pageData.recharge ? true : false,
            user:props.pageInfoData.user ? true : false
        }
        this.recharge = this.recharge.bind(this)
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else if (nextProps.pageData.searchData != prevState.searchData) {
            return { submitting: false, searchData: nextProps.pageData.searchData,fields:nextProps.pageData.searchData, page: 2, pagging: nextProps.pageData.items.pagging, items: nextProps.pageData.items.ads }
        }else{
            return null
        }
    }

    componentDidMount() {
        if (this.state.adsPaymentStatus) {
            if (this.state.adsPaymentStatus == "success") {
                swal("Success", Translate(this.props, "Wallet recharge successfully.", "success"));
            } else if (this.state.adsPaymentStatus == "fail") {
                swal("Error", Translate(this.props, "Something went wrong, please try again later", "error"));
            } else if (this.state.adsPaymentStatus == "cancel") {
                swal("Error", Translate(this.props, "You have cancelled the payment.", "error"));
            }
        }
    }
    refreshContent() {
        this.setState({localUpdate:true, page: 1, items: [] })
        this.loadMoreContent()
    }
    loadMoreContent(values) {
        this.setState({localUpdate:true, loading: true })
        let formData = new FormData();
        if(this.member){
            formData.append('owner_id',this.state.member.user_id)
        }
        formData.append('page', this.state.page)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };

        let url = `/dashboard/ads`;
        let queryString = ""
        if (this.props.pageInfoData.searchData) {
            queryString = Object.keys(this.props.pageInfoData.searchData).map(key => key + '=' + this.props.pageInfoData.searchData[key]).join('&');
            url = `${url}?${queryString}`
        }
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.ads) {
                    let pagging = response.data.pagging
                    this.setState({localUpdate:true, page: this.state.page + 1, pagging: pagging, ads: [...this.state.ads, ...response.data.ads], loading: false })
                } else {
                    this.setState({localUpdate:true, loading: false })
                }
            }).catch(err => {
                this.setState({localUpdate:true, loading: false })
            });
    }
    change(e) {
        const fields = { ...this.state.fields }
        fields[e.target.id] = e.target.value
        this.setState({localUpdate:true, fields: fields })
    }
    onCategoryChange = (e) => {
        const fields = { ...this.state.fields }
        fields['category_id'] = e.target.value
        fields['subcategory_id'] = e.target.value
        fields['subsubcategory_id'] = e.target.value
        this.setState({localUpdate:true, fields: fields })
    }
    onSubCategoryChange = (e) => {
        const fields = { ...this.state.fields }
        fields['subcategory_id'] = e.target.value
        fields['subsubcategory_id'] = 0
        this.setState({localUpdate:true, fields: fields })
    }
    onSubSubCategoryChange = (e) => {
        const fields = { ...this.state.fields }
        fields['subsubcategory_id'] = e.target.value
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
            `/dashboard?type=ads&${queryString}${queryString ? "&" : ""}${user}`,
            `/dashboard/ads?${queryString}${queryString ? "&" : ""}${user}`,
        )
    }
    changeStatus = (ad_id, e) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('ad_id', ad_id)
        const url = "/ads/status"
        const itemIndex = this.getItemIndex(ad_id)
        if (itemIndex > -1) {
            const items = [...this.state.items]
            items[itemIndex]['status'] = 3
            this.setState({localUpdate:true, items: items })
        }
        axios.post(url, formData)
            .then(response => {
                if (response.data.error) {
                    swal("Error", Translate(this.props, "Something went wrong, please try again later", "error"));
                } else {
                    const itemIndex = this.getItemIndex(ad_id)
                    if (itemIndex > -1) {
                        const items = [...this.state.items]
                        items[itemIndex]['status'] = response.data.status ? 1 : 0
                        this.setState({localUpdate:true, items: items })
                    }
                }
            }).catch(err => {
                swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
            });
    }
    delete = (ad_id, e) => {
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
                    formData.append('ad_id', ad_id)
                    const url = "/ads/delete"
                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) {
                                swal("Error", Translate(this.props, "Something went wrong, please try again later", "error"));
                            } else {
                                const itemIndex = this.getItemIndex(ad_id)
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
        const itemIndex = items.findIndex(p => p["ad_id"] == item_id);
        return itemIndex;
    }
    recharge = (e) => {
        this.setState({localUpdate:true, adsWallet: true })
    }
    edit = (ad_id, e) => {
        e.preventDefault()
        Router.push(
            `/create-ad?adId=${ad_id}`,
            `/create-ad/${ad_id}`,
        )
    }
    analytics = (ad_id, e) => {
        e.preventDefault()
        this.setState({localUpdate:true, analytics: true, ad_id: ad_id })
    }
    closePopup = (e) => {
        this.setState({localUpdate:true, analytics: false, ad_id: 0 })
    }
    closeWalletPopup = (e) => {
        this.setState({localUpdate:true, adsWallet: false, walletAmount: 0 })
    }
    walletValue = (e) => {
        if (isNaN(e.target.value) || e.target.value < 1) {
            this.setState({localUpdate:true, walletAmount: parseFloat(e.target.value) })
        } else {
            this.setState({localUpdate:true, walletAmount: e.target.value })
        }
    }
    walletFormSubmit = (e) => {
        e.preventDefault()
        if (!this.state.walletAmount) {
            return
        }
        this.setState({localUpdate:true, adsWallet: false })
        swal("Success", Translate(this.props, "Redirecting you to payment gateway...", "success"));
        window.location.href = "/ads/recharge?amount=" + encodeURI(this.state.walletAmount)
    }
    render() {
        let adsWallet = null
        if (this.state.adsWallet && !this.state.user) {
            adsWallet = <div className="popup_wrapper_cnt">
                <div className="popup_cnt">
                    <div className="comments">
                        <div className="VideoDetails-commentWrap">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{Translate(this.props, "Recharge Wallet")}</h2>
                                <a onClick={this.closeWalletPopup} className="_close"><i></i></a>
                            </div>
                            <div className="user_wallet">
                                <div className="row">
                                    <form onSubmit={this.walletFormSubmit}>
                                        <div className="form-group">
                                            <label htmlFor="name" className="control-label">{Translate(this.props, "Enter Amount :")}</label>
                                            <input type="text" className="form-control" value={this.state.walletAmount ? this.state.walletAmount : ""} onChange={this.walletValue} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="name" className="control-label"></label>
                                            <button type="submit">{Translate(this.props, "Submit")}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        } 

        let analyticsData = null
        if (this.state.analytics) {
            let itemIndex = this.getItemIndex(this.state.ad_id)
            analyticsData = <div className="popup_wrapper_cnt">
                <div className="popup_cnt" style={{ maxWidth: "60%" }}>
                    <div className="comments">
                        <div className="VideoDetails-commentWrap">
                            <div className="popup_wrapper_cnt_header">
                                <h2>{Translate(this.props, "Analytics")}</h2>
                                <a onClick={this.closePopup} className="_close"><i></i></a>
                            </div>
                            <Analytics {...this.props} item={this.state.items[itemIndex]} ad_id={this.state.ad_id} />
                        </div>
                    </div>
                </div>
            </div>
        }

        let categories = []
        let subcategories = []
        let subsubcategories = []
        if (this.props.pageInfoData.categories) {

            categories.push({ key: 0, value: Translate(this.props, "Please Select Category") })
            this.props.pageInfoData.categories.forEach(res => {
                categories.push({ key: res.category_id, value: Translate(this.props, res.title) })
            })

            //get sub category
            if (this.state.fields.category_id) {
                this.props.pageInfoData.categories.forEach(res => {
                    if (res.category_id == this.state.fields.category_id) {
                        if (res.subcategories) {
                            subcategories.push({ key: 0, value: Translate(this.props, "Please Select Sub Category") })
                            res.subcategories.forEach(rescat => {
                                subcategories.push({ key: rescat.category_id, value: Translate(this.props, rescat.title) })
                            })
                        }
                    }
                })


                if (subcategories.length > 0) {
                    if (this.state.fields.subcategory_id) {
                        this.props.pageInfoData.categories.forEach(res => {
                            if (res.category_id == this.state.fields.category_id) {
                                if (res.subcategories) {
                                    res.subcategories.forEach(rescat => {
                                        if (rescat.category_id == this.state.fields.subcategory_id) {
                                            if (rescat.subsubcategories) {
                                                subsubcategories.push({ key: 0, value: Translate(this.props, "Please Select Sub Sub Category") })
                                                rescat.subsubcategories.forEach(ressubcat => {
                                                    subsubcategories.push({ key: ressubcat.category_id, value: Translate(this.props, ressubcat.title) })
                                                })
                                            }
                                        }
                                    })
                                }
                            }
                        })


                    }
                }
            }
        }


        let results = this.state.items.map(item => {
            let spent = {}
            spent['package'] = { price: item.spent }
            return (
                <tr key={item.ad_id}>
                    <td>{item.name}</td>
                    <td>{item.title}</td>
                    <td>
                        {
                            item.completed == 1 ?
                                item.status == 3 ?
                                    <a href="#" onClick={(e) => { e.preventDefault() }}>
                                        <img style={{ width: "16px" }} src="/images/admin/loading.gif" />
                                    </a>
                                    :
                                    item.status == 1 ?
                                        <a href="#" title={Translate(this.props, "Disabled")} onClick={this.changeStatus.bind(this, item.ad_id)}>
                                            <img src="/images/admin/check_image.png" />
                                        </a>
                                        : <a href="#" title={Translate(this.props, "Enabled")} onClick={this.changeStatus.bind(this, item.ad_id)}>
                                            <img src="/images/admin/error_image.png" />
                                        </a>
                                :
                                Translate(this.props, "Processing")
                        }
                    </td>
                    <td>{item.approve ? Translate(this.props,'Approved') : Translate(this.props,'Pending')}</td>
                    <td>{item.results}{item.type == 1 ? " "+Translate(this.props,'Clicks') : " "+Translate(this.props,'Views')}</td>
                    <td>{ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...spent} />)}</td>
                    <td>
                        <div className="actionBtn">
                            {
                                this.state.canDelete ?
                                    <a className="text-danger" href="#" title={Translate(this.props, "Delete")} onClick={this.delete.bind(this, item.ad_id)}><span className="material-icons">delete</span></a>
                                    : null
                            }
                            {
                                this.state.canEdit ?
                                    <a href="#"  className="text-success" title={Translate(this.props, "Edit")} onClick={this.edit.bind(this, item.ad_id)}><span className="material-icons">edit</span></a>
                                    : null
                            }
                            <a href="#" className="text-info" onClick={this.analytics.bind(this, item.ad_id)} title={Translate(this.props, "Analytics")}>
                                <span className="material-icons">show_chart</span>
                            </a>
                        </div>
                    </td>
                </tr>
            )
        })
        let wallet = {}
        wallet['package'] = { price: this.state.member ? this.state.member.wallet : this.props.pageInfoData.loggedInUserDetails.wallet }
        return (
            <React.Fragment>
                {adsWallet}
                {analyticsData}
                <div className="row">
                    <div className="col-12">
                        <div className="container">
                            <div className="row wallet">
                                <div className="col-md-2 wallet_amount">{Translate(this.props, "Wallet Total:")}{" "}<b>{ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props } {...wallet} />)}</b></div>
                                {
                                    !this.state.member && !this.state.user ? 
                                        <button onClick={this.recharge.bind(this)}>{Translate(this.props, "Recharge Wallet")}</button>
                                        : null
                                }
                            </div>
                        </div>
                        
                        <div className="grid-menu justify-content-between search-form">
                            <form onSubmit={this.submitForm}>
                                <div className="form-group col-xs-3 col-md-3">
                                    <label htmlFor="name" className="control-label">{Translate(this.props, "Name")}</label>
                                    <input type="text" onChange={this.change.bind(this)} value={this.state.fields.name ? this.state.fields.name : ""} id="name" className="form-control" placeholder={Translate(this.props, "Name")} />
                                </div>
                                <div className="form-group col-xs-3 col-md-3">
                                    <label htmlFor="title" className="control-label">{Translate(this.props, "Title")}</label>
                                    <input type="text" onChange={this.change.bind(this)} value={this.state.fields.title ? this.state.fields.title : ""} id="title" className="form-control" placeholder={Translate(this.props, "Title")} />
                                </div>
                                {
                                    categories.length > 0 ?
                                        <React.Fragment>
                                            <div className="form-group col-xs-3 col-md-3">
                                                <label htmlFor="category_id" className="control-label">{Translate(this.props, "Categories")}</label>
                                                <select className="form-control" id="category_id" value={this.state.fields.category_id ? this.state.fields.category_id : ""} onChange={this.onCategoryChange}>
                                                    {
                                                        categories.map(res => {
                                                            return (
                                                                <option key={res.key} value={res.key}>{Translate(this.props, res.value)}</option>
                                                            )
                                                        })
                                                    }
                                                </select>
                                            </div>
                                            {
                                                subcategories.length > 0 ?
                                                    <div className="form-group col-xs-3 col-md-3">
                                                        <label htmlFor="subcategory_id" className="control-label">{Translate(this.props, "Sub Categories")}</label>
                                                        <select className="form-control" id="subcategory_id" value={this.state.fields.subcategory_id ? this.state.fields.subcategory_id : ""} onChange={this.onSubCategoryChange}>
                                                            {
                                                                subcategories.map(res => {
                                                                    return (
                                                                        <option key={res.key} value={res.key}>{Translate(this.props, res.value)}</option>
                                                                    )
                                                                })
                                                            }
                                                        </select>
                                                    </div>
                                                    : null
                                            }
                                            {
                                                subsubcategories.length > 0 ?
                                                    <div className="form-group col-xs-3 col-md-3">
                                                        <label htmlFor="subsubcategory_id" className="control-label">{Translate(this.props, "Sub Sub Categories")}</label>
                                                        <select value={this.state.fields.subsubcategory_id ? this.state.fields.subsubcategory_id : ""} id="subsubcategory_id" className="form-control" onChange={this.onSubSubCategoryChange}>
                                                            {
                                                                subsubcategories.map(res => {
                                                                    return (
                                                                        <option key={res.key} value={res.key}>{Translate(this.props, res.value)}</option>
                                                                    )
                                                                })
                                                            }
                                                        </select>
                                                    </div>
                                                    : null
                                            }
                                            <div className="form-group col-xs-3 col-md-3">
                                                <label htmlFor="status" className="control-label">{Translate(this.props, "Status")}</label>
                                                <select className="form-control" id="status" value={this.state.fields.status ? this.state.fields.status : ""} onChange={this.change.bind(this)}>
                                                    <option key={""} value="">{Translate(this.props, "")}</option>
                                                    <option key="1" value={"1"}>{Translate(this.props, "Enabled")}</option>
                                                    <option key="0" value={"0"}>{Translate(this.props, "Disabled")}</option>

                                                </select>
                                            </div>
                                            <div className="form-group col-xs-3 col-md-3">
                                                <label htmlFor="adult" className="control-label">{Translate(this.props, "Adult")}</label>
                                                <select className="form-control" id="adult" value={this.state.fields.adult ? this.state.fields.adult : ""} onChange={this.change.bind(this)}>
                                                    <option key={""} value="">{Translate(this.props, "")}</option>
                                                    <option key="1" value={"1"}>{Translate(this.props, "Yes")}</option>
                                                    <option key="0" value={"0"}>{Translate(this.props, "No")}</option>

                                                </select>
                                            </div>
                                            <div className="form-group col-xs-3 col-md-3">
                                                <label htmlFor="approve" className="control-label">{Translate(this.props, "Approve")}</label>
                                                <select className="form-control" id="approve" value={this.state.fields.approve ? this.state.fields.approve : ""} onChange={this.change.bind(this)}>
                                                    <option key={""} value="">{Translate(this.props, "")}</option>
                                                    <option key="1" value={"1"}>{Translate(this.props, "Yes")}</option>
                                                    <option key="0" value={"0"}>{Translate(this.props, "No")}</option>

                                                </select>
                                            </div>
                                        </React.Fragment>
                                        : null
                                }

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
                                    <EndContent {...this.props} text={this.state.searchData ? Translate(this.props,"No advertisement found with your matching criteria.") : Translate(this.props,'No advertisement created yet.')} itemCount={this.state.items.length} />
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
                                            <th scope="col">{this.props.t("Name")}</th>
                                            <th scope="col">{this.props.t("Title")}</th>
                                            <th scope="col">{this.props.t("Status")}</th>
                                            <th scope="col">{this.props.t("Approved")}</th>
                                            <th scope="col">{this.props.t("Results")}</th>
                                            <th scope="col">{this.props.t("Spent")}</th>
                                            <th scope="col">{this.props.t("Options")}</th>
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

export default Ads