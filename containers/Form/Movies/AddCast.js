import React, { Component } from "react"
import { connect } from 'react-redux';
import Form from '../../../components/DynamicForm/Index'
import Validator from '../../../validators';
import axios from "../../../axios-orders"
import config from "../../../config";

class AddCast extends Component {
    constructor(props) {
        super(props)
        this.state = {
            season_id:props.season_id,
            editItem:props.editItem,
            movie:props.movie
        }
        this.empty = true
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else {
            return {
                season_id:nextProps.season_id,
                editItem:nextProps.editItem,
                movie:nextProps.movie             
            }
        }
    }

    onSubmit = model => {
        if (this.state.submitting) {
            return
        }

        let formData = new FormData();
        for (var key in model) {
            if(model[key] != null && typeof model[key] != "undefined")
                formData.append(key, model[key]);
        }
        
        //image
        
        formData.append("movie_id",this.state.movie.movie_id);
        formData.append("season_id",this.state.season_id);
        if(this.props.fromCastnCrew){
            formData.append("fromCastnCrew",1);
        }
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        formData.append("resource_type",this.props.resource_type);
        formData.append("resource_id",this.props.resource_id);
        let url = '/movies/episode/create-cast';
        if (this.state.editItem) {
            formData.append("cast_crew_member_id",this.state.editItem.cast_crew_member_id)
            formData.append("cast_id", this.state.editItem.cast_crew_id)
        }
        this.setState({localUpdate:true, submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({localUpdate:true, error: response.data.error, submitting: false });
                } else {
                    this.props.closeCastCreate({...response.data.item},response.data.message)
                }
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });

    }
    render(){


        let validator = [
            
        ]
        

        let suggestionValue = []
      
        if(this.state.editItem){
            suggestionValue = [{title:this.state.editItem.name,image:this.state.editItem.image,id:this.state.editItem.cast_crew_id}]
        }
        let formFields = []
        if(!this.state.editItem){
            validator.push(
                {
                    key: "cast_crew_member_id",
                    validations: [
                        {
                            "validator": Validator.int,
                            "message": this.props.isCrew ? "Crew Member is required field" : "Cast Member is required field"
                        }
                    ]
                }
            )
            formFields.push(
                { key: "cast_crew_member_id",type:"autosuggest",id:this.state.editItem ? this.state.editItem.cast_crew_id : "",imageSuffix:this.props.pageInfoData.imageSuffix,url:config.app_server+"/api/movies/cast/auto-suggest"+(this.props.fromCastnCrew ? "/movie" : ""),placeholder:"Search for a member...",suggestionValue:suggestionValue, label: "Cast Member", value: this.state.editItem ? this.state.editItem.name : null ,isRequired:true},
            )
        }else{
            formFields.push(
                { key: "cast_crew_member_id", type:"text", label: "Cast Member", value: this.state.editItem ? this.state.editItem.name : null ,isRequired:true, props: { disabled: "disabled" }}
            )
        }
        if(!this.props.isCrew){
            validator.push({
                key: "character",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Character is required field"
                    }
                ]
            });
            formFields.push(
                { key: "character", type:"text", label: "Character", value: this.state.editItem ? this.state.editItem.character : null ,isRequired:true}
            )
        }else{
            validator.push({
                key: "job",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Job is required field"
                    }
                ]
            },
            {
                key: "department",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Department is required field"
                    }
                ]
            });
            formFields.push(
                { key: "job", type:"text", label: "Job", value: this.state.editItem ? this.state.editItem.job : null ,isRequired:true},
                { key: "department", type:"text", label: "Department", value: this.state.editItem ? this.state.editItem.department : null ,isRequired:true}
            )
        }
        
        let defaultValues = {}
        if(this.empty){
            formFields.forEach((elem) => {
                if (elem.value)
                    defaultValues[elem.key] = elem.value
            })
        }
        var empty = false
        if(this.empty){
            empty = true
            this.empty = false
        }
        return (
            <Form
                className="form"
                defaultValues={defaultValues}
                {...this.props}
                empty={empty}
                generalError={this.state.error}
                validators={validator}
                submitText={!this.state.submitting ? "Submit" : "Submitting..."}
                model={formFields}
                onSubmit={model => {
                    this.onSubmit(model);
                }}
            />
        )

        
    }

}

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData
    };
};


export default connect(mapStateToProps, null)(AddCast);