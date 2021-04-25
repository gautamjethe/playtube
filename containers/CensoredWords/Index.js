import React from "react"
const Filter = require('bad-words');
const Index = (props) => {
    if(!props.text){
        return null
    }

    let newBadWords = ""
    if(props.pageData && props.pageData.appSettings && props.pageData.appSettings['censored_words']){
        newBadWords = props.pageData.appSettings['censored_words']
    }else if(props.pageInfoData && props.pageInfoData.appSettings['censored_words']){
        newBadWords = props.pageInfoData.appSettings['censored_words']
    }

    if(newBadWords){
        var customFilter = new Filter(); 
        customFilter.addWords(...newBadWords);
        return customFilter.clean(props.text)
    }
    return props.text
}

export default Index