import React from "react"
import { connect } from "react-redux";
import Router  from 'next/router'
import Translate from "../../components/Translate/Index";
import AdsIndex from "../Ads/Index"

class Index extends React.Component{
    constructor(props){
        super(props)
        const search = props.pageInfoData.search
        this.state = {
            fields:{
                categories:search && search.category_id ? search.category_id : "",
                subCategory:search && search.subcategory_id ? search.subcategory_id : "",
                subSubCatgeory:search && search.subsubcategory_id ? search.subsubcategory_id : "",
                q:search && search.q ? search.q : "",
                sort:search && search.sort ? search.sort : "latest",
                tag:search && search.tag ? search.tag : "",
                type:search && search.type ? search.type : "",
            },sort:{
                latest:'Latest '+this.capitalizeFirstLetter(props.type+"s"),
                favourite:"Most Favourite "+this.capitalizeFirstLetter(props.type+"s"),
                view:"Most Viewed "+this.capitalizeFirstLetter(props.type+"s"),
                like:"Most Liked "+this.capitalizeFirstLetter(props.type+"s"),
                dislike:"Most Disliked "+this.capitalizeFirstLetter(props.type+"s"),
                commented:"Most Commented "+this.capitalizeFirstLetter(props.type+"s"),
                rated:"Most Rated "+this.capitalizeFirstLetter(props.type+"s"),
                played:"Most Played "+this.capitalizeFirstLetter(props.type+"s")
            },type:{
                featured:"Featured "+this.capitalizeFirstLetter(props.type+"s"),
                sponsored:"Sponsored "+this.capitalizeFirstLetter(props.type+"s"),
                hot:"Hot "+this.capitalizeFirstLetter(props.type+"s")
            },
            filterForm:0
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else {
            const search = nextProps.pageInfoData.search
            return {
                fields:{
                    categories:search && search.category_id ? search.category_id : "",
                    subCategory:search && search.subcategory_id ? search.subcategory_id : "",
                    subSubCatgeory:search && search.subsubcategory_id ? search.subsubcategory_id : "",
                    q:search && search.q ? search.q : "",
                    sort:search && search.sort ? search.sort : "latest",
                    tag:search && search.tag ? search.tag : "",
                    type:search && search.type ? search.type : "",
                }
            }
        } 
    }
    onCategoryChange = (e) => {
        const fields = {...this.state.fields}
        fields['categories'] = e.target.value
        fields['subSubCatgeory'] = ''
        fields['subCategory'] = ''
        this.setState({localUpdate:true,fields:fields})
    }
    onSubCategoryChange = (e) => {
        const fields = {...this.state.fields}
        fields['subSubCatgeory'] = ''
        fields['subCategory'] = e.target.value
        this.setState({localUpdate:true,fields:fields})
    }
    onSubSubCategoryChange = (e) => {
        const fields = {...this.state.fields}
        fields['subSubCatgeory'] = e.target.value
        this.setState({localUpdate:true,fields:fields})
    }
    changeTitle = (e) => {
        const fields = {...this.state.fields}
        fields['q'] = e.target.value
        if(this.state.tag){
            fields['tag'] = e.target.value
        }
        this.setState({localUpdate:true,fields:fields})
    }
    changeSort= (e) => {
        const fields = {...this.state.fields}
        fields['sort'] = e.target.value
        this.setState({localUpdate:true,fields:fields})
    }
    changeType = (e) => {
        const fields = {...this.state.fields}
        fields['type'] = e.target.value
        this.setState({localUpdate:true,fields:fields})
    }
    submitForm = (e) => {
        if(e)
         e.preventDefault()
        const values = {}
        for (var key in this.state.fields) {
            if(this.state.fields[key] && this.state.fields[key] != ""){
                let keyName = key
                if(key == "categories"){
                    keyName = "category_id"
                }else if(key == "subCategory"){
                    keyName = "subcategory_id"
                }else if(key == "subSubCatgeory"){
                    keyName = "subsubcategory_id"
                }else if(key == "tag"){
                    continue;
                }
                values[keyName] = this.state.fields[key]
            }
        }
        if(this.state.fields.tag){
            if(this.state.fields.q)
                values["tag"] = this.state.fields.q
        }else{
            if(this.state.fields.q)
                values["q"] = this.state.fields.q
        }
        let subtype = ""
        let asPath = ""
        if(this.props.subtype){
            subtype = `?artistType=${this.props.subtype}`
            asPath = `/${this.props.subtype}`
        }
        var queryString = Object.keys(values).map(key => key + '=' + values[key]).join('&');

        let url = `${this.props.type}s`
        if(this.props.type == "audio"){
            url = `${this.props.type}`
        }
        if(this.props.liveStreamingPage){
            url = "live"
        }

        Router.push(
            `/${url}${subtype}`+(queryString ? (subtype != "" ? "&"+queryString : "?"+queryString) : ""),
            `/${url}${asPath}${queryString ? "?"+queryString : ""}`,
        )
    }
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    searchButton = (e) => {
        e.preventDefault()
        this.setState({localUpdate:true,filterForm:!this.state.filterForm})
    }
    render(){
        let sortArray = []
        for (var key in this.state.sort) {
            if(key == "latest"){
                sortArray.push({key:key,value:Translate(this.props,this.state.sort[key])})
            }else if(key == "favourite" && this.props.pageInfoData.appSettings[(this.props.subtype ? this.props.subtype+"_" : "") + this.props.type+'_favourite'] == 1){
                sortArray.push({key:key,value:Translate(this.props,this.state.sort[key])})
            }else if(key == "view"){
                sortArray.push({key:key,value:Translate(this.props,this.state.sort[key])})
            }else if(key == "like" && this.props.pageInfoData.appSettings[(this.props.subtype ? this.props.subtype+"_" : "") +this.props.type+'_like'] == "1"){
                sortArray.push({key:key,value:Translate(this.props,this.state.sort[key])})
            }else if(key == "dislike" && this.props.pageInfoData.appSettings[(this.props.subtype ? this.props.subtype+"_" : "") +this.props.type+'_dislike'] == "1"){
                sortArray.push({key:key,value:Translate(this.props,this.state.sort[key])})
            }else if(key == "rated" && this.props.pageInfoData.appSettings[(this.props.subtype ? this.props.subtype+"_" : "") +this.props.type+'_rating'] == "1"){
                sortArray.push({key:key,value:Translate(this.props,this.state.sort[key])})
            }else if(key == "commented" && this.props.pageInfoData.appSettings[(this.props.subtype ? this.props.subtype+"_" : "") +this.props.type+'_comment'] == "1"){
                sortArray.push({key:key,value:Translate(this.props,this.state.sort[key])})
            }else if(key == "rated" && this.props.pageInfoData.appSettings[(this.props.subtype ? this.props.subtype+"_" : "") +this.props.type+'_rating'] == "1"){
                sortArray.push({key:key,value:Translate(this.props,this.state.sort[key])})
            }else if(key == "played" && this.props.type == "audio"){
                sortArray.push({key:key,value:Translate(this.props,this.state.sort[key])})
            }
        }
        
        const typeArray = []
        for(var key in this.state.type){
            if(key == "featured" && this.props.pageInfoData.appSettings[(this.props.subtype ? this.props.subtype+"_" : "") +this.props.type+'_featured'] == 1){
                typeArray.push({key:key,value:Translate(this.props,this.state.type[key])})
            }else if(key == "sponsored" && this.props.pageInfoData.appSettings[(this.props.subtype ? this.props.subtype+"_" : "") +this.props.type+'_sponsored'] == 1){
                typeArray.push({key:key,value:Translate(this.props,this.state.type[key])})
            }else if(key == "hot" && this.props.pageInfoData.appSettings[(this.props.subtype ? this.props.subtype+"_" : "") +this.props.type+'_hot'] == 1){
                typeArray.push({key:key,value:Translate(this.props,this.state.type[key])})
            }
        }

        let categories = []
        let subcategories = []
        let subsubcategories = []
        if(this.props.pageInfoData.categories){
            
            categories.push({key:'',value:Translate(this.props,"Please Select Category")})
            this.props.pageInfoData.categories.forEach(res => {
                categories.push({key:res.category_id,value:Translate(this.props,res.title)})
            })

            //get sub category
            if(this.state.fields.categories){                
                this.props.pageInfoData.categories.forEach(res => {
                    if(res.category_id == this.state.fields.categories){
                        if(res.subcategories){
                            subcategories.push({key:0,value:Translate(this.props,"Please Select Sub Category")})
                            res.subcategories.forEach(rescat => {
                                subcategories.push({key:rescat.category_id,value:Translate(this.props,rescat.title)})
                            })
                        }
                    }
                })


                if(subcategories.length > 0){
                    if(this.state.fields.subCategory){                        
                        this.props.pageInfoData.categories.forEach(res => {
                            if(res.category_id == this.state.fields.categories){
                                if(res.subcategories){
                                    res.subcategories.forEach(rescat => {
                                        if(rescat.category_id == this.state.fields.subCategory){
                                            if(rescat.subsubcategories){
                                                subsubcategories.push({key:0,value:Translate(this.props,"Please Select Sub Sub Category")})
                                                rescat.subsubcategories.forEach(ressubcat => {
                                                    subsubcategories.push({key:ressubcat.category_id,value:Translate(this.props,ressubcat.title)})
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


        return (
            <React.Fragment>
                <div className="row">
                    <div className="col-sm-12">
                        <a className={`filter-search ${this.state.filterForm ? "active" : ""}`} href="#" title={Translate(this.props,'Search Filters')} onClick={this.searchButton}>
                        <span className="material-icons">
                            tune
                        </span>{Translate(this.props,'Filter')}
                        </a>
                    </div>
                </div>
                {
                    this.state.filterForm ? 
                <div className="row">
                        <div className="grid-menu justify-content-between search-form">
                            <form onSubmit={this.submitForm.bind(this)}>
                                <div className="form-group col-sm-4">
                                    <label htmlFor="q" className="control-label">{Translate(this.props,this.state.fields.tag ? "Tags" : "Title")}</label>
                                    <input type="text" onChange={this.changeTitle} value={Translate(this.props,this.state.fields.tag ? this.state.fields.tag : this.state.fields.q)} id="q" className="form-control" placeholder={Translate(this.props,"Title")} />
                                </div>
                                {
                                    categories.length > 0 ? 
                                        <React.Fragment>
                                            <div className="form-group col-sm-4">
                                                <label htmlFor="name" className="control-label">{Translate(this.props,"Categories")}</label>
                                                <select className="form-control" value={this.state.fields.categories} onChange={this.onCategoryChange}>
                                                {
                                                    categories.map(res => {
                                                        return (
                                                            <option key={res.key} value={res.key}>{Translate(this.props,res.value)}</option>
                                                        )
                                                    })
                                                }
                                                </select>
                                            </div>
                                            {
                                                subcategories.length > 0 ? 
                                                <div className="form-group col-sm-4">
                                                    <label htmlFor="name" className="control-label">{Translate(this.props,"Sub Categories")}</label>
                                                    <select className="form-control"  value={this.state.fields.subCategory} onChange={this.onSubCategoryChange}>
                                                    {
                                                        subcategories.map(res => {
                                                            return (
                                                                <option key={res.key} value={res.key}>{Translate(this.props,res.value)}</option>
                                                            )
                                                        })
                                                    }
                                                    </select>
                                                </div>
                                            : null
                                            }
                                            {
                                                subsubcategories.length > 0 ? 
                                                    <div className="form-group col-sm-4">
                                                        <label htmlFor="name" className="control-label">{Translate(this.props,"Sub Sub Categories")}</label>
                                                        <select  value={this.state.fields.subSubCatgeory} className="form-control" onChange={this.onSubSubCategoryChange}>
                                                        {
                                                            subsubcategories.map(res => {
                                                                return (
                                                                    <option key={res.key} value={res.key}>{Translate(this.props,res.value)}</option>
                                                                )
                                                            })
                                                        }
                                                        </select>
                                                    </div>
                                                : null
                                            }
                                        </React.Fragment>
                                    : null
                                }
                                {
                                    sortArray.length > 0 && !this.props.liveStreamingPage ? 
                                        <div className="form-group col-sm-4">
                                            <label htmlFor="name" className="control-label">{Translate(this.props,"Sort")}</label>
                                            <select onChange={this.changeSort} className="form-control" value={this.state.fields.sort}>
                                                <option value="">{Translate(this.props,"Sort By")}</option>
                                                {
                                                    sortArray.map(res => {
                                                        return (
                                                            <option key={res.key} value={res.key}>{Translate(this.props,res.value)}</option>
                                                        )
                                                    })
                                                }
                                            </select>
                                        </div>
                                    : null
                                }
                                {
                                    typeArray.length > 0 && !this.props.liveStreamingPage ? 
                                        <div className="form-group col-sm-4">
                                            <label htmlFor="name" className="control-label">{Translate(this.props,"Type")}</label>
                                            <select onChange={this.changeType} className="form-control" value={this.state.fields.type}>
                                                <option value="">{Translate(this.props,"Type")}</option>
                                                {
                                                    typeArray.map(res => {
                                                        return (
                                                            <option key={res.key} value={res.key}>{Translate(this.props,res.value)}</option>
                                                        )
                                                    })
                                                }
                                            </select>
                                            
                                        </div>
                                    : null
                                }
                                <div className="form-group col-sm-4 searchBtn filterBtn">
                                    
                                    <button type="submit">{Translate(this.props,"Search")} </button>{" or "}
                                    <a href="#" style={{fontSize:"16px"}} onClick={(e) => {
                                        e.preventDefault()
                                        let data = {}
                                        for(var key in this.state.fields){
                                            data[key] = ""
                                        }
                                        this.setState({localUpdate:true,fields:data},() => {this.submitForm()})
                                    }}>{Translate(this.props,'reset')}</a>
                                </div>
                            </form>
                        </div>
                        {
                        this.props.pageInfoData.appSettings['below_searchform'] ? 
                            <AdsIndex paddingTop="20px" className="below_searchform" ads={this.props.pageInfoData.appSettings['below_searchform']} />
                        : null
                        }
                </div>
                : null
            }
            </React.Fragment>
        )
    }
}


const mapStateToProps = state => {
    return {
        pageInfoData:state.general.pageInfoData
    };
  };

export default connect(mapStateToProps,null)(Index)