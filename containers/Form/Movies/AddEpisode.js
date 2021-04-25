import React, { Component } from "react"
import { connect } from 'react-redux';
import Form from '../../../components/DynamicForm/Index'
import Validator from '../../../validators';
import axios from "../../../axios-orders"

class AddEpisode extends Component {
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
            if(key == "release_date"){
                if(model[key]){
                    formData.append(key, new Date(model[key]).toJSON().slice(0,10));
                }
            }else if(model[key] != null && typeof model[key] != "undefined")
                formData.append(key, model[key]);
        }
        
        //image
        if (model['image']) {
            let image = typeof model['image'] == "string" ? model['image'] : false
            if (image) {
                formData.append('episodeImage', image)
            }
        }
        formData.append("movie_id",this.state.movie.movie_id);
        formData.append("season_id",this.state.season_id);
        
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/movies/episode/create';
        if (this.state.editItem) {
            formData.append("episodeId", this.state.editItem.episode_id)
        }
        this.setState({localUpdate:true, submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({localUpdate:true, error: response.data.error, submitting: false });
                } else {
                    this.props.closeEpisodeCreate({...response.data.item},response.data.message)
                }
            }).catch(err => {
                this.setState({localUpdate:true, submitting: false, error: err });
            });

    }
    render(){


        let validator = [
            {
                key: "title",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Title is required field"
                    }
                ]
            },
            {
                key: "episode_number",
                validations: [
                    {
                        "validator": Validator.int,
                        "message": "Episode Number is required field"
                    }
                ]
            },
            {
                key: "release_date",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Release Date is required field"
                    }
                ]
            }
        ]

        let imageUrl = null
        if(this.state.editItem && this.state.editItem.orgImage){
            if(this.state.editItem.image.indexOf("http://") == 0 || this.state.editItem.image.indexOf("https://") == 0){
                imageUrl = this.state.editItem.image
            }else{
                imageUrl = this.props.pageInfoData.imageSuffix+this.state.editItem.image
            }
        }
        let formFields = [
            { key: "title", label: "Title", value: this.state.editItem ? this.state.editItem.title : null ,isRequired:true},
            { key: "episode_number", type:"number", label: "Episode Number", value: this.state.editItem ? this.state.editItem.episode_number : null ,isRequired:true},
            { key: "description", label: "Description", type: "textarea", value: this.state.editItem ? this.state.editItem.description : null },
            { key: "image", label: "Upload Image", type: "file", value: imageUrl },
            { key: "release_date", label: "Release Date", type: "date", value: this.state.editItem && this.state.editItem.release_date ? new Date(this.state.editItem.release_date)  : "",isRequired:true }
        ]


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


export default connect(mapStateToProps, null)(AddEpisode);