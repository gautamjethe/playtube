import React, { Component } from "react"
import { connect } from 'react-redux';
import * as actions from '../../../store/actions/general';

import Image from "../../Image/Index"
import imageCompression from 'browser-image-compression';
import swal from 'sweetalert'
import axios from "../../../axios-orders"
import Translate from "../../../components/Translate/Index";

class Images extends Component {
    constructor(props) {
        super(props)
        this.state = {
            images:props.images,
            movie:props.movie
        }
        this.deleteImage = this.deleteImage.bind(this);
        this.uploadImage = this.uploadImage.bind(this)
        
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(typeof window == "undefined" || nextProps.i18n.language != $("html").attr("lang")){
            return null;
        }
        if(prevState.localUpdate){
            return {...prevState,localUpdate:false}
        }else {
            return {
                images:nextProps.images ? nextProps.images : [],                
            }
        }
    }
    updateValues = (values) => {
        //update the values
        this.props.updateSteps({key:"images",value:values})
    }
    updateState = (data,message) => {
        if(message && data){
            this.props.openToast(Translate(this.props,message), "success");
        }
        const items = [...this.state.images]
        items.unshift(data)
        this.setState({submitting:false},() => {
            this.updateValues(items)
        })
    }
    uploadImage = async (picture) =>  {
        var url = picture.target.value;
        let imageFile = ""
        var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        if (picture.target.files && picture.target.files[0] && (ext === "png" || ext === "jpeg" || ext === "jpg" || ext === 'PNG' || ext === 'JPEG' || ext === 'JPG' || ext === 'gif' || ext === 'GIF')) {
            imageFile = picture.target.files[0];
        } else {
            return;
        }

        if(this.state.submitting){
            return
        }
        this.setState({submitting:true});

        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        }
        let compressedFile = picture.target.files[0];
        if(ext != 'gif' && ext != 'GIF'){
            try { 
            compressedFile = await imageCompression(imageFile, options);
            } catch (error) {
                
            }
        }

        const formData = new FormData()
        formData.append('image', compressedFile,url)

        let uploadurl = '/movies/upload-image/'+this.state.movie.movie_id


        axios.post(uploadurl, formData)
            .then(response => {
                if (response.data.error) {
                    swal("Error", response.data.error[0].message, "error");
                } else {
                    this.setState({submitting:false},() => {
                        this.updateState({...response.data.item},response.data.message)
                    })
                }
            }).catch(err => {
                swal("Error", Translate(this.props, "Something went wrong, please try again later"), "error");
            });

    } 
    deleteImage = (id,e) => {
        e.preventDefault();

        swal({
            title: Translate(this.props,"Delete Image"),
            text: Translate(this.props,"Are you sure you want to delete this image?"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    const formData = new FormData()
                    formData.append('id', id)
                    formData.append('movie_id', this.state.movie.movie_id);
                    const url = "/movies/delete-image"
                    axios.post(url, formData)
                        .then(response => {
                            if (response.data.error) {
                                swal("Error", Translate(this.props,"Something went wrong, please try again later", "error"));
                            } else {
                                let message = response.data.message
                                this.props.openToast(Translate(this.props,message), "success");
                                const items = [...this.state.images]
                                const itemIndex = items.findIndex(p => p["photo_id"] == id)
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
    render(){
        const imageref = React.createRef();
        return (
            <div className="movie_photos">
                    <button className="add_photo" onClick={e => {
                                imageref.current.click();
                            }}>
                        {
                            this.props.t(this.state.submitting ? "Uploading Image..." : "Upload Image")
                        }
                    </button>
                    <input className="fileNone" onChange={this.uploadImage.bind(this)}  ref={imageref} type="file" />
                    <ul className="movie_photos_cnt">
                        {
                            this.state.images.map((item,index) => {
                                return (
                                    <li className="image" key={item.photo_id}>
                                        <Image className="img" image={item.image} title={""} imageSuffix={this.props.pageInfoData.imageSuffix} />
                                        <a href="#" onClick={this.deleteImage.bind(this,item.photo_id)}>{this.props.t("Delete")}</a>
                                    </li>
                                )
                            })
                        }
                    </ul>
            </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(Images);