import React, { Component } from "react"
import { connect } from 'react-redux';
import Translate from "../../../components/Translate/Index";
import swal from 'sweetalert'
import * as actions from '../../../store/actions/general';
import axios from "../../../axios-orders"

class Generes extends Component {
    constructor(props) {
        super(props)
        this.state = {
            generes:props.generes ? props.generes : [],
            movie:props.movie ? props.movie : {},
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
                generes:nextProps.generes ? nextProps.generes : [],   
                movie:nextProps.movie ? nextProps.movie : {},
                values:"",
                tags:[]        
            }
        }
    }
    updateValues = (values) => {
        //update the values
        this.props.updateSteps({key:"generes",value:values})
    }
    addGenres = (e) => {
        e.preventDefault();
        this.setState({addGenre:true});
    }
    deleteGenere = (genre_id,e) => {
        e.preventDefault();
        swal({
            title: Translate(this.props,"Delete Genre?"),
            text: Translate(this.props,"Are you sure you want to delete this genre?"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()
                    formData.append('id', genre_id)
                    formData.append('movie_id', this.state.movie.movie_id);
                    const url = "/movies/genres/delete"
                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) {
                                swal("Error", Translate(this.props,"Something went wrong, please try again later", "error"));
                            } else {
                                let message = response.data.message
                                this.props.openToast(Translate(this.props,message), "success");
                                const items = [...this.state.generes]
                                const itemIndex = items.findIndex(p => p["movie_genre_id"] == genre_id)
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
    closeGeneres = () => {
        this.setState({addGenre:false})
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
        let url = '/movies/genres/create';

        formData.append("tags",JSON.stringify(this.state.tags));

        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({localUpdate:true, error: response.data.error, submitting: false });
                } else {
                    this.setState({addGenre:false,tags:[],submitting:false,localUpdate:true,generes:[ ...response.data.generes,...this.state.generes  ]},() => {
                        this.updateValues(this.state.generes)
                    })
                }
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });
    }
    addTags = (e) => {
        if(this.state.submitting){
            return false;
        }
        e.preventDefault();
        let tags = []
        this.state.values.split(",").forEach(item => {
            let value = this.processValue(item)
            if(value){
                if (this.state.tags.find(tag => tag["key"] == value) || tags.find(tag => tag["key"] == value) || this.state.generes.find(tag => tag["slug"] == value)  ) {
                    return;
                }
                tags.push({key:value,value:item})
            }
        })
        this.setState({values:"",localUpdate:true, tags: [...this.state.tags, ...tags] });
    }
    inputKeyDown = (e) => {
        if(this.state.submitting){
            return false;
        }
        const val = e.target.value;
        if (e.key === 'Enter' && val) {
           this.addTags(e);
        } else if (e.key === 'Enter') {
          e.preventDefault();
        }
      }
      removeTag = (i,e) => {
        if(this.state.submitting){
            return false;
        }
        const newTags = [...this.state.tags];
        newTags.splice(i, 1);
        this.setState({localUpdate:true, tags: newTags });
      } 
    render(){

        let addGenres = null

        if(this.state.addGenre){
            addGenres = (
                <div className="popup_wrapper_cnt">
                    <div className="popup_cnt">
                        <div className="comments">
                            <div className="VideoDetails-commentWrap">
                                <div className="popup_wrapper_cnt_header">
                                    <h2>{Translate(this.props,"Add Genres")}</h2>
                                    <a onClick={this.closeGeneres}  className="_close"><i></i></a>
                                </div>
                                
                                <div className="user-area clear">
                                    <div className="container form">
                                        <form className="formFields" onSubmit={this.submit}>
                                            <div className="form-group genres_input">
                                                <input className="form-input form-control" type="text" onKeyDown={this.inputKeyDown} value={this.state.values} onChange={(e) => this.setState({values:e.target.value,localUpdate:true})} />  
                                                <button type="button" onClick={this.addTags}>{this.props.t("Add")}</button>  
                                            </div>
                                            <p>{this.props.t("Separate genres with comma.")}</p>
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
                    addGenres
                }
                <div className="movie_generes">
                    <div className="container">
                        <div className="row"> 
                            <div className="col-md-12">        
                                <button className="add_generes" onClick={this.addGenres.bind(this)}>
                                    {
                                        this.props.t("Add Genres")
                                    }
                                </button>     
                                {
                                    this.state.generes.length > 0 ? 
                                        <div className="table-responsive">
                                            <table className="table custTble1">
                                                <thead>
                                                    <tr>
                                                        <th scope="col">{this.props.t("Name")}</th>
                                                        <th scope="col">{this.props.t("Slug")}</th>
                                                        <th scope="col">{this.props.t("Options")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.generes.map((generes,index) => {
                                                            return (
                                                                <tr key={generes.genre_id}>
                                                                    <td>
                                                                            {generes.title}
                                                                    </td>
                                                                    <td>{generes.slug}</td>
                                                                    <td>
                                                                        <div className="actionBtn">
                                                                            <a className="text-danger" href="#" title={Translate(this.props, "Delete")} onClick={this.deleteGenere.bind(this, generes.movie_genre_id)}><span className="material-icons">delete</span></a>                                                                                           
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

export default connect(mapStateToProps, mapDispatchToProps)(Generes);