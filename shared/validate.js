export const updateObject = (oldObject, updatedProperties) => {
    return {
        ...oldObject,
        ...updatedProperties
    };
};

export const checkValidity = ( value, rules,images ,controlName,controls) => {
    let isValid = true;
    if ( !rules ) {
        return true;
    }
    if(controlName === 'image' && images){
        return true;
    }
    if ( rules.required ) {
        isValid = value.trim() !== '' && isValid;
    }
    if(controls){
        if(controlName == "password"){
            if(controls["newpassword"].value != value){
                isValid = false;
            }
        }else if(controlName == "newpassword"){
            if(controls["password"].value != value){
                isValid = false;
            }
        }
    }
    if ( rules.minLength ) {
        isValid = value.length >= rules.minLength && isValid
    }

    if ( rules.maxLength ) {
        isValid = value.length <= rules.maxLength && isValid
    }

    if ( rules.isEmail ) {
        const pattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
        isValid = pattern.test( value ) && isValid
    }

    if ( rules.isNumeric ) {
        const pattern = /^\d+$/;
        isValid = pattern.test( value ) && isValid
    }

    return isValid;
}
