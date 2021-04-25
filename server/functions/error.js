exports.errors = (errors,customMessage = false) => {
    const error = [];
    let errorData = errors;
    if(!customMessage){
      errorData = errors.array();
    }
    errorData.map((value,index,array) => {
        error.push({'field':value.param,'value':value.value,'message':value.msg,"type":value.error_type});
      })
    return error;
  }