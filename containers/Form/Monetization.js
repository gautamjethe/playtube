import React, { Component } from "react"
import Form from '../../components/DynamicForm/Index'
import { connect } from 'react-redux';
import axios from "../../axios-orders"
import Currency from "../Upgrade/Currency"
import general from '../../store/actions/general';
import ReactDOMServer from "react-dom/server"
import Translate from "../../components/Translate/Index";

class Monetization extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "Monetization Settings",
            success: false,
            error: null,
            loading: true,
            member: props.member,
            submitting: false,
            firstLoaded: true,
            requestSend:props.member.monetizationRequestSend ? props.member.monetizationRequestSend : null
        }
        this.myRef = React.createRef();
    }

    onSubmit = model => {
        if (this.state.submitting) {
            return
        }
        let formData = new FormData();
        for (var key in model) {
            if (model[key])
                formData.append(key, model[key]);
        }

        formData.append("user_id", this.state.member.user_id)

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        let url = '/members/monetization';

        this.setState({ submitting: true, error: null });
        axios.post(url, formData, config)
            .then(response => {
                if (response.data.error) {
                    window.scrollTo(0, this.myRef.current.offsetTop);
                    this.setState({ error: response.data.error, submitting: false });
                } else if(response.data.request == 1){
                    this.setState({ submitting: false,requestSend:response.data.message });
                }else{
                    this.setState({ submitting: false });
                    this.props.openToast(Translate(this.props,response.data.message), "success");
                }
            }).catch(err => {
                this.setState({ submitting: false, error: err });
            });
    };



    render() {
        if(this.state.requestSend){
            return (
                <div className="alert alert-success" role="alert">
                {this.props.t(this.state.requestSend)}
                </div>
            )
        }
        let validator = []
        let formFields = []
        let perclick = {}
        perclick['package'] = { price: this.props.pageInfoData.appSettings['ads_cost_publisher'] }        

        formFields.push({
            key: "monetization",
            label: "",
            type: "checkbox",
            subtype:"single",
            value: [this.state.member.monetization ? "1" : "0"],
            options: [
              {
                value: "1",
                label: "Enable Monetization",
                key: "monetization_1"
              }
            ]
          },
          {
            key: "res_type_1",
            type: "content",
            content: '<h6 className="custom-control">' + this.props.t("Earn {{data}} for each advertisement click you get from your videos!",{data:"("+ReactDOMServer.renderToStaticMarkup(<Currency { ...this.props} {...perclick } />)+")"}) + '</h6>'
        });
        
        

        let initalValues = {}

        //get current values of fields

        formFields.forEach(item => {
            initalValues[item.key] = item.value
        })
        return (
            <React.Fragment>
                <div ref={this.myRef}>
                <Form
                    //key={this.state.current.id}
                    className="form"
                    title={this.state.title}
                    initalValues={initalValues}
                    validators={validator}
                    submitText={!this.state.submitting ? "Save Changes" : "Saving Changes..."}
                    model={formFields}
                    {...this.props}
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

export default connect(null, mapDispatchToProps)(Monetization);