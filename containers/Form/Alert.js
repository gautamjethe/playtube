import React, { Component } from "react"
import Form from '../../components/DynamicForm/Index';
import { connect } from 'react-redux';
import axios from "../../axios-orders"
import general from '../../store/actions/general';
import Translate from "../../components/Translate/Index";

class General extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: props.type.charAt(0).toUpperCase() + props.type.slice(1) + " Alert",
            success: false,
            error: null,
            loading: true,
            notificationTypes: props.notificationTypes,
            submitting: false,
            firstLoaded: true,
            member: props.member,
            type:["videos"]
        }
        this.myRef = React.createRef();
    }
    getIndex(type) {
        const types = [...this.state.type];
        const index = types.findIndex(p => p == type);
        return index;
    }
    componentDidMount(){
        let _ = this
        $(document).on('click','.change_type',function(e){
            e.preventDefault()
            let type = $(this).attr('rel')
            const types = [... _.state.type]
            let index = _.getIndex(type)
            if(index > -1){
                types.splice(index, 1);
            }else{
                types.push(type)
            }
            _.setState({type:types})
        });
    }
    onSubmit = model => {
        if (this.state.submitting) {
            return
        }
        let formData = new FormData();
        let values = []
        for (var key in model) {
            if (model[key])
                values.push(model[key])
        }
        const selectedValues = values.join(',')
        const disableValues = []
        this.state.notificationTypes.forEach(value => {
            if(selectedValues.indexOf(value.type) < 0){
                disableValues.push(value.type)
            }
        })
        formData.append("user_id", this.state.member.user_id)
        formData.append('types',disableValues.join(','))


        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/dashboard/' + this.props.type;

        this.setState({ submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({ error: response.data.error, submitting: false });
                } else {
                    this.setState({ submitting: false });
                    this.props.openToast(Translate(this.props,response.data.message), "success");
                }
            }).catch(err => {
                this.setState({ submitting: false, error: err });
            });
    };



    render() {
        let formFields = []
        let fields = []
        let type = ""
        let index = 0
        let initalValues = {}
        let lastIndexType = ""
        this.state.notificationTypes.forEach(res => {
            if (type != res.content_type) {
                if (index != 0 && this.state.type.indexOf(type) > -1) {
                    formFields.push({
                        key: "settings_" + lastIndexType,
                        label: "",
                        type: "checkbox",
                        options: fields,
                    })
                }
                formFields.push({
                    key: "res_type_" + res.content_type,
                    type: "content",
                    content: '<a href="#" class="change_type" rel="'+res.content_type+'"><h4 class="custom-control">' + Translate(this.props,res.content_type.charAt(0).toUpperCase() + res.content_type.slice(1)) + (this.state.type.indexOf(res.content_type) < 0 ? '<span class="material-icons alert_icon">arrow_right</span>' : '<span class="material-icons alert_icon">arrow_drop_down</span>') + '</h4></a>'
                })
                type = res.content_type
                fields = []
            }
            if (!initalValues["settings_" + res.content_type])
                initalValues["settings_" + res.content_type] = []
            if(res.enable)
            initalValues["settings_" + res.content_type].push(res.type.toString())
            fields.push({ value: res.type.toString(), key: res.type, label: Translate(this.props,res.type) })
            lastIndexType = res.content_type
            index = index + 1
        })
        if(this.state.type.indexOf(lastIndexType) > -1){
            formFields.push({
                key: "settings_" + lastIndexType,
                label: "",
                type: "checkbox",
                options: fields
            })
        }
        return (
            <React.Fragment>
                <div ref={this.myRef}>
                    <Form
                        //key={this.state.current.id}
                        className="form"
                        {...this.props}
                        title={this.state.title}
                        initalValues={initalValues}
                        validators={[]}
                        submitText={!this.state.submitting ? "Save Changes" : "Saving Changes..."}
                        model={formFields}
                        generalError={this.state.error}
                        onSubmit={model => {
                            this.onSubmit(model);
                        }}
                    />
                </div>
            </React.Fragment>
        )
    }
}




const mapDispatchToProps = dispatch => {
    return {
        openToast: (message, typeMessage) => dispatch(general.openToast(message, typeMessage)),
    };
};

export default connect(null, mapDispatchToProps)(General);