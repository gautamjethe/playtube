import React from 'react';

const input = ( props ) => {
    let inputElement  = props.classes;
    let  month = null;
    let  year = null;
    const inputClasses = ["form-input"];
    if (props.invalid && props.shouldValidate && props.touched) {
        inputClasses.push("form-field-error");
    }
    let classSelect = "form-field";
    switch ( props.elementType ) {
        case ( 'input' ):
            classSelect = "form-field has-float-label";
            inputElement = <input
            className={inputClasses.join(' ')}
                {...props.elementConfig}
                value={props.value}
                id={props.id}
                onChange={props.changed} />;
            break;
        case ( 'textarea' ):
            classSelect = "form-field has-float-label";
            inputElement = <textarea
            className={inputClasses.join(' ')}
                {...props.elementConfig}
                value={props.value}
                onChange={props.changed} />;
            break;
        case ( 'select' ):
            inputElement = (
                <select
                className={inputClasses.join(' ')}
                    value={props.value}
                    onChange={props.changed}>
                    {props.elementConfig.options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.displayValue}
                        </option>
                    ))}
                </select>
            );
            break;
        case ('radio'):
        inputElement = (
            <ul key={props.keyValue} className="form-options">
                {props.elementConfig.options.map(option => (
                    <li key={props.value+option.value}>
                        <input type="radio" checked={props.value === option.value ? true : false} key={option.value} name={props.keyValue} value={option.value} onChange={props.changed} />{option.label}
                    </li>
                ))}
            </ul>
        )
         break;
        case ( 'dob' ):

        const dayInputClasses = ['form-input'];
        
        if (!props.dayValue && props.shouldValidate && props.touched) {
            dayInputClasses.push("form-field-error");
        }
        const day = (
            <select
                key="day"
                className={dayInputClasses.join(' ')}
                value={props.dayValue}
                onChange={props.dayChange}>
                {[...Array(32)].map((_,i) => (
                    <option key={i} value={(i === 0 ? "" : i)}>
                        {i === 0 ? "Day" : i}
                    </option>
                ))}
            </select>
        );
        const monthInputClasses = ['form-input'];
        if (!props.monthValue && props.shouldValidate && props.touched) {
            monthInputClasses.push("form-field-error");
        }
        month = (
            <select
                key="month"
                className={monthInputClasses.join(' ')}
                value={props.monthValue}
                onChange={props.monthChange}>
                {[...Array(13)].map((_,i) => (
                    <option key={i} value={i === 0 ? "" : i}>
                        {i === 0 ? "Month" : i}
                    </option>
                ))}
            </select>
        );
        const currentYear = new Date().getFullYear();
        const dateDiff = currentYear - 1904;
        year = (
            <select
                key="year"
                className={inputClasses.join(' ')}
                value={props.value}
                onChange={props.changed}>
                <option key="0" value="">
                    Year
                </option>
                {[...Array(dateDiff)].map((_,i) => (
                    <option key={currentYear-i} value={currentYear-i}>
                        {currentYear-i}
                    </option>
                ))}
            </select>
        );
        inputElement = (
            <div className="form-field-group">
            {day}
            {month}
            {year}
            </div>
        )
        classSelect = "form-field form-field-birthday";
        break;
        case ('file'):
            let displayFileField = true;
            if(props.pictures){
                displayFileField = false
            }
            inputElement = (
                    <div className={inputClasses.join(' ')+" fileUploader form-input"}>
                        <div className="fileContainer">
                            <div className="fileContainerChooser" style={{display:displayFileField ? "block" : "none"}} >
                                <img src="static/images/camera.svg" style={{height:"100px"}} className="uploadIcon" alt="Upload Icon" />
                                <p className="">accepted: jpg|png|jpeg</p>
                                <div className="errorsContainer"></div>
                                <input type="file" name="image" accept="image/*" onChange={props.onDrop} />
                            </div>
                            <div className="uploadPicturesWrapper" style={{display:(displayFileField ? "none" : "block")}}>
                                <div style={{position:"relative", display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", width: "100%"}}>
                                    <div className="uploadPictureContainer">
                                        <div className="deleteImage" onClick={props.removeUploadedImage}>X</div>
                                        <img src={props.pictures ? window.URL.createObjectURL(props.pictures) : null} className="uploadPicture" alt="preview" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        break
        default:
            classSelect = "form-field has-float-label";
            inputElement = <input
                className={inputClasses.join(' ')}
                {...props.elementConfig}
                value={props.value}
                id={props.id}
                onChange={props.changed} />;
    }
    classSelect  = 'form_fields_'+props.elementConfig.placeholder.replace(' ','_').toString().toLowerCase()+' '+classSelect;
    return (
        <div className={classSelect}>
            {props.elementType === "file" || props.elementType === "select" || props.elementType === "dob" || props.elementType === "radio" || props.elementType === "checkbox" ? 
                <label htmlFor={props.id}>{props.elementConfig.placeholder}</label> : null}
            {inputElement}
            {props.elementType === "file" || props.elementType === "select" || props.elementType === "dob" || props.elementType === "radio" || props.elementType === "checkbox" ? 
                 null : <label htmlFor={props.id}>{props.elementConfig.placeholder}</label>}
        </div>
    );
};
export default input;