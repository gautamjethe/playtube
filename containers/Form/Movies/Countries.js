import React, { Component } from "react"
import { connect } from 'react-redux';
import Translate from "../../../components/Translate/Index";
import swal from 'sweetalert'
import * as actions from '../../../store/actions/general';
import axios from "../../../axios-orders"

class Countries extends Component {
    constructor(props) {
        super(props)
        this.state = {
            countries:props.countries ? props.countries : [],
            movie:props.movie ? props.movie : {},
            movie_countries:props.movie_countries ? props.movie_countries : [],
            values:"",
            tags:[]
        }
        this.removeTag = this.removeTag.bind(this);
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else {
            return {
                countries:nextProps.countries ? nextProps.countries : [],
                movie:nextProps.movie ? nextProps.movie : {},
                movie_countries:nextProps.movie_countries ? nextProps.movie_countries : [],
                values:"",
                tags:[]       
            }
        }
    }
    updateValues = (values) => {
        //update the values
        this.props.updateSteps({key:"movie_countries",value:values})
    }
    addCountry = (e) => {
        e.preventDefault();
        this.setState({addCountry:true});
    }
    deleteCountry = (country_id,e) => {
        e.preventDefault();
        swal({
            title: Translate(this.props,"Delete Country?"),
            text: Translate(this.props,"Are you sure you want to delete this country?"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()
                    formData.append('id', country_id)
                    formData.append('movie_id', this.state.movie.movie_id);
                    const url = "/movies/country/delete"
                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) {
                                swal("Error", Translate(this.props,"Something went wrong, please try again later", "error"));
                            } else {
                                let message = response.data.message
                                this.props.openToast(Translate(this.props,message), "success");
                                const items = [...this.state.movie_countries]
                                const itemIndex = items.findIndex(p => p["movie_country_id"] == country_id)
                                if(itemIndex > -1){
                                    items.splice(itemIndex, 1)
                                    this.updateValues(items)
                                }
                            }
                        }).catch(err => {
                            swal("Error", Translate(this.props,"Something went wrong, please try again later"), "error");
                        });
                    //delete
                } else {

                }
            });
    }
    closeCountry = () => {
        this.setState({addCountry:false})
    }
    processValue = (value) => {
        return value.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
    }
    submit = (e) => {
        e.preventDefault();
        if(this.state.submitting || !this.state.tags.length){
            return false;
        }
        this.setState({submitting:true,localUpdate:true})
        let formData = new FormData();
        formData.append('movie_id', this.state.movie.movie_id)
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/movies/country/create';

        formData.append("countries",JSON.stringify(this.state.tags));

        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({localUpdate:true, error: response.data.error, submitting: false });
                } else {
                    this.setState({addCountry:false,tags:[],submitting:false,localUpdate:true,movie_countries:[ ...response.data.movie_countries,...this.state.movie_countries  ]},() => {
                        this.updateValues(this.state.movie_countries)
                    })
                }
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });
    }

    getCountryName = (id) => {
        const itemIndex = this.state.countries.findIndex(p => p["id"] == id)
        if(itemIndex > -1){
            return this.state.countries[itemIndex]['nicename']
        }
    }

    addTags = (e) => {
        if(this.state.submitting){
            return false;
        }
        e.preventDefault();
        let tags = []
        this.state.values.split(",").forEach(item => {
            let value = item
            if(value){
                if (this.state.tags.find(tag => tag["key"] == value) || tags.find(tag => tag["key"] == value) || this.state.movie_countries.find(tag => tag["id"] == value)  ) {
                    return;
                }
                tags.push({key:value,value:this.getCountryName(value)})
            }
        })
        this.setState({values:"",localUpdate:true, tags: [...this.state.tags, ...tags] });
    }
    
      removeTag = (i,e) => {
        if(this.state.submitting){
            return false;
        }
        const newTags = [...this.state.tags];
        newTags.splice(i, 1);
        this.setState({localUpdate:true, tags: newTags });
      } 
      addCountryValue = (e) => {
         this.setState({values:e.target.value,localUpdate:true})
      }
    render(){

        let addCountry = null

        if(this.state.addCountry){
            addCountry = (
                <div className="popup_wrapper_cnt">
                    <div className="popup_cnt">
                        <div className="comments">
                            <div className="VideoDetails-commentWrap">
                                <div className="popup_wrapper_cnt_header">
                                    <h2>{Translate(this.props,"Add Country")}</h2>
                                    <a onClick={this.closeCountry}  className="_close"><i></i></a>
                                </div>
                                <div className="user-area clear">
                                    <div className="container form">
                                        <form className="formFields" onSubmit={this.submit}>
                                            <div className="form-group genres_input">
                                                <select className="form-input form-control" value={this.state.values} onChange={this.addCountryValue}>
                                                    {
                                                        this.state.countries.map((item,i) => {
                                                            return(
                                                                <React.Fragment key={item.id+"11w112"}>
                                                                    {
                                                                        i == 0 ?
                                                                            <option key={item.id+"11112"}>{this.props.t("Select Country")}</option>
                                                                        : null
                                                                    }
                                                                     <option value={item.id} key={item.id}>{item.nicename}</option>
                                                                </React.Fragment>
                                                               
                                                            )
                                                        })
                                                    }    
                                                </select>  
                                                <button type="button" onClick={this.addTags}>{this.props.t("Add")}</button>  
                                            </div>
                                            <p>{this.props.t("Separate countries with comma.")}</p>
                                            {
                                                this.state.tags.length ?
                                                    <React.Fragment>
                                                        <div className="form-group genres_tags">
                                                            <div className="input-tag">
                                                                <ul className="input-tag__tags">
                                                                {
                                                                    this.state.tags.map((item,i) => {
                                                                    return (
                                                                        <li key={i}>{item.value}<button type="button" onClick={this.removeTag.bind(this,i)}>+</button></li>
                                                                        )
                                                                    })
                                                                }
                                                                </ul>
                                                            </div>
                                                        </div>
                                                        <div className="input-group">
                                                            <button type="submit">{this.state.submitting ? this.props.t("Submitting...") : this.props.t("Submit")}</button>
                                                        </div>
                                                    </React.Fragment>
                                                : null
                                            }
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }


        return (
            <React.Fragment>
                {
                    addCountry
                }
                <div className="movie_countries">
                    <div className="container">
                        <div className="row"> 
                            <div className="col-md-12">        
                                <button className="add_countries" onClick={this.addCountry.bind(this)}>
                                    {
                                        this.props.t("Add Country")
                                    }
                                </button>     
                                {
                                    this.state.movie_countries.length > 0 ? 
                                        <div className="table-responsive">
                                            <table className="table custTble1">
                                                <thead>
                                                    <tr>
                                                        <th scope="col">{this.props.t("Code")}</th>
                                                        <th scope="col">{this.props.t("Name")}</th>
                                                        <th scope="col">{this.props.t("Options")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.movie_countries.map((countries,index) => {
                                                            return (
                                                                <tr key={countries.movie_country_id}>
                                                                    <td>
                                                                            {countries.iso}
                                                                    </td>
                                                                    <td>{countries.nicename}</td>
                                                                    <td>
                                                                        <div className="actionBtn">
                                                                            <a className="text-danger" href="#" title={Translate(this.props, "Delete")} onClick={this.deleteCountry.bind(this, countries.movie_country_id)}><span className="material-icons">delete</span></a>                                                                                           
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                : null
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }

}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};
const mapDispatchToProps = dispatch => {
    return {
        openToast: (message, typeMessage) => dispatch(actions.openToast(message, typeMessage))
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Countries);