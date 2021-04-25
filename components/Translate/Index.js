const Translate = (props,translateData) => {
    var data = translateData
    try{
      data = props.t(translateData)
    }catch(e){
        return translateData
    }
    if(!data){
        data = translateData
    }
    return data
}
export default Translate