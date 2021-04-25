import React, { Component } from "react"

import Form from '../../components/DynamicForm/Index'

import { connect } from 'react-redux';

import Validator from '../../validators';

import axios from "../../axios-orders"

import LoadMore from "../LoadMore/Index"
import general from '../../store/actions/general';
import Translate from "../../components/Translate/Index";

class Report extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "",
            success: false,
            error: null,
            loading: true,
            types: [],
            submitting: false
        }
        this.myRef = React.createRef();
        this.onTypeChange = this.onTypeChange.bind(this)
    }
    componentDidMount() {
        this.setState({ loading: true })
        const formData = new FormData()
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        formData.append('types', 1)
        axios.post("/report", formData, config)
            .then(response => {
                if (response.data.error) {
                    this.setState({ loading: false, error: response.data.error });
                } else {
                    this.setState({ loading: false, types: response.data.types })
                }
            }).catch(err => {
                this.setState({ loading: false, error: err });
            });
    }
    onSubmit = model => {
        if (this.state.submitting) {
            return
        }
        let formData = new FormData();
        for (var key in model) {
            formData.append(key, model[key]);
        }

        formData.append("id", this.props.contentId)
        formData.append("type", this.props.contentType)

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/report';

        this.setState({ submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({ error: response.data.error, submitting: false });
                } else {
                    this.props.openToast(Translate(this.props,response.data.message), "success");
                    this.props.openReport(false)
                }
            }).catch(err => {
                this.setState({ submitting: false, error: err });
            });
    };

    onTypeChange = (id) => {
        this.setState({ reportmessage_id: id })
    }

    render() {
        if (this.state.loading) {
            return <LoadMore loading={true} />
        }
        let validator = []

        validator.push({
            key: "reportmessage_id",
            validations: [
                {
                    "validator": Validator.required,
                    "message": "Report content is required field"
                }
            ]
        },
            {
                key: "description",
                validations: [
                    {
                        "validator": Validator.required,
                        "message": "Description is required field"
                    }
                ]
            })
        let formFields = []

        let types = [{ key: "0", label: "Select Type", value: "0" }]
        this.state.types.forEach(res => {
            types.push({ key: res.reportmessage_id, label: res.description, value: res.reportmessage_id })
        })
        formFields.push({
            key: "reportmessage_id",
            label: "Report content",
            type: "select",
            onChangeFunction: this.onTypeChange,
            options: types
            ,isRequired:true
        })
        formFields.push(
            { key: "description", label: "Description", type: "textarea",isRequired:true })

        const defaultValues = {}
        defaultValues["reportmessage_id"] = this.state.reportmessage_id
        return (
            <React.Fragment>
                <div ref={this.myRef}>
                <Form
                    //key={this.state.current.id}
                    className="form"
                    title={this.state.title}
                    defaultValues={defaultValues}
                    {...this.props}
                    validators={validator}
                    submitText={!this.state.submitting ? "Submit Report" : "Submitting Report..."}
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

const mapStateToProps = state => {
    return {
        pageInfoData: state.general.pageInfoData,
        contentId: state.report.contentId,
        contentType: state.report.contentType
    };
};
const mapDispatchToProps = dispatch => {
    return {
        openReport: (open) => dispatch(general.openReport(open, {})),
        openToast: (message, typeMessage) => dispatch(general.openToast(message, typeMessage)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Report);