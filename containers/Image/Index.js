import React from "react"
import { LazyLoadImage } from 'react-lazy-load-image-component';
const Image = (props) => {
    let isS3 = true
    if (props.image) {
        const splitVal = props.image.split('/')
         if (splitVal[0] == "http:" || splitVal[0] == "https:") {
            isS3 = false
        }
    }
    if(!props.image){
        return null;
    }
    return (
        <LazyLoadImage
            alt={props.title}
            effect="blur"
            className={props.className ? props.className : ""}
            src={(isS3 ? props.imageSuffix : "") + props.image} />
        // <img className={props.className ? props.className : ""} src={(isS3 ? props.imageSuffix : "") + props.image} alt={`${props.title}`} />
    )
}

export default Image